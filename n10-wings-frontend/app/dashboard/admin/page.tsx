'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users, Trophy, ShieldCheck, LayoutDashboard,
  TrendingUp, UserCheck, UserX, Search, ChevronDown,
  CheckCircle, XCircle, Shield, Gamepad2, Briefcase,
  Crown, LogOut, RefreshCw, Eye, AlertTriangle
} from 'lucide-react';
import IconTile from '../../../components/IconTile';
import api from '../../../lib/api';
import styles from './admin.module.scss';

// ── Types ──
interface Stats {
  total_users: number;
  total_gamers: number;
  total_sponsors: number;
  total_organizers: number;
  pending_applications: number;
  total_tournaments: number;
  total_teams: number;
  active_users: number;
  suspended_users: number;
  verified_users: number;
  new_users_30d: number;
  monthly_growth: { month: string; count: number }[];
}

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  full_name?: string;
  avatar?: string;
  country?: string;
  is_organizer: boolean;
  organizer_status: string;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
}

interface Application {
  id: number;
  username: string;
  email: string;
  full_name?: string;
  avatar?: string;
  country?: string;
  bio?: string;
  organizer_status: string;
  created_at: string;
}

type Tab = 'overview' | 'users' | 'applications';

export default function AdminDashboard() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('overview');
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [totalUsers, setTotalUsers] = useState(0);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  // Auth check
  useEffect(() => {
    const role = localStorage.getItem('role');
    if (role !== 'admin') { router.push('/login'); return; }
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get('/admin/stats');
      if (res.data.success) setStats(res.data.stats);
    } catch {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (roleFilter) params.set('role', roleFilter);
      if (statusFilter) params.set('status', statusFilter);
      const res = await api.get(`/admin/users?${params}`);
      if (res.data.success) {
        setUsers(res.data.users);
        setTotalUsers(res.data.total);
      }
    } catch {}
    finally { setUsersLoading(false); }
  }, [search, roleFilter, statusFilter]);

  const fetchApplications = async () => {
    try {
      const res = await api.get('/admin/organizer-applications?status=pending');
      if (res.data.success) setApplications(res.data.applications);
    } catch {}
  };

  useEffect(() => {
    if (tab === 'users') fetchUsers();
    if (tab === 'applications') fetchApplications();
  }, [tab, fetchUsers]);

  const handleSuspend = async (userId: number) => {
    setActionLoading(userId);
    try {
      const res = await api.put(`/admin/users/${userId}/suspend`);
      showToast(res.data.message);
      setUsers(prev => prev.map(u =>
        u.id === userId ? { ...u, is_active: res.data.is_active } : u
      ));
    } catch { showToast('Action failed!'); }
    finally { setActionLoading(null); }
  };

  const handleRoleChange = async (userId: number, role: string) => {
    try {
      await api.put(`/admin/users/${userId}/role`, { role });
      showToast('Role updated!');
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u));
    } catch { showToast('Failed to update role!'); }
  };

  const handleApplication = async (appId: number, action: 'approve' | 'reject') => {
    setActionLoading(appId);
    try {
      const res = await api.put(`/admin/organizer-applications/${appId}`, { action });
      showToast(res.data.message);
      setApplications(prev => prev.filter(a => a.id !== appId));
      if (stats) {
        setStats({ ...stats, pending_applications: stats.pending_applications - 1 });
      }
    } catch { showToast('Action failed!'); }
    finally { setActionLoading(null); }
  };

  const handleLogout = async () => {
    try { await api.post('/auth/logout'); } catch {}
    localStorage.clear();
    router.push('/login');
  };

  if (loading) return (
    <div className={styles.loading}>
      <div className={styles.loading__spinner} />
      <p>Loading admin panel...</p>
    </div>
  );

  const navItems: { key: Tab; icon: any; label: string; badge?: number }[] = [
    { key: 'overview', icon: LayoutDashboard, label: 'Overview' },
    { key: 'users', icon: Users, label: 'Users', badge: stats?.total_users },
    { key: 'applications', icon: ShieldCheck, label: 'Applications', badge: stats?.pending_applications },
  ];

  return (
    <div className={styles.admin}>

      {/* Toast */}
      {toast && <div className={styles.toast}>{toast}</div>}

      {/* ── Sidebar ── */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebar__brand}>
          <div className={styles.sidebar__brand_icon}>
            <Crown size={18} color="#FFD700" strokeWidth={1.75} />
          </div>
          <div>
            <div className={styles.sidebar__brand_name}>N-10 WINGS</div>
            <div className={styles.sidebar__brand_sub}>Admin Panel</div>
          </div>
        </div>

        <nav className={styles.sidebar__nav}>
          {navItems.map((item) => (
            <button
              key={item.key}
              className={`${styles.sidebar__item} ${tab === item.key ? styles['sidebar__item--active'] : ''}`}
              onClick={() => setTab(item.key)}
            >
              <item.icon size={17} strokeWidth={1.75} />
              <span>{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span className={styles.sidebar__badge}>{item.badge}</span>
              )}
            </button>
          ))}
        </nav>

        <button className={styles.sidebar__logout} onClick={handleLogout}>
          <LogOut size={16} strokeWidth={1.75} />
          Logout
        </button>
      </aside>

      {/* ── Content ── */}
      <div className={styles.content}>

        {/* Header */}
        <header className={styles.header}>
          <div>
            <h1 className={styles.header__title}>
              {tab === 'overview' && 'Platform Overview'}
              {tab === 'users' && 'User Management'}
              {tab === 'applications' && 'Organizer Applications'}
            </h1>
            <p className={styles.header__sub}>
              {tab === 'overview' && 'Real-time platform statistics'}
              {tab === 'users' && `${totalUsers || stats?.total_users || 0} total users`}
              {tab === 'applications' && `${stats?.pending_applications || 0} pending review`}
            </p>
          </div>
          <button className={styles.header__refresh} onClick={fetchStats}>
            <RefreshCw size={15} strokeWidth={2} />
            Refresh
          </button>
        </header>

        {/* ── OVERVIEW TAB ── */}
        {tab === 'overview' && stats && (
          <div className={styles.overview}>

            {/* Stat cards */}
            <div className={styles.cards}>
              {[
                { icon: Users, label: 'Total Users', value: stats.total_users, color: '#00F5FF', sub: `+${stats.new_users_30d} this month` },
                { icon: Gamepad2, label: 'Gamers', value: stats.total_gamers, color: '#8B00FF', sub: `${stats.verified_users} verified` },
                { icon: Trophy, label: 'Organizers', value: stats.total_organizers, color: '#FFD700', sub: `${stats.pending_applications} pending` },
                { icon: Briefcase, label: 'Sponsors', value: stats.total_sponsors, color: '#FF006E', sub: 'registered sponsors' },
                { icon: UserCheck, label: 'Active', value: stats.active_users, color: '#00FF88', sub: 'active accounts' },
                { icon: UserX, label: 'Suspended', value: stats.suspended_users, color: '#FF4444', sub: 'suspended accounts' },
              ].map((card) => (
                <div key={card.label} className={styles.stat_card}>
                  <div className={styles.stat_card__top}>
                    <IconTile icon={card.icon} color={card.color} size={20} tileSize={44} radius={10} />
                    <span className={styles.stat_card__value} style={{ color: card.color }}>
                      {card.value.toLocaleString()}
                    </span>
                  </div>
                  <div className={styles.stat_card__label}>{card.label}</div>
                  <div className={styles.stat_card__sub}>{card.sub}</div>
                </div>
              ))}
            </div>

            {/* Growth chart (simple bar) */}
            {stats.monthly_growth.length > 0 && (
              <div className={styles.chart_card}>
                <h3 className={styles.chart_card__title}>
                  <TrendingUp size={15} strokeWidth={2} style={{ marginRight: 8, display: 'inline' }} />
                  User Growth (Last 6 Months)
                </h3>
                <div className={styles.chart}>
                  {stats.monthly_growth.map((m, i) => {
                    const max = Math.max(...stats.monthly_growth.map(x => x.count));
                    const pct = max > 0 ? (m.count / max) * 100 : 0;
                    return (
                      <div key={i} className={styles.chart__bar_wrap}>
                        <div className={styles.chart__bar_val}>{m.count}</div>
                        <div className={styles.chart__bar_track}>
                          <div
                            className={styles.chart__bar_fill}
                            style={{ height: `${Math.max(pct, 4)}%` }}
                          />
                        </div>
                        <div className={styles.chart__bar_label}>{m.month}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Pending applications alert */}
            {stats.pending_applications > 0 && (
              <div className={styles.alert} onClick={() => setTab('applications')}>
                <AlertTriangle size={18} color="#FFD700" strokeWidth={2} />
                <span>
                  <strong>{stats.pending_applications}</strong> organizer application{stats.pending_applications > 1 ? 's' : ''} waiting for review
                </span>
                <span className={styles.alert__cta}>Review now →</span>
              </div>
            )}
          </div>
        )}

        {/* ── USERS TAB ── */}
        {tab === 'users' && (
          <div className={styles.users}>

            {/* Filters */}
            <div className={styles.filters}>
              <div className={styles.filters__search}>
                <Search size={15} color="#8892A4" strokeWidth={2} />
                <input
                  type="text"
                  placeholder="Search username, email, name..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && fetchUsers()}
                  className={styles.filters__input}
                />
              </div>
              <select
                className={styles.filters__select}
                value={roleFilter}
                onChange={e => setRoleFilter(e.target.value)}
              >
                <option value="">All Roles</option>
                <option value="user">Gamer</option>
                <option value="sponsor">Sponsor</option>
                <option value="admin">Admin</option>
              </select>
              <select
                className={styles.filters__select}
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="unverified">Unverified</option>
              </select>
              <button className={styles.filters__btn} onClick={fetchUsers}>
                <Search size={14} strokeWidth={2} /> Search
              </button>
            </div>

            {/* Table */}
            {usersLoading ? (
              <div className={styles.table_loading}>
                <div className={styles.loading__spinner} />
              </div>
            ) : (
              <div className={styles.table_wrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Joined</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id}>
                        <td>
                          <div className={styles.user_cell}>
                            <div className={styles.user_cell__avatar}>
                              {u.avatar
                                ? <img src={u.avatar} alt={u.username} />
                                : <Gamepad2 size={16} color="#8892A4" strokeWidth={1.75} />
                              }
                            </div>
                            <div>
                              <div className={styles.user_cell__name}>{u.full_name || u.username}</div>
                              <div className={styles.user_cell__email}>{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <select
                            className={styles.role_select}
                            value={u.role}
                            onChange={e => handleRoleChange(u.id, e.target.value)}
                          >
                            <option value="user">Gamer</option>
                            <option value="sponsor">Sponsor</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td>
                          <div className={styles.status_badges}>
                            <span className={`${styles.badge} ${u.is_active ? styles['badge--active'] : styles['badge--suspended']}`}>
                              {u.is_active ? 'Active' : 'Suspended'}
                            </span>
                            {!u.is_verified && (
                              <span className={`${styles.badge} ${styles['badge--unverified']}`}>
                                Unverified
                              </span>
                            )}
                            {u.is_organizer && (
                              <span className={`${styles.badge} ${styles['badge--organizer']}`}>
                                Organizer
                              </span>
                            )}
                          </div>
                        </td>
                        <td className={styles.date_cell}>
                          {new Date(u.created_at).toLocaleDateString()}
                        </td>
                        <td>
                          <button
                            className={`${styles.action_btn} ${u.is_active ? styles['action_btn--suspend'] : styles['action_btn--activate']}`}
                            onClick={() => handleSuspend(u.id)}
                            disabled={actionLoading === u.id}
                          >
                            {actionLoading === u.id ? (
                              <RefreshCw size={13} strokeWidth={2} />
                            ) : u.is_active ? (
                              <><UserX size={13} strokeWidth={2} /> Suspend</>
                            ) : (
                              <><UserCheck size={13} strokeWidth={2} /> Activate</>
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {users.length === 0 && (
                  <div className={styles.empty}>
                    <Eye size={32} color="#8892A4" strokeWidth={1.5} />
                    <p>No users found</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── APPLICATIONS TAB ── */}
        {tab === 'applications' && (
          <div className={styles.applications}>
            {applications.length === 0 ? (
              <div className={styles.empty}>
                <CheckCircle size={40} color="#00FF88" strokeWidth={1.5} />
                <p>No pending applications!</p>
              </div>
            ) : (
              <div className={styles.app_grid}>
                {applications.map((app) => (
                  <div key={app.id} className={styles.app_card}>
                    <div className={styles.app_card__header}>
                      <div className={styles.app_card__avatar}>
                        {app.avatar
                          ? <img src={app.avatar} alt={app.username} />
                          : <Gamepad2 size={22} color="#8892A4" strokeWidth={1.75} />
                        }
                      </div>
                      <div>
                        <div className={styles.app_card__name}>{app.full_name || app.username}</div>
                        <div className={styles.app_card__email}>{app.email}</div>
                        {app.country && (
                          <div className={styles.app_card__country}>🌍 {app.country}</div>
                        )}
                      </div>
                    </div>
                    {app.bio && (
                      <p className={styles.app_card__bio}>{app.bio}</p>
                    )}
                    <div className={styles.app_card__meta}>
                      Applied {new Date(app.created_at).toLocaleDateString()}
                    </div>
                    <div className={styles.app_card__actions}>
                      <button
                        className={styles.approve_btn}
                        onClick={() => handleApplication(app.id, 'approve')}
                        disabled={actionLoading === app.id}
                      >
                        <CheckCircle size={14} strokeWidth={2} />
                        {actionLoading === app.id ? 'Processing...' : 'Approve'}
                      </button>
                      <button
                        className={styles.reject_btn}
                        onClick={() => handleApplication(app.id, 'reject')}
                        disabled={actionLoading === app.id}
                      >
                        <XCircle size={14} strokeWidth={2} />
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}