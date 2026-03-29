'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Users, Plus, Trophy, Gamepad2, Shield,
  UserMinus, Mail, CheckCircle, XCircle,
  ArrowLeft, Crown, Zap, ChevronRight, Search
} from 'lucide-react';
import IconTile from '../../../components/IconTile';
import api from '../../../lib/api';
import styles from './myteam.module.scss';

interface Team { team_id: number; name: string; tag: string; game: string; description?: string; logo?: string; leader_id: number; }
interface Member { id: number; user_id: number; username: string; full_name?: string; avatar?: string; country?: string; player_rank?: string; role: string; status: string; joined_at: string; }
interface Invitation { member_id: number; team_id: number; name: string; tag: string; game: string; leader_username: string; leader_name?: string; }

export default function MyTeamPage() {
  const router = useRouter();
  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteUsername, setInviteUsername] = useState('');
  const [inviting, setInviting] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | string | null>(null);
  const [toast, setToast] = useState('');
  const [myUserId, setMyUserId] = useState<number | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }
    fetchAll();
    fetchMyId();
  }, []);

  const fetchMyId = async () => {
    try {
      const res = await api.get('/auth/me');
      setMyUserId(res.data.user?.id);
    } catch {}
  };

  const fetchAll = async () => {
    try {
      const [teamRes, invRes] = await Promise.all([
        api.get('/teams/my'),
        api.get('/teams/invitations'),
      ]);
      if (teamRes.data.team) {
        setTeam(teamRes.data.team);
        setMembers(teamRes.data.members || []);
      }
      setInvitations(invRes.data.invitations || []);
    } catch {}
    finally { setLoading(false); }
  };

  const handleInvite = async () => {
    if (!inviteUsername.trim()) return;
    setInviting(true);
    try {
      await api.post(`/teams/${team?.team_id}/invite`, { username: inviteUsername });
      showToast(`Invitation sent to ${inviteUsername}!`);
      setInviteUsername('');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to invite!');
    } finally { setInviting(false); }
  };

  const handleKick = async (memberId: number, username: string) => {
    if (!confirm(`Remove ${username} from the team?`)) return;
    setActionLoading(memberId);
    try {
      await api.delete(`/teams/${team?.team_id}/members/${memberId}`);
      showToast(`${username} removed!`);
      setMembers(prev => prev.filter(m => m.id !== memberId));
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed!');
    } finally { setActionLoading(null); }
  };

  const handleLeave = async (memberId: number) => {
    if (!confirm('Leave this team?')) return;
    setActionLoading('leave');
    try {
      await api.delete(`/teams/${team?.team_id}/members/${memberId}`);
      showToast('You left the team.');
      setTeam(null);
      setMembers([]);
    } catch { showToast('Failed!'); }
    finally { setActionLoading(null); }
  };

  const handleInvitationResponse = async (inv: Invitation, action: 'accept' | 'decline') => {
    setActionLoading(inv.member_id);
    try {
      await api.put(`/teams/${inv.team_id}/members/${inv.member_id}`, { action });
      showToast(action === 'accept' ? `Joined ${inv.name}!` : 'Invitation declined.');
      setInvitations(prev => prev.filter(i => i.member_id !== inv.member_id));
      if (action === 'accept') await fetchAll();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed!');
    } finally { setActionLoading(null); }
  };

  if (loading) return (
    <div className={styles.loading}><div className={styles.spinner} /></div>
  );

  const isLeader = team && members.find(m => m.user_id === myUserId)?.role === 'leader';
  const myMembership = members.find(m => m.user_id === myUserId);

  return (
    <div className={styles.page}>
      {toast && <div className={styles.toast}>{toast}</div>}
      <div className="container">

        <div className={styles.header}>
          <Link href="/dashboard" className={styles.back}>
            <ArrowLeft size={15} strokeWidth={2} /> Dashboard
          </Link>
          <div>
            <h1 className={styles.title}>My Team</h1>
            <p className={styles.sub}>Manage your team and participate in tournaments</p>
          </div>
          {!team && (
            <Link href="/teams/create" className={styles.create_btn}>
              <Plus size={16} strokeWidth={2.5} /> Create Team
            </Link>
          )}
        </div>

        {/* Pending Invitations */}
        {invitations.length > 0 && (
          <div className={styles.invites_section}>
            <h2 className={styles.invites_title}>
              <Mail size={16} color="#FFD700" strokeWidth={2} style={{ marginRight: 8 }} />
              Team Invitations ({invitations.length})
            </h2>
            <div className={styles.invites_list}>
              {invitations.map(inv => (
                <div key={inv.member_id} className={styles.invite_card}>
                  <div className={styles.invite_card__info}>
                    <span className={styles.invite_card__team}>[{inv.tag}] {inv.name}</span>
                    <span className={styles.invite_card__game}>
                      <Gamepad2 size={12} strokeWidth={1.75} style={{ display: 'inline', marginRight: 4 }} />{inv.game}
                    </span>
                    <span className={styles.invite_card__from}>from @{inv.leader_username}</span>
                  </div>
                  <div className={styles.invite_card__actions}>
                    <button
                      className={styles.accept_btn}
                      onClick={() => handleInvitationResponse(inv, 'accept')}
                      disabled={actionLoading === inv.member_id}
                    >
                      <CheckCircle size={13} strokeWidth={2} /> Accept
                    </button>
                    <button
                      className={styles.decline_btn}
                      onClick={() => handleInvitationResponse(inv, 'decline')}
                      disabled={actionLoading === inv.member_id}
                    >
                      <XCircle size={13} strokeWidth={2} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No team state */}
        {!team && invitations.length === 0 && (
          <div className={styles.no_team}>
            <IconTile icon={Users} color="#8892A4" size={32} tileSize={72} radius={18} />
            <h2 className={styles.no_team__title}>You're not in a team yet</h2>
            <p className={styles.no_team__sub}>Create your own team or wait for an invitation from a team leader</p>
            <div className={styles.no_team__actions}>
              <Link href="/teams/create" className={styles.create_btn}>
                <Plus size={16} strokeWidth={2.5} /> Create a Team
              </Link>
              <Link href="/teams" className={styles.browse_btn}>
                <Search size={15} strokeWidth={2} /> Browse Teams
              </Link>
            </div>
          </div>
        )}

        {/* Team card */}
        {team && (
          <div className={styles.team_hero}>
            <div className={styles.team_hero__avatar}>
              {team.logo ? <img src={team.logo} alt={team.name} /> : <Gamepad2 size={32} color="#00F5FF" strokeWidth={1.75} />}
            </div>
            <div className={styles.team_hero__info}>
              <div className={styles.team_hero__tag}>[{team.tag}]</div>
              <h2 className={styles.team_hero__name}>{team.name}</h2>
              <div className={styles.team_hero__game}>
                <Gamepad2 size={13} strokeWidth={1.75} style={{ marginRight: 4 }} />{team.game}
              </div>
              {team.description && <p className={styles.team_hero__desc}>{team.description}</p>}
            </div>
            <div className={styles.team_hero__stats}>
              <div className={styles.team_stat}>
                <span className={styles.team_stat__val} style={{ color: '#00F5FF' }}>{members.filter(m => m.status === 'approved').length}</span>
                <span className={styles.team_stat__label}>Members</span>
              </div>
            </div>
          </div>
        )}

        {/* Invite box (leader only) */}
        {team && isLeader && (
          <div className={styles.invite_box}>
            <h3 className={styles.invite_box__title}>
              <Crown size={15} color="#FFD700" strokeWidth={2} style={{ marginRight: 6 }} />
              Invite Player
            </h3>
            <div className={styles.invite_box__row}>
              <input
                className={styles.invite_box__input}
                placeholder="Enter player username..."
                value={inviteUsername}
                onChange={e => setInviteUsername(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleInvite()}
              />
              <button className={styles.invite_box__btn} onClick={handleInvite} disabled={inviting}>
                {inviting ? 'Sending...' : <><Mail size={14} strokeWidth={2} /> Invite</>}
              </button>
            </div>
          </div>
        )}

        {/* Roster */}
        {team && members.length > 0 && (
          <div className={styles.roster}>
            <h3 className={styles.roster__title}>
              <IconTile icon={Users} color="#00F5FF" size={13} tileSize={26} radius={6} />
              <span>Roster ({members.filter(m => m.status === 'approved').length} members)</span>
            </h3>
            <div className={styles.roster__list}>
              {members.filter(m => m.status === 'approved').map(member => (
                <div key={member.id} className={styles.member_card}>
                  <div className={styles.member_card__avatar}>
                    {member.avatar ? <img src={member.avatar} alt={member.username} /> : <Gamepad2 size={18} color="#8892A4" strokeWidth={1.75} />}
                  </div>
                  <div className={styles.member_card__info}>
                    <div className={styles.member_card__name}>
                      {member.full_name || member.username}
                      {member.role === 'leader' && (
                        <span className={styles.leader_badge}><Crown size={11} strokeWidth={2} /> Captain</span>
                      )}
                    </div>
                    <div className={styles.member_card__sub}>
                      @{member.username}
                      {member.player_rank && <span className={styles.rank_badge}>{member.player_rank}</span>}
                    </div>
                  </div>
                  {/* Actions */}
                  {member.role !== 'leader' && (
                    <>
                      {isLeader && (
                        <button
                          className={styles.kick_btn}
                          onClick={() => handleKick(member.id, member.username)}
                          disabled={actionLoading === member.id}
                          title="Remove from team"
                        >
                          <UserMinus size={14} strokeWidth={2} />
                        </button>
                      )}
                      {member.user_id === myUserId && !isLeader && (
                        <button
                          className={styles.leave_btn}
                          onClick={() => handleLeave(member.id)}
                          disabled={actionLoading === 'leave'}
                        >
                          Leave
                        </button>
                      )}
                    </>
                  )}
                </div>
              ))}

              {/* Pending invites shown in roster */}
              {members.filter(m => m.status === 'pending').map(member => (
                <div key={member.id} className={`${styles.member_card} ${styles['member_card--pending']}`}>
                  <div className={styles.member_card__avatar}>
                    {member.avatar ? <img src={member.avatar} alt={member.username} /> : <Gamepad2 size={18} color="#8892A4" strokeWidth={1.75} />}
                  </div>
                  <div className={styles.member_card__info}>
                    <div className={styles.member_card__name}>{member.full_name || member.username}</div>
                    <div className={styles.member_card__sub}>@{member.username} · Invitation pending</div>
                  </div>
                  <span className={styles.pending_label}>Pending</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Register for tournament CTA */}
        {team && isLeader && (
          <div className={styles.tournament_cta}>
            <IconTile icon={Trophy} color="#FFD700" size={22} tileSize={50} radius={12} />
            <div>
              <h3 className={styles.tournament_cta__title}>Ready to compete?</h3>
              <p className={styles.tournament_cta__sub}>As team captain, you can register your team for open tournaments</p>
            </div>
            <Link href="/tournaments" className={styles.tournament_cta__btn}>
              Browse Tournaments <ChevronRight size={14} strokeWidth={2.5} />
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}