import db from '../config/db.js';

// ── CREATE TEAM ──
export const createTeam = async (req, res) => {
  try {
    const { name, tag, game, description } = req.body;
    if (!name || !tag || !game) return res.status(400).json({ success: false, message: 'Name, tag and game are required!' });

    // Check user already in a team for this game
    const [existing] = await db.query(
      `SELECT tm.id FROM team_members tm
       JOIN teams t ON tm.team_id = t.id
       WHERE tm.user_id = ? AND tm.status = 'approved' AND t.game = ?`,
      [req.user.id, game]
    );
    if (existing.length > 0) return res.status(400).json({ success: false, message: 'You are already in a team for this game!' });

    const [result] = await db.query(
      'INSERT INTO teams (name, tag, game, description, leader_id) VALUES (?, ?, ?, ?, ?)',
      [name, tag.toUpperCase(), game, description || null, req.user.id]
    );
    const teamId = result.insertId;

    // Auto-add leader as approved member
    await db.query(
      "INSERT INTO team_members (team_id, user_id, role, status) VALUES (?, ?, 'leader', 'approved')",
      [teamId, req.user.id]
    );

    res.status(201).json({ success: true, message: 'Team created!', team_id: teamId });
  } catch (error) {
    console.error('Create Team Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── GET ALL TEAMS ──
export const getTeams = async (req, res) => {
  try {
    const { game, search } = req.query;
    let query = `
      SELECT t.*, u.username as leader_username, p.full_name as leader_name, p.avatar as leader_avatar,
        COUNT(DISTINCT tm.id) as member_count
      FROM teams t
      LEFT JOIN users u ON t.leader_id = u.id
      LEFT JOIN profiles p ON t.leader_id = p.user_id
      LEFT JOIN team_members tm ON t.id = tm.team_id AND tm.status = 'approved'
      WHERE t.is_active = TRUE`;
    const params = [];
    if (game) { query += ' AND t.game LIKE ?'; params.push(`%${game}%`); }
    if (search) { query += ' AND (t.name LIKE ? OR t.tag LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
    query += ' GROUP BY t.id ORDER BY t.created_at DESC';
    const [teams] = await db.query(query, params);
    res.status(200).json({ success: true, total: teams.length, teams });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── GET SINGLE TEAM ──
export const getTeam = async (req, res) => {
  try {
    const [teams] = await db.query(
      `SELECT t.*, u.username as leader_username, p.full_name as leader_name, p.avatar as leader_avatar
       FROM teams t LEFT JOIN users u ON t.leader_id = u.id LEFT JOIN profiles p ON t.leader_id = p.user_id
       WHERE t.id = ? AND t.is_active = TRUE`, [req.params.id]);
    if (!teams.length) return res.status(404).json({ success: false, message: 'Team not found!' });

    const [members] = await db.query(
      `SELECT tm.*, u.username, u.email, p.full_name, p.avatar, p.country, gp.player_rank
       FROM team_members tm
       LEFT JOIN users u ON tm.user_id = u.id
       LEFT JOIN profiles p ON tm.user_id = p.user_id
       LEFT JOIN gamer_profiles gp ON tm.user_id = gp.user_id
       WHERE tm.team_id = ? AND tm.status = 'approved'
       ORDER BY tm.role DESC, tm.joined_at ASC`, [req.params.id]);

    res.status(200).json({ success: true, team: teams[0], members });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── GET MY TEAM ──
export const getMyTeam = async (req, res) => {
  try {
    const [memberships] = await db.query(
      `SELECT tm.*, t.id as team_id, t.name, t.tag, t.game, t.description, t.logo, t.leader_id,
        u.username as leader_username, p.full_name as leader_name
       FROM team_members tm
       JOIN teams t ON tm.team_id = t.id
       LEFT JOIN users u ON t.leader_id = u.id
       LEFT JOIN profiles p ON t.leader_id = p.user_id
       WHERE tm.user_id = ? AND t.is_active = TRUE
       ORDER BY tm.status DESC`, [req.user.id]);

    if (!memberships.length) return res.status(200).json({ success: true, team: null, members: [], invitations: [] });

    const approved = memberships.find(m => m.status === 'approved');
    if (!approved) {
      return res.status(200).json({ success: true, team: null, members: [], invitations: memberships.filter(m => m.status === 'pending') });
    }

    const [members] = await db.query(
      `SELECT tm.*, u.username, p.full_name, p.avatar, p.country, gp.player_rank
       FROM team_members tm
       LEFT JOIN users u ON tm.user_id = u.id
       LEFT JOIN profiles p ON tm.user_id = p.user_id
       LEFT JOIN gamer_profiles gp ON tm.user_id = gp.user_id
       WHERE tm.team_id = ?
       ORDER BY tm.role DESC, tm.joined_at ASC`, [approved.team_id]);

    res.status(200).json({ success: true, team: approved, members, invitations: [] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── UPDATE TEAM ──
export const updateTeam = async (req, res) => {
  try {
    const { name, tag, description } = req.body;
    const [teams] = await db.query('SELECT id FROM teams WHERE id = ? AND leader_id = ?', [req.params.id, req.user.id]);
    if (!teams.length) return res.status(403).json({ success: false, message: 'Not authorized!' });
    await db.query(
      'UPDATE teams SET name=COALESCE(?,name), tag=COALESCE(?,tag), description=COALESCE(?,description) WHERE id=?',
      [name, tag?.toUpperCase(), description, req.params.id]);
    res.status(200).json({ success: true, message: 'Team updated!' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── INVITE PLAYER ──
export const invitePlayer = async (req, res) => {
  try {
    const { username } = req.body;
    const teamId = req.params.id;

    // Verify leader
    const [teams] = await db.query('SELECT * FROM teams WHERE id = ? AND leader_id = ?', [teamId, req.user.id]);
    if (!teams.length) return res.status(403).json({ success: false, message: 'Only team leader can invite!' });

    // Find user
    const [users] = await db.query('SELECT id FROM users WHERE username = ?', [username]);
    if (!users.length) return res.status(404).json({ success: false, message: 'Player not found!' });
    const inviteeId = users[0].id;

    if (inviteeId === req.user.id) return res.status(400).json({ success: false, message: 'Cannot invite yourself!' });

    // Check already member
    const [existing] = await db.query(
      'SELECT id, status FROM team_members WHERE team_id = ? AND user_id = ?', [teamId, inviteeId]);
    if (existing.length > 0) {
      if (existing[0].status === 'approved') return res.status(400).json({ success: false, message: 'Player is already in the team!' });
      if (existing[0].status === 'pending') return res.status(400).json({ success: false, message: 'Invitation already sent!' });
    }

    // Check member limit (max 10)
    const [[{ count }]] = await db.query(
      "SELECT COUNT(*) as count FROM team_members WHERE team_id = ? AND status = 'approved'", [teamId]);
    if (count >= 10) return res.status(400).json({ success: false, message: 'Team is full (max 10 members)!' });

    await db.query(
      "INSERT INTO team_members (team_id, user_id, role, status) VALUES (?, ?, 'member', 'pending') ON DUPLICATE KEY UPDATE status='pending'",
      [teamId, inviteeId]);

    res.status(200).json({ success: true, message: `Invitation sent to ${username}!` });
  } catch (error) {
    console.error('Invite Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── RESPOND TO INVITATION (accept/decline) ──
export const respondToInvitation = async (req, res) => {
  try {
    const { action } = req.body; // 'accept' | 'decline'
    const { id: teamId, memberId } = req.params;

    const [members] = await db.query(
      "SELECT * FROM team_members WHERE id = ? AND team_id = ? AND user_id = ? AND status = 'pending'",
      [memberId, teamId, req.user.id]);
    if (!members.length) return res.status(404).json({ success: false, message: 'Invitation not found!' });

    if (action === 'accept') {
      await db.query("UPDATE team_members SET status = 'approved' WHERE id = ?", [memberId]);
      res.status(200).json({ success: true, message: 'You joined the team!' });
    } else {
      await db.query('DELETE FROM team_members WHERE id = ?', [memberId]);
      res.status(200).json({ success: true, message: 'Invitation declined.' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── KICK MEMBER / LEAVE TEAM ──
export const removeMember = async (req, res) => {
  try {
    const { id: teamId, memberId } = req.params;

    const [members] = await db.query(
      'SELECT * FROM team_members WHERE id = ? AND team_id = ?', [memberId, teamId]);
    if (!members.length) return res.status(404).json({ success: false, message: 'Member not found!' });

    const member = members[0];

    // Can remove if: leader kicking someone, OR member leaving themselves
    const isLeader = (await db.query('SELECT id FROM teams WHERE id = ? AND leader_id = ?', [teamId, req.user.id]))[0].length > 0;
    const isSelf = member.user_id === req.user.id;

    if (!isLeader && !isSelf) return res.status(403).json({ success: false, message: 'Not authorized!' });
    if (member.role === 'leader') return res.status(400).json({ success: false, message: 'Leader cannot leave! Transfer leadership first.' });

    await db.query('DELETE FROM team_members WHERE id = ?', [memberId]);
    res.status(200).json({ success: true, message: isLeader && !isSelf ? 'Member removed!' : 'You left the team.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── REGISTER TEAM FOR TOURNAMENT ──
export const registerTeamForTournament = async (req, res) => {
  try {
    const { tournament_id } = req.params;
    const userId = req.user.id;

    // Verify user is team leader
    const [leaderOf] = await db.query(
      `SELECT t.* FROM teams t
       JOIN team_members tm ON t.id = tm.team_id
       WHERE tm.user_id = ? AND tm.role = 'leader' AND tm.status = 'approved' AND t.is_active = TRUE`,
      [userId]);
    if (!leaderOf.length) return res.status(403).json({ success: false, message: 'Only team leaders can register for tournaments!' });

    const team = leaderOf[0];

    // Check tournament is open
    const [tournaments] = await db.query("SELECT * FROM tournaments WHERE id = ? AND status = 'open'", [tournament_id]);
    if (!tournaments.length) return res.status(404).json({ success: false, message: 'Tournament not found or not open!' });

    // Check already registered
    const [existing] = await db.query(
      'SELECT id FROM tournament_registrations WHERE tournament_id = ? AND team_id = ?', [tournament_id, team.id]);
    if (existing.length) return res.status(400).json({ success: false, message: 'Team already registered!' });

    // Check capacity
    const [[{ count }]] = await db.query(
      "SELECT COUNT(*) as count FROM tournament_registrations WHERE tournament_id = ? AND status = 'approved'", [tournament_id]);
    if (count >= tournaments[0].max_teams) return res.status(400).json({ success: false, message: 'Tournament is full!' });

    await db.query(
      'INSERT INTO tournament_registrations (tournament_id, user_id, team_id, team_name, status) VALUES (?, ?, ?, ?, ?)',
      [tournament_id, userId, team.id, team.name, 'pending']);

    res.status(201).json({ success: true, message: `${team.name} registered! Waiting for organizer approval.` });
  } catch (error) {
    console.error('Team Register Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── GET MY INVITATIONS ──
export const getMyInvitations = async (req, res) => {
  try {
    const [invitations] = await db.query(
      `SELECT tm.id as member_id, tm.status, tm.joined_at,
        t.id as team_id, t.name, t.tag, t.game, t.logo,
        u.username as leader_username, p.full_name as leader_name
       FROM team_members tm
       JOIN teams t ON tm.team_id = t.id
       LEFT JOIN users u ON t.leader_id = u.id
       LEFT JOIN profiles p ON t.leader_id = p.user_id
       WHERE tm.user_id = ? AND tm.status = 'pending'`, [req.user.id]);
    res.status(200).json({ success: true, invitations });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};