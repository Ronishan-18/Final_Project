'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '../../../lib/api';
import styles from './game-identities.module.scss';

interface Game {
  id: string;
  name: string;
  type: 'api' | 'manual';
  icon: string;
  color: string;
  placeholder: string;
  hint: string;
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

export default function GameIdentitiesPage() {
  const router = useRouter();
  const [games, setGames] = useState<Game[]>([]);
  const [identities, setIdentities] = useState<Identity[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [username, setUsername] = useState('');
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const gamesRes = await api.get('/game-identities/games');
      setGames(gamesRes.data.games || []);
      try {
        const identitiesRes = await api.get('/game-identities/me');
        setIdentities(identitiesRes.data.identities || []);
      } catch {
        setIdentities([]);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setGames([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchData();
  }, [fetchData, router]);

  const getIdentityForGame = (gameName: string) => {
    return identities.find(i => i.game_name === gameName);
  };

  const handleAddGame = (game: Game) => {
    const existing = getIdentityForGame(game.name);
    setSelectedGame(game);
    setUsername(existing?.game_username || '');
    setMessage('');
    setError('');
  };

  const handleSave = async () => {
    if (!selectedGame || !username.trim()) {
      setError('Please enter your username!');
      return;
    }
    setSaving(true);
    setError('');
    setMessage('');
    try {
      await api.post('/game-identities', {
        game_id: selectedGame.id,
        game_name: selectedGame.name,
        game_type: selectedGame.type,
        game_username: username.trim(),
      });
      setMessage(`${selectedGame.name} identity saved!`);
      if (selectedGame.type === 'api') {
        await handleSync(selectedGame, username.trim());
      }
      await fetchData();
      setTimeout(() => {
        setSelectedGame(null);
        setUsername('');
        setMessage('');
      }, 2000);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Failed to save!');
    } finally {
      setSaving(false);
    }
  };

  const handleSync = async (game: Game, gameUsername?: string) => {
    const uname = gameUsername || getIdentityForGame(game.name)?.game_username;
    if (!uname) return;
    setSyncing(game.name);
    setError('');
    setMessage('');
    try {
      const endpoint = game.id === 'pubg'
        ? '/game-identities/sync/pubg'
        : '/game-identities/sync/valorant';
      const res = await api.post(endpoint, { game_username: uname });
      setMessage(res.data.message);
      await fetchData();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Sync failed!');
    } finally {
      setSyncing('');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Remove this game identity?')) return;
    try {
      await api.delete(`/game-identities/${id}`);
      await fetchData();
    } catch {
      setError('Failed to remove!');
    }
  };

  const parseStats = (statsStr: string | null) => {
    if (!statsStr) return null;
    try {
      return typeof statsStr === 'string' ? JSON.parse(statsStr) : statsStr;
    } catch { return null; }
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.loading__spinner} />
        <p>Loading game identities...</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <Link href="/dashboard" className={styles.header__back}>
          ← Back to Dashboard
        </Link>
        <h1 className={styles.header__title}>
          GAME <span className={styles.header__gradient}>IDENTITIES</span>
        </h1>
        <p className={styles.header__sub}>
          Link your gaming accounts to showcase on your profile
        </p>
      </div>

      {message && <div className={styles.success}>✅ {message}</div>}
      {error && <div className={styles.error}>❌ {error}</div>}

      {selectedGame && (
        <div className={styles.modal}>
          <div className={styles.modal__box}>
            <div className={styles.modal__header}>
              <span style={{ fontSize: '2rem' }}>{selectedGame.icon}</span>
              <div>
                <h3 className={styles.modal__title} style={{ color: selectedGame.color }}>
                  {selectedGame.name}
                </h3>
                <p className={styles.modal__type}>
                  {selectedGame.type === 'api' ? '⚡ Auto-sync stats' : '📝 Manual identity'}
                </p>
              </div>
            </div>
            <div className={styles.modal__form}>
              <label className={styles.modal__label}>
                {selectedGame.id === 'valorant' ? 'Riot ID (Name#Tag)' : 'Username / Player ID'}
              </label>
              <input
                type="text"
                className={styles.modal__input}
                placeholder={selectedGame.placeholder}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                autoFocus
              />
              <p className={styles.modal__hint}>💡 {selectedGame.hint}</p>
            </div>
            <div className={styles.modal__btns}>
              <button
                className={styles.modal__cancel}
                onClick={() => { setSelectedGame(null); setUsername(''); setError(''); }}
              >
                Cancel
              </button>
              <button
                className={styles.modal__save}
                onClick={handleSave}
                disabled={saving}
                style={{ background: `linear-gradient(90deg, ${selectedGame.color}, #8B00FF)` }}
              >
                {saving ? 'Saving...' : selectedGame.type === 'api' ? '⚡ Save & Sync' : '💾 Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={styles.content}>
        {identities.length > 0 && (
          <div className={styles.section}>
            <h2 className={styles.section__title}>MY LINKED GAMES</h2>
            <div className={styles.identities}>
              {identities.map((identity) => {
                const game = games.find(g => g.name === identity.game_name);
                const stats = parseStats(identity.api_stats);
                return (
                  <div
                    key={identity.id}
                    className={styles.identity__card}
                    style={{ borderColor: game?.color ? `${game.color}40` : undefined }}
                  >
                    <div className={styles.identity__header}>
                      <div className={styles.identity__game_info}>
                        <span className={styles.identity__icon}>{game?.icon || '🎮'}</span>
                        <div>
                          <h3 className={styles.identity__name} style={{ color: game?.color }}>
                            {identity.game_name}
                          </h3>
                          <p className={styles.identity__username}>@{identity.game_username}</p>
                        </div>
                      </div>
                      <div className={styles.identity__badges}>
                        {identity.is_verified && (
                          <span className={styles.identity__verified}>✅ Verified</span>
                        )}
                        {identity.game_type === 'api' && (
                          <span className={styles.identity__api}>⚡ API</span>
                        )}
                      </div>
                    </div>
                    {stats && identity.game_type === 'api' && (
                      <div className={styles.identity__stats}>
                        {identity.game_name === 'PUBG' && (
                          <>
                            <div className={styles.identity__stat}>
                              <span style={{ color: '#F5A623' }}>{stats.kills || 0}</span>
                              <span>Kills</span>
                            </div>
                            <div className={styles.identity__stat}>
                              <span style={{ color: '#00FF88' }}>{stats.wins || 0}</span>
                              <span>Wins</span>
                            </div>
                            <div className={styles.identity__stat}>
                              <span style={{ color: '#00F5FF' }}>{stats.kd_ratio || '0.00'}</span>
                              <span>K/D</span>
                            </div>
                            <div className={styles.identity__stat}>
                              <span style={{ color: '#8B00FF' }}>{stats.matches || 0}</span>
                              <span>Matches</span>
                            </div>
                            <div className={styles.identity__stat}>
                              <span style={{ color: '#FFD700' }}>{stats.win_rate || '0.0'}%</span>
                              <span>Win Rate</span>
                            </div>
                          </>
                        )}
                        {identity.game_name === 'Valorant' && (
                          <>
                            <div className={styles.identity__stat}>
                              <span style={{ color: '#FF4655' }}>{stats.gameName}#{stats.tagLine}</span>
                              <span>Riot ID</span>
                            </div>
                            <div className={styles.identity__stat}>
                              <span style={{ color: '#00F5FF' }}>{stats.rank || 'Unranked'}</span>
                              <span>Rank</span>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                    {identity.last_synced && (
                      <p className={styles.identity__synced}>
                        Last synced: {new Date(identity.last_synced).toLocaleDateString()}
                      </p>
                    )}
                    <div className={styles.identity__actions}>
                      {game?.type === 'api' && (
                        <button
                          className={styles.identity__sync_btn}
                          onClick={() => game && handleSync(game)}
                          disabled={syncing === identity.game_name}
                          style={{ borderColor: game?.color, color: game?.color }}
                        >
                          {syncing === identity.game_name ? 'Syncing...' : '🔄 Sync Stats'}
                        </button>
                      )}
                      <button
                        className={styles.identity__edit_btn}
                        onClick={() => game && handleAddGame(game)}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        className={styles.identity__delete_btn}
                        onClick={() => handleDelete(identity.id)}
                      >
                        🗑️ Remove
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className={styles.section}>
          <h2 className={styles.section__title}>
            {identities.length > 0 ? 'ADD MORE GAMES' : 'LINK YOUR GAMES'}
          </h2>
          <div className={styles.games__grid}>
            {games.map((game) => {
              const linked = getIdentityForGame(game.name);
              return (
                <button
                  key={game.id}
                  className={`${styles.game__card} ${linked ? styles['game__card--linked'] : ''}`}
                  style={{
                    borderColor: linked ? `${game.color}60` : undefined,
                    background: linked ? `${game.color}08` : undefined,
                  }}
                  onClick={() => handleAddGame(game)}
                >
                  <span className={styles.game__icon}>{game.icon}</span>
                  <span className={styles.game__name} style={{ color: linked ? game.color : undefined }}>
                    {game.name}
                  </span>
                  {game.type === 'api' && (
                    <span className={styles.game__api_badge}>⚡ Auto Stats</span>
                  )}
                  {linked ? (
                    <span className={styles.game__linked}>✅ Linked</span>
                  ) : (
                    <span className={styles.game__add}>+ Add</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
