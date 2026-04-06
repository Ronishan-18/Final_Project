'use client';
import { useState, useEffect } from 'react';
import { Bell, Trophy, Users, Check, X, ShieldCheck, ShieldX, UserCheck, UserX } from 'lucide-react';
import api from '@/lib/api';
import { fetchNotifications, markAllRead, Notification } from '@/lib/notifications';
import styles from './notifications.module.scss';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [actedInvites, setActedInvites] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const load = async () => {
    try {
      const data = await fetchNotifications();
      setNotifications(data.notifications);
      setUnreadCount(0); // On this page, we consider everything seen
      if (data.unreadCount > 0) {
        await markAllRead();
      }
    } catch (err) {
      console.error("Failed to load notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleTeamAction = async (n: Notification, action: 'accept' | 'decline') => {
    try {
      setActedInvites(prev => [...prev, n.id]);
      // Fixed: use the correct team endpoint and pass notification_id
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
    } catch (err) {
      console.error(err);
    }
  };


  const getIcon = (type: string) => {
    if (type === 'tournament_launched') return <Trophy size={20} />;
    if (type === 'team_invitation' || type === 'friend_request') return <Users size={20} />;
    if (type === 'team_invite_accepted' || type === 'friend_accepted') return <UserCheck size={20} />;
    if (type === 'team_invite_declined') return <UserX size={20} />;
    if (type === 'organizer_approval' || type === 'account_restored') return <ShieldCheck size={20} />;
    if (type === 'organizer_rejection' || type === 'account_rejected') return <ShieldX size={20} />;
    return <Bell size={20} />;
  };

  const getColor = (type: string) => {
    if (type === 'tournament_launched') return '#00F5FF';
    if (type === 'team_invitation') return '#00F5FF';
    if (type === 'friend_request') return '#00F5FF';
    if (type === 'team_invite_accepted' || type === 'friend_accepted') return '#00e57a';
    if (type === 'team_invite_declined') return '#ff3366';
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
    <main className={styles.page}>
      <div className={styles.container}>
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.heading}>Notifications</h1>
            <p className={styles.sub}>{unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}</p>
          </div>
        </div>

        {loading && <p className={styles.loading}>Loading...</p>}

        {!loading && notifications.length === 0 && (
          <div className={styles.emptyState}>
            <Bell size={48} strokeWidth={1} />
            <p>You're all caught up!</p>
          </div>
        )}

        <div className={styles.list}>
          {notifications.map(n => (
            <div key={n.id} className={`${styles.card} ${!n.is_read ? styles.unread : ''}`}>
              <div className={styles.iconWrap} style={{ background: getColor(n.type) + '22', color: getColor(n.type) }}>
                {getIcon(n.type)}
              </div>
              <div className={styles.body}>
                <div className={styles.cardHeader}>
                  <span className={styles.cardTitle}>{n.title}</span>
                  <span className={styles.time}>{timeAgo(n.created_at)}</span>
                </div>
                <p className={styles.msg}>{n.message}</p>

                {(n.type === 'team_invitation') && !n.is_acted && !actedInvites.includes(n.id) && (
                  <div className={styles.actions}>
                    <button className={styles.accept} onClick={() => handleTeamAction(n, 'accept')}>
                      <Check size={14} /> Accept Invitation
                    </button>
                    <button className={styles.decline} onClick={() => handleTeamAction(n, 'decline')}>
                      <X size={14} /> Decline
                    </button>
                  </div>
                )}

                {(n.type === 'friend_request') && !n.is_acted && !actedInvites.includes(n.id) && (
                  <div className={styles.actions}>
                    <button className={styles.accept} onClick={() => handleFriendAction(n, 'accept')}>
                      <Check size={14} /> Accept Friend Request
                    </button>
                    <button className={styles.decline} onClick={() => handleFriendAction(n, 'decline')}>
                      <X size={14} /> Decline
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}