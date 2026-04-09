'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Users, Gamepad2, Plus, Search, ChevronRight, Crown, X
} from 'lucide-react';
import { useRef } from 'react';

import api from '../../lib/api';
import styles from './teams.module.scss';
import { getImageUrl } from '../../lib/urlHelper';

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

function TeamsContent() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [gameFilter, setGameFilter] = useState('All');
  const [activeTab, setActiveTab] = useState<'all' | 'my'>('all');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  
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
    setIsLoggedIn(!!token);

    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    fetchTeams();
  }, [activeTab]);


  const fetchTeams = async (params: Record<string, string> = {}) => {
    setLoading(true);
    try {
      const mergedParams = {
        search,
        game: gameFilter !== 'All' ? gameFilter : '',
        filter: activeTab === 'my' ? 'my' : '',
        ...params
      };
      const query = new URLSearchParams(
        Object.fromEntries(Object.entries(mergedParams).filter(([, v]) => v && v !== 'All'))
      );
      const res = await api.get(`/teams?${query}`);
      if (res.data.success) {
        setTeams(res.data.teams || []);
      }
    } catch { setTeams([]); }
    finally { setLoading(false); }
  };

  const handleSearch = () => {
    fetchTeams();
  };

  const handleCreateTeamClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isLoggedIn) {
      router.push('/register');
    } else {
      router.push('/teams/create');
    }
  };

  return (
    <div className={styles.page}>
      <div className="container">

        {/* Header */}
        <div className={styles.header}>
          <h1 className={styles.header__title}>

            FIND YOUR <span className="gradient-text">SQUAD</span>
          </h1>
          <p className={styles.header__sub}>
            Browse top teams, explore rosters, and join the action!
          </p>

        </div>


        {/* Filters & Search */}
        <div className={styles.filters} ref={searchRef}>
          <div className={styles.filters__header}>
            {isLoggedIn && (
              <div className={styles.tabs}>
                <button 
                  className={`${styles.tab} ${activeTab === 'all' ? styles.tab_active : ''}`}
                  onClick={() => setActiveTab('all')}
                >
                  All
                </button>
                <button 
                  className={`${styles.tab} ${activeTab === 'my' ? styles.tab_active : ''}`}
                  onClick={() => setActiveTab('my')}
                >
                  My
                </button>
              </div>
            )}
            <button onClick={handleCreateTeamClick} className={styles.create_btn}>
              <Plus size={16} strokeWidth={2.5} /> Create
            </button>
          </div>

          <div className={styles.filters__wrapper}>

            <span className={styles.filters__icon}>
              <Search size={18} color="#8892A4" />
            </span>
            <input
              type="text"
              className={styles.filters__input}
              placeholder="Search by team name or tag..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            {search && (
              <button 
                className={styles.filters__clear} 
                onClick={() => { setSearch(''); fetchTeams({ search: '' }); }}
              >
                <X size={16} />
              </button>
            )}

            {/* Dropdown Results */}
            {showDropdown && search.length > 0 && (
              <div className={styles.filters__dropdown}>
                {loading ? (
                  <div style={{ padding: '1rem', textAlign: 'center', color: '#8892A4' }}>
                    Searching...
                  </div>
                ) : teams.length === 0 ? (
                  <div style={{ padding: '1rem', textAlign: 'center', color: '#8892A4' }}>
                    No teams found
                  </div>
                ) : (
                  teams.slice(0, 5).map((t) => (
                    <Link
                      key={t.id}
                      href={`/teams/${t.id}`}
                      className={styles.filters__item}
                      onClick={() => setShowDropdown(false)}
                    >
                      <div className={styles.filters__avatar_small}>
                        {t.logo ? (
                          <img src={getImageUrl(t.logo)} alt={t.name} />
                        ) : (
                          <Users size={20} color="#8892A4" />
                        )}
                      </div>
                      <div className={styles.filters__item_info}>
                        <div className={styles.filters__item_name}>{t.name}</div>
                        <div className={styles.filters__item_meta}>
                          [{t.tag}] • {t.game}
                        </div>
                      </div>
                      <ChevronRight size={14} color="#8892A4" />
                    </Link>
                  ))
                )}
              </div>
            )}
          </div>

          <div className={styles.filters__chips}>
            {GAMES.map(g => (
              <button
                key={g}
                className={`${styles.chip} ${gameFilter === g ? styles['chip--active'] : ''}`}
                onClick={() => { setGameFilter(g); fetchTeams({ game: g }); }}
              >
                {g}
              </button>
            ))}
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
            <p>{activeTab === 'my' ? "You haven't joined or created any teams yet." : "No teams found"}</p>
            {activeTab !== 'my' && (
              <button onClick={handleCreateTeamClick} className={styles.empty__btn}>
                Create the first team →
              </button>
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
                        <img src={getImageUrl(t.leader_avatar)} alt={t.leader_username} />
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

export default function TeamsPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0A0A0F' }}>
        <div className={styles.spinner} />
      </div>
    }>
      <TeamsContent />
    </Suspense>
  );
}
