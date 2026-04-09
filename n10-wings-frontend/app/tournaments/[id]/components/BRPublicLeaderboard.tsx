import React, { useState, useEffect } from 'react';
import { Trophy, Users, Crosshair, Crown } from 'lucide-react';
import api from '../../../../lib/api';
import { getImageUrl } from '../../../../lib/urlHelper';

export default function BRPublicLeaderboard({ tournamentId }: { tournamentId: string | number }) {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await api.get(`/br/${tournamentId}/leaderboard`);
        setLeaderboard(res.data.leaderboard);
      } catch (err) {
        console.error('Failed to load BR leaderboard');
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, [tournamentId]);

  if (loading) return <div style={{ color: '#8892A4', padding: '20px 0' }}>Loading live standings...</div>;

  if (leaderboard.length === 0) return (
    <div style={{ color: '#8892A4', padding: '20px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
      <Trophy size={18} /> No matches played yet. The leaderboard will appear once the first match completes.
    </div>
  );

  return (
    <div style={{ background: 'rgba(20,22,30,0.5)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <th style={{ padding: '12px 16px', color: '#8892A4', fontWeight: 600, width: 60 }}>#</th>
            <th style={{ padding: '12px 16px', color: '#8892A4', fontWeight: 600 }}>Team</th>
            <th style={{ padding: '12px 16px', color: '#8892A4', fontWeight: 600 }}>Matches</th>
            <th style={{ padding: '12px 16px', color: '#8892A4', fontWeight: 600 }}><Crosshair size={14} style={{display:'inline', verticalAlign:'middle'}}/> Kills</th>
            <th style={{ padding: '12px 16px', color: '#8892A4', fontWeight: 600 }}><Users size={14} style={{display:'inline', verticalAlign:'middle'}}/> Placement Pts</th>
            <th style={{ padding: '12px 16px', color: '#FFD700', fontWeight: 700 }}><Trophy size={14} style={{display:'inline', verticalAlign:'middle'}}/> Total Score</th>
          </tr>
        </thead>
        <tbody>
          {leaderboard.map((team, idx) => (
            <tr key={team.team_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <td style={{ padding: '16px', fontWeight: 700, color: idx === 0 ? '#FFD700' : idx === 1 ? '#C0C0C0' : idx === 2 ? '#CD7F32' : '#8892A4' }}>
                {idx === 0 ? <Crown size={18} /> : idx + 1}
              </td>
              <td style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: 10, fontWeight: 600, color: 'white' }}>
                {team.team_name} <span style={{ color: '#00F5FF', fontSize: 12, padding: '2px 6px', background: 'rgba(0,245,255,0.1)', borderRadius: 4 }}>{team.team_tag}</span>
              </td>
              <td style={{ padding: '16px', color: 'white' }}>{team.matches_played}</td>
              <td style={{ padding: '16px', color: 'white' }}>{team.total_kills}</td>
              <td style={{ padding: '16px', color: 'white' }}>{team.total_placement_points}</td>
              <td style={{ padding: '16px', color: '#FFD700', fontWeight: 800, fontSize: 16 }}>{team.grand_total}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
