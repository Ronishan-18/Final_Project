import db from '../config/db.js';
import axios from 'axios';

// ============================================
// GET SUPPORTED GAMES LIST
// GET /api/game-identities/games
// ============================================
export const getSupportedGames = (req, res) => {
  const games = [
    {
      id: 'pubg',
      name: 'PUBG',
      type: 'api',
      icon: '🎯',
      color: '#F5A623',
      placeholder: 'Enter your PUBG username',
      hint: 'Your exact in-game name'
    },
    {
      id: 'valorant',
      name: 'Valorant',
      type: 'api',
      icon: '⚡',
      color: '#FF4655',
      placeholder: 'Enter Riot ID (e.g. Roni#LK1)',
      hint: 'Format: Username#TagLine'
    },
    {
      id: 'freefire',
      name: 'Free Fire',
      type: 'manual',
      icon: '🔥',
      color: '#FF6B00',
      placeholder: 'Enter Free Fire ID',
      hint: 'Your Free Fire player ID'
    },
    {
      id: 'mobilelegends',
      name: 'Mobile Legends',
      type: 'manual',
      icon: '⚔️',
      color: '#1890FF',
      placeholder: 'Enter Mobile Legends ID',
      hint: 'Your ML player ID'
    },
    {
      id: 'codmobile',
      name: 'COD Mobile',
      type: 'manual',
      icon: '💥',
      color: '#4CAF50',
      placeholder: 'Enter COD Mobile username',
      hint: 'Your COD Mobile username'
    },
    {
      id: 'other',
      name: 'Other Game',
      type: 'manual',
      icon: '🎮',
      color: '#8892A4',
      placeholder: 'Enter your username/ID',
      hint: 'Your username in this game'
    },
  ];
  res.status(200).json({ success: true, games });
};

// ============================================
// GET MY GAME IDENTITIES
// GET /api/game-identities/me
// ============================================
export const getMyGameIdentities = async (req, res) => {
  try {
    const [identities] = await db.query(
      'SELECT * FROM game_identities WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    res.status(200).json({ success: true, identities });
  } catch (error) {
    console.error('Get Game Identities Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ============================================
// GET USER GAME IDENTITIES (Public)
// GET /api/game-identities/:userId
// ============================================
export const getUserGameIdentities = async (req, res) => {
  try {
    const [identities] = await db.query(
      'SELECT * FROM game_identities WHERE user_id = ? ORDER BY created_at DESC',
      [req.params.userId]
    );
    res.status(200).json({ success: true, identities });
  } catch (error) {
    console.error('Get User Game Identities Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ============================================
// ADD / UPDATE GAME IDENTITY
// POST /api/game-identities
// ============================================
export const upsertGameIdentity = async (req, res) => {
  try {
    const userId = req.user.id;
    const { game_id, game_name, game_type, game_username } = req.body;

    if (!game_id || !game_name || !game_username) {
      return res.status(400).json({
        success: false,
        message: 'Game and username are required!'
      });
    }

    // Check if exists
    const [existing] = await db.query(
      'SELECT id FROM game_identities WHERE user_id = ? AND game_name = ?',
      [userId, game_name]
    );

    if (existing.length > 0) {
      await db.query(
        `UPDATE game_identities SET
         game_username = ?,
         game_type = ?,
         is_verified = FALSE,
         last_synced = NULL,
         updated_at = NOW()
         WHERE user_id = ? AND game_name = ?`,
        [game_username, game_type || 'manual', userId, game_name]
      );
    } else {
      await db.query(
        `INSERT INTO game_identities
         (user_id, game_name, game_type, game_username)
         VALUES (?, ?, ?, ?)`,
        [userId, game_name, game_type || 'manual', game_username]
      );
    }

    res.status(200).json({
      success: true,
      message: 'Game identity saved!'
    });

  } catch (error) {
    console.error('Upsert Game Identity Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ============================================
// DELETE GAME IDENTITY
// DELETE /api/game-identities/:id
// ============================================
export const deleteGameIdentity = async (req, res) => {
  try {
    await db.query(
      'DELETE FROM game_identities WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    res.status(200).json({
      success: true,
      message: 'Game identity removed!'
    });
  } catch (error) {
    console.error('Delete Game Identity Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ============================================
// SYNC PUBG STATS
// POST /api/game-identities/sync/pubg
// ============================================
export const syncPUBG = async (req, res) => {
  try {
    const { game_username } = req.body;
    const userId = req.user.id;

    const response = await axios.get(
      `https://api.pubg.com/shards/steam/players?filter[playerNames]=${game_username}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PUBG_API_KEY}`,
          Accept: 'application/vnd.api+json'
        }
      }
    );

    const player = response.data?.data?.[0];
    if (!player) {
      return res.status(404).json({
        success: false,
        message: 'PUBG player not found! Check your username.'
      });
    }

    const playerId = player.id;

    // Get season stats
    const seasonRes = await axios.get(
      `https://api.pubg.com/shards/steam/players/${playerId}/seasons/division.bro.official.pc-2018-29`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PUBG_API_KEY}`,
          Accept: 'application/vnd.api+json'
        }
      }
    );

    const seasonData = seasonRes.data?.data?.attributes?.gameModeStats;
    const soloStats = seasonData?.['squad-fpp'] || seasonData?.['squad'] || {};

    const stats = {
      player_id: playerId,
      kills: soloStats.kills || 0,
      deaths: soloStats.losses || 0,
      wins: soloStats.wins || 0,
      matches: soloStats.roundsPlayed || 0,
      kd_ratio: soloStats.kills && soloStats.losses
        ? (soloStats.kills / soloStats.losses).toFixed(2)
        : '0.00',
      win_rate: soloStats.roundsPlayed
        ? ((soloStats.wins / soloStats.roundsPlayed) * 100).toFixed(1)
        : '0.0',
      damage: Math.round(soloStats.damageDealt || 0),
    };

    // Update DB
    await db.query(
      `UPDATE game_identities SET
       is_verified = TRUE,
       api_stats = ?,
       last_synced = NOW()
       WHERE user_id = ? AND game_name = 'PUBG'`,
      [JSON.stringify(stats), userId]
    );

    res.status(200).json({
      success: true,
      message: 'PUBG stats synced!',
      stats
    });

  } catch (error) {
    console.error('PUBG Sync Error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to sync PUBG stats!'
    });
  }
};

// ============================================
// SYNC VALORANT STATS
// POST /api/game-identities/sync/valorant
// ============================================
export const syncValorant = async (req, res) => {
  try {
    const { game_username } = req.body;
    const userId = req.user.id;

    // Split name#tag
    const parts = game_username.split('#');
    if (parts.length !== 2) {
      return res.status(400).json({
        success: false,
        message: 'Valorant ID must be in format: Username#Tag (e.g. Roni#LK1)'
      });
    }

    const [name, tag] = parts;

    // Get account info
    const accountRes = await axios.get(
      `https://asia.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`,
      {
        headers: { 'X-Riot-Token': process.env.RIOT_API_KEY }
      }
    );

    const puuid = accountRes.data?.puuid;
    if (!puuid) {
      return res.status(404).json({
        success: false,
        message: 'Valorant account not found!'
      });
    }

    // Get ranked info
    let rankInfo = {};
    try {
      const rankRes = await axios.get(
        `https://ap.api.riotgames.com/val/ranked/v1/leaderboards/by-act/current?size=1&startIndex=0`,
        { headers: { 'X-Riot-Token': process.env.RIOT_API_KEY } }
      );
      rankInfo = rankRes.data || {};
    } catch (e) {
      console.log('Rank fetch skipped');
    }

    const stats = {
      puuid,
      gameName: name,
      tagLine: tag,
      rank: rankInfo.tierDetails?.tierName || 'Unranked',
    };

    // Update DB
    await db.query(
      `UPDATE game_identities SET
       is_verified = TRUE,
       api_stats = ?,
       last_synced = NOW()
       WHERE user_id = ? AND game_name = 'Valorant'`,
      [JSON.stringify(stats), userId]
    );

    res.status(200).json({
      success: true,
      message: 'Valorant account verified!',
      stats
    });

  } catch (error) {
    console.error('Valorant Sync Error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to verify Valorant account!'
    });
  }
};