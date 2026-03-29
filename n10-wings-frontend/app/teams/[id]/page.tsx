'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Users, Gamepad2, Crown } from 'lucide-react';
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

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const res = await api.get(`/teams/${id}`);
      if (res.data.success) {
        setTeam(res.data.team);
        setMembers(res.data.members);
      }
    } catch {
      router.push('/teams');
    } finally {
      setLoading(false);
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
        </div>

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
                    {member.role === 'leader' && <Crown size={12} color="#FFD700" title="Captain" />}
                  </div>
                  <div style={{ color: '#8892A4', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    @{member.username} {member.player_rank && <span style={{ background: '#1A1A24', padding: '2px 6px', borderRadius: '4px', fontSize: '10px' }}>{member.player_rank}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
