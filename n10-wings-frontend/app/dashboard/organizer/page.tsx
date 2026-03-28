'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Trophy, Users, Zap, Plus, LayoutDashboard,
  PlayCircle, CheckCircle, Clock, TrendingUp,
  Pencil, Trash2, Eye, LogOut, Gamepad2,
  AlertTriangle, ChevronRight, Crown
} from 'lucide-react';
import IconTile from '../../../components/IconTile';
import api from '../../../lib/api';
import styles from './organizer.module.scss';

interface Stats {
  total_tournaments: number;
  active_tournaments: number;
  completed_tournaments: number;
  open_tournaments: number;
  total_prize_pool: number;
  total_participants: number;
  pending_registrations: number;
}

interface Tournament {
  id: number;
  title: string;
  game: string;
  status: string;
  prize_pool: number;
  max_teams: number;
  start_date: string;
  challonge_url: string;
  approved_teams: number;
  pending_teams: number;
  total_registrations: number;
}

const statusColor: Record<string, string> = {
  open: '#00F5FF', ongoing: '#00FF88',
  completed: '#8B00FF', draft: '#8892A4', cancelled: '#FF006E',
};

export default function OrganizerDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const [deleting, setDeleting] = useState<number | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  useEffect(() => {
    const role = localStorage.getItem('role');
    const isOrganizer = localStorage.getItem('is_organizer');
    if (role !== 'admin' && isOrganizer !== 'true') {
      router.push('/dashboard');
      return;
    }
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const [statsRes, tourRes] = await Promise.all([
        api.get('/tournaments/organizer-stats'),
        api.get('/tournaments/my'),
      ]);
      if (statsRes.data.success) setStats(statsRes.data.stats);
      if (tourRes.data.success) setTournaments(tourRes.data.tournaments);
    } catch (err: any) {
      if (err.response?.status === 403) router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this tournament? This cannot be undone!')) return;
    setDeleting(id);
    try {
      await api.delete(`/tournaments/${id}`);
      showToast('Tournament deleted!');
      setTournaments(prev => prev.filter(t => t.id !== id));
      if (stats) setStats({ ...stats, total_tournaments: stats.total_tournaments - 1 });
    } catch { showToast('Failed to delete!'); }
    finally { setDeleting(null); }
  };

  const handleLogout = async () => {
    try { await api.post('/auth/logout'); } catch {}
    localStorage.clear();
    router.push('/login');
  };

  if (loading) return (
    <div className={styles.loading}>
      <div className={styles.loading__spinner} />
      <p>Loading organizer panel...</p>
    </div>
  );

  const statsCards = [
    { icon: Trophy, label: 'Total Tournaments', value: stats?.total_tournaments ?? 0, color: '#00F5FF' },
    { icon: PlayCircle, label: 'Active', value: stats?.active_tournaments ?? 0, color: '#00FF88' },
    { icon: Clock, label: 'Open', value: stats?.open_tournaments ?? 0, color: '#FFD700' },
    { icon: CheckCircle, label: 'Completed', value: stats?.completed_tournaments ?? 0, color: '#8B00FF' },
    { icon: Users, label: 'Participants', value: stats?.total_participants ?? 0, color: '#FF006E' },
    { icon: AlertTriangle, label: 'Pending Approvals', value: stats?.pending_registrations ?? 0, color: '#FF6B00' },
  ];

  return (
    <div className={styles.page}>
      {toast && <div className={styles.toast}>{toast}</div>}

      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebar__brand}>
          <div className={styles.sidebar__brand_icon}>
            <Trophy size={18} color="#00F5FF" strokeWidth={1.75} />
          </div>
          <div>
            <div className={styles.sidebar__brand_name}>N-10 WINGS</div>
            <div className={styles.sidebar__brand_sub}>Organizer Panel</div>
          </div>
        </div>

        <nav className={styles.sidebar__nav}>
          {[
            { icon: LayoutDashboard, label: 'Overview', href: '/dashboard/organizer', color: '#00F5FF' },
            { icon: Plus, label: 'Create Tournament', href: '/tournaments/create', color: '#00FF88' },
            { icon: Trophy, label: 'My Tournaments', href: '/tournaments/my', color: '#8B00FF' },
            { icon: Gamepad2, label: 'Player Dashboard', href: '/dashboard', color: '#FFD700' },
          ].map(item => (
            <Link key={item.href} href={item.href} className={styles.sidebar__item}>
              <IconTile icon={item.icon} color={item.color} size={14} tileSize={28} radius={7} />
              {item.label}
            </Link>
          ))}
        </nav>

        <button className={styles.sidebar__logout} onClick={handleLogout}>
          <LogOut size={16} strokeWidth={1.75} /> Logout
        </button>
      </aside>

      {/* Main */}
      <main className={styles.main}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.header__title}>Organizer Dashboard</h1>
            <p className={styles.header__sub}>Manage your tournaments and participants</p>
          </div>
          <Link href="/tournaments/create" className={styles.create_btn}>
            <Plus size={16} strokeWidth={2.5} /> Create Tournament
          </Link>
        </div>

        {/* Stats */}
        <div className={styles.stats}>
          {statsCards.map(card => (
            <div key={card.label} className={styles.stat_card}>
              <div className={styles.stat_card__top}>
                <IconTile icon={card.icon} color={card.color} size={20} tileSize={44} radius={10} />
                <span className={styles.stat_card__value} style={{ color: card.color }}>
                  {card.label === 'Total Prize Pool'
                    ? `LKR ${Number(card.value).toLocaleString()}`
                    : card.value}
                </span>
              </div>
              <div className={styles.stat_card__label}>{card.label}</div>
            </div>
          ))}
        </div>

        {/* Pending alert */}
        {(stats?.pending_registrations ?? 0) > 0 && (
          <div className={styles.alert}>
            <AlertTriangle size={18} color="#FF6B00" strokeWidth={2} />
            <span><strong>{stats?.pending_registrations}</strong> team registration{(stats?.pending_registrations ?? 0) > 1 ? 's' : ''} waiting for approval</span>
            <ChevronRight size={16} style={{ marginLeft: 'auto' }} />
          </div>
        )}

        {/* Tournaments table */}
        <div className={styles.section}>
          <div className={styles.section__header}>
            <h2 className={styles.section__title}>My Tournaments</h2>
            <Link href="/tournaments/create" className={styles.section__btn}>
              <Plus size={13} strokeWidth={2.5} /> New
            </Link>
          </div>

          {tournaments.length === 0 ? (
            <div className={styles.empty}>
              <Trophy size={40} color="#8892A4" strokeWidth={1.5} />
              <p>No tournaments yet</p>
              <Link href="/tournaments/create" className={styles.empty__btn}>
                Create your first tournament →
              </Link>
            </div>
          ) : (
            <div className={styles.table_wrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Tournament</th>
                    <th>Status</th>
                    <th>Teams</th>
                    <th>Prize Pool</th>
                    <th>Start Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tournaments.map(t => (
                    <tr key={t.id}>
                      <td>
                        <div className={styles.tour_name}>{t.title}</div>
                        <div className={styles.tour_game}>
                          <Gamepad2 size={12} strokeWidth={1.75} style={{ display: 'inline', marginRight: 4 }} />
                          {t.game}
                        </div>
                      </td>
                      <td>
                        <span className={styles.status_badge} style={{ color: statusColor[t.status], borderColor: statusColor[t.status] + '44', background: statusColor[t.status] + '14' }}>
                          {t.status.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <div className={styles.teams_cell}>
                          <span style={{ color: '#00FF88' }}>{t.approved_teams ?? 0}</span>
                          <span style={{ color: '#8892A4' }}>/{t.max_teams}</span>
                          {(t.pending_teams ?? 0) > 0 && (
                            <span className={styles.pending_badge}>{t.pending_teams} pending</span>
                          )}
                        </div>
                      </td>
                      <td className={styles.prize_cell}>
                        LKR {Number(t.prize_pool).toLocaleString()}
                      </td>
                      <td className={styles.date_cell}>
                        {t.start_date ? new Date(t.start_date).toLocaleDateString() : '—'}
                      </td>
                      <td>
                        <div className={styles.actions}>
                          <Link href={`/tournaments/${t.id}/manage`} className={styles.action_btn}>
                            <Pencil size={13} strokeWidth={2} /> Manage
                          </Link>
                          <Link href={`/tournaments/${t.id}`} className={styles.action_btn_view}>
                            <Eye size={13} strokeWidth={2} />
                          </Link>
                          <button
                            className={styles.action_btn_del}
                            onClick={() => handleDelete(t.id)}
                            disabled={deleting === t.id}
                          >
                            <Trash2 size={13} strokeWidth={2} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}