'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, PlayCircle, CheckCircle, XCircle,
  Users, Trophy, Gamepad2, ExternalLink,
  RefreshCw, Pencil, AlertTriangle, Zap
} from 'lucide-react';
import IconTile from '../../../../components/IconTile';
import api from '../../../../lib/api';
import styles from './manage.module.scss';

interface Registration { id: number; username: string; full_name?: string; avatar?: string; team_name?: string; status: string; registered_at: string; challonge_participant_id?: string; }
interface Tournament { id: number; title: string; game: string; status: string; prize_pool: number; max_teams: number; start_date: string; challonge_url?: string; challonge_id?: string; tournament_type: string; }
interface Match { id: number; challonge_match_id?: string; player1_name?: string; player2_name?: string; player1_id?: number; player2_id?: number; winner_id?: number; score_player1: number; score_player2: number; round: number; status: string; }
interface ChallongeMatch { id: number; player1_id: number; player2_id: number; state: string; round: number; player1_prereq_match_id?: number; player2_prereq_match_id?: number; }

export default function ManageTournamentPage() {
  const { id } = useParams();
  const router = useRouter();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [challongeBracket, setChallongeBracket] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | string | null>(null);
  const [toast, setToast] = useState('');
  const [tab, setTab] = useState<'registrations' | 'matches' | 'bracket'>('registrations');
  const [scoreInput, setScoreInput] = useState<Record<string, { s1: string; s2: string; winner: string }>>({});

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  useEffect(() => { fetchData(); }, [id]);

  const fetchData = async () => {
    try {
      const res = await api.get(`/tournaments/${id}`);
      if (res.data.success) {
        setTournament(res.data.tournament);
        setRegistrations(res.data.registrations);
        setMatches(res.data.matches);
        setChallongeBracket(res.data.challongeBracket);
      }
    } catch { router.push('/dashboard/organizer'); }
    finally { setLoading(false); }
  };

  const handleRegistration = async (regId: number, action: 'approve' | 'reject') => {
    setActionLoading(regId);
    try {
      await api.put(`/tournaments/${id}/registrations/${regId}`, { action });
      showToast(action === 'approve' ? 'Team approved!' : 'Team rejected!');
      setRegistrations(prev => prev.map(r => r.id === regId ? { ...r, status: action === 'approve' ? 'approved' : 'rejected' } : r));
    } catch { showToast('Action failed!'); }
    finally { setActionLoading(null); }
  };

  const handleStart = async () => {
    const approvedCount = registrations.filter(r => r.status === 'approved').length;
    if (approvedCount < 2) { showToast('Need at least 2 approved teams!'); return; }
    if (!confirm(`Start tournament with ${approvedCount} teams? This will generate the bracket.`)) return;
    setActionLoading('start');
    try {
      const res = await api.post(`/tournaments/${id}/start`);
      showToast(res.data.message);
      setTournament(prev => prev ? { ...prev, status: 'ongoing' } : prev);
      await fetchData();
    } catch (err: any) { showToast(err.response?.data?.message || 'Failed to start!'); }
    finally { setActionLoading(null); }
  };

  const handleMatchUpdate = async (matchKey: string, challongeMatchId?: string) => {
    const scores = scoreInput[matchKey];
    if (!scores?.winner) { showToast('Select a winner!'); return; }
    setActionLoading(matchKey);
    try {
      await api.put(`/tournaments/${id}/matches/${matchKey}`, {
        winner_id: parseInt(scores.winner),
        score_player1: parseInt(scores.s1) || 0,
        score_player2: parseInt(scores.s2) || 0,
        challonge_match_id: challongeMatchId,
        challonge_winner_id: scores.winner,
      });
      showToast('Match result saved!');
      await fetchData();
      setScoreInput(prev => { const n = { ...prev }; delete n[matchKey]; return n; });
    } catch { showToast('Failed to update match!'); }
    finally { setActionLoading(null); }
  };

  if (loading) return (
    <div className={styles.loading}>
      <div className={styles.loading__spinner} />
      <p>Loading...</p>
    </div>
  );

  if (!tournament) return null;

  const approved = registrations.filter(r => r.status === 'approved');
  const pending = registrations.filter(r => r.status === 'pending');
  const rejected = registrations.filter(r => r.status === 'rejected');

  const statusColor: Record<string, string> = {
    open: '#00F5FF', ongoing: '#00FF88', completed: '#8B00FF', draft: '#8892A4', cancelled: '#FF006E',
  };

  const challongeParticipants: Record<number, string> = {};
  if (challongeBracket?.participants) {
    challongeBracket.participants.forEach((p: any) => {
      challongeParticipants[p.participant?.id] = p.participant?.name;
    });
  }

  return (
    <div className={styles.page}>
      {toast && <div className={styles.toast}>{toast}</div>}

      <div className={styles.inner}>

        {/* Header */}
        <div className={styles.header}>
          <Link href="/dashboard/organizer" className={styles.back}>
            <ArrowLeft size={15} strokeWidth={2} /> Organizer Dashboard
          </Link>
          <div className={styles.header__info}>
            <div className={styles.header__top}>
              <h1 className={styles.title}>{tournament.title}</h1>
              <span className={styles.status} style={{ color: statusColor[tournament.status], borderColor: statusColor[tournament.status] + '44', background: statusColor[tournament.status] + '14' }}>
                {tournament.status.toUpperCase()}
              </span>
            </div>
            <div className={styles.header__meta}>
              <span><Gamepad2 size={13} strokeWidth={1.75} style={{ display: 'inline', marginRight: 4 }} />{tournament.game}</span>
              <span><Users size={13} strokeWidth={1.75} style={{ display: 'inline', marginRight: 4 }} />{approved.length}/{tournament.max_teams} teams</span>
              <span><Zap size={13} strokeWidth={1.75} style={{ display: 'inline', marginRight: 4 }} />LKR {Number(tournament.prize_pool).toLocaleString()}</span>
            </div>
          </div>
          <div className={styles.header__actions}>
            {tournament.challonge_url && (
              <a href={tournament.challonge_url} target="_blank" rel="noreferrer" className={styles.challonge_btn}>
                <ExternalLink size={14} strokeWidth={2} /> Challonge
              </a>
            )}
            {tournament.status === 'open' && (
              <button className={styles.start_btn} onClick={handleStart} disabled={actionLoading === 'start'}>
                {actionLoading === 'start' ? <RefreshCw size={14} strokeWidth={2} /> : <PlayCircle size={14} strokeWidth={2} />}
                Start Tournament
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          {[
            { key: 'registrations', label: `Registrations (${registrations.length})`, icon: Users },
            { key: 'matches', label: `Matches (${matches.length})`, icon: Trophy },
            { key: 'bracket', label: 'Bracket', icon: Zap },
          ].map(t => (
            <button
              key={t.key}
              className={`${styles.tab} ${tab === t.key ? styles['tab--active'] : ''}`}
              onClick={() => setTab(t.key as any)}
            >
              <t.icon size={14} strokeWidth={1.75} style={{ marginRight: 6 }} />
              {t.label}
            </button>
          ))}
        </div>

        {/* ── REGISTRATIONS TAB ── */}
        {tab === 'registrations' && (
          <div className={styles.section}>
            {pending.length > 0 && (
              <div className={styles.pending_notice}>
                <AlertTriangle size={16} color="#FF6B00" strokeWidth={2} />
                <span>{pending.length} team{pending.length > 1 ? 's' : ''} waiting for approval</span>
              </div>
            )}

            {['pending', 'approved', 'rejected'].map(status => {
              const list = registrations.filter(r => r.status === status);
              if (!list.length) return null;
              const color = status === 'approved' ? '#00FF88' : status === 'pending' ? '#FF6B00' : '#FF006E';
              return (
                <div key={status} className={styles.reg_group}>
                  <h3 className={styles.reg_group__title} style={{ color }}>
                    {status.charAt(0).toUpperCase() + status.slice(1)} ({list.length})
                  </h3>
                  <div className={styles.reg_list}>
                    {list.map(reg => (
                      <div key={reg.id} className={styles.reg_card}>
                        <div className={styles.reg_card__avatar}>
                          {reg.avatar
                            ? <img src={reg.avatar} alt={reg.username} />
                            : <Gamepad2 size={18} color="#8892A4" strokeWidth={1.75} />
                          }
                        </div>
                        <div className={styles.reg_card__info}>
                          <div className={styles.reg_card__name}>{reg.team_name || reg.full_name || reg.username}</div>
                          <div className={styles.reg_card__sub}>@{reg.username} · {new Date(reg.registered_at).toLocaleDateString()}</div>
                        </div>
                        {status === 'pending' && (
                          <div className={styles.reg_card__actions}>
                            <button
                              className={styles.approve_btn}
                              onClick={() => handleRegistration(reg.id, 'approve')}
                              disabled={actionLoading === reg.id}
                            >
                              <CheckCircle size={13} strokeWidth={2} /> Approve
                            </button>
                            <button
                              className={styles.reject_btn}
                              onClick={() => handleRegistration(reg.id, 'reject')}
                              disabled={actionLoading === reg.id}
                            >
                              <XCircle size={13} strokeWidth={2} />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {registrations.length === 0 && (
              <div className={styles.empty}>
                <Users size={36} color="#8892A4" strokeWidth={1.5} />
                <p>No registrations yet</p>
              </div>
            )}
          </div>
        )}

        {/* ── MATCHES TAB ── */}
        {tab === 'matches' && (
          <div className={styles.section}>
            {tournament.status !== 'ongoing' && tournament.status !== 'completed' ? (
              <div className={styles.empty}>
                <PlayCircle size={36} color="#8892A4" strokeWidth={1.5} />
                <p>Start the tournament to generate matches</p>
              </div>
            ) : challongeBracket?.matches?.length > 0 ? (
              <div className={styles.matches}>
                {challongeBracket.matches.map((m: any) => {
                  const match = m.match;
                  const key = String(match.id);
                  const p1Name = challongeParticipants[match.player1_id] || `Player ${match.player1_id}`;
                  const p2Name = challongeParticipants[match.player2_id] || `Player ${match.player2_id}`;
                  const isCompleted = match.state === 'complete';
                  return (
                    <div key={match.id} className={`${styles.match_card} ${isCompleted ? styles['match_card--done'] : ''}`}>
                      <div className={styles.match_card__round}>Round {match.round}</div>
                      <div className={styles.match_card__body}>
                        <div className={styles.match_players}>
                          <span className={styles.player}>{p1Name || '—'}</span>
                          <span className={styles.vs}>VS</span>
                          <span className={styles.player}>{p2Name || '—'}</span>
                        </div>
                        {!isCompleted && match.player1_id && match.player2_id && (
                          <div className={styles.score_form}>
                            <input type="number" min="0" placeholder="0" className={styles.score_input}
                              value={scoreInput[key]?.s1 || ''}
                              onChange={e => setScoreInput(prev => ({ ...prev, [key]: { ...prev[key], s1: e.target.value } }))}
                            />
                            <span style={{ color: '#8892A4' }}>—</span>
                            <input type="number" min="0" placeholder="0" className={styles.score_input}
                              value={scoreInput[key]?.s2 || ''}
                              onChange={e => setScoreInput(prev => ({ ...prev, [key]: { ...prev[key], s2: e.target.value } }))}
                            />
                            <select className={styles.winner_select}
                              value={scoreInput[key]?.winner || ''}
                              onChange={e => setScoreInput(prev => ({ ...prev, [key]: { ...prev[key], winner: e.target.value } }))}
                            >
                              <option value="">Winner</option>
                              <option value={String(match.player1_id)}>{p1Name}</option>
                              <option value={String(match.player2_id)}>{p2Name}</option>
                            </select>
                            <button
                              className={styles.save_match_btn}
                              onClick={() => handleMatchUpdate(key, String(match.id))}
                              disabled={actionLoading === key}
                            >
                              {actionLoading === key ? <RefreshCw size={13} strokeWidth={2} /> : 'Save'}
                            </button>
                          </div>
                        )}
                        {isCompleted && (
                          <div className={styles.match_result}>
                            <CheckCircle size={14} color="#00FF88" strokeWidth={2} />
                            <span style={{ color: '#00FF88', fontSize: '0.8rem' }}>
                              Winner: {challongeParticipants[match.winner_id] || 'TBD'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : matches.length > 0 ? (
              <div className={styles.matches}>
                {matches.map(m => (
                  <div key={m.id} className={styles.match_card}>
                    <div className={styles.match_card__round}>Round {m.round}</div>
                    <div className={styles.match_card__body}>
                      <div className={styles.match_players}>
                        <span className={styles.player}>{m.player1_name || '—'}</span>
                        <span className={styles.vs}>{m.score_player1} — {m.score_player2}</span>
                        <span className={styles.player}>{m.player2_name || '—'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.empty}>
                <Trophy size={36} color="#8892A4" strokeWidth={1.5} />
                <p>No matches yet</p>
              </div>
            )}
          </div>
        )}

        {/* ── BRACKET TAB ── */}
        {tab === 'bracket' && (
          <div className={styles.section}>
            {tournament.challonge_url ? (
              <div className={styles.bracket_wrap}>
                <div className={styles.bracket_notice}>
                  <Zap size={15} color="#FFD700" strokeWidth={2} />
                  <span>Live bracket powered by Challonge</span>
                  <a href={tournament.challonge_url} target="_blank" rel="noreferrer" className={styles.challonge_link}>
                    Open full bracket <ExternalLink size={12} strokeWidth={2} style={{ display: 'inline', marginLeft: 4 }} />
                  </a>
                </div>
                <iframe
                  src={`${tournament.challonge_url}/module`}
                  width="100%"
                  height="500"
                  frameBorder="0"
                  scrolling="auto"
                  allowTransparency={true}
                  className={styles.bracket_iframe}
                  title="Tournament Bracket"
                />
              </div>
            ) : (
              <div className={styles.empty}>
                <Zap size={36} color="#8892A4" strokeWidth={1.5} />
                <p>No Challonge bracket available. Check your API key in <code>.env</code></p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}