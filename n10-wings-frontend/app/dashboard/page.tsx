'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard, Pencil, Gamepad2, Users, Trophy,
  Search, LogOut, Trophy as TrophyIcon, CheckCircle,
  XCircle, Zap, TrendingUp, User, Link as LinkIcon,
  Rocket, Lock, Shield, Building2, Globe, ChevronRight
} from 'lucide-react';
import api from '../../lib/api';
import AvatarUpload from '../../components/AvatarUpload';
import IconTile from '../../components/IconTile';
import LoadingScreen from '../../components/LoadingScreen';
import styles from './dashboard.module.scss';

interface Profile {
  full_name?: string;
  bio?: string;
  avatar?: string;
  country?: string;
  phone?: string;
  date_of_birth?: string;
  social_facebook?: string;
  social_instagram?: string;
  social_youtube?: string;
  social_twitter?: string;
}

interface GamerProfile {
  game_preferences?: string;
  player_rank?: string;
  playstyle?: string;
  tournaments_played?: number;
  wins?: number;
  losses?: number;
  points?: number;
}

interface OrganizerProfile {
  organization_name?: string;
  experience_years?: number;
  website?: string;
  tournaments_hosted?: number;
  bio?: string;
}

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  is_organizer: boolean;
  organizer_status: string;
  created_at: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [gamerProfile, setGamerProfile] = useState<GamerProfile | null>(null);
  const [organizerProfile, setOrganizerProfile] = useState<OrganizerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'player' | 'organizer'>('player');
  const [applyLoading, setApplyLoading] = useState(false);
  const [applyMsg, setApplyMsg] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) { router.push('/login'); return; }
        const res = await api.get('/profile/me');
        if (res.data.success) {
          setUser(res.data.user);
          setProfile(res.data.profile);
          setGamerProfile(res.data.gamerProfile);
          setOrganizerProfile(res.data.organizerProfile);
        }
      } catch {
        localStorage.removeItem('token');
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [router]);

  const handleLogout = async () => {
    try { await api.post('/auth/logout'); } catch {}
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    router.push('/login');
  };

  const handleApplyOrganizer = async () => {
    setApplyLoading(true);
    setApplyMsg('');
    try {
      const res = await api.post('/profile/apply-organizer');
      setApplyMsg(res.data.message);
      if (user) setUser({ ...user, organizer_status: 'pending' });
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setApplyMsg(e.response?.data?.message || 'Failed to apply!');
    } finally {
      setApplyLoading(false);
    }
  };

  if (loading) {
    return <LoadingScreen message="SYNCING PLAYER DATA..." />;
  }

  const winRate = gamerProfile?.wins !== undefined &&
    gamerProfile?.losses !== undefined &&
    gamerProfile.wins + gamerProfile.losses > 0
    ? Math.round((gamerProfile.wins / (gamerProfile.wins + gamerProfile.losses)) * 100)
    : 0;

  const getRoleIcon = () => {
    if (user?.role === 'admin') return <Shield size={13} strokeWidth={2} style={{ display:'inline', marginRight:4 }} />;
    if (user?.role === 'sponsor') return <Building2 size={13} strokeWidth={2} style={{ display:'inline', marginRight:4 }} />;
    if (user?.is_organizer) return <Trophy size={13} strokeWidth={2} style={{ display:'inline', marginRight:4 }} />;
    return <Gamepad2 size={13} strokeWidth={2} style={{ display:'inline', marginRight:4 }} />;
  };

  const getRoleLabel = () => {
    if (user?.role === 'admin') return 'ADMIN';
    if (user?.role === 'sponsor') return 'SPONSOR';
    if (user?.is_organizer) return 'ORGANIZER';
    return 'GAMER';
  };

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: null, active: true, color: '#00F5FF' },
    ...(user?.is_organizer && user?.role !== 'admin' ? [{ icon: Trophy, label: 'Organizer Panel', href: '/dashboard/organizer', color: '#FFD700' }] : []),
    { icon: Pencil, label: 'Edit Profile', href: '/profile/edit', color: '#00F5FF' },
    ...(user?.role !== 'admin' ? [
      { icon: Gamepad2, label: 'Game Identities', href: '/dashboard/game-identities', color: '#FF006E' },
      { icon: Users, label: 'My Teams', href: '/teams?filter=my', color: '#00F5FF' },
      { icon: Trophy, label: 'My Tournaments', href: '/tournaments?filter=my', color: '#FFD700' },
      { icon: Search, label: 'Find Players', href: '/players', color: '#00FF88' },
    ] : []),
  ];

  const statsData = [
    { icon: Trophy, label: 'Tournaments', value: gamerProfile?.tournaments_played ?? 0, color: '#00F5FF' },
    { icon: CheckCircle, label: 'Wins', value: gamerProfile?.wins ?? 0, color: '#00FF88' },
    { icon: XCircle, label: 'Losses', value: gamerProfile?.losses ?? 0, color: '#FF006E' },
    { icon: Zap, label: 'Points', value: gamerProfile?.points ?? 0, color: '#00F5FF' },
    { icon: TrendingUp, label: 'Win Rate', value: `${winRate}%`, color: '#FFD700' },
  ];

  return (
    <div className={styles.dashboard}>
      <div className={styles.bg_grid} />

      {/* ── Sidebar ── */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebar__logo}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Gamepad2 size={18} color="#00F5FF" strokeWidth={1.75} />
            <span>N-10 WINGS</span>
          </Link>
        </div>

        <div className={styles.sidebar__avatar}>
          <AvatarUpload
            currentAvatar={profile?.avatar || ''}
            username={user?.username}
            onUpdate={(newAvatar) => setProfile(prev => ({ ...prev, avatar: newAvatar }))}
          />
          <div className={styles.sidebar__name}>{profile?.full_name || user?.username}</div>
          <div className={styles.sidebar__role}>
            {getRoleIcon()}{getRoleLabel()}
          </div>
        </div>

        <nav className={styles.sidebar__nav}>
          {navItems.map((item) => (
            item.href ? (
              <Link
                key={item.label}
                href={item.href}
                className={styles.sidebar__link}
              >
                <IconTile icon={item.icon} color={item.color} size={14} tileSize={28} radius={7} />
                {item.label}
              </Link>
            ) : (
              <span
                key={item.label}
                className={`${styles.sidebar__link} ${styles['sidebar__link--active']}`}
              >
                <IconTile icon={item.icon} color={item.color} size={14} tileSize={28} radius={7} />
                {item.label}
              </span>
            )
          ))}
        </nav>

        <button onClick={handleLogout} className={styles.sidebar__logout}>
          <LogOut size={15} strokeWidth={2} />
          Logout
        </button>
      </aside>

      {/* ── Main ── */}
      <main className={styles.main}>

        <div className={styles.main__header}>
          <div>
            <h1 className={styles.main__title}>
              WELCOME,{' '}
              <span className={styles.main__title_name}>
                {user?.username?.toUpperCase()}!
              </span>
            </h1>
            <p className={styles.main__sub}>Manage your E-Sports profile and activities</p>
          </div>
          <Link href="/profile/edit" className={styles.main__edit_btn}>
            <Pencil size={13} strokeWidth={2} style={{ marginRight: 4 }} />
            Edit Profile
          </Link>
        </div>

        {/* Tabs */}
        {user?.role !== 'admin' && (
          <div className={styles.tabs}>
            <button
              className={`${styles.tabs__btn} ${activeTab === 'player' ? styles['tabs__btn--active'] : ''}`}
              onClick={() => setActiveTab('player')}
            >
              <Gamepad2 size={14} strokeWidth={1.75} style={{ marginRight: 5 }} />
              PLAYER PROFILE
            </button>
            <button
              className={`${styles.tabs__btn} ${activeTab === 'organizer' ? styles['tabs__btn--active'] : ''} ${!user?.is_organizer ? styles['tabs__btn--locked'] : ''}`}
              onClick={() => user?.is_organizer && setActiveTab('organizer')}
            >
              {user?.is_organizer
                ? <Trophy size={14} strokeWidth={1.75} style={{ marginRight: 5 }} />
                : <Lock size={14} strokeWidth={1.75} style={{ marginRight: 5 }} />
              }
              ORGANIZER PROFILE
            </button>
          </div>
        )}

        {/* ── PLAYER TAB ── */}
        {(activeTab === 'player' || user?.role === 'admin') && (
          <>
            {user?.role !== 'admin' && (
              <div className={styles.stats}>
                {statsData.map((stat) => (
                  <div key={stat.label} className={styles.stats__card}>
                    <IconTile icon={stat.icon} color={stat.color} size={20} tileSize={44} radius={10} />
                    <span className={styles.stats__value} style={{ color: stat.color }}>{stat.value}</span>
                    <span className={styles.stats__label}>{stat.label}</span>
                  </div>
                ))}
              </div>
            )}

            <div className={styles.content}>

              {/* Personal Info */}
              <div className={styles.card}>
                <h2 className={styles.card__title}>
                  <IconTile icon={User} color="#00F5FF" size={12} tileSize={22} radius={5} />
                  <span style={{ marginLeft: 8 }}>PERSONAL INFO</span>
                </h2>
                <div className={styles.card__grid}>
                  {[
                    { label: 'Username', value: user?.username },
                    { label: 'Email', value: user?.email },
                    { label: 'Full Name', value: profile?.full_name || '—' },
                    { label: 'Country', value: profile?.country || '—' },
                    { label: 'Phone', value: profile?.phone || '—' },
                    { label: 'Member Since', value: user?.created_at?.split('T')[0] },
                  ].map((item) => (
                    <div key={item.label} className={styles.card__item}>
                      <span className={styles.card__item_label}>{item.label}</span>
                      <span className={styles.card__item_value}>{item.value}</span>
                    </div>
                  ))}
                </div>
                {profile?.bio && (
                  <div className={styles.card__bio}>
                    <span className={styles.card__item_label}>Bio</span>
                    <p className={styles.card__bio_text}>{profile.bio}</p>
                  </div>
                )}
              </div>

              {/* Gaming Info */}
              {user?.role !== 'admin' && (
                <div className={styles.card}>
                  <h2 className={styles.card__title}>
                    <IconTile icon={Gamepad2} color="#00F5FF" size={12} tileSize={22} radius={5} />
                    <span style={{ marginLeft: 8 }}>GAMING INFO</span>
                  </h2>
                  <div className={styles.card__grid}>
                    {[
                      { label: 'Rank', value: gamerProfile?.player_rank || '—' },
                      { label: 'Playstyle', value: gamerProfile?.playstyle || '—' },
                      { label: 'Games', value: gamerProfile?.game_preferences || '—' },
                    ].map((item) => (
                      <div key={item.label} className={styles.card__item}>
                        <span className={styles.card__item_label}>{item.label}</span>
                        <span className={styles.card__item_value}>{item.value}</span>
                      </div>
                    ))}
                  </div>
                  {!gamerProfile?.player_rank && (
                    <div className={styles.card__empty}>
                      <p>Complete your gaming profile!</p>
                      <Link href="/profile/edit" className={styles.card__empty_btn}>
                        Add Gaming Info →
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {/* Social Links */}
              <div className={styles.card}>
                <h2 className={styles.card__title}>
                  <IconTile icon={LinkIcon} color="#FF006E" size={12} tileSize={22} radius={5} />
                  <span style={{ marginLeft: 8 }}>SOCIAL LINKS</span>
                </h2>
                <div className={styles.card__socials}>
                  {[
                    { label: 'Facebook', value: profile?.social_facebook },
                    { label: 'Instagram', value: profile?.social_instagram },
                    { label: 'YouTube', value: profile?.social_youtube },
                    { label: 'Twitter / X', value: profile?.social_twitter },
                  ].map((item) => (
                    <div key={item.label} className={styles.card__social_item}>
                      <span className={styles.card__item_label}>{item.label}</span>
                      {item.value ? (
                        <a href={item.value} target="_blank" rel="noreferrer" className={styles.card__social_link}>
                          View Profile →
                        </a>
                      ) : (
                        <span className={styles.card__item_value}>—</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Become Organizer */}
              {!user?.is_organizer && user?.role !== 'admin' && (
                <div className={styles.card}>
                  <h2 className={styles.card__title}>
                    <IconTile icon={Trophy} color="#FFD700" size={12} tileSize={22} radius={5} />
                    <span style={{ marginLeft: 8 }}>BECOME AN ORGANIZER</span>
                  </h2>
                  <p className={styles.card__desc}>
                    Apply to become an organizer and start hosting tournaments!
                  </p>
                  {user?.organizer_status === 'pending' ? (
                    <div className={styles.card__pending}>
                      <Zap size={14} strokeWidth={2} style={{ marginRight: 6, display: 'inline' }} />
                      Application pending — Admin will review soon!
                    </div>
                  ) : user?.organizer_status === 'rejected' ? (
                    <div className={styles.card__rejected}>
                      <XCircle size={14} strokeWidth={2} style={{ marginRight: 6, display: 'inline' }} />
                      Application rejected. Contact admin for more info.
                    </div>
                  ) : (
                    <>
                      {applyMsg && <div className={styles.card__apply_msg}>{applyMsg}</div>}
                      <button
                        className={styles.card__apply_btn}
                        onClick={handleApplyOrganizer}
                        disabled={applyLoading}
                      >
                        <Rocket size={15} strokeWidth={2} style={{ marginRight: 6, display: 'inline' }} />
                        {applyLoading ? 'Applying...' : 'Apply for Organizer'}
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {/* ── ORGANIZER TAB ── */}
        {activeTab === 'organizer' && user?.is_organizer && (
          <div className={styles.content}>
            <div className={styles.card}>
              <h2 className={styles.card__title}>
                <IconTile icon={Trophy} color="#FFD700" size={12} tileSize={22} radius={5} />
                <span style={{ marginLeft: 8 }}>ORGANIZER INFO</span>
              </h2>
              <div className={styles.card__grid}>
                {[
                  { label: 'Organization', value: organizerProfile?.organization_name || '—' },
                  { label: 'Experience', value: organizerProfile?.experience_years ? `${organizerProfile.experience_years} years` : '—' },
                  { label: 'Website', value: organizerProfile?.website || '—' },
                  { label: 'Tournaments Hosted', value: organizerProfile?.tournaments_hosted ?? 0 },
                ].map((item) => (
                  <div key={item.label} className={styles.card__item}>
                    <span className={styles.card__item_label}>{item.label}</span>
                    <span className={styles.card__item_value}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.card}>
              <h2 className={styles.card__title}>
                <IconTile icon={Zap} color="#00F5FF" size={12} tileSize={22} radius={5} />
                <span style={{ marginLeft: 8 }}>QUICK ACTIONS</span>
              </h2>
              <div className={styles.card__actions}>
                <Link href="/dashboard/organizer" className={styles.card__action_btn}>
                  <ChevronRight size={14} strokeWidth={2} style={{ marginRight: 4, display: 'inline' }} />
                  Organizer Panel
                </Link>
                <Link href="/tournaments/create" className={styles.card__action_btn}>
                  <ChevronRight size={14} strokeWidth={2} style={{ marginRight: 4, display: 'inline' }} />
                  Create Tournament
                </Link>
                <Link href="/tournaments?filter=my" className={styles.card__action_btn}>
                  <ChevronRight size={14} strokeWidth={2} style={{ marginRight: 4, display: 'inline' }} />
                  My Tournaments
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}