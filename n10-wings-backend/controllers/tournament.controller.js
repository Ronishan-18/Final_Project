import db from '../config/db.js';
import {
  createChallongeTournament,
  getChallongeTournament,
  addChallongeParticipant,
  startChallongeTournament,
  updateChallongeMatch,
  deleteChallongeTournament,
} from '../config/challonge.js';

// ── CREATE TOURNAMENT ──
export const createTournament = async (req, res) => {
  try {
    const { title, game, description, rules, prize_pool, max_teams, entry_fee, start_date, end_date, tournament_type } = req.body;
    if (!title || !game) return res.status(400).json({ success: false, message: 'Title and game are required!' });

    let challongeData = null;
    try {
      challongeData = await createChallongeTournament({ name: title, tournamentType: tournament_type || 'single elimination', startAt: start_date });
    } catch (e) { console.warn('Challonge skip:', e.message); }

    const [result] = await db.query(
      `INSERT INTO tournaments (organizer_id,title,game,description,rules,prize_pool,max_teams,entry_fee,start_date,end_date,tournament_type,status,challonge_id,challonge_url)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,'open',?,?)`,
      [req.user.id, title, game, description||null, rules||null, prize_pool||0, max_teams||16, entry_fee||0, start_date||null, end_date||null, tournament_type||'single elimination', challongeData?.id||null, challongeData?.full_challonge_url||null]
    );

    await db.query('UPDATE organizer_profiles SET tournaments_hosted = tournaments_hosted + 1 WHERE user_id = ?', [req.user.id]).catch(()=>{});

    res.status(201).json({ success: true, message: 'Tournament created!', tournament_id: result.insertId, challonge_url: challongeData?.full_challonge_url || null });
  } catch (error) {
    console.error('Create Tournament Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── GET ALL TOURNAMENTS ──
export const getTournaments = async (req, res) => {
  try {
    const { game, status, search } = req.query;
    let query = `
      SELECT t.*, u.username as organizer_username, p.full_name as organizer_name,
        COUNT(DISTINCT r.id) as registered_teams
      FROM tournaments t
      LEFT JOIN users u ON t.organizer_id = u.id
      LEFT JOIN profiles p ON t.organizer_id = p.user_id
      LEFT JOIN tournament_registrations r ON t.id = r.tournament_id AND r.status = 'approved'
      WHERE 1=1`;
    const params = [];
    if (game) { query += ' AND t.game LIKE ?'; params.push(`%${game}%`); }
    if (status) { query += ' AND t.status = ?'; params.push(status); }
    if (search) { query += ' AND t.title LIKE ?'; params.push(`%${search}%`); }
    query += ' GROUP BY t.id ORDER BY t.created_at DESC';
    const [tournaments] = await db.query(query, params);
    res.status(200).json({ success: true, total: tournaments.length, tournaments });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── GET SINGLE TOURNAMENT ──
export const getTournament = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT t.*, u.username as organizer_username, p.full_name as organizer_name
       FROM tournaments t LEFT JOIN users u ON t.organizer_id = u.id LEFT JOIN profiles p ON t.organizer_id = p.user_id
       WHERE t.id = ?`, [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Not found!' });
    const [registrations] = await db.query(
      `SELECT r.*, u.username, p.full_name, p.avatar FROM tournament_registrations r
       LEFT JOIN users u ON r.user_id = u.id LEFT JOIN profiles p ON r.user_id = p.user_id
       WHERE r.tournament_id = ? ORDER BY r.registered_at DESC`, [req.params.id]);
    const [matches] = await db.query('SELECT * FROM matches WHERE tournament_id = ? ORDER BY round,id', [req.params.id]);
    let challongeBracket = null;
    if (rows[0].challonge_id) { try { challongeBracket = await getChallongeTournament(rows[0].challonge_id); } catch {} }
    res.status(200).json({ success: true, tournament: rows[0], registrations, matches, challongeBracket });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── UPDATE TOURNAMENT ──
export const updateTournament = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query('SELECT id FROM tournaments WHERE id = ? AND organizer_id = ?', [id, req.user.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Not found or unauthorized!' });
    const { title, game, description, rules, prize_pool, max_teams, entry_fee, start_date, end_date, status } = req.body;
    await db.query(
      `UPDATE tournaments SET title=COALESCE(?,title), game=COALESCE(?,game), description=COALESCE(?,description),
       rules=COALESCE(?,rules), prize_pool=COALESCE(?,prize_pool), max_teams=COALESCE(?,max_teams),
       entry_fee=COALESCE(?,entry_fee), start_date=COALESCE(?,start_date), end_date=COALESCE(?,end_date),
       status=COALESCE(?,status) WHERE id=?`,
      [title, game, description, rules, prize_pool, max_teams, entry_fee, start_date, end_date, status, id]);
    res.status(200).json({ success: true, message: 'Tournament updated!' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── DELETE TOURNAMENT ──
export const deleteTournament = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM tournaments WHERE id = ? AND organizer_id = ?', [req.params.id, req.user.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Not found!' });
    if (rows[0].challonge_id) { try { await deleteChallongeTournament(rows[0].challonge_id); } catch {} }
    await db.query('DELETE FROM tournaments WHERE id = ?', [req.params.id]);
    res.status(200).json({ success: true, message: 'Tournament deleted!' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── START TOURNAMENT ──
export const startTournament = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query('SELECT * FROM tournaments WHERE id = ? AND organizer_id = ?', [id, req.user.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Not found!' });
    const [approved] = await db.query(
      `SELECT r.*, u.username, p.full_name FROM tournament_registrations r
       LEFT JOIN users u ON r.user_id = u.id LEFT JOIN profiles p ON r.user_id = p.user_id
       WHERE r.tournament_id = ? AND r.status = 'approved'`, [id]);
    if (approved.length < 2) return res.status(400).json({ success: false, message: 'Need at least 2 approved teams!' });
    if (rows[0].challonge_id) {
      try {
        for (const reg of approved) {
          const name = reg.team_name || reg.full_name || reg.username;
          const p = await addChallongeParticipant(rows[0].challonge_id, name);
          await db.query('UPDATE tournament_registrations SET challonge_participant_id = ? WHERE id = ?', [p.id, reg.id]);
        }
        await startChallongeTournament(rows[0].challonge_id);
      } catch (e) { console.warn('Challonge start skip:', e.message); }
    }
    await db.query("UPDATE tournaments SET status = 'ongoing' WHERE id = ?", [id]);
    res.status(200).json({ success: true, message: 'Tournament started!', challonge_url: rows[0].challonge_url });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── REGISTER FOR TOURNAMENT ──
export const registerForTournament = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query("SELECT * FROM tournaments WHERE id = ? AND status = 'open'", [id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Tournament not open!' });
    const [existing] = await db.query('SELECT id FROM tournament_registrations WHERE tournament_id = ? AND user_id = ?', [id, req.user.id]);
    if (existing.length) return res.status(400).json({ success: false, message: 'Already registered!' });
    const [[{ count }]] = await db.query("SELECT COUNT(*) as count FROM tournament_registrations WHERE tournament_id = ? AND status = 'approved'", [id]);
    if (count >= rows[0].max_teams) return res.status(400).json({ success: false, message: 'Tournament is full!' });
    await db.query('INSERT INTO tournament_registrations (tournament_id, user_id, team_name) VALUES (?, ?, ?)', [id, req.user.id, req.body.team_name || null]);
    res.status(201).json({ success: true, message: 'Registered! Waiting for organizer approval.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── HANDLE REGISTRATION ──
export const handleRegistration = async (req, res) => {
  try {
    const { id, regId } = req.params;
    const { action } = req.body;
    const [rows] = await db.query('SELECT id FROM tournaments WHERE id = ? AND organizer_id = ?', [id, req.user.id]);
    if (!rows.length) return res.status(403).json({ success: false, message: 'Unauthorized!' });
    if (!['approve', 'reject'].includes(action)) return res.status(400).json({ success: false, message: 'Invalid action!' });
    await db.query('UPDATE tournament_registrations SET status = ? WHERE id = ? AND tournament_id = ?', [action === 'approve' ? 'approved' : 'rejected', regId, id]);
    res.status(200).json({ success: true, message: `Registration ${action === 'approve' ? 'approved' : 'rejected'}!` });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── UPDATE MATCH RESULT ──
export const updateMatchResult = async (req, res) => {
  try {
    const { id, matchId } = req.params;
    const { winner_id, score_player1, score_player2, challonge_match_id, challonge_winner_id } = req.body;
    const [rows] = await db.query('SELECT * FROM tournaments WHERE id = ? AND organizer_id = ?', [id, req.user.id]);
    if (!rows.length) return res.status(403).json({ success: false, message: 'Unauthorized!' });
    await db.query(
      `INSERT INTO matches (tournament_id,challonge_match_id,winner_id,score_player1,score_player2,status,played_at)
       VALUES (?,?,?,?,?,'completed',NOW()) ON DUPLICATE KEY UPDATE winner_id=VALUES(winner_id),
       score_player1=VALUES(score_player1),score_player2=VALUES(score_player2),status='completed',played_at=NOW()`,
      [id, challonge_match_id||matchId, winner_id, score_player1||0, score_player2||0]);
    if (rows[0].challonge_id && challonge_match_id && challonge_winner_id) {
      try { await updateChallongeMatch(rows[0].challonge_id, challonge_match_id, { winnerId: challonge_winner_id, scoresCsv: `${score_player1}-${score_player2}` }); } catch {}
    }
    res.status(200).json({ success: true, message: 'Match updated!' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── MY TOURNAMENTS ──
export const getMyTournaments = async (req, res) => {
  try {
    const [tournaments] = await db.query(
      `SELECT t.*, COUNT(DISTINCT r.id) as total_registrations,
        SUM(CASE WHEN r.status='approved' THEN 1 ELSE 0 END) as approved_teams,
        SUM(CASE WHEN r.status='pending' THEN 1 ELSE 0 END) as pending_teams
       FROM tournaments t LEFT JOIN tournament_registrations r ON t.id = r.tournament_id
       WHERE t.organizer_id = ? GROUP BY t.id ORDER BY t.created_at DESC`, [req.user.id]);
    res.status(200).json({ success: true, tournaments });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── ORGANIZER STATS ──
export const getOrganizerStats = async (req, res) => {
  try {
    const [[stats]] = await db.query(
      `SELECT COUNT(*) as total_tournaments,
        SUM(CASE WHEN status='ongoing' THEN 1 ELSE 0 END) as active_tournaments,
        SUM(CASE WHEN status='completed' THEN 1 ELSE 0 END) as completed_tournaments,
        SUM(CASE WHEN status='open' THEN 1 ELSE 0 END) as open_tournaments,
        COALESCE(SUM(prize_pool),0) as total_prize_pool
       FROM tournaments WHERE organizer_id=?`, [req.user.id]);
    const [[{ total_participants }]] = await db.query(
      `SELECT COUNT(*) as total_participants FROM tournament_registrations r
       JOIN tournaments t ON r.tournament_id=t.id WHERE t.organizer_id=? AND r.status='approved'`, [req.user.id]);
    const [[{ pending_registrations }]] = await db.query(
      `SELECT COUNT(*) as pending_registrations FROM tournament_registrations r
       JOIN tournaments t ON r.tournament_id=t.id WHERE t.organizer_id=? AND r.status='pending'`, [req.user.id]);
    res.status(200).json({ success: true, stats: { ...stats, total_participants, pending_registrations } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};