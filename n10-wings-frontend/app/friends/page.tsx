'use client';
import { useState, useEffect } from 'react';
import { UserPlus, UserCheck, UserX, MessageCircle, Search, Users, ChevronLeft, ChevronRight, LayoutDashboard, UserMinus } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getMyFriends, getPendingRequests, sendFriendRequest, respondToRequest, removeFriend } from '@/lib/friends';
import { useSocket } from '@/contexts/SocketContext';
import ChatWindow from '@/components/ChatWindow';
import { formatDistanceToNow } from 'date-fns';
import styles from './friends.module.scss';
import { getImageUrl } from '@/lib/urlHelper';

export default function FriendsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { onlineUsers, socket } = useSocket();
  const [friends, setFriends] = useState<any[]>([]);
  const [pending, setPending] = useState<{ received: any[]; sent: any[] }>({ received: [], sent: [] });
  const [tab, setTab] = useState<'friends' | 'pending' | 'add'>('friends');
  const [selectedFriendId, setSelectedFriendId] = useState<number | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchUsername, setSearchUsername] = useState('');
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const [f, p] = await Promise.all([getMyFriends(), getPendingRequests()]);
      setFriends(f);
      setPending(p);
      
      // If URL has a chat ID, select it
      const chatId = searchParams.get('chat');
      if (chatId) {
        setSelectedFriendId(parseInt(chatId));
      }
    } catch (err) {
      console.error('Load Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/register');
      return;
    }
    load();
  }, [searchParams]);

  // Socket listener for real-time friend updates
  useEffect(() => {
    if (!socket) return;
    const handleStatusChange = ({ user_id, is_online, last_seen }: any) => {
      setFriends(prev => prev.map(f => {
        if (f.friend_id === user_id) {
          return { ...f, last_seen: last_seen || f.last_seen };
        }
        return f;
      }));
    };
    socket.on('friend_status_change', handleStatusChange);
    return () => { socket.off('friend_status_change', handleStatusChange); };
  }, [socket]);

  const handleSendRequest = async () => {
    if (!searchUsername.trim()) return;
    setMsg(''); setError('');
    try {
      await sendFriendRequest(searchUsername.trim());
      setMsg(`Friend request sent to ${searchUsername}!`);
      setSearchUsername('');
      load();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to send request');
    }
  };

  const handleRespond = async (friendship_id: number, action: 'accept' | 'decline') => {
    await respondToRequest(friendship_id, action);
    load();
  };

  const handleRemove = async (friendship_id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to remove this friend?')) return;
    await removeFriend(friendship_id);
    if (friends.find(f => f.friendship_id === friendship_id)?.friend_id === selectedFriendId) {
      setSelectedFriendId(null);
    }
    load();
  };

  const formatLastSeen = (date: string) => {
    if (!date) return 'Offline';
    try {
      return `seen ${formatDistanceToNow(new Date(date), { addSuffix: true })}`;
    } catch {
      return 'Offline';
    }
  };

  const pendingCount = pending.received?.length || 0;

  return (
    <main className={styles.page}>
      <div className={styles.dashboardContainer}>
        {/* Sidebar */}
        <aside className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ''}`}>
          <button 
            className={styles.collapseBtn} 
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>

          <div className={styles.sidebarHeader}>
            <h1 className={styles.heading}>WINGS SOCIAL</h1>
            <p className={styles.sub}>{friends.length} Active Connections</p>
          </div>

          <div className={styles.tabs}>
            <button className={`${styles.tab} ${tab === 'friends' ? styles.active : ''}`} onClick={() => setTab('friends')} title="Friends List">
              <Users size={18} />
              <span className={styles.tabText}>Friends</span>
            </button>
            <button className={`${styles.tab} ${tab === 'pending' ? styles.active : ''}`} onClick={() => setTab('pending')} title="Pending Requests">
              <UserCheck size={18} />
              <span className={styles.tabText}>Requests</span>
              {pendingCount > 0 && <span className={styles.badge}>{pendingCount}</span>}
            </button>
            <button className={`${styles.tab} ${tab === 'add' ? styles.active : ''}`} onClick={() => setTab('add')} title="Add Player">
              <UserPlus size={18} />
              <span className={styles.tabText}>Add</span>
            </button>
          </div>

          <div className={styles.sidebarContent}>
            {tab === 'friends' && (
              <div className={styles.list}>
                {loading && <p className={styles.empty}>Loading friends...</p>}
                {!loading && friends.length === 0 && <p className={styles.empty}>No friends found. Use the 'Add' tab to find players.</p>}
                {friends.map(f => (
                  <div 
                    key={f.friendship_id} 
                    className={`${styles.friendCard} ${selectedFriendId === f.friend_id ? styles.selected : ''}`}
                    onClick={() => {
                        setSelectedFriendId(f.friend_id);
                        if (window.innerWidth < 900) setIsCollapsed(true);
                    }}
                  >
                    <div className={styles.avatarWrap}>
                      <img src={getImageUrl(f.avatar) || '/default-avatar.png'} alt="" className={styles.avatar} />
                      <span className={`${styles.statusDot} ${onlineUsers[f.friend_id] ? styles.online : styles.offline}`} />
                    </div>
                    <div className={styles.friendInfo}>
                      <p className={styles.name}>{f.full_name || f.username}</p>
                      <p className={`${styles.statusText} ${onlineUsers[f.friend_id] ? styles.online : ''}`}>
                        {onlineUsers[f.friend_id] ? 'Online' : formatLastSeen(f.last_seen)}
                      </p>
                    </div>
                    <div className={styles.actions}>
                      <button className={`${styles.actionBtn} ${styles.remove}`} onClick={(e) => handleRemove(f.friendship_id, e)} title="Remove Friend">
                        <UserMinus size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tab === 'pending' && (
              <div className={styles.list}>
                {pendingCount === 0 && (!pending.sent || pending.sent.length === 0) && (
                  <p className={styles.empty}>No pending requests.</p>
                )}
                {pending.received?.map(r => (
                  <div key={r.friendship_id} className={styles.friendCard} style={{ cursor: 'default' }}>
                    <div className={styles.avatarWrap}>
                      <img src={getImageUrl(r.avatar) || '/default-avatar.png'} alt="" className={styles.avatar} />
                    </div>
                    <div className={styles.friendInfo}>
                      <p className={styles.name}>{r.full_name || r.username}</p>
                      <p className={styles.statusText}>Sent you a request</p>
                    </div>
                    <div className={styles.actions}>
                      <button className={styles.actionBtn} onClick={() => handleRespond(r.friendship_id, 'accept')} title="Accept">
                        <UserCheck size={14} style={{ color: '#00FF88' }} />
                      </button>
                      <button className={`${styles.actionBtn} ${styles.remove}`} onClick={() => handleRespond(r.friendship_id, 'decline')} title="Decline">
                        <UserX size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tab === 'add' && (
              <div className={styles.addSection}>
                <p className={styles.addHint}>Connect with players by their username.</p>
                <div className={styles.searchRow}>
                  <div className={styles.inputWrap}>
                    <Search size={16} className={styles.searchIcon} />
                    <input
                      value={searchUsername}
                      onChange={e => setSearchUsername(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSendRequest()}
                      placeholder="Username..."
                      className={styles.input}
                    />
                  </div>
                  <button className={styles.submitBtn} onClick={handleSendRequest}>Send Invite</button>
                </div>
                {msg && <p className={`${styles.msg} ${styles.success}`}>{msg}</p>}
                {error && <p className={`${styles.msg} ${styles.error}`}>{error}</p>}
              </div>
            )}
          </div>
        </aside>

        {/* Main Area */}
        <div className={styles.mainArea}>
          {selectedFriendId ? (
            <ChatWindow 
                friendId={selectedFriendId} 
                onBack={() => {
                    if (window.innerWidth < 900) setIsCollapsed(false);
                }} 
            />
          ) : (
            <div className={styles.welcomeScreen}>
              <div className={styles.welcomeIcon}>
                <MessageCircle size={40} />
              </div>
              <h2>Select a Player</h2>
              <p>Choose a connection from your friends list to start a secure conversation or check pending requests.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}