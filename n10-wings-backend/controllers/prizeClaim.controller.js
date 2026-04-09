import db from '../config/db.js';
import { createNotification } from './notification.controller.js';

// ── CLAIM PRIZE (TEAM LEADER) ──
export const claimPrize = async (req, res) => {
  try {
    const userId = req.user.id;
    const { tournament_id, team_id, bank_details, amount } = req.body;

    if (!tournament_id || !team_id || !bank_details || !amount) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Verify user is leader
    const [members] = await db.query(
      "SELECT * FROM team_members WHERE team_id = ? AND user_id = ? AND role = 'leader'",
      [team_id, userId]
    );

    if (!members.length) {
      return res.status(403).json({ success: false, message: 'Only team leaders can claim prizes.' });
    }

    // Check if claim already exists
    const [existing] = await db.query(
      "SELECT * FROM prize_claims WHERE tournament_id = ? AND team_id = ? AND status != 'rejected'",
      [tournament_id, team_id]
    );

    if (existing.length) {
      return res.status(400).json({ success: false, message: 'Prize already claimed or pending for this tournament.' });
    }

    await db.query(
      "INSERT INTO prize_claims (tournament_id, team_id, user_id, bank_details, amount, status) VALUES (?, ?, ?, ?, ?, 'pending')",
      [tournament_id, team_id, userId, bank_details, amount]
    );

    res.status(201).json({ success: true, message: 'Prize claim submitted successfully.' });
  } catch (error) {
    console.error('Claim Prize Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── GET PRIZE CLAIMS (ADMIN) ──
export const getClaims = async (req, res) => {
  try {
    const { status } = req.query;
    let query = `
      SELECT pc.*, t.title as tournament_title, team.name as team_name, u.email as user_email
      FROM prize_claims pc
      JOIN tournaments t ON pc.tournament_id = t.id
      JOIN teams team ON pc.team_id = team.id
      JOIN users u ON pc.user_id = u.id
    `;
    const params = [];
    if (status) {
      query += ' WHERE pc.status = ?';
      params.push(status);
    }
    query += ' ORDER BY pc.created_at DESC';

    const [claims] = await db.query(query, params);
    res.status(200).json({ success: true, claims });
  } catch (error) {
    console.error('Get Claims Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── UPDATE CLAIM STATUS (ADMIN) ──
export const updateClaimStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!['paid', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const [claims] = await db.query('SELECT * FROM prize_claims WHERE id = ?', [id]);
    if (!claims.length) return res.status(404).json({ success: false, message: 'Claim not found' });

    const claim = claims[0];
    await db.query('UPDATE prize_claims SET status = ?, notes = ? WHERE id = ?', [status, notes || null, id]);

    if (status === 'paid') {
      await createNotification(
        claim.user_id,
        'system',
        '💰 Prize Paid',
        `Your prize claim of $${claim.amount} has been paid successfully.`
      );
    } else if (status === 'rejected') {
      await createNotification(
        claim.user_id,
        'system',
        '❌ Prize Claim Rejected',
        `Your prize claim of $${claim.amount} was rejected. Note: ${notes}`
      );
    }

    res.status(200).json({ success: true, message: `Claim marked as ${status}.` });
  } catch (error) {
    console.error('Update Claim Status Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
