'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, PlayCircle, CheckCircle, XCircle,
  Users, Trophy, Gamepad2, ExternalLink,
  RefreshCw, AlertTriangle, Zap, Megaphone, Crown, Send
} from 'lucide-react';
import IconTile from '../../../../components/IconTile';
import api from '../../../../lib/api';
import styles from './manage.module.scss';
import { getImageUrl } from '../../../../lib/urlHelper';

interface Registration {
  id: number; username: string; full_name?: string; avatar?: string;
  team_name?: string; team_id?: number; status: string; registered_at: string;
  challonge_participant_id?: string; leader_username?: string; leader_name?: string; leader_avatar?: string;
}
interface Tournament {
  id: number; title: string; game: string; status: string;
  prize_pool: number; max_teams: number; start_date: string;
  challonge_url?: string; challonge_id?: string; tournament_type: string;
  announcement?: string; announcement_sent_at?: string;
  winner_team_id?: number; winner_team_name?: string; winner_declared_at?: string;
}
interface Match {
  id: number; challonge_match_id?: string; player1_name?: string; player2_name?: string;
  player1_id?: number; player2_id?: number; winner_id?: number;
  score_player1: number; score_player2: number; round: number; status: string;
}

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
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [tab, setTab] = useState<'registrations' | 'matches' | 'bracket' | 'announce' | 'winner'>('registrations');
  const [scoreInput, setScoreInput] = useState<Record<string, { s1: string; s2: string; winner: string }>>({});

  // Announce tab state
  const [announcement, setAnnouncement] = useState('');
  const [sendingAnnouncement, setSendingAnnouncement] = useState(false);

  // Winner tab state
  const [selectedWinner, setSelectedWinner] = useState('');
  const [declaringWinner, setDeclaringWinner] = useState(false);
  const [winnerConfirm, setWinnerConfirm] = useState(false);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast(msg); setToastType(type);
    setTimeout(() => setToast(''), 4000);
  };

  useEffect(() => { fetchData(); }, [id]);

  const fetchData = async () => {
    try {
      const res = await api.get(`/tournaments/${id}`);
      if (res.data.success) {
        setTournament(res.data.tournament);
        setRegistrations(res.data.registrations || []);
        setMatches(res.data.matches || []);
        setChallongeBracket(res.data.challongeBracket);
        if (res.data.tournament.announcement) {
          setAnnouncement(res.data.tournament.announcement);
        }
      }
    } catch { router.push('/dashboard/organizer'); }
    finally { setLoading(false); }
  };

  const handleRegistration = async (regId: number, action: 'approve' | 'reject') => {
    setActionLoading(regId);
    try {
      await api.put(`/tournaments/${id}/registrations/${regId}`, { action });
      showToast(action === 'approve' ? '✅ Team approved!' : '❌ Team rejected!');
      setRegistrations(prev => prev.map(r => r.id === regId ? { ...r, status: action === 'approve' ? 'approved' : 'rejected' } : r));
    } catch { showToast('Action failed!', 'error'); }
    finally { setActionLoading(null); }
  };

  const handleStart = async () => {
    const approvedCount = registrations.filter(r => r.status === 'approved').length;
    if (approvedCount < 2) { showToast('Need at least 2 approved teams!', 'error'); return; }
    if (!confirm(`Start tournament with ${approvedCount} teams? This will lock registrations and generate the bracket.`)) return;
    setActionLoading('start');
    try {
      const res = await api.post(`/tournaments/${id}/start`);
      showToast(res.data.message);
      setTournament(prev => prev ? { ...prev, status: 'ongoing' } : prev);
      await fetchData();
    } catch (err: any) { showToast(err.response?.data?.message || 'Failed to start!', 'error'); }
    finally { setActionLoading(null); }
  };

  const handleMatchUpdate = async (matchKey: string, challongeMatchId?: string) => {
    const scores = scoreInput[matchKey];
    if (!scores?.winner) { showToast('Select a winner!', 'error'); return; }
    setActionLoading(matchKey);
    try {
      await api.put(`/tournaments/${id}/matches/${matchKey}`, {
        winner_id: parseInt(scores.winner),
        score_player1: parseInt(scores.s1) || 0,
        score_player2: parseInt(scores.s2) || 0,
        challonge_match_id: challongeMatchId,
        challonge_winner_id: scores.winner,
      });
      showToast('✅ Match result saved!');
      await fetchData();
      setScoreInput(prev => { const n = { ...prev }; delete n[matchKey]; return n; });
    } catch { showToast('Failed to update match!', 'error'); }
    finally { setActionLoading(null); }
  };

  const handleSendAnnouncement = async () => {
    if (!announcement.trim()) { showToast('Write an announcement first!', 'error'); return; }
    setSendingAnnouncement(true);
    try {
      const res = await api.post(`/tournaments/${id}/announce`, { message: announcement });
      showToast(`📢 ${res.data.message}`);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to send!', 'error');
    } finally { setSendingAnnouncement(false); }
  };

  const handleDeclareWinner = async () => {
    if (!selectedWinner) { showToast('Select a winner team!', 'error'); return; }
    if (!winnerConfirm) { setWinnerConfirm(true); return; }

    const winnerReg = approvedRegistrations.find(r => String(r.team_id) === selectedWinner || String(r.id) === selectedWinner);
    setDeclaringWinner(true);
    try {
      const res = await api.post(`/tournaments/${id}/declare-winner`, {
        team_id: winnerReg?.team_id || null,
        team_name: winnerReg?.team_name || selectedWinner,
      });
      showToast(res.data.message);
      setTournament(prev => prev ? {
        ...prev,
        status: 'completed',
        winner_team_id: winnerReg?.team_id,
        winner_team_name: winnerReg?.team_name,
        winner_declared_at: new Date().toISOString(),
      } : prev);
      setWinnerConfirm(false);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to declare winner!', 'error');
    } finally { setDeclaringWinner(false); }
  };

  if (loading) return (
    <div className={styles.loading}>
      <div className={styles.loading__spinner} />
      <p>Loading tournament...</p>
    </div>
  );

  if (!tournament) return null;

  const approvedRegistrations = registrations.filter(r => r.status === 'approved');
  const pendingRegistrations = registrations.filter(r => r.status === 'pending');
  const rejectedRegistrations = registrations.filter(r => r.status === 'rejected');

  const statusColor: Record<string, string> = {
    open: '#00F5FF', ongoing: '#00FF88', completed: '#FFD700', draft: '#8892A4', cancelled: '#FF006E',
  };

  const challongeParticipants: Record<number, string> = {};
  if (challongeBracket?.participants) {
    challongeBracket.participants.forEach((p: any) => {
      challongeParticipants[p.participant?.id] = p.participant?.name;
    });
  }

  const isCompleted = tournament.status === 'completed';
  const isOngoing = tournament.status === 'ongoing';

  return (
    <div className={styles.page}>
      {toast && (
        <div className={`${styles.toast} ${toastType === 'error' ? styles.toast_error : ''}`}>
          {toast}
        </div>
      )}

      <div className={styles.inner}>

        {/* ── Winner Banner (shown when completed) ── */}
        {isCompleted && tournament.winner_team_name && (
          <div className={styles.winner_banner}>
            <div className={styles.winner_banner__glow} />
            <div className={styles.winner_banner__content}>
              <div className={styles.winner_banner__trophy}>🏆</div>
              <div className={styles.winner_banner__text}>
                <div className={styles.winner_banner__label}>Tournament Champion</div>
                <div className={styles.winner_banner__name}>{tournament.winner_team_name}</div>
                <div className={styles.winner_banner__prize}>
                  Prize Pool: <span>LKR {Number(tournament.prize_pool).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Header ── */}
        <div className={styles.header}>
          <Link href="/dashboard/organizer" className={styles.back}>
            <ArrowLeft size={15} strokeWidth={2} /> Organizer Dashboard
          </Link>
          <div className={styles.header__info}>
            <div className={styles.header__top}>
              <h1 className={styles.title}>{tournament.title}</h1>
              <span className={styles.status} style={{ color: statusColor[tournament.status], borderColor: statusColor[tournament.status] + '44', background: statusColor[tournament.status] + '14' }}>
                {tournament.status === 'ongoing' && <span className={styles.live_dot} />}
                {tournament.status.toUpperCase()}
              </span>
            </div>
            <div className={styles.header__meta}>
              <span><Gamepad2 size={13} strokeWidth={1.75} style={{ display: 'inline', marginRight: 4 }} />{tournament.game}</span>
              <span><Users size={13} strokeWidth={1.75} style={{ display: 'inline', marginRight: 4 }} />{approvedRegistrations.length}/{tournament.max_teams} teams</span>
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
                {actionLoading === 'start' ? <RefreshCw size={14} className={styles.spin} /> : <PlayCircle size={14} strokeWidth={2} />}
                Start Tournament
              </button>
            )}
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className={styles.tabs}>
          {[
            { key: 'registrations', label: `Registrations (${registrations.length})`, icon: Users },
            { key: 'matches', label: `Matches (${matches.length})`, icon: Trophy },
            { key: 'bracket', label: 'Bracket', icon: Zap },
            { key: 'announce', label: 'Announce', icon: Megaphone },
            { key: 'winner', label: 'Declare Winner', icon: Crown },
          ].map(t => (
            <button
              key={t.key}
              className={`${styles.tab} ${tab === t.key ? styles['tab--active'] : ''}`}
              onClick={() => setTab(t.key as any)}
            >
              <t.icon size={13} strokeWidth={1.75} />
              {t.label}
            </button>
          ))}
        </div>

        {/* ── REGISTRATIONS TAB ── */}
        {tab === 'registrations' && (
          <div className={styles.section}>
            {pendingRegistrations.length > 0 && (
              <div className={styles.pending_notice}>
                <AlertTriangle size={16} color="#FF6B00" strokeWidth={2} />
                <span>{pendingRegistrations.length} team{pendingRegistrations.length > 1 ? 's' : ''} waiting for approval</span>
              </div>
            )}
            {(['pending', 'approved', 'rejected'] as const).map(status => {
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
                          {reg.leader_avatar
                            ? <img src={getImageUrl(reg.leader_avatar)} alt={reg.leader_username} />
                            : <Gamepad2 size={18} color="#8892A4" strokeWidth={1.75} />
                          }
                        </div>
                        <div className={styles.reg_card__info}>
                          <div className={styles.reg_card__name}>{reg.team_name || reg.full_name || reg.username}</div>
                          <div className={styles.reg_card__sub}>
                            Leader: @{reg.leader_username || reg.username} · {new Date(reg.registered_at).toLocaleDateString()}
                          </div>
                        </div>
                        {status === 'pending' && (
                          <div className={styles.reg_card__actions}>
                            <button className={styles.approve_btn} onClick={() => handleRegistration(reg.id, 'approve')} disabled={actionLoading === reg.id}>
                              <CheckCircle size={13} strokeWidth={2} /> Approve
                            </button>
                            <button className={styles.reject_btn} onClick={() => handleRegistration(reg.id, 'reject')} disabled={actionLoading === reg.id}>
                              <XCircle size={13} strokeWidth={2} />
                            </button>
                          </div>
                        )}
                        {status === 'approved' && (
                          <CheckCircle size={16} color="#00FF88" strokeWidth={2} style={{ marginLeft: 'auto', flexShrink: 0 }} />
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
                  const isDone = match.state === 'complete';
                  return (
                    <div key={match.id} className={`${styles.match_card} ${isDone ? styles['match_card--done'] : ''}`}>
                      <div className={styles.match_card__round}>Round {match.round}</div>
                      <div className={styles.match_card__body}>
                        <div className={styles.match_players}>
                          <span className={`${styles.player} ${match.winner_id === match.player1_id && isDone ? styles['player--winner'] : ''}`}>{p1Name || '—'}</span>
                          <span className={styles.vs}>VS</span>
                          <span className={`${styles.player} ${match.winner_id === match.player2_id && isDone ? styles['player--winner'] : ''}`}>{p2Name || '—'}</span>
                        </div>
                        {!isDone && match.player1_id && match.player2_id && (
                          <div className={styles.score_form}>
                            <input type="number" min="0" placeholder="0" className={styles.score_input}
                              value={scoreInput[key]?.s1 || ''}
                              onChange={e => setScoreInput(prev => ({ ...prev, [key]: { ...prev[key], s1: e.target.value } }))}
                            />
                            <span style={{ color: '#8892A4', fontWeight: 700 }}>—</span>
                            <input type="number" min="0" placeholder="0" className={styles.score_input}
                              value={scoreInput[key]?.s2 || ''}
                              onChange={e => setScoreInput(prev => ({ ...prev, [key]: { ...prev[key], s2: e.target.value } }))}
                            />
                            <select className={styles.winner_select}
                              value={scoreInput[key]?.winner || ''}
                              onChange={e => setScoreInput(prev => ({ ...prev, [key]: { ...prev[key], winner: e.target.value } }))}
                            >
                              <option value="">Select Winner</option>
                              <option value={String(match.player1_id)}>{p1Name}</option>
                              <option value={String(match.player2_id)}>{p2Name}</option>
                            </select>
                            <button className={styles.save_match_btn} onClick={() => handleMatchUpdate(key, String(match.id))} disabled={actionLoading === key}>
                              {actionLoading === key ? <RefreshCw size={13} className={styles.spin} /> : 'Save'}
                            </button>
                          </div>
                        )}
                        {isDone && (
                          <div className={styles.match_result}>
                            <CheckCircle size={14} color="#00FF88" strokeWidth={2} />
                            <span>Winner: <strong style={{ color: '#00FF88' }}>{challongeParticipants[match.winner_id] || 'TBD'}</strong></span>
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
                <p>No matches yet — bracket will generate after tournament starts</p>
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
                  width="100%" height="500"
                  frameBorder="0" scrolling="auto"
                  className={styles.bracket_iframe}
                  title="Tournament Bracket"
                />
              </div>
            ) : (
              <div className={styles.empty}>
                <Zap size={36} color="#8892A4" strokeWidth={1.5} />
                <p>No Challonge bracket — check your API key in <code>.env</code></p>
              </div>
            )}
          </div>
        )}

        {/* ── ANNOUNCE TAB ── */}
        {tab === 'announce' && (
          <div className={styles.section}>
            <div className={styles.announce_header}>
              <IconTile icon={Megaphone} color="#00F5FF" size={15} tileSize={32} radius={8} />
              <div>
                <h2 className={styles.section_title}>Send Announcement</h2>
                <p className={styles.section_sub}>Your message will be emailed to all registered team leaders and sent as an in-app notification.</p>
              </div>
            </div>

            {approvedRegistrations.length === 0 ? (
              <div className={styles.empty}>
                <Megaphone size={36} color="#8892A4" strokeWidth={1.5} />
                <p>No approved teams yet — nothing to announce to</p>
              </div>
            ) : (
              <>
                <div className={styles.recipients_badge}>
                  <Users size={13} strokeWidth={2} />
                  Sending to <strong>{approvedRegistrations.length}</strong> team leader{approvedRegistrations.length > 1 ? 's' : ''}
                </div>

                <textarea
                  className={styles.announce_textarea}
                  placeholder={`Write your announcement here...\n\nExamples:\n• Match 1 starts at 8:00 PM. Room code: ABC123, Password: 9876\n• Please be ready 15 minutes before your match time\n• Tournament bracket has been updated — check Challonge`}
                  value={announcement}
                  onChange={e => setAnnouncement(e.target.value)}
                  rows={8}
                />

                <div className={styles.announce_footer}>
                  <span className={styles.char_count}>{announcement.length} characters</span>
                  <button
                    className={styles.send_btn}
                    onClick={handleSendAnnouncement}
                    disabled={sendingAnnouncement || !announcement.trim()}
                  >
                    {sendingAnnouncement
                      ? <><RefreshCw size={14} className={styles.spin} /> Sending...</>
                      : <><Send size={14} strokeWidth={2} /> Send to All Teams</>
                    }
                  </button>
                </div>

                {tournament.announcement_sent_at && (
                  <div className={styles.last_sent}>
                    Last sent: {new Date(tournament.announcement_sent_at).toLocaleString()}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── WINNER TAB ── */}
        {tab === 'winner' && (
          <div className={styles.section}>
            {isCompleted && tournament.winner_team_name ? (
              /* Already declared */
              <div className={styles.winner_declared}>
                <div className={styles.winner_declared__trophy}>🏆</div>
                <h2 className={styles.winner_declared__name}>{tournament.winner_team_name}</h2>
                <p className={styles.winner_declared__label}>Tournament Champion</p>
                <div className={styles.winner_declared__prize}>
                  LKR {Number(tournament.prize_pool).toLocaleString()}
                  <span>Prize Pool</span>
                </div>
                {tournament.winner_declared_at && (
                  <p className={styles.winner_declared__date}>
                    Declared on {new Date(tournament.winner_declared_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                )}
              </div>
            ) : (
              <>
                <div className={styles.announce_header}>
                  <IconTile icon={Crown} color="#FFD700" size={15} tileSize={32} radius={8} />
                  <div>
                    <h2 className={styles.section_title}>Declare Winner</h2>
                    <p className={styles.section_sub}>
                      Select the winning team. This will mark the tournament as completed, email all participants, and send notifications.
                    </p>
                  </div>
                </div>

                {approvedRegistrations.length < 2 ? (
                  <div className={styles.empty}>
                    <Crown size={36} color="#8892A4" strokeWidth={1.5} />
                    <p>Need at least 2 approved teams to declare a winner</p>
                  </div>
                ) : (
                  <>
                    <div className={styles.winner_teams}>
                      {approvedRegistrations.map(reg => (
                        <button
                          key={reg.id}
                          className={`${styles.winner_team_card} ${selectedWinner === String(reg.team_id || reg.id) ? styles['winner_team_card--selected'] : ''}`}
                          onClick={() => { setSelectedWinner(String(reg.team_id || reg.id)); setWinnerConfirm(false); }}
                        >
                          <div className={styles.winner_team_card__avatar}>
                            {reg.leader_avatar
                              ? <img src={getImageUrl(reg.leader_avatar)} alt={reg.leader_username} />
                              : <Gamepad2 size={20} color="#8892A4" strokeWidth={1.5} />
                            }
                          </div>
                          <div className={styles.winner_team_card__info}>
                            <div className={styles.winner_team_card__name}>{reg.team_name || reg.username}</div>
                            <div className={styles.winner_team_card__leader}>@{reg.leader_username || reg.username}</div>
                          </div>
                          {selectedWinner === String(reg.team_id || reg.id) && (
                            <div className={styles.winner_team_card__check}>
                              <Trophy size={16} color="#FFD700" strokeWidth={2} />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>

                    {selectedWinner && (
                      <div className={styles.declare_footer}>
                        {winnerConfirm ? (
                          <div className={styles.confirm_box}>
                            <AlertTriangle size={18} color="#FF6B00" strokeWidth={2} />
                            <div>
                              <p className={styles.confirm_box__title}>Are you sure?</p>
                              <p className={styles.confirm_box__sub}>
                                This will mark the tournament as <strong>completed</strong>, email all {approvedRegistrations.length} participants, and cannot be undone.
                              </p>
                            </div>
                            <div className={styles.confirm_box__btns}>
                              <button className={styles.confirm_yes} onClick={handleDeclareWinner} disabled={declaringWinner}>
                                {declaringWinner ? <RefreshCw size={13} className={styles.spin} /> : '🏆'} Yes, Declare Winner
                              </button>
                              <button className={styles.confirm_no} onClick={() => setWinnerConfirm(false)}>
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button className={styles.declare_btn} onClick={handleDeclareWinner}>
                            <Crown size={15} strokeWidth={2} />
                            Declare Winner & End Tournament
                          </button>
                        )}
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}