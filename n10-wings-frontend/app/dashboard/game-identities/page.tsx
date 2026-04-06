'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Gamepad2, Plus, ArrowLeft, RefreshCw, Edit, Trash2, 
  CheckCircle, Zap, Info, ShieldCheck, Star, Search, X, Clock, XCircle
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
import styles from './game-identities.module.scss';

interface Game {
  id: string;
  name: string;
  category: 'api' | 'manual';
  icon: string;
  color: string;
  platform: string;
  placeholder: string;
  hint: string;
  stats_info?: string;
}

interface Identity {
  id: number;
  game_name: string;
  game_type: string;
  game_username: string;
  is_verified: boolean;
  last_synced: string;
  api_stats: string | null;
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
const GAME_ICONS_BY_ID: Record<string, string> = {
  'pubg_pc': '/icons/games/pubg_pc.png',
  'valorant': '/icons/games/valorant.png',
  'league_of_legends': '/icons/games/lol.png',
};

export default function GameIdentitiesPage() {
  const router = useRouter();
  const [games, setGames] = useState<Game[]>([]);
  const [identities, setIdentities] = useState<Identity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [isCustom, setIsCustom] = useState(false);
  const [username, setUsername] = useState('');
  const [customGameName, setCustomGameName] = useState('');
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const gamesRes = await api.get('/game-identities/games');
      setGames(gamesRes.data.games || []);
      try {
        const idRes = await api.get('/game-identities/me');
        setIdentities(idRes.data.identities || []);
      } catch { setIdentities([]); }
    } catch { setGames([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }
    fetchData();
  }, [fetchData, router]);

  const getIdentity = (gameName: string) =>
    identities.find(i => i.game_name === gameName);

  const openModal = (game: Game) => {
    const existing = getIdentity(game.name);
    setSelectedGame(game);
    setIsCustom(false);
    setUsername(existing?.game_username || '');
    setCustomGameName('');
    setShowModal(true);
    setMessage('');
    setError('');
  };

  const openCustomModal = () => {
    setSelectedGame(null);
    setIsCustom(true);
    setUsername('');
    setCustomGameName('');
    setShowModal(true);
    setMessage('');
    setError('');
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedGame(null);
    setIsCustom(false);
    setUsername('');
    setCustomGameName('');
    setError('');
    setMessage('');
  };

  const handleSave = async () => {
    if (!username.trim()) { setError('Please enter your username!'); return; }
    if (isCustom && !customGameName.trim()) {
      setError('Please enter the game name!'); return;
    }

    setSaving(true);
    setError('');

    try {
      await api.post('/game-identities', {
        game_id: selectedGame?.id || 'other',
        game_name: selectedGame?.name || customGameName.trim(),
        game_username: username.trim(),
        custom_game_name: customGameName.trim(),
      });

      if (selectedGame?.category === 'api') {
        await handleSync(selectedGame, username.trim());
      } else {
        setMessage('Game identity saved!');
        await fetchData();
        setTimeout(() => { closeModal(); setMessage(''); }, 1500);
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Failed to save!');
    } finally {
      setSaving(false);
    }
  };

  const handleSync = async (game: Game, gameUsername?: string) => {
    const uname = gameUsername || getIdentity(game.name)?.game_username;
    if (!uname) return;

    setSyncing(game.name);
    setError('');

    try {
      const endpoints: Record<string, string> = {
        'pubg_pc': '/game-identities/sync/pubg',
        'valorant': '/game-identities/sync/valorant',
        'league_of_legends': '/game-identities/sync/lol',
      };

      const endpoint = endpoints[game.id];
      if (!endpoint) return;

      const res = await api.post(endpoint, { game_username: uname });
      setMessage(res.data.message);
      await fetchData();
      setTimeout(() => { closeModal(); setMessage(''); }, 2000);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Sync failed! Check your username.');
    } finally {
      setSyncing('');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Remove this game identity?')) return;
    try {
      await api.delete(`/game-identities/${id}`);
      await fetchData();
    } catch { setError('Failed to remove!'); }
  };

  const parseStats = (s: string | null) => {
    if (!s) return null;
    try { return typeof s === 'string' ? JSON.parse(s) : s; }
    catch { return null; }
  };

  const apiGames = games.filter(g => g.category === 'api');
  const manualGames = games.filter(g => g.category === 'manual');

  if (loading) return (
    <div className={styles.loading}>
      <div className={styles.loading__spinner} />
      <p>Loading game identities...</p>
    </div>
  );

  return (
    <div className={styles.page}>

      {/* Header */}
      <div className={styles.header}>
        <Link href="/dashboard" className={styles.header__back}>
          <ArrowLeft size={14} style={{ marginRight: 6 }} /> Dashboard
        </Link>
        <div className={styles.header__content}>
          <div>
            <h1 className={styles.header__title}>
              <Gamepad2 size={28} className={styles.header__icon_main} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 12, color: '#00F5FF' }} />
              GAME <span className={styles.header__cyan}>IDENTITIES</span>
            </h1>
            <p className={styles.header__sub}>
              Link your gaming accounts — API games auto-sync stats!
            </p>
          </div>
          <button className={styles.header__add_btn} onClick={openCustomModal}>
            <Plus size={16} /> Add Custom Game
          </button>
        </div>
      </div>

      {/* Messages */}
      {message && <div className={styles.success}><CheckCircle size={14} /> {message}</div>}
      {error && !showModal && <div className={styles.error}><X size={14} /> {error}</div>}

      {/* Linked Games */}
      {identities.length > 0 && (
        <div className={styles.section}>
          <h2 className={styles.section__title}>
            <Gamepad2 size={18} style={{ color: '#00F5FF', marginRight: 8, display: 'inline', verticalAlign: 'middle' }} />
            MY LINKED GAMES
          </h2>
          <div className={styles.linked}>
            {identities.map((identity: Identity) => {
              const game = games.find((g: Game) => g.name === identity.game_name);
              const stats = parseStats(identity.api_stats);
              const color = GAME_COLORS[identity.game_name] || game?.color || '#8892A4';

              return (
                <div key={identity.id} className={styles.card}
                  style={{ '--game-color': color } as React.CSSProperties}>
                  <div className={styles.card__top}>
                    <div className={styles.card__game}>
                      <span className={styles.card__icon}>
                        <GameIcon name={identity.game_name} size={24} color={color} />
                      </span>
                      <div>
                        <h3 className={styles.card__name} style={{ color }}>
                          {identity.game_name}
                        </h3>
                        <p className={styles.card__username}>@{identity.game_username}</p>
                      </div>
                    </div>
                    <div className={styles.card__badges}>
                      {identity.is_verified && (
                        <span className={styles.badge__verified}>
                          <ShieldCheck size={12} style={{ marginRight: 4 }} /> Verified
                        </span>
                      )}
                      <span className={`${styles.badge__type} ${identity.game_type === 'api' ? styles['badge__type--api'] : styles['badge__type--manual']}`}>
                        {identity.game_type === 'api' ? <><Zap size={10} style={{ marginRight: 4 }} /> API</> : <><Edit size={10} style={{ marginRight: 4 }} /> Manual</>}
                      </span>
                    </div>
                  </div>

                  {/* Stats */}
                  {stats && identity.game_type === 'api' && (
                    <div className={styles.card__stats}>
                      {identity.game_name === 'PUBG PC' && (
                        <>
                          {[
                            { l: 'K/D', v: stats.kd_ratio || '0.00', c: '#F5A623' },
                            { l: 'Kills', v: stats.kills || 0, c: '#FF006E' },
                            { l: 'Wins', v: stats.wins || 0, c: '#00FF88' },
                            { l: 'Matches', v: stats.matches || 0, c: '#00F5FF' },
                            { l: 'Win Rate', v: `${stats.win_rate || 0}%`, c: '#FFD700' },
                          ].map(s => (
                            <div key={s.l} className={styles.stat}>
                              <span style={{ color: s.c }}>{s.v}</span>
                              <span>{s.l}</span>
                            </div>
                          ))}
                        </>
                      )}
                      {identity.game_name === 'Valorant' && (
                        <>
                          <div className={styles.stat}>
                            <span style={{ color: '#FF4655' }}>{stats.gameName}#{stats.tagLine}</span>
                            <span>Riot ID</span>
                          </div>
                          <div className={styles.stat}>
                            <span style={{ color: '#00F5FF' }}>Verified <ShieldCheck size={12} style={{ display: 'inline', marginLeft: 4 }} /></span>
                            <span>Status</span>
                          </div>
                        </>
                      )}
                      {identity.game_name === 'League of Legends' && (
                        <>
                          {[
                            { l: 'Rank', v: `${stats.tier || 'Unranked'} ${stats.rank || ''}`.trim(), c: '#C89B3C' },
                            { l: 'LP', v: stats.lp || 0, c: '#FFD700' },
                            { l: 'Wins', v: stats.wins || 0, c: '#00FF88' },
                            { l: 'Losses', v: stats.losses || 0, c: '#FF006E' },
                            { l: 'Win Rate', v: `${stats.win_rate || 0}%`, c: '#00F5FF' },
                            { l: 'Level', v: stats.summoner_level || 0, c: '#00F5FF' },
                          ].map(s => (
                            <div key={s.l} className={styles.stat}>
                              <span style={{ color: s.c }}>{s.v}</span>
                              <span>{s.l}</span>
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  )}

                  {identity.last_synced && (
                    <p className={styles.card__synced}>
                      <Clock size={11} style={{ marginRight: 4 }} /> Synced: {new Date(identity.last_synced).toLocaleDateString()}
                    </p>
                  )}

                  <div className={styles.card__actions}>
                    {game?.category === 'api' && (
                      <button
                        className={styles.btn__sync}
                        style={{ borderColor: color, color }}
                        onClick={() => game && handleSync(game)}
                        disabled={!!syncing}
                      >
                        {syncing === identity.game_name ? '⏳ Syncing...' : <><RefreshCw size={12} /> Sync</>}
                      </button>
                    )}
                    <button className={styles.btn__edit}
                      onClick={() => game ? openModal(game) : openCustomModal()}>
                      ✏️ Edit
                    </button>
                    <button className={styles.btn__delete}
                      onClick={() => handleDelete(identity.id)}>
                      🗑️ Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* API Games */}
      <div className={styles.section}>
        <div className={styles.section__header}>
          <h2 className={styles.section__title}>⚡ AUTO-SYNC GAMES</h2>
          <span className={styles.section__badge}>Stats fetched automatically!</span>
        </div>
        <div className={styles.games__grid}>
          {apiGames.map(game => {
            const linked = getIdentity(game.name);
            return (
              <button key={game.id}
                className={`${styles.game__tile} ${linked ? styles['game__tile--linked'] : ''}`}
                style={linked ? { borderColor: `${game.color}60`, background: `${game.color}10` } : {}}
                onClick={() => openModal(game)}
              >
                <span className={styles.game__tile_icon}>
                  {game.icon.startsWith('/') ? <img src={game.icon} alt={game.name} /> : <Gamepad2 size={32} strokeWidth={1.5} />}
                </span>
                <span className={styles.game__tile_name} style={{ color: linked ? game.color : '#ffffff' }}>
                  {game.name}
                </span>
                <span className={styles.game__tile_platform}>{game.platform}</span>
                <span className={styles.game__tile_badge}
                  style={{ background: `${game.color}20`, color: game.color }}>
                  ⚡ {game.stats_info}
                </span>
                {linked
                  ? <span className={styles.game__tile_linked}><CheckCircle size={12} style={{marginRight:4}}/> Linked</span>
                  : <span className={styles.game__tile_add}>+ Link Account</span>
                }
              </button>
            );
          })}
        </div>
      </div>

      {/* Manual Games */}
      <div className={styles.section}>
        <div className={styles.section__header}>
          <h2 className={styles.section__title}>📝 SHOWCASE GAMES</h2>
          <span className={styles.section__badge}>Show your username/ID only</span>
        </div>
        <div className={styles.games__grid}>
          {manualGames.map(game => {
            const linked = getIdentity(game.name);
            return (
              <button key={game.id}
                className={`${styles.game__tile} ${linked ? styles['game__tile--linked'] : ''}`}
                style={linked ? { borderColor: `${game.color}60`, background: `${game.color}10` } : {}}
                onClick={() => openModal(game)}
              >
                <span className={styles.game__tile_icon}>
                  {game.icon.startsWith('/') ? <img src={game.icon} alt={game.name} /> : game.icon}
                </span>
                <span className={styles.game__tile_name} style={{ color: linked ? game.color : '#ffffff' }}>
                  {game.name}
                </span>
                <span className={styles.game__tile_platform}>{game.platform}</span>
                {linked
                  ? <span className={styles.game__tile_linked}><CheckCircle size={12} style={{marginRight:4}}/> {linked.game_username}</span>
                  : <span className={styles.game__tile_add}>+ Add ID</span>
                }
              </button>
            );
          })}
          <button className={styles.game__tile} onClick={openCustomModal}>
            <span className={styles.game__tile_icon}><Gamepad2 size={32} strokeWidth={1.5}/></span>
            <span className={styles.game__tile_name}>Other Game</span>
            <span className={styles.game__tile_platform}>Any</span>
            <span className={styles.game__tile_add}>+ Add Custom</span>
          </button>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className={styles.modal} onClick={closeModal}>
          <div className={styles.modal__box} onClick={e => e.stopPropagation()}>
            <div className={styles.modal__header}>
              <span className={styles.modal__icon_wrap}>
                {selectedGame?.id && selectedGame.id in GAME_ICONS_BY_ID 
                  ? <img src={GAME_ICONS_BY_ID[selectedGame.id]} alt={selectedGame.name} className={styles.modal__icon} />
                  : <span className={styles.modal__icon}><Gamepad2 size={24} /></span>
                }
              </span>
              <div>
                <h3 className={styles.modal__title}
                  style={{ color: selectedGame?.color || '#00F5FF' }}>
                  {isCustom ? 'Add Custom Game' : selectedGame?.name}
                </h3>
                <p className={styles.modal__subtitle}>
                  {selectedGame?.category === 'api'
                    ? `⚡ Stats: ${selectedGame.stats_info}`
                    : '📝 Username will be showcased on profile'}
                </p>
              </div>
            </div>

            {isCustom && (
              <div className={styles.modal__group}>
                <label className={styles.modal__label}>Game Name</label>
                <input
                  className={styles.modal__input}
                  placeholder="e.g. Apex Legends, GTA V..."
                  value={customGameName}
                  onChange={e => setCustomGameName(e.target.value)}
                  autoFocus
                />
              </div>
            )}

            <div className={styles.modal__group}>
              <label className={styles.modal__label}>
                {selectedGame?.id === 'valorant' || selectedGame?.id === 'league_of_legends'
                  ? 'Riot ID (Name#Tag)'
                  : 'Username / Player ID'}
              </label>
              <input
                className={styles.modal__input}
                placeholder={selectedGame?.placeholder || 'Enter your username or ID'}
                value={username}
                onChange={e => setUsername(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSave()}
                autoFocus={!isCustom}
              />
              <p className={styles.modal__hint}>
                💡 {selectedGame?.hint || 'Enter your username or Player ID'}
              </p>
            </div>

            {error && <p className={styles.modal__error}><XCircle size={14} style={{display:'inline', marginRight:4}}/> {error}</p>}
            {message && <p className={styles.modal__success}><CheckCircle size={14} style={{display:'inline', marginRight:4}}/> {message}</p>}

            <div className={styles.modal__btns}>
              <button className={styles.modal__cancel} onClick={closeModal}>
                Cancel
              </button>
              <button
                className={styles.modal__save}
                onClick={handleSave}
                disabled={saving || !!syncing}
                style={{
                  background: selectedGame?.color
                    ? selectedGame.color
                    : '#00F5FF'
                }}
              >
                {saving || syncing
                  ? '⏳ Processing...'
                  : selectedGame?.category === 'api'
                  ? '⚡ Save & Sync Stats'
                  : '💾 Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}