'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Trophy, Users, Zap, Calendar, Gamepad2,
  ExternalLink, CheckCircle, Clock, Shield, ChevronRight
} from 'lucide-react';
import IconTile from '../../../components/IconTile';
import api from '../../../lib/api';
import styles from './tournament.module.scss';

interface Tournament {
  id: number; title: string; game: string; status: string; description?: string; rules?: string;
  prize_pool: number; max_teams: number; entry_fee: number; start_date: string; end_date: string;
  tournament_type: string; organizer_username: string; organizer_name: string;
  challonge_url?: string; challonge_id?: string;
}
interface Registration {
  id: number; username: string; full_name?: string; avatar?: string; team_name?: string; status: string;
}

const STATUS_COLOR: Record<string, string> = {
  open: '#00F5FF', ongoing: '#00FF88', completed: '#8B00FF', draft: '#8892A4', cancelled: '#FF006E',
};

export default function TournamentDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [toast, setToast] = useState('');
  const [isLeader, setIsLeader] = useState(false);
  const [isOrganizer, setIsOrganizer] = useState(false);
  const [myTeamId, setMyTeamId] = useState<number | null>(null);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  useEffect(() => {
    const orgStatus = localStorage.getItem('is_organizer');
    const role = localStorage.getItem('role');
    setIsOrganizer(orgStatus === 'true' || role === 'admin');
    fetchData();
    checkMyTeam();
  }, [id]);

  const fetchData = async () => {
    try {
      const res = await api.get(`/tournaments/${id}`);
      if (res.data.success) {
        setTournament(res.data.tournament);
        setRegistrations(res.data.registrations);
      }
    } catch { router.push('/tournaments'); }
    finally { setLoading(false); }
  };

  const checkMyTeam = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await api.get('/teams/my');
      if (res.data.team) {
        const isLeaderRole = res.data.members?.find((m: any) => m.user_id === res.data.team.leader_id);
        setIsLeader(true);
        setMyTeamId(res.data.team.team_id);
      }
    } catch {}
  };

  const handleRegister = async () => {
    if (!myTeamId) { showToast('You need a team to register! Create or join one first.'); return; }
    setRegistering(true);
    try {
      const res = await api.post(`/tournaments/${id}/register-team`, { team_id: myTeamId });
      showToast(res.data.message);
      setAlreadyRegistered(true);
      await fetchData();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Registration failed!');
    } finally { setRegistering(false); }
  };

  if (loading) return (
    <div className={styles.loading}><div className={styles.spinner} /></div>
  );
  if (!tournament) return null;

  const approved = registrations.filter(r => r.status === 'approved');
  const fillPct = Math.min((approved.length / tournament.max_teams) * 100, 100);
  const color = STATUS_COLOR[tournament.status] || '#00F5FF';

  return (
    <div className={styles.page}>
      {toast && <div className={styles.toast}>{toast}</div>}
      <div className="container">

        <Link href="/tournaments" className={styles.back}>
          <ArrowLeft size={15} strokeWidth={2} /> All Tournaments
        </Link>

        {/* Hero */}
        <div className={styles.hero} style={{ borderColor: color + '33' }}>
          <div className={styles.hero__left}>
            <div className={styles.hero__badges}>
              <span className={styles.hero__game}>
                <Gamepad2 size={13} strokeWidth={1.75} style={{ marginRight: 4, display: 'inline' }} />{tournament.game}
              </span>
              <span className={styles.hero__status} style={{ color, borderColor: color + '55', background: color + '14' }}>
                {tournament.status === 'ongoing' && <span className={styles.live_dot} />}
                {tournament.status.toUpperCase()}
              </span>
              <span className={styles.hero__type}>{tournament.tournament_type}</span>
            </div>
            <h1 className={styles.hero__title}>{tournament.title}</h1>
            <p className={styles.hero__organizer}>
              Organized by <strong style={{ color }}>{tournament.organizer_name || tournament.organizer_username}</strong>
            </p>
            {tournament.description && (
              <p className={styles.hero__desc}>{tournament.description}</p>
            )}
          </div>

          <div className={styles.hero__right}>
            <div className={styles.info_card}>
              {[
                { icon: Zap, label: 'Prize Pool', value: `LKR ${Number(tournament.prize_pool).toLocaleString()}`, color: '#FFD700' },
                { icon: Users, label: 'Teams', value: `${approved.length} / ${tournament.max_teams}`, color: '#00F5FF' },
                { icon: Trophy, label: 'Entry Fee', value: tournament.entry_fee > 0 ? `LKR ${tournament.entry_fee}` : 'FREE', color: '#00FF88' },
                { icon: Calendar, label: 'Start Date', value: tournament.start_date ? new Date(tournament.start_date).toLocaleDateString() : 'TBD', color: '#8B00FF' },
              ].map(item => (
                <div key={item.label} className={styles.info_row}>
                  <IconTile icon={item.icon} color={item.color} size={14} tileSize={30} radius={7} />
                  <div>
                    <div className={styles.info_label}>{item.label}</div>
                    <div className={styles.info_val} style={{ color: item.color }}>{item.value}</div>
                  </div>
                </div>
              ))}

              {/* Fill bar */}
              <div className={styles.fill_track}>
                <div className={styles.fill_bar} style={{ width: `${fillPct}%`, background: color }} />
              </div>

              {/* CTA */}
              {tournament.status === 'open' && !isOrganizer && (
                <button className={styles.register_btn} onClick={handleRegister} disabled={registering || alreadyRegistered} style={{ background: `linear-gradient(90deg, ${color}, #8B00FF)` }}>
                  {alreadyRegistered ? <><CheckCircle size={15} strokeWidth={2} /> Registered!</> : registering ? 'Registering...' : <><ChevronRight size={15} strokeWidth={2.5} /> Register Team</>}
                </button>
              )}
              {isOrganizer && (
                <Link href={`/tournaments/${tournament.id}/manage`} className={styles.manage_btn}>
                  <Shield size={14} strokeWidth={2} /> Manage Tournament
                </Link>
              )}
              {tournament.challonge_url && (
                <a href={tournament.challonge_url} target="_blank" rel="noreferrer" className={styles.challonge_btn}>
                  <ExternalLink size={14} strokeWidth={2} /> View Bracket on Challonge
                </a>
              )}
            </div>
          </div>
        </div>

        <div className={styles.body}>
          {/* Teams */}
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
                {approved.map(r => (
                  <div key={r.id} className={styles.team_card}>
                    <div className={styles.team_card__avatar}>
                      {r.avatar ? <img src={r.avatar} alt={r.username} /> : <Gamepad2 size={18} color="#8892A4" strokeWidth={1.75} />}
                    </div>
                    <div>
                      <div className={styles.team_card__name}>{r.team_name || r.full_name || r.username}</div>
                      <div className={styles.team_card__user}>@{r.username}</div>
                    </div>
                    <CheckCircle size={14} color="#00FF88" strokeWidth={2} style={{ marginLeft: 'auto' }} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Rules */}
          {tournament.rules && (
            <div className={styles.section}>
              <h2 className={styles.section__title}>
                <IconTile icon={Shield} color="#8B00FF" size={14} tileSize={28} radius={7} />
                Rules & Regulations
              </h2>
              <pre className={styles.rules}>{tournament.rules}</pre>
            </div>
          )}

          {/* Bracket embed */}
          {tournament.challonge_url && (
            <div className={styles.section}>
              <h2 className={styles.section__title}>
                <IconTile icon={Trophy} color="#FFD700" size={14} tileSize={28} radius={7} />
                Live Bracket
              </h2>
              <iframe
                src={`${tournament.challonge_url}/module`}
                width="100%" height="500"
                frameBorder="0" scrolling="auto"
                allowTransparency={true}
                className={styles.bracket_iframe}
                title="Bracket"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}