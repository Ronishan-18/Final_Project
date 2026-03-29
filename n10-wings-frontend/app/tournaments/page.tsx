'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Trophy, Gamepad2, Users, Zap, Plus,
  Search, Filter, Calendar, ChevronRight, Lock
} from 'lucide-react';
import IconTile from '../../components/IconTile';
import api from '../../lib/api';
import styles from './tournaments.module.scss';

interface Tournament {
  id: number;
  title: string;
  game: string;
  status: string;
  prize_pool: number;
  max_teams: number;
  entry_fee: number;
  start_date: string;
  tournament_type: string;
  organizer_username: string;
  organizer_name: string;
  registered_teams: number;
  challonge_url?: string;
}

const STATUS_COLOR: Record<string, string> = {
  open: '#00F5FF', ongoing: '#00FF88',
  completed: '#8B00FF', draft: '#8892A4', cancelled: '#FF006E',
};

const GAMES = ['All', 'PUBG', 'Valorant', 'Free Fire', 'Mobile Legends', 'COD Mobile', 'CS2', 'Other'];
const STATUSES = ['All', 'open', 'ongoing', 'completed'];

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [gameFilter, setGameFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isOrganizer, setIsOrganizer] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const orgStatus = localStorage.getItem('is_organizer');
    const role = localStorage.getItem('role');
    setIsLoggedIn(!!token);
    setIsOrganizer(orgStatus === 'true' || role === 'admin');
    fetchTournaments();
  }, []);

  const fetchTournaments = async (params: Record<string, string> = {}) => {
    setLoading(true);
    try {
      const query = new URLSearchParams(
        Object.fromEntries(Object.entries(params).filter(([, v]) => v && v !== 'All'))
      );
      const res = await api.get(`/tournaments?${query}`);
      if (res.data.success) setTournaments(res.data.tournaments);
    } catch { setTournaments([]); }
    finally { setLoading(false); }
  };

  const handleSearch = () => {
    fetchTournaments({
      search,
      game: gameFilter !== 'All' ? gameFilter : '',
      status: statusFilter !== 'All' ? statusFilter : '',
    });
  };

  const fillPct = (t: Tournament) => Math.min((t.registered_teams / t.max_teams) * 100, 100);

  return (
    <div className={styles.page}>
      <div className="container">

        {/* Header */}
        <div className={styles.header}>
          <div>
            <div className="badge">
              <Trophy size={12} strokeWidth={2.5} /> Tournaments
            </div>
            <h1 className={styles.header__title}>
              FIND YOUR <span className="gradient-text">TOURNAMENT</span>
            </h1>
            <p className={styles.header__sub}>
              Compete, win prizes and climb the leaderboard
            </p>
          </div>
          {isOrganizer && (
            <Link href="/tournaments/create" className={styles.create_btn}>
              <Plus size={16} strokeWidth={2.5} /> Create Tournament
            </Link>
          )}
          {!isOrganizer && isLoggedIn && (
            <div className={styles.organizer_hint}>
              <Lock size={14} color="#8892A4" strokeWidth={1.75} />
              <span>Apply to become an organizer to create tournaments</span>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className={styles.filters}>
          <div className={styles.filters__search}>
            <Search size={15} color="#8892A4" strokeWidth={2} />
            <input
              className={styles.filters__input}
              placeholder="Search tournaments..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <div className={styles.filters__chips}>
            {GAMES.map(g => (
              <button
                key={g}
                className={`${styles.chip} ${gameFilter === g ? styles['chip--active'] : ''}`}
                onClick={() => setGameFilter(g)}
              >
                {g}
              </button>
            ))}
          </div>
          <div className={styles.filters__row}>
            {STATUSES.map(s => (
              <button
                key={s}
                className={`${styles.status_chip} ${statusFilter === s ? styles['status_chip--active'] : ''}`}
                onClick={() => { setStatusFilter(s); fetchTournaments({ search, game: gameFilter !== 'All' ? gameFilter : '', status: s !== 'All' ? s : '' }); }}
                style={s !== 'All' ? { '--sc': STATUS_COLOR[s] } as any : {}}
              >
                {s === 'All' ? 'All Status' : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
            <button className={styles.search_btn} onClick={handleSearch}>
              <Search size={14} strokeWidth={2} /> Search
            </button>
          </div>
        </div>

        {/* Results count */}
        <p className={styles.count}>
          {loading ? 'Loading...' : `${tournaments.length} tournament${tournaments.length !== 1 ? 's' : ''} found`}
        </p>

        {/* Grid */}
        {loading ? (
          <div className={styles.loading}>
            <div className={styles.spinner} />
          </div>
        ) : tournaments.length === 0 ? (
          <div className={styles.empty}>
            <Trophy size={48} color="#8892A4" strokeWidth={1.5} />
            <p>No tournaments found</p>
            {isOrganizer && (
              <Link href="/tournaments/create" className={styles.empty__btn}>
                Create the first one →
              </Link>
            )}
          </div>
        ) : (
          <div className={styles.grid}>
            {tournaments.map(t => (
              <Link key={t.id} href={`/tournaments/${t.id}`} className={styles.card}>
                {/* Status bar */}
                <div className={styles.card__bar} style={{ background: STATUS_COLOR[t.status] }} />

                <div className={styles.card__top}>
                  <div className={styles.card__game}>
                    <Gamepad2 size={13} strokeWidth={1.75} style={{ marginRight: 4, display: 'inline' }} />
                    {t.game}
                  </div>
                  <span
                    className={styles.card__status}
                    style={{ color: STATUS_COLOR[t.status], borderColor: STATUS_COLOR[t.status] + '44', background: STATUS_COLOR[t.status] + '14' }}
                  >
                    {t.status === 'ongoing' && <span className={styles.live_dot} />}
                    {t.status.toUpperCase()}
                  </span>
                </div>

                <h3 className={styles.card__title}>{t.title}</h3>

                <div className={styles.card__type}>
                  {t.tournament_type}
                </div>

                <div className={styles.card__stats}>
                  <div className={styles.card__stat}>
                    <Zap size={14} color="#FFD700" strokeWidth={2} />
                    <div>
                      <div className={styles.card__stat_val} style={{ color: '#FFD700' }}>
                        LKR {Number(t.prize_pool).toLocaleString()}
                      </div>
                      <div className={styles.card__stat_label}>Prize Pool</div>
                    </div>
                  </div>
                  <div className={styles.card__stat}>
                    <Users size={14} color="#00F5FF" strokeWidth={2} />
                    <div>
                      <div className={styles.card__stat_val} style={{ color: '#00F5FF' }}>
                        {t.registered_teams}/{t.max_teams}
                      </div>
                      <div className={styles.card__stat_label}>Teams</div>
                    </div>
                  </div>
                  {t.start_date && (
                    <div className={styles.card__stat}>
                      <Calendar size={14} color="#8B00FF" strokeWidth={2} />
                      <div>
                        <div className={styles.card__stat_val} style={{ color: '#8B00FF' }}>
                          {new Date(t.start_date).toLocaleDateString()}
                        </div>
                        <div className={styles.card__stat_label}>Start Date</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Fill bar */}
                <div className={styles.card__fill_track}>
                  <div className={styles.card__fill_bar} style={{ width: `${fillPct(t)}%`, background: STATUS_COLOR[t.status] }} />
                </div>

                <div className={styles.card__footer}>
                  <span className={styles.card__organizer}>
                    by {t.organizer_name || t.organizer_username}
                  </span>
                  {t.entry_fee > 0
                    ? <span className={styles.card__fee}>LKR {t.entry_fee} entry</span>
                    : <span className={styles.card__free}>FREE</span>
                  }
                </div>

                <div className={styles.card__cta}>
                  View Tournament <ChevronRight size={14} strokeWidth={2.5} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}