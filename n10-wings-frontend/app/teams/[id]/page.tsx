'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Users, Gamepad2, Crown, Edit3, X, Save, Check } from 'lucide-react';
import IconTile from '../../../components/IconTile';
import api from '../../../lib/api';
import styles from './team.module.scss'; // Reuse or create basic styles

interface Team {
  id: number;
  name: string;
  tag: string;
  game: string;
  description?: string;
  logo?: string;
  leader_username: string;
  leader_name?: string;
}

interface Member {
  id: number;
  user_id: number;
  username: string;
  full_name?: string;
  avatar?: string;
  player_rank?: string;
  role: string;
}

export default function TeamDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  const [user, setUser] = useState<{ id: number; username: string } | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editData, setEditData] = useState({ name: '', tag: '', description: '' });

  const [joinRequests, setJoinRequests] = useState<any[]>([]);
  const [requestActionLoading, setRequestActionLoading] = useState<number | null>(null);
  const [hasRequested, setHasRequested] = useState(false);
  const [requestLoading, setRequestLoading] = useState(false);

  const [inviteUsername, setInviteUsername] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);

  useEffect(() => {
    fetchData();
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        setUser(JSON.parse(userStr));
      } catch (e) {}
    }
  }, [id]);

  useEffect(() => {
    if (user && team) {
      if (user.username === team.leader_username) {
        const fetchRequests = async () => {
          try {
            const token = localStorage.getItem('token');
            const res = await api.get(`/teams/${team.id}/requests`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
              setJoinRequests(res.data.requests);
            }
          } catch (e) {}
        };
        fetchRequests();
      }
    }
  }, [user, team]);

  const fetchData = async () => {
    try {
      const res = await api.get(`/teams/${id}`);
      if (res.data.success) {
        setTeam(res.data.team);
        setMembers(res.data.members);
        setEditData({
          name: res.data.team.name,
          tag: res.data.team.tag,
          description: res.data.team.description || ''
        });
      }
    } catch {
      router.push('/teams');
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      // Set the token if needed by the api interceptor, but usually logic handles it. However to be safe:
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      
      const res = await api.put(`/teams/${id}`, editData, config);
      if (res.data.success) {
        setTeam(prev => prev ? { ...prev, ...editData, tag: editData.tag.toUpperCase() } : null);
        setIsEditing(false);
      } else {
        alert(res.data.message || 'Failed to update team');
      }
    } catch (error: any) {
      console.error('Update team error:', error);
      alert(error.response?.data?.message || 'Failed to update team');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestToJoin = async () => {
    setRequestLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await api.post(`/teams/${team?.id}/request-join`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setHasRequested(true);
        alert(res.data.message);
      }
    } catch (e: any) {
      alert(e.response?.data?.message || 'Failed to send request');
      if (e.response?.data?.message === 'Join request already sent!') {
        setHasRequested(true);
      }
    } finally {
      setRequestLoading(false);
    }
  };

  const handleRequestAction = async (requestId: number, action: 'accept' | 'decline') => {
    setRequestActionLoading(requestId);
    try {
      const token = localStorage.getItem('token');
      const res = await api.put(`/teams/${team?.id}/requests/${requestId}`, { action }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setJoinRequests(prev => prev.filter(req => req.request_id !== requestId));
        if (action === 'accept') {
          fetchData(); 
        }
      }
    } catch (e: any) {
      alert(e.response?.data?.message || `Failed to ${action} request`);
    } finally {
      setRequestActionLoading(null);
    }
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteUsername) return;
    setInviteLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await api.post(`/teams/${team?.id}/invite`, { username: inviteUsername }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setInviteUsername('');
        alert(res.data.message || 'Invitation sent successfully!');
      }
    } catch (e: any) {
      alert(e.response?.data?.message || 'Failed to send invitation');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRemoveMember = async (userId: number) => {
    if (!window.confirm('Are you sure you want to remove this member?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await api.delete(`/teams/${id}/members/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setMembers(prev => prev.filter(m => m.user_id !== userId));
        alert('Member removed successfully');
      }
    } catch (e: any) {
      alert(e.response?.data?.message || 'Failed to remove member');
    }
  };

  const handleDeleteTeam = async () => {
    if (!window.confirm('CRITICAL: Are you sure you want to delete this team? This action cannot be undone.')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await api.delete(`/teams/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        alert('Team deleted successfully');
        router.push('/teams');
      }
    } catch (e: any) {
      alert(e.response?.data?.message || 'Failed to delete team');
    }
  };

  if (loading) return (
    <div style={{ padding: '8rem 0', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '40px', height: '40px', border: '3px solid rgba(0,245,255,0.15)', borderTopColor: '#00F5FF', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
    </div>
  );

  if (!team) return null;

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0F', padding: '4rem 0' }}>
      <div className="container" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <Link href="/teams" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#8892A4', textDecoration: 'none', marginBottom: '2rem', fontSize: '14px' }}>
          <ArrowLeft size={16} /> Back to Teams
        </Link>

        {/* Hero */}
        <div style={{ background: '#12121A', padding: '2rem', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexWrap: 'wrap', gap: '2rem', alignItems: 'center' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '16px', background: '#0A0A0F', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden' }}>
            {team.logo ? <img src={team.logo} alt={team.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Gamepad2 size={40} color="#00F5FF" strokeWidth={1.5} />}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontFamily: '"Orbitron", sans-serif', color: '#00F5FF', background: 'rgba(0, 245, 255, 0.1)', padding: '2px 8px', borderRadius: '4px', fontSize: '12px' }}>[{team.tag}]</span>
              <span style={{ color: '#8892A4', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}><Gamepad2 size={12} /> {team.game}</span>
            </div>
            <h1 style={{ margin: 0, color: '#fff', fontSize: '24px', fontFamily: '"Orbitron", sans-serif' }}>{team.name}</h1>
            {team.description && <p style={{ color: '#8892A4', fontSize: '14px', marginTop: '8px', lineHeight: '1.6' }}>{team.description}</p>}
          </div>

          {user && user.username === team.leader_username ? (
            <div>
              <button 
                onClick={() => setIsEditing(true)}
                style={{ 
                  background: 'rgba(0, 245, 255, 0.1)', 
                  color: '#00F5FF', 
                  border: '1px solid rgba(0, 245, 255, 0.2)', 
                  padding: '10px 16px', 
                  borderRadius: '10px', 
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'rgba(0, 245, 255, 0.2)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'rgba(0, 245, 255, 0.1)';
                }}
              >
                <Edit3 size={16} /> Edit Team
              </button>
            </div>
          ) : user && !members.some(m => m.user_id === user.id) ? (
            <div>
              <button 
                onClick={handleRequestToJoin}
                disabled={requestLoading || hasRequested}
                style={{ 
                  background: hasRequested ? 'rgba(255, 255, 255, 0.1)' : '#00F5FF', 
                  color: hasRequested ? '#8892A4' : '#000', 
                  border: 'none', 
                  padding: '10px 20px', 
                  borderRadius: '10px', 
                  cursor: hasRequested || requestLoading ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  transition: 'all 0.2s',
                  boxShadow: hasRequested ? 'none' : '0 0 15px rgba(0, 245, 255, 0.4)'
                }}
              >
                {requestLoading ? 'Sending...' : hasRequested ? 'Request Sent' : 'Request to Join'}
              </button>
            </div>
          ) : null}
        </div>

        {/* Join Requests (Owner Only) */}
        {user && user.username === team.leader_username && joinRequests.length > 0 && (
          <div style={{ marginTop: '2rem', background: '#1A1A24', padding: '2rem', borderRadius: '14px', border: '1px solid rgba(0, 245, 255, 0.3)' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', fontSize: '18px', margin: '0 0 1.5rem 0', fontFamily: '"Orbitron", sans-serif' }}>
              <IconTile icon={Users} color="#FFD700" size={16} tileSize={32} radius={8} /> Pending Join Requests ({joinRequests.length})
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
              {joinRequests.map(req => (
                <div key={req.request_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', background: '#12121A', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#0A0A0F', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                      {req.avatar ? <img src={`http://localhost:5000${req.avatar}`} alt={req.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Gamepad2 size={20} color="#8892A4" />}
                    </div>
                    <div>
                      <Link href={`/profile/${req.user_id}`} style={{ color: '#fff', fontSize: '14px', fontWeight: 'bold', textDecoration: 'none' }}>
                        {req.full_name || req.username}
                      </Link>
                      <div style={{ color: '#8892A4', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        @{req.username} {req.player_rank && <span style={{ background: '#0A0A0F', padding: '2px 6px', borderRadius: '4px', fontSize: '10px' }}>{req.player_rank}</span>}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button 
                      onClick={() => handleRequestAction(req.request_id, 'accept')}
                      disabled={requestActionLoading === req.request_id}
                      style={{ background: 'rgba(0, 255, 136, 0.1)', color: '#00FF88', border: '1px solid rgba(0, 255, 136, 0.2)', padding: '6px', borderRadius: '6px', cursor: 'pointer' }}
                      title="Accept"
                    ><Check size={16} /></button>
                    <button 
                      onClick={() => handleRequestAction(req.request_id, 'decline')}
                      disabled={requestActionLoading === req.request_id}
                      style={{ background: 'rgba(255, 0, 110, 0.1)', color: '#FF006E', border: '1px solid rgba(255, 0, 110, 0.2)', padding: '6px', borderRadius: '6px', cursor: 'pointer' }}
                      title="Decline"
                    ><X size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Invite Player Form */}
        {user && user.username === team.leader_username && (
          <div style={{ marginTop: '2rem', background: '#12121A', padding: '2rem', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <h2 style={{ color: '#fff', fontSize: '18px', margin: '0 0 1rem 0', fontFamily: '"Orbitron", sans-serif', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <IconTile icon={Users} color="#00F5FF" size={16} tileSize={32} radius={8} /> Invite a Player
            </h2>
            <form onSubmit={handleInviteSubmit} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <input 
                type="text" 
                value={inviteUsername} 
                onChange={e => setInviteUsername(e.target.value)} 
                placeholder="Enter player's exact username..." 
                required
                style={{ flex: 1, minWidth: '200px', padding: '0.85rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: '#0A0A0F', color: '#fff', outline: 'none' }}
                onFocus={(e) => e.target.style.borderColor = '#00F5FF'} 
                onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
              <button 
                type="submit" 
                disabled={inviteLoading}
                style={{ background: '#00F5FF', color: '#000', border: 'none', padding: '0 1.5rem', borderRadius: '8px', fontWeight: 'bold', cursor: inviteLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px', opacity: inviteLoading ? 0.7 : 1 }}
              >
                {inviteLoading ? 'Sending...' : 'Send Invite'}
              </button>
            </form>
          </div>
        )}

        {/* Roster */}
        <div style={{ marginTop: '2rem', background: '#12121A', padding: '2rem', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.06)' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', fontSize: '18px', margin: '0 0 1.5rem 0', fontFamily: '"Orbitron", sans-serif' }}>
            <IconTile icon={Users} color="#00F5FF" size={16} tileSize={32} radius={8} /> Active Roster ({members.length})
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
            {members.map(member => (
              <div key={member.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#0A0A0F', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#12121A', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {member.avatar ? <img src={`http://localhost:5000${member.avatar}`} alt={member.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Gamepad2 size={20} color="#8892A4" />}
                </div>
                  <div>
                    <div style={{ color: '#fff', fontSize: '14px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {member.full_name || member.username}
                      {member.role === 'leader' && <span title="Captain"><Crown size={12} color="#FFD700" /></span>}
                    </div>
                    <div style={{ color: '#8892A4', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      @{member.username} {member.player_rank && <span style={{ background: '#1A1A24', padding: '2px 6px', borderRadius: '4px', fontSize: '10px' }}>{member.player_rank}</span>}
                    </div>
                  </div>
                  {user && user.username === team.leader_username && member.role !== 'leader' && (
                    <button 
                      onClick={() => handleRemoveMember(member.user_id)}
                      style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: '#FF006E', cursor: 'pointer', padding: '4px', opacity: 0.6 }}
                      title="Remove Member"
                      onMouseOver={(e) => e.currentTarget.style.opacity = '1'}
                      onMouseOut={(e) => e.currentTarget.style.opacity = '0.6'}
                    >
                      <X size={16} />
                    </button>
                  )}
              </div>
            ))}
          </div>
        </div>

        {/* Edit Modal Overlay */}
        {isEditing && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backdropFilter: 'blur(4px)' }}>
            <div style={{ background: '#12121A', padding: '2rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)', width: '100%', maxWidth: '500px', boxShadow: '0 20px 40px rgba(0,0,0,0.4)', position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ margin: 0, color: '#fff', fontSize: '20px', fontFamily: '"Orbitron", sans-serif' }}>Edit Team Info</h3>
                <button onClick={() => setIsEditing(false)} style={{ background: 'transparent', border: 'none', color: '#8892A4', cursor: 'pointer', display: 'flex' }}><X size={24} /></button>
              </div>
              <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                <div>
                  <label style={{ display: 'block', color: '#8892A4', marginBottom: '0.5rem', fontSize: '14px' }}>Team Name</label>
                  <input required type="text" value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} style={{ width: '100%', padding: '0.85rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: '#0A0A0F', color: '#fff', outline: 'none', fontSize: '14px', boxSizing: 'border-box' }} onFocus={(e) => e.target.style.borderColor = '#00F5FF'} onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                </div>
                <div>
                  <label style={{ display: 'block', color: '#8892A4', marginBottom: '0.5rem', fontSize: '14px' }}>Tag (Max 6 chars)</label>
                  <input required type="text" maxLength={6} value={editData.tag} onChange={e => setEditData({...editData, tag: e.target.value})} style={{ width: '100%', padding: '0.85rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: '#0A0A0F', color: '#fff', outline: 'none', fontSize: '14px', textTransform: 'uppercase', boxSizing: 'border-box' }} onFocus={(e) => e.target.style.borderColor = '#00F5FF'} onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                </div>
                <div>
                  <label style={{ display: 'block', color: '#8892A4', marginBottom: '0.5rem', fontSize: '14px' }}>Description</label>
                  <textarea rows={4} value={editData.description} onChange={e => setEditData({...editData, description: e.target.value})} style={{ width: '100%', padding: '0.85rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: '#0A0A0F', color: '#fff', resize: 'vertical', outline: 'none', fontSize: '14px', boxSizing: 'border-box', fontFamily: 'inherit' }} onFocus={(e) => e.target.style.borderColor = '#00F5FF'} onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                  <button 
                    type="button" 
                    onClick={handleDeleteTeam}
                    style={{ background: 'rgba(255, 0, 110, 0.1)', color: '#FF006E', border: '1px solid rgba(255, 0, 110, 0.2)', padding: '0.75rem 1rem', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}
                  >
                    Delete Team
                  </button>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <button type="button" onClick={() => setIsEditing(false)} style={{ background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', padding: '0.75rem 1.5rem', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }} onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>Cancel</button>
                    <button type="submit" disabled={isSubmitting} style={{ background: '#00F5FF', color: '#000', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', fontWeight: 'bold', cursor: isSubmitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px', opacity: isSubmitting ? 0.7 : 1 }} onMouseOver={(e) => !isSubmitting && (e.currentTarget.style.boxShadow = '0 0 15px rgba(0, 245, 255, 0.4)')} onMouseOut={(e) => !isSubmitting && (e.currentTarget.style.boxShadow = 'none')}>
                      {isSubmitting ? 'Saving...' : <><Save size={18} /> Save</>}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
