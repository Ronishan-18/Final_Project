import db from '../config/db.js';
import { createNotification } from './notification.controller.js';

// ── CREATE TEAM ──
export const createTeam = async (req, res) => {
  try {
    const { name, tag, description, logo } = req.body;
    const game = req.body.game || 'Any';

    if (!name || !tag) {
      return res.status(400).json({ success: false, message: 'Name and tag are required!' });
    }

    // Check user creation limit (max 3 teams as leader)
    const [ownedTeams] = await db.query(
      'SELECT id FROM teams WHERE leader_id = ? AND is_active = TRUE',
      [req.user.id]
    );
    
    if (ownedTeams.length >= 3) {
      return res.status(400).json({ success: false, message: 'You can create a maximum of 3 teams!' });
    }

    const [result] = await db.query(
      'INSERT INTO teams (name, tag, game, description, logo, leader_id) VALUES (?, ?, ?, ?, ?, ?)',
      [name, tag.toUpperCase(), game, description || null, logo || null, req.user.id]
    );
    const teamId = result.insertId;

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
    const { game, search, filter } = req.query;
    const userId = req.user?.id;

    let query = `
      SELECT t.*, u.username as leader_username, p.full_name as leader_name, p.avatar as leader_avatar,
        COUNT(DISTINCT tm.id) as member_count
      FROM teams t
      LEFT JOIN users u ON t.leader_id = u.id
      LEFT JOIN profiles p ON t.leader_id = p.user_id
      LEFT JOIN team_members tm ON t.id = tm.team_id AND tm.status = 'approved'
      WHERE t.is_active = TRUE`;
    
    const params = [];
    
    if (filter === 'my') {
      if (!userId) {
        return res.status(200).json({ success: true, total: 0, teams: [] });
      }
      query += ` AND t.id IN (
        SELECT team_id FROM team_members WHERE user_id = ? AND status = 'approved'
      )`;
      params.push(userId);
    }

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

// ── GET MY TEAMS ──
export const getMyTeams = async (req, res) => {
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

    if (!memberships.length) return res.status(200).json({ success: true, teams: [], invitations: [] });

    // For player registrations, we need all teams the user leads
    const myOwnedTeams = memberships.filter(m => m.role === 'leader' && m.status === 'approved');
    const myMemberships = memberships.filter(m => m.status === 'approved');
    const invitations = memberships.filter(m => m.status === 'pending');

    res.status(200).json({ success: true, teams: myMemberships, ownedTeams: myOwnedTeams, invitations });
  } catch (error) {
    console.error('Get My Teams Error:', error);
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

    // Check member limit (max 4)
    const [[{ count }]] = await db.query(
      "SELECT COUNT(*) as count FROM team_members WHERE team_id = ? AND status = 'approved'", [teamId]);
    if (count >= 4) return res.status(400).json({ success: false, message: 'Team is full (max 4 members)!' });

    const [insertResult] = await db.query(
      "INSERT INTO team_members (team_id, user_id, role, status) VALUES (?, ?, 'member', 'pending') ON DUPLICATE KEY UPDATE status='pending'",
      [teamId, inviteeId]);

    const newMemberId = insertResult.insertId;

    await createNotification(
      inviteeId,
      'team_invitation',
      '📩 Team Invitation',
      `${req.user.username} invited you to join team "${teams[0].name}". Accept or decline below.`,
      { team_id: Number(teamId), team_name: teams[0].name, team_member_id: newMemberId }
    );

    res.status(200).json({ success: true, message: `Invitation sent to ${username}!` });
  } catch (error) {
    console.error('Invite Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── RESPOND TO INVITATION (accept/decline) ──
export const respondToInvitation = async (req, res) => {
  try {
    const { action, notification_id } = req.body; // 'accept' | 'decline'
    const { id: teamId, memberId } = req.params;

    const [members] = await db.query(
      "SELECT * FROM team_members WHERE id = ? AND team_id = ? AND user_id = ? AND status = 'pending'",
      [memberId, teamId, req.user.id]);
    if (!members.length) return res.status(404).json({ success: false, message: 'Invitation not found!' });

    const [teams] = await db.query('SELECT leader_id, name FROM teams WHERE id = ?', [teamId]);
    if (!teams.length) return res.status(404).json({ success: false, message: 'Team not found!' });
    const leaderId = teams[0].leader_id;
    const teamName = teams[0].name;

    if (action === 'accept') {
      // Check max joined teams
      const [[{ myTeamsCount }]] = await db.query("SELECT COUNT(*) as count FROM team_members WHERE user_id = ? AND status = 'approved'", [req.user.id]);
      if (myTeamsCount >= 3) return res.status(400).json({ success: false, message: 'You can only join a maximum of 3 teams!'});

      await db.query("UPDATE team_members SET status = 'approved' WHERE id = ?", [memberId]);

      await createNotification(
        leaderId,
        'team_invite_accepted',
        '✅ Request Accepted',
        `${req.user?.username || 'A player'} has joined your team "${teamName}".`,
        { team_id: Number(teamId) }
      );

      res.status(200).json({ success: true, message: 'You joined the team!' });
    } else {
      await db.query('DELETE FROM team_members WHERE id = ?', [memberId]);

      await createNotification(
        leaderId,
        'team_invite_declined',
        '❌ Request Declined',
        `${req.user?.username || 'A player'} has declined your invitation to join team "${teamName}".`,
        { team_id: Number(teamId) }
      );

      res.status(200).json({ success: true, message: 'Invitation declined.' });
    }

    // Mark notification as acted upon
    if (notification_id) {
      await db.query('UPDATE notifications SET is_acted = TRUE WHERE id = ?', [notification_id]);
    } else {
      await db.query(
        "UPDATE notifications SET is_acted = TRUE WHERE type = 'team_invitation' AND user_id = ? AND JSON_EXTRACT(data, '$.team_member_id') = ?",
        [req.user.id, Number(memberId)]
      );
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
    const { team_id } = req.body; // Accept team_id from body
    const userId = req.user.id;

    if (!team_id) return res.status(400).json({ success: false, message: 'Please select a team!' });

    // Verify user is the leader of the SELECTED team
    const [leaderOf] = await db.query(
      `SELECT t.* FROM teams t
       JOIN team_members tm ON t.id = tm.team_id
       WHERE tm.user_id = ? AND t.id = ? AND tm.role = 'leader' AND tm.status = 'approved' AND t.is_active = TRUE`,
      [userId, team_id]
    );
    if (!leaderOf.length) {
      return res.status(403).json({ success: false, message: 'Only the team leader can register this team!' });
    }
    const team = leaderOf[0];

    // Check team size is exactly 4
    const [[{ memberCount }]] = await db.query("SELECT COUNT(*) as count FROM team_members WHERE team_id = ? AND status = 'approved'", [team.id]);
    if (memberCount !== 4) return res.status(400).json({ success: false, message: 'Your team must have exactly 4 members to register for a tournament!' });

    // Check tournament is open
    const [tournaments] = await db.query(
      "SELECT * FROM tournaments WHERE id = ? AND status = 'open'",
      [tournament_id]
    );
    if (!tournaments.length) {
      return res.status(404).json({ success: false, message: 'Tournament not found or not open!' });
    }
    const tournament = tournaments[0];

    // Check if entry fee required — must pay via Stripe first
    if (tournament.entry_fee_required && parseFloat(tournament.entry_fee) > 0) {
      // Check if payment exists and succeeded
      const [payment] = await db.query(
        "SELECT id FROM payments WHERE user_id = ? AND tournament_id = ? AND status = 'succeeded'",
        [userId, tournament_id]
      );
      if (!payment.length) {
        return res.status(402).json({
          success: false,
          message: 'Entry fee payment required before registration!',
          requires_payment: true
        });
      }
    }

    // Check already registered
    const [existing] = await db.query(
      'SELECT id FROM tournament_registrations WHERE tournament_id = ? AND team_id = ?',
      [tournament_id, team.id]
    );
    if (existing.length) {
      return res.status(400).json({ success: false, message: 'Team already registered!' });
    }

    // Check capacity
    const [[{ count }]] = await db.query(
      "SELECT COUNT(*) as count FROM tournament_registrations WHERE tournament_id = ? AND status = 'approved'",
      [tournament_id]
    );
    if (count >= tournament.max_teams) {
      return res.status(400).json({ success: false, message: 'Tournament is full!' });
    }

    await db.query(
      'INSERT INTO tournament_registrations (tournament_id, user_id, team_id, team_name, status) VALUES (?, ?, ?, ?, ?)',
      [tournament_id, userId, team.id, team.name, 'pending']
    );

    res.status(201).json({
      success: true,
      message: `${team.name} registered! Waiting for organizer approval.`
    });
  } catch (error) {
    console.error('Team Register Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── DELETE TEAM ──
export const deleteTeam = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query('SELECT id FROM teams WHERE id = ? AND leader_id = ?', [id, req.user.id]);
    if (!rows.length) return res.status(403).json({ success: false, message: 'Only team leader can delete the team!' });

    await db.query('UPDATE teams SET is_active = FALSE WHERE id = ?', [id]);
    res.status(200).json({ success: true, message: 'Team deleted successfully!' });
  } catch (error) {
    console.error('Delete Team Error:', error);
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

// ── REQUEST TO JOIN TEAM (by player) ──
export const requestJoinTeam = async (req, res) => {
  try {
    const teamId = req.params.id;
    const userId = req.user.id;

    // View team game
    const [teams] = await db.query('SELECT game, leader_id, name FROM teams WHERE id = ?', [teamId]);
    if (!teams.length) return res.status(404).json({ success: false, message: 'Team not found!' });
    const { game, leader_id, name: teamName } = teams[0];

    // Check already in team for this game
    const [existing] = await db.query(
      `SELECT tm.id FROM team_members tm
       JOIN teams t ON tm.team_id = t.id
       WHERE tm.user_id = ? AND tm.status = 'approved' AND t.game = ?`,
      [userId, game]
    );
    if (existing.length > 0) return res.status(400).json({ success: false, message: 'You are already in a team for this game!' });

    // Check max teams joined
    const [[{ myTeamsCount }]] = await db.query("SELECT COUNT(*) as count FROM team_members WHERE user_id = ? AND status = 'approved'", [userId]);
    if (myTeamsCount >= 3) return res.status(400).json({ success: false, message: 'You can only join a maximum of 3 teams!' });

    // Check existing request
    const [existingMem] = await db.query('SELECT id, status FROM team_members WHERE team_id = ? AND user_id = ?', [teamId, userId]);
    if (existingMem.length > 0) {
      if (existingMem[0].status === 'approved') return res.status(400).json({ success: false, message: 'You are already in this team!' });
      if (existingMem[0].status === 'join_request') return res.status(400).json({ success: false, message: 'Join request already sent!' });
      if (existingMem[0].status === 'pending') return res.status(400).json({ success: false, message: 'Team has already invited you!' });
    }

    const [insertResult] = await db.query(
      "INSERT INTO team_members (team_id, user_id, role, status) VALUES (?, ?, 'member', 'join_request') ON DUPLICATE KEY UPDATE status = 'join_request', role = 'member'",
      [teamId, userId]
    );

    // Get the correct ID for the notification (either new or existing)
    const requestId = insertResult.insertId || (await db.query('SELECT id FROM team_members WHERE team_id = ? AND user_id = ?', [teamId, userId]))[0][0].id;

    // Notify team owner
    await createNotification(
      leader_id,
      'team_join_request',
      '🚨 New Join Request',
      `Player @${req.user.username} wants to join your team "${teamName}".`,
      { team_id: Number(teamId), request_id: requestId, user_id: userId }
    );

    res.status(200).json({ success: true, message: 'Join request sent! Waiting for captain approval.' });
  } catch (error) {
    console.error('Request Join Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── GET JOIN REQUESTS (for team leader) ──
export const getJoinRequests = async (req, res) => {
  try {
    const teamId = req.params.id;

    // Verify leader
    const [teams] = await db.query('SELECT id FROM teams WHERE id = ? AND leader_id = ?', [teamId, req.user.id]);
    if (!teams.length) return res.status(403).json({ success: false, message: 'Not authorized or team not found!' });

    const [requests] = await db.query(
      `SELECT tm.id as request_id, tm.status, tm.joined_at,
        u.id as user_id, u.username, p.full_name, p.avatar, gp.player_rank
       FROM team_members tm
       JOIN users u ON tm.user_id = u.id
       LEFT JOIN profiles p ON u.id = p.user_id
       LEFT JOIN gamer_profiles gp ON u.id = gp.user_id
       WHERE tm.team_id = ? AND tm.status = 'join_request'
       ORDER BY tm.joined_at DESC`, [teamId]);

    res.status(200).json({ success: true, requests });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── RESPOND TO JOIN REQUEST (accept/decline by leader) ──
export const respondToJoinRequest = async (req, res) => {
  try {
    const { action, notification_id } = req.body; // 'accept' | 'decline'
    const { id: teamId, requestId } = req.params;

    // Verify leader
    const [teams] = await db.query('SELECT leader_id, name FROM teams WHERE id = ? AND leader_id = ?', [teamId, req.user.id]);
    if (!teams.length) return res.status(403).json({ success: false, message: 'Not authorized!' });
    const teamName = teams[0].name;

    const [members] = await db.query(
      "SELECT user_id FROM team_members WHERE id = ? AND team_id = ? AND status = 'join_request'",
      [requestId, teamId]);
    if (!members.length) return res.status(404).json({ success: false, message: 'Request not found!' });
    const playerId = members[0].user_id;

    if (action === 'accept') {
      // Check member limit (max 4)
      const [[{ count }]] = await db.query("SELECT COUNT(*) as count FROM team_members WHERE team_id = ? AND status = 'approved'", [teamId]);
      if (count >= 4) return res.status(400).json({ success: false, message: 'Team is full (max 4)!' });

      await db.query("UPDATE team_members SET status = 'approved' WHERE id = ?", [requestId]);

      await createNotification(
        playerId,
        'team_request_accepted',
        '🎉 Request Accepted',
        `Your request to join "${teamName}" was accepted!`,
        { team_id: Number(teamId) }
      );
      res.status(200).json({ success: true, message: 'Request accepted!' });
    } else {
      await db.query('DELETE FROM team_members WHERE id = ?', [requestId]);

      await createNotification(
        playerId,
        'team_request_declined',
        '❌ Request Declined',
        `Your request to join "${teamName}" was declined.`,
        { team_id: Number(teamId) }
      );
      res.status(200).json({ success: true, message: 'Request declined.' });
    }

    // Mark notification as acted upon
    if (notification_id) {
      await db.query('UPDATE notifications SET is_acted = TRUE WHERE id = ?', [notification_id]);
    } else {
      await db.query(
        "UPDATE notifications SET is_acted = TRUE WHERE type = 'team_join_request' AND user_id = ? AND JSON_EXTRACT(data, '$.request_id') = ?",
        [req.user.id, Number(requestId)]
      );
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};