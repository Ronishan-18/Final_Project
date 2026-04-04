'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '../../lib/api';
import styles from './players.module.scss';

interface Gamer {
  id: number;
  username: string;
  full_name?: string;
  avatar?: string;
  country?: string;
  player_rank?: string;
  game_preferences?: string;
  playstyle?: string;
  wins?: number;
  losses?: number;
  points?: number;
  tournaments_played?: number;
}

export default function PlayersPage() {
  const [gamers, setGamers] = useState<Gamer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState({
    username: '',
    game: '',
    rank: '',
    country: '',
  });

  const fetchGamers = async (filters: Record<string, string> = {}) => {
    setLoading(true);
    try {
      const params = new URLSearchParams(
        Object.fromEntries(
          Object.entries(filters).filter(([, v]) => v !== '')
        )
      );
      const res = await api.get(`/profile/search?${params}`);
      if (res.data.success) {
        setGamers(res.data.gamers);
      }
    } catch {
      setGamers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGamers();
  }, []);

  const handleSearch = () => {
    fetchGamers(search);
  };

  const handleReset = () => {
    setSearch({ username: '', game: '', rank: '', country: '' });
    fetchGamers();
  };

  return (
    <div className={styles.players}>
      <div className="container">

        {/* Header */}
        <div className={styles.players__header}>
          <div className="badge">🎮 Player Directory</div>
          <h1 className={styles.players__title}>
            FIND <span className="gradient-text">PLAYERS</span>
          </h1>
          <p className={styles.players__sub}>
            Discover talented gamers, check their stats and connect!
          </p>
        </div>

        {/* Search Filters */}
        <div className={styles.filters}>
          <div className={styles.filters__grid}>
            {[
              { label: 'Username', field: 'username', placeholder: 'Search by username...' },
              { label: 'Game', field: 'game', placeholder: 'e.g. PUBG, Valorant...' },
              { label: 'Rank', field: 'rank', placeholder: 'e.g. Diamond, Pro...' },
              { label: 'Country', field: 'country', placeholder: 'e.g. Sri Lanka...' },
            ].map((item) => (
              <div key={item.field} className={styles.filters__group}>
                <label className={styles.filters__label}>{item.label}</label>
                <input
                  type="text"
                  className={styles.filters__input}
                  placeholder={item.placeholder}
                  value={search[item.field as keyof typeof search]}
                  onChange={(e) =>
                    setSearch({ ...search, [item.field]: e.target.value })
                  }
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
            ))}
          </div>
          <div className={styles.filters__btns}>
            <button className={styles.filters__search} onClick={handleSearch}>
              🔍 Search Players
            </button>
            <button className={styles.filters__reset} onClick={handleReset}>
              ✕ Reset
            </button>
          </div>
        </div>

        {/* Results */}
        <div className={styles.results}>
          <p className={styles.results__count}>
            {loading ? 'Searching...' : `${gamers.length} player(s) found`}
          </p>

          {loading ? (
            <div className={styles.results__loading}>
              <div className={styles.results__spinner} />
            </div>
          ) : gamers.length === 0 ? (
            <div className={styles.results__empty}>
              <span>😕</span>
              <p>No players found! Try different filters.</p>
            </div>
          ) : (
            <div className={styles.grid}>
              {gamers.map((gamer) => (
                <Link
                  key={gamer.id}
                  href={`/profile/${gamer.id}`}
                  className={styles.card}
                >
                  {/* Avatar */}
                  <div className={styles.card__avatar}>
                    {gamer.avatar ? (
                      <img src={gamer.avatar} alt={gamer.username} />
                    ) : (
                      <span>🎮</span>
                    )}
                  </div>

                  {/* Info */}
                  <div className={styles.card__info}>
                    <h3 className={styles.card__name}>
                      {gamer.full_name || gamer.username}
                    </h3>
                    <p className={styles.card__username}>@{gamer.username}</p>

                    {gamer.player_rank && (
                      <span className={styles.card__rank}>
                        ⭐ {gamer.player_rank}
                      </span>
                    )}

                    {gamer.country && (
                      <p className={styles.card__country}>
                        🌍 {gamer.country}
                      </p>
                    )}

                    {gamer.game_preferences && (
                      <p className={styles.card__games}>
                        🎮 {gamer.game_preferences}
                      </p>
                    )}
                  </div>

                  {/* Stats */}
                  <div className={styles.card__stats}>
                    <div className={styles.card__stat}>
                      <span style={{ color: '#00FF88' }}>
                        {gamer.wins ?? 0}
                      </span>
                      <span>Wins</span>
                    </div>
                    <div className={styles.card__stat}>
                      <span style={{ color: '#00F5FF' }}>
                        {gamer.points ?? 0}
                      </span>
                      <span>Points</span>
                    </div>
                    <div className={styles.card__stat}>
                      <span style={{ color: '#00F5FF' }}>
                        {gamer.tournaments_played ?? 0}
                      </span>
                      <span>Tournaments</span>
                    </div>
                  </div>

                  <div className={styles.card__view}>
                    View Profile →
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}