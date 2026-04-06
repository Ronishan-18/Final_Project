'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Trophy, Users, Zap, Calendar, Gamepad2,
  ExternalLink, CheckCircle, Clock, Shield, ChevronRight,
  CreditCard, LogIn, AlertCircle, Lock, Info, ArrowRight
} from 'lucide-react';
import IconTile from '../../../components/IconTile';
import api from '../../../lib/api';
import styles from './tournament.module.scss';
import { getImageUrl } from '../../../lib/urlHelper';

interface Tournament {
  id: number; title: string; game: string; status: string;
  description?: string; rules?: string;
  prize_pool: number; max_teams: number; entry_fee: number;
  entry_fee_required: boolean; start_date: string; end_date: string;
  tournament_type: string; organizer_username: string; organizer_name: string;
  challonge_url?: string; challonge_id?: string;
}
interface Registration {
  id: number; username: string; full_name?: string; avatar?: string;
  team_name?: string; status: string; team_id?: number; user_id?: number;
}
interface OwnedTeam { id?: number; team_id?: number; name: string; tag: string; }

const STATUS_COLOR: Record<string, string> = {
  open: '#00F5FF', ongoing: '#00FF88',
  completed: '#FFD700', draft: '#8892A4', cancelled: '#FF006E',
};
const COMMISSION = 0.05;

export default function TournamentDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const paymentCancelled = searchParams.get('payment') === 'cancelled';

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [toast, setToast] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isOrganizer, setIsOrganizer] = useState(false);
  const [ownedTeams, setOwnedTeams] = useState<OwnedTeam[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);
  const [registrationStatus, setRegistrationStatus] = useState('');
  const [teamsLoading, setTeamsLoading] = useState(false);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast(msg); setToastType(type);
    setTimeout(() => setToast(''), 4000);
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const orgStatus = localStorage.getItem('is_organizer');
    const role = localStorage.getItem('role');
    setIsLoggedIn(!!token);
    setIsOrganizer(orgStatus === 'true' || role === 'admin');
    fetchTournament();
    if (token) fetchMyTeams();
    if (paymentCancelled) showToast('Payment cancelled. Your team was not registered.', 'error');
  }, [id]);

  const fetchTournament = async () => {
    try {
      const res = await api.get(`/tournaments/${id}`);
      if (res.data.success) {
        setTournament(res.data.tournament);
        setRegistrations(res.data.registrations || []);
      }
    } catch { router.push('/tournaments'); }
    finally { setLoading(false); }
  };

  const fetchMyTeams = async () => {
    setTeamsLoading(true);
    try {
      const res = await api.get('/teams/my');
      if (res.data.success) {
        const owned: OwnedTeam[] = res.data.ownedTeams || [];
        setOwnedTeams(owned);
        if (owned.length === 1) setSelectedTeamId(owned[0].team_id || owned[0].id || null);
      }
    } catch {}
    finally { setTeamsLoading(false); }
  };

  useEffect(() => {
    if (!ownedTeams.length || !registrations.length) return;
    const myTeamIds = ownedTeams.map(t => t.team_id || t.id).filter(Boolean);
    const existing = registrations.find(r => r.team_id && myTeamIds.includes(r.team_id));
    if (existing) {
      setAlreadyRegistered(true);
      setRegistrationStatus(existing.status);
      setSelectedTeamId(existing.team_id || null);
    }
  }, [ownedTeams, registrations]);

  const getTeamId = () => selectedTeamId || (ownedTeams.length === 1 ? (ownedTeams[0].team_id || ownedTeams[0].id || null) : null);

  const handleRegister = async () => {
    if (!isLoggedIn) { router.push('/login'); return; }
    if (!tournament) return;
    const teamId = getTeamId();
    if (!teamId) { showToast('Please select a team!', 'error'); return; }
    setRegistering(true);
    try {
      if (tournament.entry_fee_required && Number(tournament.entry_fee) > 0) {
        const res = await api.post('/payments/entry-checkout', { tournament_id: tournament.id, team_id: teamId });
        window.location.href = res.data.checkout_url;
        return;
      }
      const res = await api.post(`/teams/register/${id}`, { team_id: teamId });
      showToast(res.data.message || 'Applied! Waiting for organizer approval.');
      setAlreadyRegistered(true);
      setRegistrationStatus('pending');
      await fetchTournament();
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Registration failed!', 'error');
    } finally { setRegistering(false); }
  };

  if (loading) return <div className={styles.loading}><div className={styles.spinner} /></div>;
  if (!tournament) return null;

  const approved = registrations.filter(r => r.status === 'approved');
  const fillPct = Math.min((approved.length / tournament.max_teams) * 100, 100);
  const color = STATUS_COLOR[tournament.status] || '#00F5FF';
  const isFull = approved.length >= tournament.max_teams;
  const entryFee = Number(tournament.entry_fee) || 0;
  const commission = Math.round(entryFee * COMMISSION * 100) / 100;
  const totalFee = Math.round((entryFee + commission) * 100) / 100;

  const renderPanel = () => {
    if (tournament.status !== 'open') return (
      <div className={styles.reg_notice}>
        <Info size={14} /> Tournament is <strong>{tournament.status}</strong> — registration closed
      </div>
    );
    if (isOrganizer) return null;
    if (alreadyRegistered) {
      const map: Record<string, any> = {
        approved: { bg: 'rgba(0,255,136,0.08)', bd: 'rgba(0,255,136,0.3)', c: '#00FF88', Icon: CheckCircle, txt: 'Your team is approved!' },
        pending:  { bg: 'rgba(255,107,0,0.08)', bd: 'rgba(255,107,0,0.3)',  c: '#FF6B00', Icon: Clock,        txt: 'Application pending approval' },
        rejected: { bg: 'rgba(255,0,110,0.08)', bd: 'rgba(255,0,110,0.3)',  c: '#FF006E', Icon: AlertCircle,  txt: 'Application was rejected' },
      };
      const cfg = map[registrationStatus] || map.pending;
      return (
        <div className={styles.reg_status} style={{ background: cfg.bg, borderColor: cfg.bd, color: cfg.c }}>
          <cfg.Icon size={15} /> <span>{cfg.txt}</span>
        </div>
      );
    }
    if (isFull) return (
      <div className={styles.reg_status} style={{ background: 'rgba(136,146,164,0.08)', borderColor: 'rgba(136,146,164,0.2)', color: '#8892A4' }}>
        <Users size={15} /> <span>Tournament is full ({tournament.max_teams}/{tournament.max_teams})</span>
      </div>
    );
    if (!isLoggedIn) return (
      <button className={styles.cta_btn} onClick={() => router.push('/login')} style={{ background: 'linear-gradient(135deg,#00F5FF,#8B00FF)' }}>
        <LogIn size={15} /> Login to Apply
      </button>
    );
    if (teamsLoading) return (
      <div className={styles.reg_loading}><div className={styles.mini_spinner} /> Checking your teams...</div>
    );
    if (ownedTeams.length === 0) return (
      <div>
        <div className={styles.reg_status} style={{ background: 'rgba(0,245,255,0.05)', borderColor: 'rgba(0,245,255,0.12)', color: 'rgba(0,245,255,0.6)' }}>
          <Shield size={15} /> <span>You need to be a team captain to apply</span>
        </div>
        <Link href="/teams/create" className={styles.create_team_btn}>
          <Users size={14} /> Create a Team <ArrowRight size={14} />
        </Link>
      </div>
    );
    return (
      <div className={styles.reg_card}>
        <div className={styles.reg_card__hdr}>
          <Trophy size={14} color="#FFD700" strokeWidth={2} /><span>Apply for Tournament</span>
        </div>
        {ownedTeams.length > 1 ? (
          <div className={styles.team_sel_wrap}>
            <label className={styles.sel_label}>Select your team:</label>
            <select className={styles.team_sel} value={getTeamId() || ''} onChange={e => setSelectedTeamId(Number(e.target.value))}>
              <option value="" disabled>Choose a team...</option>
              {ownedTeams.map(t => { const tid = t.team_id || t.id; return <option key={tid} value={tid}>{t.name} [{t.tag}]</option>; })}
            </select>
          </div>
        ) : (
          <div className={styles.single_team}>
            <span className={styles.single_team__lbl}>Registering as:</span>
            <span className={styles.single_team__name}>
              <Users size={13} color="#00F5FF" /> {ownedTeams[0].name}
              <span className={styles.tag_pill}>{ownedTeams[0].tag}</span>
            </span>
          </div>
        )}
        {tournament.entry_fee_required && entryFee > 0 ? (
          <>
            <div className={styles.fee_box}>
              <div className={styles.fee_row}><span>Entry fee</span><span>LKR {entryFee.toLocaleString()}</span></div>
              <div className={styles.fee_row}><span>Platform fee (5%)</span><span>LKR {commission.toLocaleString()}</span></div>
              <div className={styles.fee_div} />
              <div className={`${styles.fee_row} ${styles['fee_row--total']}`}>
                <span>Total</span><span style={{ color: '#FFD700' }}>LKR {totalFee.toLocaleString()}</span>
              </div>
            </div>
            <button className={styles.cta_btn} onClick={handleRegister} disabled={registering || !getTeamId()}
              style={{ background: 'linear-gradient(135deg,#FFD700,#FF6B00)', color: '#0A0A0F' }}>
              {registering ? <><div className={styles.mini_spinner} /> Redirecting...</> : <><CreditCard size={15} /> Pay LKR {totalFee.toLocaleString()} & Apply</>}
            </button>
            <p className={styles.secure_note}><Lock size={11} /> Secured by Stripe</p>
          </>
        ) : (
          <>
            <div className={styles.free_badge}><CheckCircle size={12} color="#00FF88" /> Free Entry — No payment required</div>
            <button className={styles.cta_btn} onClick={handleRegister} disabled={registering || !getTeamId()}
              style={{ background: 'linear-gradient(135deg,#00F5FF,#8B00FF)' }}>
              {registering ? 'Submitting...' : <><ChevronRight size={15} /> Apply for Tournament</>}
            </button>
          </>
        )}
      </div>
    );
  };

  return (
    <div className={styles.page}>
      {toast && <div className={`${styles.toast} ${toastType === 'error' ? styles.toast_error : ''}`}>{toast}</div>}
      <div className="container">
        <Link href="/tournaments" className={styles.back}><ArrowLeft size={15} strokeWidth={2} /> All Tournaments</Link>

        <div className={styles.hero} style={{ borderColor: color + '33' }}>
          <div className={styles.hero__left}>
            <div className={styles.hero__badges}>
              <span className={styles.hero__game}><Gamepad2 size={13} strokeWidth={1.75} style={{ marginRight: 4, display: 'inline' }} />{tournament.game}</span>
              <span className={styles.hero__status} style={{ color, borderColor: color + '55', background: color + '14' }}>
                {tournament.status === 'ongoing' && <span className={styles.live_dot} />}
                {tournament.status.toUpperCase()}
              </span>
              <span className={styles.hero__type}>{tournament.tournament_type}</span>
            </div>
            <h1 className={styles.hero__title}>{tournament.title}</h1>
            <p className={styles.hero__organizer}>Organized by <strong style={{ color }}>{tournament.organizer_name || tournament.organizer_username}</strong></p>
            {tournament.description && <p className={styles.hero__desc}>{tournament.description}</p>}
          </div>

          <div className={styles.hero__right}>
            <div className={styles.info_card}>
              {[
                { icon: Zap,      label: 'Prize Pool', value: `LKR ${Number(tournament.prize_pool).toLocaleString()}`, color: '#FFD700' },
                { icon: Users,    label: 'Teams',      value: `${approved.length} / ${tournament.max_teams}`,          color: '#00F5FF' },
                { icon: Trophy,   label: 'Entry Fee',  value: entryFee > 0 ? `LKR ${entryFee.toLocaleString()}` : 'FREE', color: entryFee > 0 ? '#FF6B00' : '#00FF88' },
                { icon: Calendar, label: 'Start Date', value: tournament.start_date ? new Date(tournament.start_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'TBD', color: '#00F5FF' },
              ].map(item => (
                <div key={item.label} className={styles.info_row}>
                  <IconTile icon={item.icon} color={item.color} size={14} tileSize={30} radius={7} />
                  <div>
                    <div className={styles.info_label}>{item.label}</div>
                    <div className={styles.info_val} style={{ color: item.color }}>{item.value}</div>
                  </div>
                </div>
              ))}

              <div className={styles.fill_wrap}>
                <div className={styles.fill_label}>
                  <span>Slots filled</span>
                  <span style={{ color: isFull ? '#FF006E' : color }}>{Math.round(fillPct)}%</span>
                </div>
                <div className={styles.fill_track}>
                  <div className={styles.fill_bar} style={{ width: `${fillPct}%`, background: isFull ? '#FF006E' : color }} />
                </div>
              </div>

              {renderPanel()}

              {isOrganizer && (
                <Link href={`/tournaments/${tournament.id}/manage`} className={styles.manage_btn}>
                  <Shield size={14} strokeWidth={2} /> Manage Tournament
                </Link>
              )}
              {tournament.challonge_url && (
                <a href={tournament.challonge_url} target="_blank" rel="noreferrer" className={styles.challonge_btn}>
                  <ExternalLink size={14} strokeWidth={2} /> View Bracket
                </a>
              )}
            </div>
          </div>
        </div>

        <div className={styles.body}>
          <div className={styles.section}>
            <h2 className={styles.section__title}>
              <IconTile icon={Users} color="#00F5FF" size={14} tileSize={28} radius={7} />
              Registered Teams ({approved.length})
            </h2>
            {approved.length === 0 ? (
              <div className={styles.empty}>
                <Users size={32} color="#8892A4" strokeWidth={1.5} />
                <p>No teams registered yet. Be the first!</p>
              </div>
            ) : (
              <div className={styles.teams_grid}>
                {approved.map((r, i) => (
                  <div key={r.id} className={styles.team_card}>
                    <div className={styles.team_card__num}>{i + 1}</div>
                    <div className={styles.team_card__avatar}>
                      {r.avatar ? <img src={getImageUrl(r.avatar)} alt={r.username} /> : <Gamepad2 size={16} color="#8892A4" strokeWidth={1.75} />}
                    </div>
                    <div className={styles.team_card__info}>
                      <div className={styles.team_card__name}>{r.team_name || r.full_name || r.username}</div>
                      <div className={styles.team_card__user}>@{r.username}</div>
                    </div>
                    <CheckCircle size={14} color="#00FF88" strokeWidth={2} style={{ marginLeft: 'auto', flexShrink: 0 }} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {tournament.rules && (
            <div className={styles.section}>
              <h2 className={styles.section__title}>
                <IconTile icon={Shield} color="#8B00FF" size={14} tileSize={28} radius={7} />
                Rules & Regulations
              </h2>
              <pre className={styles.rules}>{tournament.rules}</pre>
            </div>
          )}

          {tournament.challonge_url && (
            <div className={styles.section}>
              <h2 className={styles.section__title}>
                <IconTile icon={Trophy} color="#FFD700" size={14} tileSize={28} radius={7} />
                Live Bracket
              </h2>
              <iframe src={`${tournament.challonge_url}/module`} width="100%" height="500"
                frameBorder="0" scrolling="auto" 
                className={styles.bracket_iframe} title="Bracket" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}