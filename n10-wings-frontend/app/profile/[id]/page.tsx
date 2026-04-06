'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  UserPlus, UserCheck, Clock, MessageCircle, UserX, 
  Globe, Calendar, Trophy, CheckCircle, XCircle, Zap, TrendingUp, 
  User, Gamepad2, Link as LinkIcon, ShieldCheck, Mail, MapPin, 
  Star, Info
} from 'lucide-react';
import { 
  SiFacebook, SiInstagram, SiYoutube, SiX, SiGoogle, SiSteam, SiDiscord,
  SiLeagueoflegends, SiValorant
} from 'react-icons/si';
import { 
  GiCrossedSwords, GiCrosshair, GiFire, GiBullets, GiSoccerBall, GiGhost, GiCrown, GiBroadsword
} from 'react-icons/gi';
import { FaMobile } from 'react-icons/fa6';
import api from '../../../lib/api';
import { getFriendshipStatus, sendFriendRequest, respondToRequest, removeFriend } from '../../../lib/friends';
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
  first_name?: string;
  last_name?: string;
  bio?: string;
  avatar?: string;
  country?: string;
  city?: string;
  phone?: string;
  gender?: string;
  date_of_birth?: string;
  address?: string;
  nickname?: string;
  social_facebook?: string;
  social_instagram?: string;
  social_youtube?: string;
  social_twitter?: string;
  social_google?: string;
  social_steam?: string;
  social_discord?: string;
  arena_of_valor_id?: string;
  cricket_sixes_id?: string;
  minecraft_id?: string;
  krunker_id?: string;
  fifa_mobile_id?: string;
  honor_of_kings_id?: string;
  identity_v_id?: string;
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

interface FriendshipState {
  status: 'none' | 'pending' | 'accepted' | 'declined' | 'blocked';
  friendship_id: number | null;
  is_requester: boolean;
}

const GameIcon = ({ name, size = 16, color }: { name: string; size?: number; color?: string }) => {
  const props = { size, style: { color } };
  switch (name) {
    case 'PUBG PC': return <GiCrosshair {...props} />;
    case 'PUBG Mobile': return <FaMobile {...props} />;
    case 'Valorant': return <SiValorant {...props} />;
    case 'League of Legends': return <SiLeagueoflegends {...props} />;
    case 'Free Fire': return <GiFire {...props} />;
    case 'Mobile Legends': return <GiCrossedSwords {...props} />;
    case 'COD Mobile': return <GiBullets {...props} />;
    case 'Fortnite': return <GiBullets {...props} />;
    case 'Minecraft': return <Gamepad2 {...props} />;
    default: return <Gamepad2 {...props} />;
  }
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

  // Friend system state
  const [myId, setMyId] = useState<number | null>(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [friendship, setFriendship] = useState<FriendshipState>({
    status: 'none',
    friendship_id: null,
    is_requester: false,
  });
  const [friendBtnLoading, setFriendBtnLoading] = useState(false);
  const [friendMsg, setFriendMsg] = useState('');
  const [friendMsgType, setFriendMsgType] = useState<'success' | 'error'>('success');

  const router = useRouter();

  // Step 1: Get logged-in user's ID from /auth/me (most reliable method)
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/register');
      return;
    }
    api.get('/auth/me')
      .then(res => {
        if (res.data.success) setMyId(res.data.user.id);
      })
      .catch(() => {});
  }, []);

  // Step 2: Load profile data — runs when BOTH id and myId are ready
  useEffect(() => {
    if (!id) return;

    const fetchAll = async () => {
      try {
        const [profileRes, gameRes] = await Promise.all([
          api.get(`/profile/${id}`),
          api.get(`/game-identities/${id}`).catch(() => ({ data: { identities: [] } })),
        ]);

        if (profileRes.data.success) {
          const profileUser = profileRes.data.user;
          setUser(profileUser);
          setProfile(profileRes.data.profile);
          setGamerProfile(profileRes.data.gamerProfile);
          setOrganizerProfile(profileRes.data.organizerProfile);

          // Check if viewing own profile
          if (myId && myId === profileUser.id) {
            setIsOwnProfile(true);
          } else if (myId) {
            // Fetch friendship status with this user
            try {
              const fs = await getFriendshipStatus(profileUser.id);
              setFriendship({
                status: fs.status,
                friendship_id: fs.friendship_id,
                is_requester: fs.is_requester,
              });
            } catch {}
          }
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

    fetchAll();
  }, [id, myId]); // re-runs when myId loads

  const refreshFriendship = async (userId: number) => {
    try {
      const fs = await getFriendshipStatus(userId);
      setFriendship({
        status: fs.status,
        friendship_id: fs.friendship_id,
        is_requester: fs.is_requester,
      });
    } catch {}
  };

  const handleSendRequest = async () => {
    if (!user) return;
    setFriendBtnLoading(true);
    setFriendMsg('');
    try {
      await sendFriendRequest(user.username);
      setFriendMsg('Friend request sent!');
      setFriendMsgType('success');
      await refreshFriendship(user.id);
    } catch (err: any) {
      setFriendMsg(err?.response?.data?.message || 'Failed to send request');
      setFriendMsgType('error');
    } finally {
      setFriendBtnLoading(false);
    }
  };

  const handleRespond = async (action: 'accept' | 'decline') => {
    if (!friendship.friendship_id || !user) return;
    setFriendBtnLoading(true);
    try {
      await respondToRequest(friendship.friendship_id, action);
      setFriendMsg(action === 'accept' ? 'You are now friends!' : 'Request declined.');
      setFriendMsgType(action === 'accept' ? 'success' : 'error');
      await refreshFriendship(user.id);
    } finally {
      setFriendBtnLoading(false);
    }
  };

  const handleRemove = async () => {
    if (!friendship.friendship_id || !user || !confirm('Remove this friend?')) return;
    setFriendBtnLoading(true);
    try {
      await removeFriend(friendship.friendship_id);
      setFriendship({ status: 'none', friendship_id: null, is_requester: false });
      setFriendMsg('Friend removed.');
      setFriendMsgType('error');
    } finally {
      setFriendBtnLoading(false);
    }
  };

  const parseStats = (s: string | null) => {
    if (!s) return null;
    try { return typeof s === 'string' ? JSON.parse(s) : s; }
    catch { return null; }
  };

  // ── Friend button renderer ──
  const renderFriendButton = () => {
    // Not logged in OR viewing own profile → show nothing
    if (!myId || isOwnProfile) return null;

    if (friendship.status === 'accepted') {
      return (
        <div className={styles.friendActions}>
          <Link href={`/chat/${user?.id}`} className={styles.chatBtn}>
            <MessageCircle size={15} /> Message
          </Link>
          <button
            className={styles.removeFriendBtn}
            onClick={handleRemove}
            disabled={friendBtnLoading}
          >
            <UserX size={15} /> Remove Friend
          </button>
        </div>
      );
    }

    if (friendship.status === 'pending' && friendship.is_requester) {
      return (
        <div className={styles.friendActions}>
          <button className={styles.pendingBtn} disabled>
            <Clock size={15} /> Request Sent
          </button>
        </div>
      );
    }

    if (friendship.status === 'pending' && !friendship.is_requester) {
      return (
        <div className={styles.friendActions}>
          <button
            className={styles.acceptBtn}
            onClick={() => handleRespond('accept')}
            disabled={friendBtnLoading}
          >
            <UserCheck size={15} /> Accept Request
          </button>
          <button
            className={styles.declineBtn}
            onClick={() => handleRespond('decline')}
            disabled={friendBtnLoading}
          >
            <UserX size={15} /> Decline
          </button>
        </div>
      );
    }

    // Default — not friends yet
    return (
      <div className={styles.friendActions}>
        <button
          className={styles.addFriendBtn}
          onClick={handleSendRequest}
          disabled={friendBtnLoading}
        >
          <UserPlus size={15} />
          {friendBtnLoading ? 'Sending...' : 'Add Friend'}
        </button>
      </div>
    );
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
    user.is_organizer ? '#00F5FF' : '#00F5FF';
  const roleLabel = user.role === 'sponsor' ? '💼 SPONSOR' :
    user.is_organizer ? '🏆 ORGANIZER' : '🎮 GAMER';

  const apiGames = gameIdentities.filter(g => g.game_type === 'api');
  const manualGames = gameIdentities.filter(g => g.game_type === 'manual');
  const hasSocials = profile?.social_facebook || profile?.social_instagram ||
    profile?.social_youtube || profile?.social_twitter || profile?.social_google ||
    profile?.social_steam || profile?.social_discord;
  
  const hasGameIds = profile?.arena_of_valor_id || profile?.cricket_sixes_id ||
    profile?.minecraft_id || profile?.krunker_id || profile?.fifa_mobile_id ||
    profile?.honor_of_kings_id || profile?.identity_v_id;

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
            <span className={styles.hero__role} style={{ color: roleColor, borderColor: roleColor }}>
              {roleLabel}
            </span>
            <h1 className={styles.hero__name}>{profile?.full_name || user.username}</h1>
            <p className={styles.hero__username}>@{user.username}</p>
            <div className={styles.hero__meta}>
              {profile?.country && (
                <span>
                  <Globe size={14} className={styles.metaIcon} /> {profile.country}
                </span>
              )}
              {profile?.date_of_birth && (
                <span>
                  <Calendar size={14} className={styles.metaIcon} /> {new Date(profile.date_of_birth).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
              )}
              <span>
                <UserPlus size={14} className={styles.metaIcon} /> Joined {user.created_at?.split('T')[0]}
              </span>
            </div>
            {profile?.bio && <p className={styles.hero__bio}>{profile.bio}</p>}

            {/* ── FRIEND BUTTON ── */}
            {renderFriendButton()}
            {friendMsg && (
              <p className={friendMsgType === 'success' ? styles.friendMsgSuccess : styles.friendMsgError}>
                {friendMsg}
              </p>
            )}
          </div>
        </div>

        {/* 2. STATS */}
        {user.role !== 'sponsor' && (
          <div className={styles.stats}>
            {[
              { icon: <Trophy size={18} />, label: 'Tournaments', value: gamerProfile?.tournaments_played ?? 0, color: '#00F5FF' },
              { icon: <CheckCircle size={18} />, label: 'Wins', value: gamerProfile?.wins ?? 0, color: '#00FF88' },
              { icon: <XCircle size={18} />, label: 'Losses', value: gamerProfile?.losses ?? 0, color: '#FF006E' },
              { icon: <Zap size={18} />, label: 'Points', value: gamerProfile?.points ?? 0, color: '#00F5FF' },
              { icon: <TrendingUp size={18} />, label: 'Win Rate', value: `${winRate}%`, color: '#FFD700' },
            ].map(s => (
              <div key={s.label} className={styles.stat}>
                <span style={{ color: s.color }}>{s.icon}</span>
                <span className={styles.stat__val} style={{ color: s.color }}>{s.value}</span>
                <span className={styles.stat__label}>{s.label}</span>
              </div>
            ))}
          </div>
        )}

        <div className={styles.grid}>

          {/* 3. BASIC INFO */}
          <div className={styles.card}>
            <h2 className={styles.card__title}>
              <User size={18} className={styles.titleIcon} /> BASIC INFO
            </h2>
            <div className={styles.card__rows}>
              {[
                { label: 'Username', value: user.username },
                { label: 'Full Name', value: profile?.full_name || (profile?.first_name ? `${profile.first_name} ${profile.last_name || ''}` : '—') },
                { label: 'Nickname', value: profile?.nickname || '—' },
                { label: 'Gender', value: profile?.gender || '—' },
                { label: 'Country', value: profile?.country || '—' },
                { label: 'City', value: profile?.city || '—' },
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
              <h2 className={styles.card__title}>
                <Gamepad2 size={18} className={styles.titleIcon} /> GAMING INFO
              </h2>
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
              <h2 className={styles.card__title}>
                <Zap size={18} className={styles.titleIcon} /> API GAME STATS
              </h2>
              <div className={styles.api_games}>
                {apiGames.map(gi => {
                  const stats = parseStats(gi.api_stats);
                  const color = GAME_COLORS[gi.game_name] || '#8892A4';
                  return (
                    <div key={gi.id} className={styles.api_card}
                      style={{ borderColor: `${color}40`, background: `${color}06` }}>
                      <div className={styles.api_card__header}>
                        <div className={styles.api_card__game}>
                          <span className={styles.api_card__icon}>
                            <GameIcon name={gi.game_name} size={24} color={color} />
                          </span>
                          <div>
                            <h3 className={styles.api_card__name} style={{ color }}>
                              {gi.game_name}
                              {gi.is_verified && (
                                <ShieldCheck size={14} style={{ color: '#00FF88', marginLeft: 4, display: 'inline' }} color="#00FF88" />
                              )}
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
                            { label: 'Damage', value: stats.damage || 0, color: '#00F5FF' },
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
                            { label: 'Level', value: stats.summoner_level || 0, color: '#00F5FF' },
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
              <h2 className={styles.card__title}>
                <Gamepad2 size={18} className={styles.titleIcon} /> OTHER GAMES
              </h2>
              <div className={styles.manual_games}>
                {manualGames.map(gi => {
                  const color = GAME_COLORS[gi.game_name] || '#8892A4';
                  return (
                    <div key={gi.id} className={styles.manual_card}>
                      <span className={styles.manual_card__icon}>
                        <GameIcon name={gi.game_name} size={20} color={color} />
                      </span>
                      <div>
                        <p className={styles.manual_card__name} style={{ color }}>{gi.game_name}</p>
                        <p className={styles.manual_card__username}>@{gi.game_username}</p>
                      </div>
                      <span className={styles.manual_badge} title="Manual Entry">
                        <Info size={12} color="#8892A4" />
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 7. SOCIAL LINKS */}
          {hasSocials && (
            <div className={`${styles.card} ${styles['card--full']}`}>
              <h2 className={styles.card__title}>
                <LinkIcon size={18} className={styles.titleIcon} /> SOCIAL LINKS
              </h2>
              <div className={styles.socials}>
                {[
                  { label: 'Facebook', icon: <SiFacebook />, value: profile?.social_facebook, color: '#1877F2' },
                  { label: 'Instagram', icon: <SiInstagram />, value: profile?.social_instagram, color: '#E4405F' },
                  { label: 'YouTube', icon: <SiYoutube />, value: profile?.social_youtube, color: '#FF0000' },
                  { label: 'Twitter / X', icon: <SiX />, value: profile?.social_twitter, color: '#FFFFFF' },
                  { label: 'Google', icon: <SiGoogle />, value: profile?.social_google, color: '#4285F4' },
                  { label: 'Steam', icon: <SiSteam />, value: profile?.social_steam, color: '#00ADEE' },
                  { label: 'Discord', icon: <SiDiscord />, value: profile?.social_discord, color: '#5865F2' },
                ].filter(s => s.value).map(s => (
                  <a key={s.label} href={s.value?.startsWith('http') ? s.value : `https://${s.label.toLowerCase()}.com/${s.value}`} target="_blank" rel="noreferrer"
                    className={styles.social}
                    style={{ borderColor: `${s.color}30` }}>
                    <span style={{ color: s.color }}>{s.icon}</span>
                    <span className={styles.social__label}>{s.label}</span>
                    <span className={styles.social__arrow}>→</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* 7b. GAME IDS */}
          {hasGameIds && (
            <div className={`${styles.card} ${styles['card--full']}`}>
              <h2 className={styles.card__title}>
                <Gamepad2 size={18} className={styles.titleIcon} /> COMMUNITY GAME IDS
              </h2>
              <div className={styles.manual_games}>
                {[
                  { label: 'Arena of Valor', value: profile?.arena_of_valor_id, icon: <GiBroadsword size={20} color="#FF6B00" /> },
                  { label: 'Cricket Sixes', value: profile?.cricket_sixes_id, icon: <GiBullets size={20} color="#00FF88" /> }, // Generic sport placeholder
                  { label: 'Minecraft', value: profile?.minecraft_id, icon: <SiMinecraft size={20} color="#8B6914" /> },
                  { label: 'Krunker', value: profile?.krunker_id, icon: <GiCrosshair size={20} color="#FF006E" /> },
                  { label: 'FIFA Mobile', value: profile?.fifa_mobile_id, icon: <GiSoccerBall size={20} color="#FFFFFF" /> },
                  { label: 'Honor of Kings', value: profile?.honor_of_kings_id, icon: <GiCrown size={20} color="#FFD700" /> },
                  { label: 'Identity V', value: profile?.identity_v_id, icon: <GiGhost size={20} color="#8892A4" /> },
                ].filter(g => g.value).map(gi => (
                  <div key={gi.label} className={styles.manual_card}>
                    <span className={styles.manual_card__icon}>{gi.icon}</span>
                    <div>
                      <p className={styles.manual_card__name}>{gi.label}</p>
                      <p className={styles.manual_card__username}>@{gi.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 8. ORGANIZER INFO */}
          {user.is_organizer && organizerProfile && (
            <div className={`${styles.card} ${styles['card--full']}`}>
              <h2 className={styles.card__title}>
                <Trophy size={18} className={styles.titleIcon} /> ORGANIZER INFO
              </h2>
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