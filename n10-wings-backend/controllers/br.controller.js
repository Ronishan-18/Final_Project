import db from '../config/db.js';

// Calculate points based on PMGC format
const getPlacementPoints = (placement) => {
  if (placement === 1) return 10;
  if (placement === 2) return 6;
  if (placement === 3) return 5;
  if (placement === 4) return 4;
  if (placement === 5) return 3;
  if (placement === 6) return 2;
  if (placement === 7 || placement === 8) return 1;
  return 0; // 9th+ gets 0
};

export const createMatch = async (req, res) => {
  try {
    const { tournament_id } = req.params;
    const { map_name } = req.body;

    const [tournaments] = await db.query(
      "SELECT id, organizer_id FROM tournaments WHERE id = ?",
      [tournament_id]
    );

    if (!tournaments.length) {
      return res.status(404).json({ success: false, message: 'Tournament not found.' });
    }

    if (tournaments[0].organizer_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to manage this tournament.' });
    }

    // Get current match count
    const [[{ count }]] = await db.query(
      "SELECT COUNT(*) as count FROM br_matches WHERE tournament_id = ?",
      [tournament_id]
    );

    const match_number = count + 1;

    const [result] = await db.query(
      "INSERT INTO br_matches (tournament_id, match_number, map_name) VALUES (?, ?, ?)",
      [tournament_id, match_number, map_name || `Match ${match_number}`]
    );

    res.json({ success: true, message: 'Match created successfully.', match_id: result.insertId });
  } catch (error) {
    console.error('Create BR Match Error:', error);
    res.status(500).json({ success: false, message: 'Server error while creating match.' });
  }
};

export const getMatches = async (req, res) => {
  try {
    const { tournament_id } = req.params;
    const [matches] = await db.query(
      "SELECT * FROM br_matches WHERE tournament_id = ? ORDER BY match_number ASC",
      [tournament_id]
    );

    res.json({ success: true, matches });
  } catch (error) {
    console.error('Get BR Matches Error:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching matches.' });
  }
};

export const submitMatchResults = async (req, res) => {
  try {
    const { match_id } = req.params;
    const { results } = req.body; // Array: [{ team_id, kills, placement }]

    const [matches] = await db.query(
      "SELECT m.id, t.organizer_id FROM br_matches m JOIN tournaments t ON m.tournament_id = t.id WHERE m.id = ?",
      [match_id]
    );

    if (!matches.length) {
      return res.status(404).json({ success: false, message: 'Match not found.' });
    }

    if (matches[0].organizer_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to update this match.' });
    }

    // Insert or Update results
    for (const resData of results) {
      const placementPoints = getPlacementPoints(Number(resData.placement));
      const kills = Number(resData.kills);
      const total = placementPoints + kills;

      await db.query(`
        INSERT INTO br_match_results (match_id, team_id, kills, placement, placement_points, total_points)
        VALUES (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
        kills = VALUES(kills),
        placement = VALUES(placement),
        placement_points = VALUES(placement_points),
        total_points = VALUES(total_points)
      `, [match_id, resData.team_id, kills, resData.placement, placementPoints, total]);
    }

    // Mark match as completed
    await db.query("UPDATE br_matches SET status = 'completed' WHERE id = ?", [match_id]);

    res.json({ success: true, message: 'Results saved successfully.' });
  } catch (error) {
    console.error('Submit BR Results Error:', error);
    res.status(500).json({ success: false, message: 'Server error while saving results.' });
  }
};

export const getLeaderboard = async (req, res) => {
  try {
    const { tournament_id } = req.params;

    const query = `
      SELECT 
        r.team_id,
        t.name as team_name,
        t.tag as team_tag,
        p.avatar as team_avatar,
        COUNT(r.id) as matches_played,
        SUM(r.kills) as total_kills,
        SUM(r.placement_points) as total_placement_points,
        SUM(r.total_points) as grand_total
      FROM br_match_results r
      JOIN br_matches m ON r.match_id = m.id
      JOIN teams t ON r.team_id = t.id
      LEFT JOIN profiles p ON t.leader_id = p.user_id
      WHERE m.tournament_id = ?
      GROUP BY r.team_id, t.name, t.tag, p.avatar
      ORDER BY grand_total DESC, total_placement_points DESC, total_kills DESC
    `;

    const [leaderboard] = await db.query(query, [tournament_id]);

    res.json({ success: true, leaderboard });
  } catch (error) {
    console.error('Get BR Leaderboard Error:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching leaderboard.' });
  }
};
