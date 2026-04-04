'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Trophy, Gamepad2, Users, Zap, Plus,
  Search, Filter, Calendar, ChevronRight, Lock, CheckCircle
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
  is_registered?: boolean;
  challonge_url?: string;
  entry_fee_required?: boolean;
}

const STATUS_COLOR: Record<string, string> = {
  open: '#00F5FF', ongoing: '#00FF88',
  completed: '#FF6B00', draft: '#8892A4', cancelled: '#FF006E',
};

const GAMES = ['All', 'PUBG', 'Valorant', 'Free Fire', 'Mobile Legends', 'COD Mobile', 'CS2', 'Other'];
const STATUSES = ['All', 'open', 'ongoing', 'completed'];

function TournamentsContent() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [gameFilter, setGameFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [activeTab, setActiveTab] = useState<'all' | 'my'>('all');
  const [isOrganizer, setIsOrganizer] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [myOwnedTeams, setMyOwnedTeams] = useState<any[]>([]);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const filterParam = searchParams.get('filter');

  useEffect(() => {
    if (filterParam === 'my') {
      setActiveTab('my');
    }
  }, [filterParam]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const orgStatus = localStorage.getItem('is_organizer');
    const role = localStorage.getItem('role');
    setIsLoggedIn(!!token);
    setIsOrganizer(orgStatus === 'true' || role === 'admin');
    if (token) fetchMyTeams();
  }, []);

  const fetchMyTeams = async () => {
    try {
      const res = await api.get('/teams/my');
      if (res.data.success) {
        setMyOwnedTeams(res.data.ownedTeams || []);
      }
    } catch {}
  };

  useEffect(() => {
    fetchTournaments();
  }, [activeTab]);

  const fetchTournaments = async (params: Record<string, string> = {}) => {
    setLoading(true);
    try {
      const mergedParams = {
        search,
        game: gameFilter !== 'All' ? gameFilter : '',
        status: statusFilter !== 'All' ? statusFilter : '',
        filter: activeTab === 'my' ? 'my' : '',
        ...params
      };
      console.log('--- FETCH TOURNAMENTS ---');
      console.log('Active Tab:', activeTab);
      console.log('Final Params:', mergedParams);

      const query = new URLSearchParams(
        Object.fromEntries(Object.entries(mergedParams).filter(([, v]) => v && v !== 'All'))
      );
      const res = await api.get(`/tournaments?${query}`);
      if (res.data.success) setTournaments(res.data.tournaments);
    } catch { setTournaments([]); }
    finally { setLoading(false); }
  };

  const handleSearch = () => {
    fetchTournaments();
  };

  const handleCreateTournamentClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isLoggedIn) {
      router.push('/register');
    } else if (!isOrganizer) {
      alert('Please apply to become an organizer in your dashboard to create tournaments.');
      router.push('/dashboard');
    } else {
      router.push('/tournaments/create');
    }
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
          <div className={styles.header__actions}>
            {isLoggedIn && (
              <div className={styles.tabs}>
                <button 
                  className={`${styles.tab} ${activeTab === 'all' ? styles.tab_active : ''}`}
                  onClick={() => setActiveTab('all')}
                >
                  All Tournaments
                </button>
                <button 
                  className={`${styles.tab} ${activeTab === 'my' ? styles.tab_active : ''}`}
                  onClick={() => setActiveTab('my')}
                >
                  My Tournaments
                </button>
              </div>
            )}
            <button onClick={handleCreateTournamentClick} className={styles.create_btn}>
              <Plus size={16} strokeWidth={2.5} /> Create Tournament
            </button>
          </div>
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
                onClick={() => {
                  setGameFilter(g);
                  fetchTournaments({ game: g });
                }}
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
                onClick={() => { 
                  setStatusFilter(s); 
                  fetchTournaments({ status: s }); 
                }}
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
            <p>{activeTab === 'my' ? "You haven't registered for any tournaments yet." : "No tournaments found"}</p>
            {activeTab !== 'my' && (
              <button onClick={handleCreateTournamentClick} className={styles.empty__btn}>
                Create the first one →
              </button>
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
                      <Calendar size={14} color="#FF6B00" strokeWidth={2} />
                      <div>
                        <div className={styles.card__stat_val} style={{ color: '#FF6B00' }}>
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
                  {t.is_registered ? (
                    <span className={styles.card__registered}>
                      <CheckCircle size={14} strokeWidth={2.5} /> ALREADY REGISTERED
                    </span>
                  ) : (
                    <>
                      View Tournament <ChevronRight size={14} strokeWidth={2.5} />
                    </>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function TournamentsPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0A0A0F' }}>
        <div className={styles.spinner} />
      </div>
    }>
      <TournamentsContent />
    </Suspense>
  );
}
