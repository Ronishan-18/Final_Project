import axios from 'axios';
import 'dotenv/config';

const challonge = axios.create({
  baseURL: 'https://api.challonge.com/v1',
  params: { api_key: process.env.CHALLONGE_API_KEY },
  headers: { 'Content-Type': 'application/json' },
});

export const createChallongeTournament = async ({ name, tournamentType, startAt }) => {
  const url = name.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 50) + '_' + Date.now();
  const res = await challonge.post('/tournaments.json', {
    tournament: {
      name,
      url,
      tournament_type: tournamentType || 'single elimination',
      start_at: startAt,
      open_signup: false,
    }
  });
  return res.data.tournament;
};

export const getChallongeTournament = async (challongeId) => {
  const res = await challonge.get(`/tournaments/${challongeId}.json`, {
    params: { include_participants: 1, include_matches: 1 }
  });
  return res.data.tournament;
};

export const addChallongeParticipant = async (challongeId, name) => {
  const res = await challonge.post(`/tournaments/${challongeId}/participants.json`, {
    participant: { name }
  });
  return res.data.participant;
};

export const removeChallongeParticipant = async (challongeId, participantId) => {
  await challonge.delete(`/tournaments/${challongeId}/participants/${participantId}.json`);
};

export const startChallongeTournament = async (challongeId) => {
  const res = await challonge.post(`/tournaments/${challongeId}/start.json`);
  return res.data.tournament;
};

export const updateChallongeMatch = async (challongeId, matchId, { winnerId, scoresCsv }) => {
  const res = await challonge.put(`/tournaments/${challongeId}/matches/${matchId}.json`, {
    match: { winner_id: winnerId, scores_csv: scoresCsv }
  });
  return res.data.match;
};

export const deleteChallongeTournament = async (challongeId) => {
  await challonge.delete(`/tournaments/${challongeId}.json`);
};