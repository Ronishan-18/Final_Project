import React, { useState, useEffect } from 'react';
import { RefreshCw, PlayCircle, PlusCircle, CheckCircle, Trophy, Crosshair, Users } from 'lucide-react';
import api from '../../../../../lib/api';
import styles from '../manage.module.scss'; // Assuming we re-use some styles, or we can use inline styles for the table

export default function BRScoreboard({ tournamentId, approvedRegistrations, showToast, isOngoing, isCompleted }: any) {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [activeMatchId, setActiveMatchId] = useState<number | null>(null);

  // States for input per match
  const [inputs, setInputs] = useState<Record<number, Record<number, { kills: number, placement: number }>>>({});

  useEffect(() => {
    fetchMatches();
  }, [tournamentId]);

  const fetchMatches = async () => {
    try {
      const res = await api.get(`/br/${tournamentId}/matches`);
      setMatches(res.data.matches);
      if (res.data.matches.length > 0) {
        setActiveMatchId(res.data.matches[0].id);
      }
    } catch {
      showToast('Failed to load BR matches', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMatch = async () => {
    setActionLoading('create');
    try {
      const res = await api.post(`/br/${tournamentId}/matches`, { map_name: 'Custom Server' });
      showToast(res.data.message, 'success');
      fetchMatches();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to create match', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSaveResults = async (matchId: number) => {
    const matchInputs = inputs[matchId];
    if (!matchInputs) {
      showToast('No inputs to save.', 'error');
      return;
    }
    
    setActionLoading(`save_${matchId}`);
    try {
      const payload = Object.entries(matchInputs).map(([teamId, data]) => ({
        team_id: Number(teamId),
        kills: data.kills,
        placement: data.placement
      }));

      const res = await api.post(`/br/matches/${matchId}/results`, { results: payload });
      showToast(res.data.message, 'success');
      fetchMatches();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to save results', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleInputChange = (matchId: number, teamId: number, field: 'kills' | 'placement', value: string) => {
    setInputs(prev => ({
      ...prev,
      [matchId]: {
        ...(prev[matchId] || {}),
        [teamId]: {
          ...(prev[matchId]?.[teamId] || { kills: 0, placement: 0 }),
          [field]: Number(value)
        }
      }
    }));
  };

  if (!isOngoing && !isCompleted) return (
    <div className={styles.empty}>
      <PlayCircle size={36} color="#8892A4" strokeWidth={1.5} />
      <p>Start the tournament to begin scoring BR matches</p>
    </div>
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h3 style={{ color: 'white', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Trophy size={18} color="#FFD700" /> Battle Royale Scoreboard
        </h3>
        <button 
          onClick={handleCreateMatch} 
          disabled={actionLoading === 'create' || isCompleted}
          style={{ 
            background: 'linear-gradient(135deg, #00F5FF, #8B00FF)', 
            border: 'none', 
            padding: '8px 16px', 
            borderRadius: 6, 
            color: 'black', 
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6
          }}
        >
          {actionLoading === 'create' ? <RefreshCw size={14} className={styles.spin} /> : <PlusCircle size={14} />}
          Add New Match
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', color: '#8892A4', padding: '40px 0' }}>Loading matches...</div>
      ) : matches.length === 0 ? (
        <div className={styles.empty}>
          <p>No matches added yet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 20 }}>
          {/* Sidebar */}
          <div style={{ width: 200, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {matches.map(m => (
              <button
                key={m.id}
                onClick={() => setActiveMatchId(m.id)}
                style={{
                  background: activeMatchId === m.id ? 'rgba(0,245,255,0.1)' : 'rgba(255,255,255,0.03)',
                  border: activeMatchId === m.id ? '1px solid rgba(0,245,255,0.5)' : '1px solid rgba(255,255,255,0.1)',
                  color: activeMatchId === m.id ? '#00F5FF' : 'white',
                  padding: '12px 16px',
                  borderRadius: 8,
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}
              >
                <span>Round {m.match_number}</span>
                {m.status === 'completed' && <CheckCircle size={14} color="#00FF88" />}
              </button>
            ))}
          </div>

          {/* Active Match Editor */}
          <div style={{ flex: 1, background: 'rgba(20,22,30,0.5)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 20 }}>
            {activeMatchId && (
              <>
                <div style={{ marginBottom: 20, color: '#8892A4', fontSize: 13 }}>
                  Input the kills and placement rank for each team in this match. Standard competitive placement points will automatically be calculated and added to the kill points.
                </div>
                
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#8892A4', textAlign: 'left' }}>
                      <th style={{ padding: '0 0 10px 0', fontWeight: 600 }}><Users size={12} /> Team</th>
                      <th style={{ padding: '0 0 10px 0', fontWeight: 600 }}><Crosshair size={12} /> Kills</th>
                      <th style={{ padding: '0 0 10px 0', fontWeight: 600 }}><Trophy size={12} /> Rank/Placement</th>
                    </tr>
                  </thead>
                  <tbody>
                    {approvedRegistrations.map((reg: any) => {
                      const tId = reg.team_id || reg.id;
                      return (
                        <tr key={tId} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <td style={{ padding: '12px 0', color: 'white', fontWeight: 600 }}>
                            {reg.team_name || reg.full_name}
                          </td>
                          <td style={{ padding: '12px 0' }}>
                           <input 
                              type="number" min="0" placeholder="0" 
                              value={inputs[activeMatchId]?.[tId]?.kills ?? ''}
                              onChange={e => handleInputChange(activeMatchId, tId, 'kills', e.target.value)}
                              style={{ width: 80, background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '6px 10px', borderRadius: 4 }}
                            />
                          </td>
                          <td style={{ padding: '12px 0' }}>
                           <input 
                              type="number" min="1" max="16" placeholder="#" 
                              value={inputs[activeMatchId]?.[tId]?.placement ?? ''}
                              onChange={e => handleInputChange(activeMatchId, tId, 'placement', e.target.value)}
                              style={{ width: 80, background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '6px 10px', borderRadius: 4 }}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
                  <button 
                    onClick={() => handleSaveResults(activeMatchId)}
                    disabled={actionLoading === `save_${activeMatchId}`}
                    style={{ 
                      background: 'rgba(0,255,136,0.15)', border: '1px solid rgba(0,255,136,0.3)', color: '#00FF88', 
                      padding: '8px 24px', borderRadius: 6, fontWeight: 700, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 6
                    }}
                  >
                    {actionLoading === `save_${activeMatchId}` ? <RefreshCw size={14} className={styles.spin} /> : <CheckCircle size={14} />}
                    Save Results for Round
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
