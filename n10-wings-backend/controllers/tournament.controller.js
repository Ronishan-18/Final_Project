import db from '../config/db.js';
import { notifyAllUsers, createNotification } from './notification.controller.js';
import { transporter } from '../config/email.js';
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
    const { title, game, description, rules, prize_pool, max_teams, entry_fee, start_date, end_date, tournament_type, mode, venue_address, registration_open_date, registration_close_date } = req.body;
    if (!title || !game) return res.status(400).json({ success: false, message: 'Title and game are required!' });

    // ── ACTIVE TOURNAMENT VALIDATION ──
    const [activeTournaments] = await db.query(
      "SELECT id, title, status FROM tournaments WHERE organizer_id = ? AND status NOT IN ('completed', 'cancelled')",
      [req.user.id]
    );

    if (activeTournaments.length > 0) {
      return res.status(400).json({
        success: false,
        message: `You currently have an active tournament ("${activeTournaments[0].title}" - ${activeTournaments[0].status.toUpperCase()}). Please complete or cancel it before creating a new one.`
      });
    }

    const isBR = ['PUBG', 'Free Fire'].includes(game);
    const final_tournament_type = isBR ? 'battle royale' : (tournament_type || 'single elimination');

    let challongeData = null;
    try {
      if (!isBR) {
        challongeData = await createChallongeTournament({ name: title, tournamentType: final_tournament_type, startAt: start_date });
      }
    } catch (e) { console.warn('Challonge skip:', e.message); }

    const [result] = await db.query(
      `INSERT INTO tournaments (organizer_id,title,game,description,rules,prize_pool,max_teams,entry_fee,start_date,end_date,tournament_type,status,challonge_id,challonge_url,mode,venue_address,registration_open_date,registration_close_date)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,'open',?,?,?,?,?,?)`,
      [req.user.id, title, game, description||null, rules||null, prize_pool||0, max_teams||16, entry_fee||0, start_date||null, end_date||null, final_tournament_type, challongeData?.id||null, challongeData?.full_challonge_url||null, mode||'online', venue_address||null, registration_open_date||null, registration_close_date||null]
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
    const { game, status, search, filter } = req.query;
    const userId = req.user?.id;

    let query = `
      SELECT t.*, t.winner_team_name, u.username as organizer_username, p.full_name as organizer_name,
        COUNT(DISTINCT r.id) as registered_teams
      FROM tournaments t
      LEFT JOIN users u ON t.organizer_id = u.id
      LEFT JOIN profiles p ON t.organizer_id = p.user_id
      LEFT JOIN tournament_registrations r ON t.id = r.tournament_id AND r.status = 'approved'`;

    const params = [];

    if (filter === 'my') {
      if (!userId) return res.status(200).json({ success: true, total: 0, tournaments: [] });
      query += ` WHERE (t.organizer_id = ? OR t.id IN (
        SELECT tr.tournament_id FROM tournament_registrations tr
        JOIN teams tm ON tr.team_id = tm.id
        JOIN team_members tmem ON tm.id = tmem.team_id
        WHERE tmem.user_id = ? AND tmem.status = 'approved'
      ))`;
      params.push(userId, userId);
    } else {
      query += ` WHERE 1=1`;
    }

    if (game) { query += ' AND t.game LIKE ?'; params.push(`%${game}%`); }
    if (status) { query += ' AND t.status = ?'; params.push(status); }
    if (search) { query += ' AND t.title LIKE ?'; params.push(`%${search}%`); }

    query += ' GROUP BY t.id ORDER BY t.created_at DESC';

    const [tournaments] = await db.query(query, params);
    res.status(200).json({ success: true, total: tournaments.length, tournaments });
  } catch (error) {
    console.error('Get Tournaments Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── GET SINGLE TOURNAMENT ──
export const getTournament = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT t.*, u.username as organizer_username, p.full_name as organizer_name
       FROM tournaments t
       LEFT JOIN users u ON t.organizer_id = u.id
       LEFT JOIN profiles p ON t.organizer_id = p.user_id
       WHERE t.id = ?`,
      [req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Tournament not found!' });
    }

    const [registrations] = await db.query(
      `SELECT
        r.id, r.tournament_id, r.team_id, r.user_id, r.status,
        r.payment_status, r.registered_at,
        COALESCE(tm.name, r.team_name) as team_name,
        tm.tag as team_tag, tm.logo as team_logo,
        u.username as leader_username,
        p.full_name as leader_name,
        p.avatar as leader_avatar
       FROM tournament_registrations r
       LEFT JOIN teams tm ON r.team_id = tm.id
       LEFT JOIN team_members tmem ON tm.id = tmem.team_id AND tmem.role = 'leader' AND tmem.status = 'approved'
       LEFT JOIN users u ON tmem.user_id = u.id
       LEFT JOIN profiles p ON tmem.user_id = p.user_id
       WHERE r.tournament_id = ?
       ORDER BY r.registered_at DESC`,
      [req.params.id]
    );

    const [matches] = await db.query(
      'SELECT * FROM matches WHERE tournament_id = ? ORDER BY round, id',
      [req.params.id]
    );

    let challongeBracket = null;
    if (rows[0].challonge_id) {
      try {
        challongeBracket = await getChallongeTournament(rows[0].challonge_id);
      } catch (e) {
        console.warn('Challonge fetch skip:', e.message);
      }
    }

    res.status(200).json({
      success: true,
      tournament: rows[0],
      registrations,
      matches,
      challongeBracket,
    });
  } catch (error) {
    console.error('Get Tournament Error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
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
    console.error('Update Tournament Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── DELETE TOURNAMENT ──
export const deleteTournament = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM tournaments WHERE id = ? AND organizer_id = ?', [req.params.id, req.user.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Not found!' });
    if (rows[0].challonge_id) { try { await deleteChallongeTournament(rows[0].challonge_id); } catch {} }

    // ── CASCADE DELETES ──
    const deleteQueries = [
      'DELETE FROM tournament_registrations WHERE tournament_id = ?',
      'DELETE FROM matches WHERE tournament_id = ?',
      'DELETE FROM prize_claims WHERE tournament_id = ?',
      'DELETE FROM payments WHERE tournament_id = ?'
    ];
    for (const q of deleteQueries) {
      try { await db.query(q, [req.params.id]); } catch(e) {}
    }

    await db.query('DELETE FROM tournaments WHERE id = ?', [req.params.id]);
    res.status(200).json({ success: true, message: 'Tournament deleted!' });
  } catch (error) {
    console.error('Delete Tournament Error:', error);
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
      `SELECT r.*, tm.name as team_name_actual
       FROM tournament_registrations r
       LEFT JOIN teams tm ON r.team_id = tm.id
       LEFT JOIN team_members tmem ON tm.id = tmem.team_id AND tmem.role = 'leader' AND tmem.status = 'approved'
       LEFT JOIN users u ON tmem.user_id = u.id
       LEFT JOIN profiles p ON tmem.user_id = p.user_id
       WHERE r.tournament_id = ? AND r.status = 'approved'`, [id]);
    if (approved.length < 2) return res.status(400).json({ success: false, message: 'Need at least 2 approved teams!' });
    if (rows[0].challonge_id) {
      try {
        for (const reg of approved) {
          const name = reg.team_name_actual || reg.team_name || 'Unknown';
          const p = await addChallongeParticipant(rows[0].challonge_id, name);
          await db.query('UPDATE tournament_registrations SET challonge_participant_id = ? WHERE id = ?', [p.id, reg.id]);
        }
        await startChallongeTournament(rows[0].challonge_id);
      } catch (e) { console.warn('Challonge start skip:', e.message); }
    }
    await db.query("UPDATE tournaments SET status = 'ongoing' WHERE id = ?", [id]);
    await notifyAllUsers(
      'tournament_launched',
      '🏆 Tournament Just Launched!',
      `"${rows[0].title}" is now live!`,
      { tournament_id: rows[0].id, tournament_title: rows[0].title }
    );
    res.status(200).json({ success: true, message: 'Tournament started!', challonge_url: rows[0].challonge_url });
  } catch (error) {
    console.error('Start Tournament Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── SEND ANNOUNCEMENT ──
// Organizer writes a message → emails all registered team leaders + in-app notifications
export const sendAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Announcement message is required!' });
    }

    const [rows] = await db.query(
      'SELECT * FROM tournaments WHERE id = ? AND organizer_id = ?',
      [id, req.user.id]
    );
    if (!rows.length) return res.status(403).json({ success: false, message: 'Unauthorized!' });
    const tournament = rows[0];

    // Get all approved team leaders with emails
    const [leaders] = await db.query(
      `SELECT DISTINCT u.id as user_id, u.email, u.username, p.full_name,
        COALESCE(tm_team.name, tr.team_name) as team_name
       FROM tournament_registrations tr
       LEFT JOIN teams tm_team ON tr.team_id = tm_team.id
       LEFT JOIN team_members tmem ON tm_team.id = tmem.team_id AND tmem.role = 'leader' AND tmem.status = 'approved'
       LEFT JOIN users u ON tmem.user_id = u.id
       LEFT JOIN profiles p ON tmem.user_id = p.user_id
       WHERE tr.tournament_id = ? AND tr.status = 'approved' AND u.id IS NOT NULL`,
      [id]
    );

    if (!leaders.length) {
      return res.status(400).json({ success: false, message: 'No registered teams to announce to!' });
    }

    // Save to DB
    await db.query(
      'UPDATE tournaments SET announcement = ?, announcement_sent_at = NOW() WHERE id = ?',
      [message.trim(), id]
    );

    // In-app notifications + emails
    for (const leader of leaders) {
      await createNotification(
        leader.user_id,
        'tournament_launched',
        `📢 ${tournament.title} — Announcement`,
        message.trim(),
        { tournament_id: parseInt(id) }
      );

      transporter.sendMail({
        from: `"N-10 Wings E-Sports" <${process.env.EMAIL_USER}>`,
        to: leader.email,
        subject: `📢 [${tournament.title}] — Tournament Announcement`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;background:#070709;color:#E8EAF0;border-radius:12px;overflow:hidden;border:1px solid #1a1a2e;">
            <div style="background:linear-gradient(135deg,#00F5FF22,#8B00FF22);padding:32px;text-align:center;border-bottom:1px solid #1a1a2e;">
              <div style="font-family:monospace;font-size:28px;font-weight:900;color:#00F5FF;letter-spacing:4px;">N-10 WINGS</div>
              <div style="color:#8892A4;font-size:12px;letter-spacing:2px;margin-top:6px;">E-SPORTS PLATFORM</div>
            </div>
            <div style="padding:32px;">
              <div style="background:rgba(0,245,255,0.06);border:1px solid rgba(0,245,255,0.2);border-radius:8px;padding:8px 16px;display:inline-block;margin-bottom:20px;">
                <span style="color:#00F5FF;font-size:11px;font-weight:700;letter-spacing:2px;">📢 ANNOUNCEMENT</span>
              </div>
              <h2 style="color:#fff;font-size:22px;margin:0 0 8px;">${tournament.title}</h2>
              <p style="color:#8892A4;font-size:13px;margin:0 0 24px;">Hi <strong style="color:#E8EAF0;">${leader.full_name || leader.username}</strong> · Team: <strong style="color:#00F5FF;">${leader.team_name || 'Your Team'}</strong></p>
              <div style="background:#0D0D16;border-left:3px solid #00F5FF;border-radius:0 8px 8px 0;padding:20px 24px;margin-bottom:28px;">
                <p style="color:#E8EAF0;font-size:15px;line-height:1.7;margin:0;white-space:pre-wrap;">${message.trim()}</p>
              </div>
              <div style="text-align:center;margin-top:24px;">
                <a href="${process.env.FRONTEND_URL}/tournaments/${id}" style="background:linear-gradient(135deg,#00F5FF,#8B00FF);color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:13px;letter-spacing:1px;">VIEW TOURNAMENT →</a>
              </div>
            </div>
            <div style="padding:20px 32px;border-top:1px solid #1a1a2e;text-align:center;">
              <p style="color:#8892A4;font-size:11px;margin:0;">N-10 Wings E-Sports Development & Management System</p>
            </div>
          </div>
        `
      }).catch(err => console.warn(`Announcement email failed for ${leader.email}:`, err.message));
    }

    res.status(200).json({
      success: true,
      message: `Announcement sent to ${leaders.length} team leader${leaders.length > 1 ? 's' : ''}!`,
      recipients: leaders.length
    });
  } catch (error) {
    console.error('Send Announcement Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── DECLARE WINNER ──
export const declareWinner = async (req, res) => {
  try {
    const { id } = req.params;
    const { team_id, team_name } = req.body;

    if (!team_id && !team_name) {
      return res.status(400).json({ success: false, message: 'Winner team is required!' });
    }

    const [rows] = await db.query(
      'SELECT * FROM tournaments WHERE id = ? AND organizer_id = ?',
      [id, req.user.id]
    );
    if (!rows.length) return res.status(403).json({ success: false, message: 'Unauthorized!' });
    const tournament = rows[0];

    if (tournament.status === 'completed') {
      return res.status(400).json({ success: false, message: 'Winner already declared!' });
    }

    let winnerName = team_name;
    if (team_id) {
      const [teamRows] = await db.query('SELECT name FROM teams WHERE id = ?', [team_id]);
      if (teamRows.length) winnerName = teamRows[0].name;
    }

    await db.query(
      `UPDATE tournaments SET status='completed', winner_team_id=?, winner_team_name=?, winner_declared_at=NOW() WHERE id=?`,
      [team_id || null, winnerName, id]
    );

    const prizePool = Number(tournament.prize_pool) || 0;

    // Get all registered leaders
    const [leaders] = await db.query(
      `SELECT DISTINCT u.id as user_id, u.email, u.username, p.full_name,
        COALESCE(tm_team.name, tr.team_name) as team_name,
        tr.team_id as reg_team_id
       FROM tournament_registrations tr
       LEFT JOIN teams tm_team ON tr.team_id = tm_team.id
       LEFT JOIN team_members tmem ON tm_team.id = tmem.team_id AND tmem.role = 'leader' AND tmem.status = 'approved'
       LEFT JOIN users u ON tmem.user_id = u.id
       LEFT JOIN profiles p ON tmem.user_id = p.user_id
       WHERE tr.tournament_id = ? AND tr.status = 'approved' AND u.id IS NOT NULL`,
      [id]
    );

    for (const leader of leaders) {
      const isWinner = String(leader.reg_team_id) === String(team_id);

      await createNotification(
        leader.user_id,
        'tournament_launched',
        isWinner ? `🏆 You Won "${tournament.title}"!` : `🏁 "${tournament.title}" Has Ended`,
        isWinner
          ? `Your team "${winnerName}" won! Prize: LKR ${prizePool.toLocaleString()}. Visit the tournament page to submit your prize claim details.`
          : `Tournament ended. Winner: "${winnerName}". Well played!`,
        { tournament_id: parseInt(id) }

      );

      transporter.sendMail({
        from: `"N-10 Wings E-Sports" <${process.env.EMAIL_USER}>`,
        to: leader.email,
        subject: isWinner ? `🏆 You Won "${tournament.title}"! — N-10 Wings` : `🏁 "${tournament.title}" Results — N-10 Wings`,
        html: isWinner ? `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;background:#070709;color:#E8EAF0;border-radius:12px;overflow:hidden;border:1px solid #1a1a2e;">
            <div style="background:linear-gradient(135deg,#FFD70022,#FF6B0022);padding:40px;text-align:center;border-bottom:1px solid #1a1a2e;">
              <div style="font-size:56px;margin-bottom:8px;">🏆</div>
              <div style="font-family:monospace;font-size:28px;font-weight:900;color:#FFD700;letter-spacing:4px;">CHAMPION!</div>
            </div>
            <div style="padding:32px;text-align:center;">
              <h2 style="color:#FFD700;font-size:24px;margin:0 0 12px;">Congratulations, ${leader.full_name || leader.username}!</h2>
              <p style="color:#8892A4;margin:0 0 24px;">Your team <strong style="color:#00F5FF;">${winnerName}</strong> won <strong style="color:#fff;">${tournament.title}</strong>!</p>
              <div style="background:linear-gradient(135deg,rgba(255,215,0,0.1),rgba(255,107,0,0.1));border:1px solid rgba(255,215,0,0.3);border-radius:12px;padding:24px;margin-bottom:24px;">
                <div style="color:#8892A4;font-size:12px;letter-spacing:2px;margin-bottom:8px;">PRIZE POOL</div>
                <div style="color:#FFD700;font-size:36px;font-weight:900;font-family:monospace;">LKR ${prizePool.toLocaleString()}</div>
                <div style="color:#8892A4;font-size:13px;margin-top:8px;">Please visit the tournament page on N-10 Wings to submit your prize claim and payout details.</div>
              </div>

              <a href="${process.env.FRONTEND_URL}/tournaments/${id}" style="background:linear-gradient(135deg,#FFD700,#FF6B00);color:#0A0A0F;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:900;font-size:14px;">VIEW TOURNAMENT →</a>
            </div>
            <div style="padding:20px 32px;border-top:1px solid #1a1a2e;text-align:center;">
              <p style="color:#8892A4;font-size:11px;margin:0;">N-10 Wings E-Sports Development & Management System</p>
            </div>
          </div>
        ` : `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;background:#070709;color:#E8EAF0;border-radius:12px;overflow:hidden;border:1px solid #1a1a2e;">
            <div style="background:linear-gradient(135deg,#00F5FF11,#8B00FF11);padding:32px;text-align:center;border-bottom:1px solid #1a1a2e;">
              <div style="font-family:monospace;font-size:28px;font-weight:900;color:#00F5FF;letter-spacing:4px;">N-10 WINGS</div>
            </div>
            <div style="padding:32px;text-align:center;">
              <div style="font-size:40px;margin-bottom:16px;">🏁</div>
              <h2 style="color:#fff;margin:0 0 8px;">${tournament.title} — Concluded</h2>
              <p style="color:#8892A4;margin:0 0 24px;">Hi ${leader.full_name || leader.username}, the tournament has ended.</p>
              <div style="background:#0D0D16;border:1px solid rgba(255,215,0,0.2);border-radius:12px;padding:20px;margin-bottom:24px;">
                <div style="color:#8892A4;font-size:12px;letter-spacing:2px;margin-bottom:8px;">🏆 WINNER</div>
                <div style="color:#FFD700;font-size:22px;font-weight:900;">${winnerName}</div>
                <div style="color:#8892A4;font-size:13px;margin-top:8px;">Prize Pool: LKR ${prizePool.toLocaleString()}</div>
              </div>
              <a href="${process.env.FRONTEND_URL}/tournaments" style="background:linear-gradient(135deg,#00F5FF,#8B00FF);color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:13px;">FIND MORE TOURNAMENTS →</a>
            </div>
            <div style="padding:20px 32px;border-top:1px solid #1a1a2e;text-align:center;">
              <p style="color:#8892A4;font-size:11px;margin:0;">N-10 Wings E-Sports Development & Management System</p>
            </div>
          </div>
        `
      }).catch(err => console.warn(`Winner email failed for ${leader.email}:`, err.message));
    }

    res.status(200).json({
      success: true,
      message: `🏆 ${winnerName} declared as winner! All participants notified.`,
      winner: { team_id: team_id, team_name: winnerName, prize_pool: prizePool }
    });
  } catch (error) {
    console.error('Declare Winner Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── REGISTER FOR TOURNAMENT (individual) ──
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
    console.error('Register Tournament Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── REGISTER TEAM FOR TOURNAMENT ──
export const registerTeamForTournament = async (req, res) => {
  try {
    const { id } = req.params;
    const { team_id } = req.body;
    const userId = req.user.id;
    if (!team_id) return res.status(400).json({ success: false, message: 'Team ID is required!' });
    const [leaderOf] = await db.query(
      `SELECT t.* FROM teams t JOIN team_members tm ON t.id = tm.team_id
       WHERE tm.user_id = ? AND t.id = ? AND tm.role = 'leader' AND tm.status = 'approved' AND t.is_active = TRUE`,
      [userId, team_id]
    );
    if (!leaderOf.length) return res.status(403).json({ success: false, message: 'Only the team leader can register this team!' });
    const team = leaderOf[0];

    // Check team size is exactly 4
    const [[{ memberCount }]] = await db.query("SELECT COUNT(*) as count FROM team_members WHERE team_id = ? AND status = 'approved'", [team.id]);
    if (memberCount !== 4) return res.status(400).json({ success: false, message: 'Your team must have exactly 4 members to register for a tournament!' });

    const [rows] = await db.query("SELECT * FROM tournaments WHERE id = ? AND status = 'open'", [id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Tournament not open!' });
    const tournament = rows[0];
    const isPaidTournament = parseFloat(tournament.entry_fee) > 0;
    if (isPaidTournament) {
      const [payment] = await db.query("SELECT id FROM payments WHERE user_id = ? AND tournament_id = ? AND status = 'succeeded'", [userId, id]);
      if (!payment.length) return res.status(402).json({ success: false, message: 'Entry fee payment required!', requires_payment: true });
    }
    const [existing] = await db.query('SELECT id FROM tournament_registrations WHERE tournament_id = ? AND team_id = ?', [id, team_id]);
    if (existing.length) return res.status(400).json({ success: false, message: 'Team already registered!' });
    const [[{ count }]] = await db.query("SELECT COUNT(*) as count FROM tournament_registrations WHERE tournament_id = ? AND status = 'approved'", [id]);
    if (count >= tournament.max_teams) return res.status(400).json({ success: false, message: 'Tournament is full!' });
    const registrationStatus = isPaidTournament ? 'pending' : 'approved';
    await db.query('INSERT INTO tournament_registrations (tournament_id, user_id, team_id, team_name, status) VALUES (?, ?, ?, ?, ?)', [id, userId, team.id, team.name, registrationStatus]);
    res.status(201).json({ success: true, message: registrationStatus === 'approved' ? `${team.name} is registered! Good luck! 🎮` : `${team.name} registered! Waiting for approval.` });
  } catch (error) {
    console.error('Register Team Tournament Error:', error);
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
    console.error('Handle Registration Error:', error);
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
      [id, challonge_match_id||matchId, winner_id, score_player1||0, score_player2||0]
    );
    if (rows[0].challonge_id && challonge_match_id && challonge_winner_id) {
      try { await updateChallongeMatch(rows[0].challonge_id, challonge_match_id, { winnerId: challonge_winner_id, scoresCsv: `${score_player1}-${score_player2}` }); } catch {}
    }
    res.status(200).json({ success: true, message: 'Match updated!' });
  } catch (error) {
    console.error('Update Match Error:', error);
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
       WHERE t.organizer_id = ? GROUP BY t.id ORDER BY t.created_at DESC`,
      [req.user.id]
    );
    res.status(200).json({ success: true, tournaments });
  } catch (error) {
    console.error('Get My Tournaments Error:', error);
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
       FROM tournaments WHERE organizer_id=?`,
      [req.user.id]
    );
    const [[{ total_participants }]] = await db.query(
      `SELECT COUNT(*) as total_participants FROM tournament_registrations r
       JOIN tournaments t ON r.tournament_id=t.id WHERE t.organizer_id=? AND r.status='approved'`,
      [req.user.id]
    );
    const [[{ pending_registrations }]] = await db.query(
      `SELECT COUNT(*) as pending_registrations FROM tournament_registrations r
       JOIN tournaments t ON r.tournament_id=t.id WHERE t.organizer_id=? AND r.status='pending'`,
      [req.user.id]
    );
    res.status(200).json({ success: true, stats: { ...stats, total_participants, pending_registrations } });
  } catch (error) {
    console.error('Organizer Stats Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};