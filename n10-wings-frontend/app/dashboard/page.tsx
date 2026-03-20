'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '../../lib/api';
import AvatarUpload from '../../components/AvatarUpload';
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
    return (
      <div className={styles.loading}>
        <div className={styles.loading__spinner} />
        <p>Loading dashboard...</p>
      </div>
    );
  }

  const winRate = gamerProfile?.wins !== undefined &&
    gamerProfile?.losses !== undefined &&
    gamerProfile.wins + gamerProfile.losses > 0
    ? Math.round((gamerProfile.wins / (gamerProfile.wins + gamerProfile.losses)) * 100)
    : 0;

  return (
    <div className={styles.dashboard}>

      {/* ── Sidebar ── */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebar__logo}>
          <Link href="/">🎮 N-10 WINGS</Link>
        </div>

        {/* Avatar */}
        <div className={styles.sidebar__avatar}>
          <AvatarUpload
            currentAvatar={profile?.avatar || ''}
            username={user?.username}
            onUpdate={(newAvatar) =>
              setProfile(prev => ({ ...prev, avatar: newAvatar }))
            }
          />
          <div className={styles.sidebar__name}>
            {profile?.full_name || user?.username}
          </div>
          <div className={styles.sidebar__role}>
            {user?.role === 'admin' ? '👑 ADMIN' :
             user?.role === 'sponsor' ? '💼 SPONSOR' :
             user?.is_organizer ? '🏆 ORGANIZER' : '🎮 GAMER'}
          </div>
        </div>

        {/* Nav */}
        <nav className={styles.sidebar__nav}>
          <span className={`${styles.sidebar__link} ${styles['sidebar__link--active']}`}>
            📊 Dashboard
          </span>
          <Link href="/profile/edit" className={styles.sidebar__link}>
            ✏️ Edit Profile
          </Link>
          <Link href="/dashboard/game-identities" className={styles.sidebar__link}>
            🎮 Game Identities
          </Link>
          <Link href="/teams" className={styles.sidebar__link}>
            👥 My Team
          </Link>
          <Link href="/tournaments" className={styles.sidebar__link}>
            🏆 Tournaments
          </Link>
          <Link href="/players" className={styles.sidebar__link}>
            🔍 Find Players
          </Link>
        </nav>

        <button onClick={handleLogout} className={styles.sidebar__logout}>
          🚪 Logout
        </button>
      </aside>

      {/* ── Main ── */}
      <main className={styles.main}>

        {/* Header */}
        <div className={styles.main__header}>
          <div>
            <h1 className={styles.main__title}>
              WELCOME,{' '}
              <span className={styles.main__title_name}>
                {user?.username?.toUpperCase()}!
              </span>
            </h1>
            <p className={styles.main__sub}>
              Manage your E-Sports profile and activities
            </p>
          </div>
          <Link href="/profile/edit" className={styles.main__edit_btn}>
            ✏️ Edit Profile
          </Link>
        </div>

        {/* Toggle Tabs */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tabs__btn} ${activeTab === 'player' ? styles['tabs__btn--active'] : ''}`}
            onClick={() => setActiveTab('player')}
          >
            🎮 PLAYER PROFILE
          </button>
          <button
            className={`${styles.tabs__btn} ${activeTab === 'organizer' ? styles['tabs__btn--active'] : ''} ${!user?.is_organizer ? styles['tabs__btn--locked'] : ''}`}
            onClick={() => user?.is_organizer && setActiveTab('organizer')}
          >
            {user?.is_organizer ? '🏆' : '🔒'} ORGANIZER PROFILE
          </button>
        </div>

        {/* ── PLAYER TAB ── */}
        {activeTab === 'player' && (
          <>
            {/* Stats */}
            <div className={styles.stats}>
              {[
                { icon: '🏆', label: 'Tournaments', value: gamerProfile?.tournaments_played ?? 0, color: '#00F5FF' },
                { icon: '✅', label: 'Wins', value: gamerProfile?.wins ?? 0, color: '#00FF88' },
                { icon: '❌', label: 'Losses', value: gamerProfile?.losses ?? 0, color: '#FF006E' },
                { icon: '⚡', label: 'Points', value: gamerProfile?.points ?? 0, color: '#8B00FF' },
                { icon: '📈', label: 'Win Rate', value: `${winRate}%`, color: '#FFD700' },
              ].map((stat) => (
                <div key={stat.label} className={styles.stats__card}>
                  <span className={styles.stats__icon}>{stat.icon}</span>
                  <span className={styles.stats__value} style={{ color: stat.color }}>
                    {stat.value}
                  </span>
                  <span className={styles.stats__label}>{stat.label}</span>
                </div>
              ))}
            </div>

            {/* Info Grid */}
            <div className={styles.content}>

              {/* Personal Info */}
              <div className={styles.card}>
                <h2 className={styles.card__title}>👤 PERSONAL INFO</h2>
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
              <div className={styles.card}>
                <h2 className={styles.card__title}>🎮 GAMING INFO</h2>
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

              {/* Social Links */}
              <div className={styles.card}>
                <h2 className={styles.card__title}>🔗 SOCIAL LINKS</h2>
                <div className={styles.card__socials}>
                  {[
                    { label: '📘 Facebook', value: profile?.social_facebook },
                    { label: '📸 Instagram', value: profile?.social_instagram },
                    { label: '▶️ YouTube', value: profile?.social_youtube },
                    { label: '🐦 Twitter', value: profile?.social_twitter },
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

              {/* Organizer Apply Card */}
              {!user?.is_organizer && (
                <div className={styles.card}>
                  <h2 className={styles.card__title}>🏆 BECOME AN ORGANIZER</h2>
                  <p className={styles.card__desc}>
                    Apply to become an organizer and start hosting tournaments!
                  </p>
                  {user?.organizer_status === 'pending' ? (
                    <div className={styles.card__pending}>
                      ⏳ Application pending — Admin will review soon!
                    </div>
                  ) : user?.organizer_status === 'rejected' ? (
                    <div className={styles.card__rejected}>
                      ❌ Application rejected. Contact admin for more info.
                    </div>
                  ) : (
                    <>
                      {applyMsg && (
                        <div className={styles.card__apply_msg}>{applyMsg}</div>
                      )}
                      <button
                        className={styles.card__apply_btn}
                        onClick={handleApplyOrganizer}
                        disabled={applyLoading}
                      >
                        {applyLoading ? 'Applying...' : '🚀 Apply for Organizer'}
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
              <h2 className={styles.card__title}>🏆 ORGANIZER INFO</h2>
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
              <h2 className={styles.card__title}>⚡ QUICK ACTIONS</h2>
              <div className={styles.card__actions}>
                <Link href="/tournaments/create" className={styles.card__action_btn}>
                  ➕ Create Tournament
                </Link>
                <Link href="/tournaments/my" className={styles.card__action_btn}>
                  📋 My Tournaments
                </Link>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}