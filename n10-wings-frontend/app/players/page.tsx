'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Search, Star, Globe, Gamepad2, X } from 'lucide-react';
import api from '../../lib/api';
import styles from './players.module.scss';
import { getImageUrl } from '../../lib/urlHelper';

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
  const [query, setQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchGamers = async (q: string = '') => {
    setLoading(true);
    try {
      const res = await api.get(`/profile/search?q=${q}`);
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
    const delayDebounceFn = setTimeout(() => {
      fetchGamers(query);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const handleClear = () => {
    setQuery('');
    fetchGamers('');
  };

  return (
    <div className={styles.players}>
      <div className="container">

        {/* Header */}
        <div className={styles.players__header}>
          <div className="badge">
            <Gamepad2 size={12} style={{ marginRight: 4 }} /> Player Directory
          </div>
          <h1 className={styles.players__title}>
            FIND <span className="gradient-text">PLAYERS</span>
          </h1>
          <p className={styles.players__sub}>
            Search by username or game to discover talented gamers!
          </p>
        </div>

        {/* Search Filters */}
        <div className={styles.filters} ref={searchRef}>
          <div className={styles.filters__wrapper}>
            <span className={styles.filters__icon}>
              <Search size={18} color="#8892A4" />
            </span>
            <input
              type="text"
              className={styles.filters__input}
              placeholder="Search by username or game"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
            />
            {query && (
              <button className={styles.filters__clear} onClick={handleClear}>
                <X size={16} />
              </button>
            )}

            {/* Dropdown Results */}
            {showDropdown && query.length > 0 && (
              <div className={styles.filters__dropdown}>
                {loading ? (
                  <div style={{ padding: '1rem', textAlign: 'center', color: '#8892A4' }}>
                    Searching...
                  </div>
                ) : gamers.length === 0 ? (
                  <div style={{ padding: '1rem', textAlign: 'center', color: '#8892A4' }}>
                    No players found
                  </div>
                ) : (
                  gamers.map((gamer) => (
                    <Link
                      key={gamer.id}
                      href={`/profile/${gamer.id}`}
                      className={styles.filters__item}
                      onClick={() => setShowDropdown(false)}
                    >
                      <div className={styles.filters__avatar_small}>
                        {gamer.avatar ? (
                          <img src={getImageUrl(gamer.avatar)} alt={gamer.username} />
                        ) : (
                          <Gamepad2 size={20} color="#8892A4" />
                        )}
                      </div>
                      <div className={styles.filters__item_info}>
                        <div className={styles.filters__item_name}>
                          {gamer.full_name || gamer.username}
                        </div>
                        <div className={styles.filters__item_user}>
                          @{gamer.username}
                        </div>
                      </div>
                      {gamer.game_preferences && (
                        <div className={styles.filters__item_game}>
                          {gamer.game_preferences.split(',')[0]}
                        </div>
                      )}
                    </Link>
                  ))
                )}
              </div>
            )}
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
              <span style={{ fontSize: '2rem', opacity: 0.5 }}>🤷</span>
              <p>No players found! Try a different search term.</p>
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
                      <img src={getImageUrl(gamer.avatar)} alt={gamer.username} />
                    ) : (
                      <Gamepad2 size={32} color="#8892A4" opacity={0.5} />
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
                        <Star size={14} color="#FFD700" fill="#FFD700" style={{ marginRight: 4 }} /> {gamer.player_rank}
                      </span>
                    )}

                    {gamer.country && (
                      <p className={styles.card__country}>
                        <Globe size={14} color="#8892A4" style={{ marginRight: 4 }} /> {gamer.country}
                      </p>
                    )}

                    {gamer.game_preferences && (
                      <p className={styles.card__games}>
                        <Gamepad2 size={14} color="#00F5FF" style={{ marginRight: 4 }} /> {gamer.game_preferences}
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