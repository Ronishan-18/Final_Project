'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users, Gamepad2, Plus, Search, ChevronRight, Crown
} from 'lucide-react';
import api from '../../lib/api';
import styles from './teams.module.scss';

interface Team {
  id: number;
  name: string;
  tag: string;
  game: string;
  description?: string;
  logo?: string;
  leader_username: string;
  leader_name?: string;
  leader_avatar?: string;
  member_count: number;
}

const GAMES = ['All', 'PUBG', 'Valorant', 'Free Fire', 'Mobile Legends', 'COD Mobile', 'CS2', 'Other'];

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [gameFilter, setGameFilter] = useState('All');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
    fetchTeams();
  }, []);

  const fetchTeams = async (params: Record<string, string> = {}) => {
    setLoading(true);
    try {
      const query = new URLSearchParams(
        Object.fromEntries(Object.entries(params).filter(([, v]) => v && v !== 'All'))
      );
      const res = await api.get(`/teams?${query}`);
      if (res.data.success) setTeams(res.data.teams);
    } catch { setTeams([]); }
    finally { setLoading(false); }
  };

  const handleSearch = () => {
    fetchTeams({
      search,
      game: gameFilter !== 'All' ? gameFilter : '',
    });
  };

  return (
    <div className={styles.page}>
      <div className="container">

        {/* Header */}
        <div className={styles.header}>
          <div>
            <div className="badge">
              <Users size={12} strokeWidth={2.5} /> Teams Directory
            </div>
            <h1 className={styles.header__title}>
              FIND YOUR <span className="gradient-text">SQUAD</span>
            </h1>
            <p className={styles.header__sub}>
              Browse top teams, explore rosters, and join the action
            </p>
          </div>
          {isLoggedIn && (
            <Link href="/teams/my" className={styles.create_btn}>
              <Plus size={16} strokeWidth={2.5} /> My Team
            </Link>
          )}
        </div>

        {/* Filters */}
        <div className={styles.filters}>
          <div className={styles.filters__search}>
            <Search size={15} color="#8892A4" strokeWidth={2} />
            <input
              className={styles.filters__input}
              placeholder="Search by team name or tag..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <div className={styles.filters__row}>
            <div className={styles.filters__chips}>
              {GAMES.map(g => (
                <button
                  key={g}
                  className={`${styles.chip} ${gameFilter === g ? styles['chip--active'] : ''}`}
                  onClick={() => { setGameFilter(g); fetchTeams({ search, game: g !== 'All' ? g : '' }); }}
                >
                  {g}
                </button>
              ))}
            </div>
            <button className={styles.search_btn} onClick={handleSearch}>
              <Search size={14} strokeWidth={2} /> Search
            </button>
          </div>
        </div>

        {/* Results count */}
        <p className={styles.count}>
          {loading ? 'Loading...' : `${teams.length} team${teams.length !== 1 ? 's' : ''} found`}
        </p>

        {/* Grid */}
        {loading ? (
          <div className={styles.loading}>
            <div className={styles.spinner} />
          </div>
        ) : teams.length === 0 ? (
          <div className={styles.empty}>
            <Users size={48} color="#8892A4" strokeWidth={1.5} />
            <p>No teams found</p>
            {isLoggedIn && (
              <Link href="/teams/create" className={styles.empty__btn}>
                Create the first team →
              </Link>
            )}
          </div>
        ) : (
          <div className={styles.grid}>
            {teams.map(t => (
              <Link key={t.id} href={`/teams/${t.id}`} className={styles.card}>
                
                <div className={styles.card__top}>
                  <div className={styles.card__game}>
                    <Gamepad2 size={13} strokeWidth={1.75} />
                    {t.game}
                  </div>
                </div>

                <div className={styles.card__header}>
                  <div className={styles.card__avatar}>
                    {t.logo ? <img src={t.logo} alt={t.name} /> : <Gamepad2 size={24} color="#00F5FF" strokeWidth={1.5} />}
                  </div>
                  <div>
                    <h3 className={styles.card__title}>{t.name}</h3>
                    <div className={styles.card__tag}>[{t.tag}]</div>
                  </div>
                </div>

                <div className={styles.card__stats}>
                  <div className={styles.card__stat}>
                    <Users size={14} color="#00F5FF" strokeWidth={2} />
                    <div>
                      <div className={styles.card__stat_val} style={{ color: '#00F5FF' }}>
                        {t.member_count}
                      </div>
                      <div className={styles.card__stat_label}>Members</div>
                    </div>
                  </div>
                </div>

                <div className={styles.card__footer}>
                  <div className={styles.card__leader}>
                    <div className={styles.card__leader_avatar}>
                      {t.leader_avatar ? (
                        <img src={`http://localhost:5000${t.leader_avatar}`} alt={t.leader_username} />
                      ) : (
                        <span>{t.leader_username.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <span>{t.leader_username} <Crown size={10} color="#FFD700" style={{ display: 'inline', marginBottom: '-1px' }}/></span>
                  </div>
                  
                  <div className={styles.card__cta}>
                    View Team <ChevronRight size={14} strokeWidth={2.5} />
                  </div>
                </div>

              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
