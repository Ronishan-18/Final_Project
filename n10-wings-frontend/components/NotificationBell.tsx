'use client';
import { useState, useEffect, useRef } from 'react';
import { Bell, Check, CheckCheck, Trophy, Users, X, ShieldCheck, ShieldX, UserCheck, UserX } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import api from '@/lib/api';
import { fetchNotifications, markRead, markAllRead, Notification } from '@/lib/notifications';
import styles from './NotificationBell.module.scss';

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [actedInvites, setActedInvites] = useState<number[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  const handleToggleBell = async () => {
    if (!open && unreadCount > 0) {
      setUnreadCount(0);
      setNotifications(prev => prev.map(x => ({ ...x, is_read: true })));
      try { await markAllRead(); } catch {}
    }
    setOpen(!open);
  };
  const load = async () => {
    try {
      const data = await fetchNotifications();
      setNotifications(data.notifications);
      // If current path is notifications, don't show badge
      if (window.location.pathname === '/notifications') {
        setUnreadCount(0);
      } else {
        setUnreadCount(data.unreadCount); // Badge shows combined total
      }
    } catch {}
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 5000); // 5s interval
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // If we navigate to notifications, clear badge immediately
    if (pathname === '/notifications') {
      setUnreadCount(0);
      markAllRead().catch(() => {});
    }
    load(); // Reload on navigation
  }, [pathname]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleTeamAction = async (n: Notification, action: 'accept' | 'decline') => {
    try {
      // Compatibility: If this is actually a friend request mislabeled as team_invitation
      if (n.data?.type === 'friend_request' || (n.message && n.message.toLowerCase().includes('friend request'))) {
        return handleFriendAction(n, action);
      }

      setActedInvites(prev => [...prev, n.id]);
      if (!n.data?.team_id || !n.data?.team_member_id) {
        console.warn('Missing team data in notification', n.data);
        return;
      }
      await api.put(`/teams/${n.data?.team_id}/members/${n.data?.team_member_id}`, { action, notification_id: n.id });
      await load();
    } catch (err) {
      console.error(err);
    }
  };

  const handleFriendAction = async (n: Notification, action: 'accept' | 'decline') => {
    try {
      setActedInvites(prev => [...prev, n.id]);
      await api.post('/friends/respond', {
        friendship_id: n.data?.friendship_id,
        requester_id: n.data?.requester_id,
        notification_id: n.id,
        action
      });
      await load();
      if (action === 'accept') router.push('/friends');
    } catch (err) {
      console.error(err);
    }
  };

  const handleJoinAction = async (n: Notification, action: 'accept' | 'decline') => {
    try {
      setActedInvites(prev => [...prev, n.id]);
      await api.put(`/teams/${n.data?.team_id}/requests/${n.data?.request_id}`, { action, notification_id: n.id });
      await load();
    } catch (err) {
      console.error(err);
    }
  };

  const getIcon = (type: string) => {
    if (type === 'tournament_launched') return <Trophy size={16} />;
    if (type === 'team_invitation' || type === 'friend_request' || type === 'team_join_request') return <Users size={16} />;
    if (type === 'team_invite_accepted' || type === 'friend_accepted' || type === 'team_request_accepted') return <UserCheck size={16} />;
    if (type === 'team_invite_declined' || type === 'team_request_declined') return <UserX size={16} />;
    if (type === 'organizer_approval' || type === 'account_restored') return <ShieldCheck size={16} />;
    if (type === 'organizer_rejection' || type === 'account_rejected') return <ShieldX size={16} />;
    return <Bell size={16} />;
  };

  const getColor = (type: string) => {
    if (type === 'tournament_launched') return '#00F5FF';
    if (type === 'team_invitation') return '#00F5FF';
    if (type === 'friend_request' || type === 'team_join_request') return '#00F5FF';
    if (type === 'team_invite_accepted' || type === 'friend_accepted' || type === 'team_request_accepted') return '#00e57a';
    if (type === 'team_invite_declined' || type === 'team_request_declined') return '#ff3366';
    if (type === 'organizer_approval' || type === 'account_restored') return '#32CD32';
    if (type === 'organizer_rejection' || type === 'account_rejected') return '#FF0000';
    return '#FFD700';
  };

  const timeAgo = (date: string) => {
    const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div className={styles.wrapper} ref={dropdownRef}>
      <button className={styles.bellBtn} onClick={handleToggleBell}>
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className={styles.badge}>{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {open && (
        <div className={styles.dropdown}>
          <div className={styles.header}>
            <span>Notifications</span>
          </div>

          <div className={styles.list}>
            {notifications.length === 0 && (
              <p className={styles.empty}>No notifications yet</p>
            )}
            {notifications.map(n => (
              <div
                key={n.id}
                className={`${styles.item} ${!n.is_read ? styles.unread : ''}`}
              >
                <div className={styles.iconWrap} style={{ background: getColor(n.type) + '22', color: getColor(n.type) }}>
                  {getIcon(n.type)}
                </div>
                <div className={styles.content}>
                  <p className={styles.title}>{n.title}</p>
                  <p className={styles.msg}>{n.message}</p>

                  {/* Team invitation actions */}
                  {n.type === 'team_invitation' && !n.is_acted && !actedInvites.includes(n.id) && (
                    <div className={styles.actions}>
                      <button className={styles.accept} onClick={e => { e.stopPropagation(); handleTeamAction(n, 'accept'); }}>
                        <Check size={12} /> Accept
                      </button>
                      <button className={styles.decline} onClick={e => { e.stopPropagation(); handleTeamAction(n, 'decline'); }}>
                        <X size={12} /> Decline
                      </button>
                    </div>
                  )}

                  {/* Friend request actions */}
                  {n.type === 'friend_request' && !n.is_acted && !actedInvites.includes(n.id) && (
                    <div className={styles.actions}>
                      <button className={styles.accept} onClick={e => { e.stopPropagation(); handleFriendAction(n, 'accept'); }}>
                        <Check size={12} /> Accept
                      </button>
                      <button className={styles.decline} onClick={e => { e.stopPropagation(); handleFriendAction(n, 'decline'); }}>
                        <X size={12} /> Decline
                      </button>
                    </div>
                  )}

                  {/* Team join request actions */}
                  {n.type === 'team_join_request' && !n.is_acted && !actedInvites.includes(n.id) && (
                    <div className={styles.actions}>
                      <button className={styles.accept} onClick={e => { e.stopPropagation(); handleJoinAction(n, 'accept'); }}>
                        <Check size={12} /> Accept
                      </button>
                      <button className={styles.decline} onClick={e => { e.stopPropagation(); handleJoinAction(n, 'decline'); }}>
                        <X size={12} /> Decline
                      </button>
                    </div>
                  )}

                  <span className={styles.time}>{timeAgo(n.created_at)}</span>
                </div>
              </div>
            ))}
          </div>

          <button className={styles.viewAll} onClick={() => { setOpen(false); router.push('/notifications'); }}>
            View all notifications
          </button>
        </div>
      )}
    </div>
  );
}