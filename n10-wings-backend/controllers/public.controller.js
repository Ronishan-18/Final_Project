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
    
    // 5. Featured Tournament (latest ongoing or open with biggest prize pool)
    const [tournaments] = await db.query(`
      SELECT t.*, u.username as organizer_username
      FROM tournaments t
      LEFT JOIN users u ON t.organizer_id = u.id
      WHERE t.status IN ('open', 'ongoing')
      ORDER BY t.prize_pool DESC, t.created_at DESC
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
