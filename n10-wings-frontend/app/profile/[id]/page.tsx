'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import api from '../../../lib/api';
import styles from './profile.module.scss';

interface User {
  id: number;
  username: string;
  role: string;
  is_organizer: boolean;
  created_at: string;
}

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
}

interface GameIdentity {
  id: number;
  game_name: string;
  game_type: string;
  game_username: string;
  is_verified: boolean;
  last_synced: string;
  api_stats: string | null;
}

const GAME_ICONS: Record<string, string> = {
  'PUBG PC': '🎯', 'PUBG Mobile': '📱',
  'Valorant': '⚡', 'League of Legends': '🗡️',
  'Free Fire': '🔥', 'Mobile Legends': '⚔️',
  'COD Mobile': '💥', 'Fortnite': '🌀',
  'Minecraft': '⛏️',
};

const GAME_COLORS: Record<string, string> = {
  'PUBG PC': '#F5A623', 'PUBG Mobile': '#F5A623',
  'Valorant': '#FF4655', 'League of Legends': '#C89B3C',
  'Free Fire': '#FF6B00', 'Mobile Legends': '#1890FF',
  'COD Mobile': '#4CAF50', 'Fortnite': '#9C27B0',
  'Minecraft': '#8B6914',
};

export default function PublicProfilePage() {
  const { id } = useParams();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [gamerProfile, setGamerProfile] = useState<GamerProfile | null>(null);
  const [organizerProfile, setOrganizerProfile] = useState<OrganizerProfile | null>(null);
  const [gameIdentities, setGameIdentities] = useState<GameIdentity[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [profileRes, gameRes] = await Promise.all([
          api.get(`/profile/${id}`),
          api.get(`/game-identities/${id}`).catch(() => ({ data: { identities: [] } })),
        ]);

        if (profileRes.data.success) {
          setUser(profileRes.data.user);
          setProfile(profileRes.data.profile);
          setGamerProfile(profileRes.data.gamerProfile);
          setOrganizerProfile(profileRes.data.organizerProfile);
        } else {
          setNotFound(true);
        }
        setGameIdentities(gameRes.data.identities || []);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchAll();
  }, [id]);

  const parseStats = (s: string | null) => {
    if (!s) return null;
    try { return typeof s === 'string' ? JSON.parse(s) : s; }
    catch { return null; }
  };

  if (loading) return (
    <div className={styles.loading}>
      <div className={styles.spinner} />
      <p>Loading profile...</p>
    </div>
  );

  if (notFound || !user) return (
    <div className={styles.notfound}>
      <span>😕</span>
      <h2>Profile Not Found</h2>
      <p>This player doesn&apos;t exist or has been removed.</p>
      <Link href="/players">← Back to Players</Link>
    </div>
  );

  const winRate = gamerProfile?.wins !== undefined &&
    gamerProfile?.losses !== undefined &&
    gamerProfile.wins + gamerProfile.losses > 0
    ? Math.round((gamerProfile.wins / (gamerProfile.wins + gamerProfile.losses)) * 100)
    : 0;

  const roleColor = user.role === 'sponsor' ? '#FF006E' :
    user.is_organizer ? '#8B00FF' : '#00F5FF';
  const roleLabel = user.role === 'sponsor' ? '💼 SPONSOR' :
    user.is_organizer ? '🏆 ORGANIZER' : '🎮 GAMER';

  const apiGames = gameIdentities.filter(g => g.game_type === 'api');
  const manualGames = gameIdentities.filter(g => g.game_type === 'manual');
  const hasSocials = profile?.social_facebook || profile?.social_instagram ||
    profile?.social_youtube || profile?.social_twitter;

  return (
    <div className={styles.page}>
      <div className={styles.inner}>

        <Link href="/players" className={styles.back}>← Back to Players</Link>

        {/* 1. HERO */}
        <div className={styles.hero}>
          <div className={styles.hero__avatar}>
            {profile?.avatar
              ? <img src={profile.avatar} alt={user.username} />
              : <span>{(profile?.full_name || user.username).charAt(0).toUpperCase()}</span>
            }
          </div>
          <div className={styles.hero__info}>
            <span className={styles.hero__role}
              style={{ color: roleColor, borderColor: roleColor }}>
              {roleLabel}
            </span>
            <h1 className={styles.hero__name}>{profile?.full_name || user.username}</h1>
            <p className={styles.hero__username}>@{user.username}</p>
            <div className={styles.hero__meta}>
              {profile?.country && <span>🌍 {profile.country}</span>}
              {profile?.date_of_birth && (
                <span>🎂 {new Date(profile.date_of_birth).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              )}
              <span>📅 Joined {user.created_at?.split('T')[0]}</span>
            </div>
            {profile?.bio && <p className={styles.hero__bio}>{profile.bio}</p>}
          </div>
        </div>

        {/* 2. STATS */}
        {user.role !== 'sponsor' && (
          <div className={styles.stats}>
            {[
              { icon: '🏆', label: 'Tournaments', value: gamerProfile?.tournaments_played ?? 0, color: '#00F5FF' },
              { icon: '✅', label: 'Wins', value: gamerProfile?.wins ?? 0, color: '#00FF88' },
              { icon: '❌', label: 'Losses', value: gamerProfile?.losses ?? 0, color: '#FF006E' },
              { icon: '⚡', label: 'Points', value: gamerProfile?.points ?? 0, color: '#8B00FF' },
              { icon: '📈', label: 'Win Rate', value: `${winRate}%`, color: '#FFD700' },
            ].map(s => (
              <div key={s.label} className={styles.stat}>
                <span>{s.icon}</span>
                <span className={styles.stat__val} style={{ color: s.color }}>{s.value}</span>
                <span className={styles.stat__label}>{s.label}</span>
              </div>
            ))}
          </div>
        )}

        <div className={styles.grid}>

          {/* 3. BASIC INFO */}
          <div className={styles.card}>
            <h2 className={styles.card__title}>👤 BASIC INFO</h2>
            <div className={styles.card__rows}>
              {[
                { label: 'Username', value: user.username },
                { label: 'Full Name', value: profile?.full_name || '—' },
                { label: 'Country', value: profile?.country || '—' },
                { label: 'Phone', value: profile?.phone || '—' },
                { label: 'Date of Birth', value: profile?.date_of_birth ? new Date(profile.date_of_birth).toLocaleDateString() : '—' },
                { label: 'Member Since', value: user.created_at?.split('T')[0] },
              ].map(item => (
                <div key={item.label} className={styles.row}>
                  <span className={styles.row__label}>{item.label}</span>
                  <span className={styles.row__value}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 4. GAMING INFO */}
          {user.role !== 'sponsor' && (
            <div className={styles.card}>
              <h2 className={styles.card__title}>🎮 GAMING INFO</h2>
              <div className={styles.card__rows}>
                {[
                  { label: 'Rank', value: gamerProfile?.player_rank || '—' },
                  { label: 'Playstyle', value: gamerProfile?.playstyle || '—' },
                  { label: 'Game Preferences', value: gamerProfile?.game_preferences || '—' },
                ].map(item => (
                  <div key={item.label} className={styles.row}>
                    <span className={styles.row__label}>{item.label}</span>
                    <span className={styles.row__value}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. API GAME STATS */}
          {apiGames.length > 0 && (
            <div className={`${styles.card} ${styles['card--full']}`}>
              <h2 className={styles.card__title}>⚡ API GAME STATS</h2>
              <div className={styles.api_games}>
                {apiGames.map(gi => {
                  const stats = parseStats(gi.api_stats);
                  const color = GAME_COLORS[gi.game_name] || '#8892A4';
                  const icon = GAME_ICONS[gi.game_name] || '🎮';
                  return (
                    <div key={gi.id} className={styles.api_card}
                      style={{ borderColor: `${color}40`, background: `${color}06` }}>
                      <div className={styles.api_card__header}>
                        <div className={styles.api_card__game}>
                          <span className={styles.api_card__icon}>{icon}</span>
                          <div>
                            <h3 className={styles.api_card__name} style={{ color }}>
                              {gi.game_name}
                              {gi.is_verified && <span className={styles.verified}> ✅</span>}
                            </h3>
                            <p className={styles.api_card__username}>@{gi.game_username}</p>
                          </div>
                        </div>
                        <span className={styles.api_badge} style={{ color, borderColor: `${color}40` }}>
                          ⚡ Auto Stats
                        </span>
                      </div>

                      {stats && gi.game_name === 'PUBG PC' && (
                        <div className={styles.api_stats}>
                          {[
                            { label: 'K/D Ratio', value: stats.kd_ratio || '0.00', color: '#F5A623' },
                            { label: 'Total Kills', value: stats.kills || 0, color: '#FF006E' },
                            { label: 'Total Wins', value: stats.wins || 0, color: '#00FF88' },
                            { label: 'Matches', value: stats.matches || 0, color: '#00F5FF' },
                            { label: 'Win Rate', value: `${stats.win_rate || 0}%`, color: '#FFD700' },
                            { label: 'Damage', value: stats.damage || 0, color: '#8B00FF' },
                          ].map(s => (
                            <div key={s.label} className={styles.api_stat}>
                              <span style={{ color: s.color }}>{s.value}</span>
                              <span>{s.label}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {stats && gi.game_name === 'Valorant' && (
                        <div className={styles.api_stats}>
                          <div className={styles.api_stat}>
                            <span style={{ color: '#FF4655' }}>{stats.gameName}#{stats.tagLine}</span>
                            <span>Riot ID</span>
                          </div>
                          <div className={styles.api_stat}>
                            <span style={{ color: '#00FF88' }}>Verified ✅</span>
                            <span>Account Status</span>
                          </div>
                        </div>
                      )}

                      {stats && gi.game_name === 'League of Legends' && (
                        <div className={styles.api_stats}>
                          {[
                            { label: 'Rank', value: `${stats.tier || 'Unranked'} ${stats.rank || ''}`.trim(), color: '#C89B3C' },
                            { label: 'LP', value: stats.lp || 0, color: '#FFD700' },
                            { label: 'Wins', value: stats.wins || 0, color: '#00FF88' },
                            { label: 'Losses', value: stats.losses || 0, color: '#FF006E' },
                            { label: 'Win Rate', value: `${stats.win_rate || 0}%`, color: '#00F5FF' },
                            { label: 'Level', value: stats.summoner_level || 0, color: '#8B00FF' },
                          ].map(s => (
                            <div key={s.label} className={styles.api_stat}>
                              <span style={{ color: s.color }}>{s.value}</span>
                              <span>{s.label}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {gi.last_synced && (
                        <p className={styles.api_card__synced}>
                          🕐 Last synced: {new Date(gi.last_synced).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 6. OTHER GAMES */}
          {manualGames.length > 0 && (
            <div className={`${styles.card} ${styles['card--full']}`}>
              <h2 className={styles.card__title}>🎮 OTHER GAMES</h2>
              <div className={styles.manual_games}>
                {manualGames.map(gi => {
                  const color = GAME_COLORS[gi.game_name] || '#8892A4';
                  const icon = GAME_ICONS[gi.game_name] || '🎮';
                  return (
                    <div key={gi.id} className={styles.manual_card}>
                      <span className={styles.manual_card__icon}>{icon}</span>
                      <div>
                        <p className={styles.manual_card__name} style={{ color }}>{gi.game_name}</p>
                        <p className={styles.manual_card__username}>@{gi.game_username}</p>
                      </div>
                      <span className={styles.manual_badge}>📝</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 7. SOCIAL LINKS */}
          {hasSocials && (
            <div className={`${styles.card} ${styles['card--full']}`}>
              <h2 className={styles.card__title}>🔗 SOCIAL LINKS</h2>
              <div className={styles.socials}>
                {[
                  { label: 'Facebook', icon: '📘', value: profile?.social_facebook, color: '#1877F2' },
                  { label: 'Instagram', icon: '📸', value: profile?.social_instagram, color: '#E4405F' },
                  { label: 'YouTube', icon: '▶️', value: profile?.social_youtube, color: '#FF0000' },
                  { label: 'Twitter / X', icon: '🐦', value: profile?.social_twitter, color: '#1DA1F2' },
                ].filter(s => s.value).map(s => (
                  <a key={s.label} href={s.value!} target="_blank" rel="noreferrer"
                    className={styles.social}
                    style={{ borderColor: `${s.color}30` }}>
                    <span>{s.icon}</span>
                    <span className={styles.social__label}>{s.label}</span>
                    <span className={styles.social__arrow}>→</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* 8. ORGANIZER INFO */}
          {user.is_organizer && organizerProfile && (
            <div className={`${styles.card} ${styles['card--full']}`}>
              <h2 className={styles.card__title}>🏆 ORGANIZER INFO</h2>
              <div className={styles.card__rows}>
                {[
                  { label: 'Organization', value: organizerProfile.organization_name || '—' },
                  { label: 'Experience', value: organizerProfile.experience_years ? `${organizerProfile.experience_years} years` : '—' },
                  { label: 'Tournaments Hosted', value: organizerProfile.tournaments_hosted ?? 0 },
                  { label: 'Website', value: organizerProfile.website || '—' },
                ].map(item => (
                  <div key={item.label} className={styles.row}>
                    <span className={styles.row__label}>{item.label}</span>
                    <span className={styles.row__value}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}