import db from '../config/db.js';

export const getLandingStats = async (req, res) => {
  try {
    // 1. Total Gamers
    const [[{ active_players }]] = await db.query("SELECT COUNT(*) as active_players FROM users WHERE role = 'gamer'");
    
    // 2. Total Tournaments
    const [[{ tournaments_count }]] = await db.query("SELECT COUNT(*) as tournaments_count FROM tournaments");
    
    // 3. Total Prize Pool
    const [[{ prize_pool }]] = await db.query("SELECT SUM(prize_pool) as prize_pool FROM tournaments");
    
    // 4. Total Sponsors
    const [[{ sponsor_count }]] = await db.query("SELECT COUNT(*) as sponsor_count FROM users WHERE role = 'sponsor'");
    
    // 5. Featured Tournament (latest ongoing/open/completed with biggest prize pool)
    const [tournaments] = await db.query(`
      SELECT t.*, u.username as organizer_username
      FROM tournaments t
      LEFT JOIN users u ON t.organizer_id = u.id
      WHERE t.status IN ('open', 'ongoing', 'completed')
      ORDER BY t.status = 'ongoing' DESC, t.status = 'open' DESC, t.prize_pool DESC, t.created_at DESC
      LIMIT 1
    `);

    res.status(200).json({
      success: true,
      stats: {
        activePlayers: active_players || 0,
        tournaments: tournaments_count || 0,
        prizePool: prize_pool || 0,
        sponsors: sponsor_count || 0
      },
      featuredTournament: tournaments[0] || null
    });
  } catch (error) {
    console.error('Landing Stats Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const submitAppeal = async (req, res) => {
  try {
    const { user_id, type, note } = req.body;
    if (!user_id || !type || !note) {
      return res.status(400).json({ success: false, message: 'All fields are required!' });
    }

    // Verify user actually is suspended
    const [users] = await db.query('SELECT is_active, organizer_status FROM users WHERE id = ?', [user_id]);
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found!' });
    }
    
    const user = users[0];
    if (type === 'account' && user.is_active) {
      return res.status(400).json({ success: false, message: 'Your account is not suspended!' });
    }
    if (type === 'organizer' && user.organizer_status !== 'suspended') {
      return res.status(400).json({ success: false, message: 'Your organizer role is not suspended!' });
    }

    // Check if pending appeal already exists
    const [existing] = await db.query(
      "SELECT id FROM suspension_appeals WHERE user_id = ? AND type = ? AND status = 'pending'",
      [user_id, type]
    );
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'You already have a pending appeal!' });
    }

    await db.query(
      'INSERT INTO suspension_appeals (user_id, type, note) VALUES (?, ?, ?)',
      [user_id, type, note]
    );

    res.status(201).json({ success: true, message: 'Appeal submitted successfully! Admin will review it shortly.' });
  } catch (error) {
    console.error('Submit Appeal Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

