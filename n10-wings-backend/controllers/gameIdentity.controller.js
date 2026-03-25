import db from '../config/db.js';
import axios from 'axios';

// ============================================
// GET SUPPORTED GAMES
// ============================================
export const getSupportedGames = (req, res) => {
  const games = [
    // ── API GAMES ──
    {
      id: 'pubg_pc',
      name: 'PUBG PC',
      category: 'api',
      icon: '🎯',
      color: '#F5A623',
      platform: 'PC',
      placeholder: 'Enter Steam username',
      hint: 'Your exact PUBG PC in-game name on Steam',
      stats_info: 'K/D, Kills, Wins, Win Rate, Damage'
    },
    {
      id: 'valorant',
      name: 'Valorant',
      category: 'api',
      icon: '⚡',
      color: '#FF4655',
      platform: 'PC',
      placeholder: 'Enter Riot ID (e.g. Roni#LK1)',
      hint: 'Format: Username#TagLine — found top right in-game',
      stats_info: 'Rank, Verified Account'
    },
    {
      id: 'league_of_legends',
      name: 'League of Legends',
      category: 'api',
      icon: '🗡️',
      color: '#C89B3C',
      platform: 'PC',
      placeholder: 'Enter Riot ID (e.g. Roni#LK1)',
      hint: 'Format: Username#TagLine — same as Valorant Riot ID',
      stats_info: 'Rank, LP, Wins, Losses, Win Rate, Level'
    },
    // ── MANUAL GAMES ──
    {
      id: 'pubg_mobile',
      name: 'PUBG Mobile',
      category: 'manual',
      icon: '📱',
      color: '#F5A623',
      platform: 'Mobile',
      placeholder: 'Enter Player ID',
      hint: 'Your PUBG Mobile Player ID (found in your profile)'
    },
    {
      id: 'freefire',
      name: 'Free Fire',
      category: 'manual',
      icon: '🔥',
      color: '#FF6B00',
      platform: 'Mobile',
      placeholder: 'Enter Player ID',
      hint: 'Your Free Fire Player ID'
    },
    {
      id: 'mobilelegends',
      name: 'Mobile Legends',
      category: 'manual',
      icon: '⚔️',
      color: '#1890FF',
      platform: 'Mobile',
      placeholder: 'Enter Player ID',
      hint: 'Your Mobile Legends Player ID'
    },
    {
      id: 'codmobile',
      name: 'COD Mobile',
      category: 'manual',
      icon: '💥',
      color: '#4CAF50',
      platform: 'Mobile',
      placeholder: 'Enter username',
      hint: 'Your COD Mobile username'
    },
    {
      id: 'fortnite',
      name: 'Fortnite',
      category: 'manual',
      icon: '🌀',
      color: '#9C27B0',
      platform: 'PC/Console',
      placeholder: 'Enter Epic Games username',
      hint: 'Your Fortnite display name'
    },
    {
      id: 'minecraft',
      name: 'Minecraft',
      category: 'manual',
      icon: '⛏️',
      color: '#8B6914',
      platform: 'PC/Mobile',
      placeholder: 'Enter Minecraft username',
      hint: 'Your Minecraft Java/Bedrock username'
    },
    {
      id: 'other',
      name: 'Other Game',
      category: 'manual',
      icon: '🎮',
      color: '#8892A4',
      platform: 'Any',
      placeholder: 'Enter username or Player ID',
      hint: 'Enter your username or ID in this game'
    },
  ];
  res.status(200).json({ success: true, games });
};

// ============================================
// GET MY GAME IDENTITIES
// ============================================
export const getMyGameIdentities = async (req, res) => {
  try {
    const [identities] = await db.query(
      'SELECT * FROM game_identities WHERE user_id = ? ORDER BY game_type ASC, created_at DESC',
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
// ============================================
export const getUserGameIdentities = async (req, res) => {
  try {
    const [identities] = await db.query(
      'SELECT * FROM game_identities WHERE user_id = ? ORDER BY game_type ASC, created_at DESC',
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
// ============================================
export const upsertGameIdentity = async (req, res) => {
  try {
    const userId = req.user.id;
    const { game_id, game_name, game_username, custom_game_name } = req.body;

    const finalGameName = game_id === 'other'
      ? custom_game_name?.trim()
      : game_name;

    if (!finalGameName || !game_username?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Game name and username are required!'
      });
    }

    const apiGames = ['pubg_pc', 'valorant', 'league_of_legends'];
    const gameType = apiGames.includes(game_id) ? 'api' : 'manual';

    const [existing] = await db.query(
      'SELECT id FROM game_identities WHERE user_id = ? AND game_name = ?',
      [userId, finalGameName]
    );

    if (existing.length > 0) {
      await db.query(
        `UPDATE game_identities SET
         game_username = ?,
         game_type = ?,
         is_verified = FALSE,
         last_synced = NULL,
         api_stats = NULL,
         updated_at = NOW()
         WHERE user_id = ? AND game_name = ?`,
        [game_username.trim(), gameType, userId, finalGameName]
      );
    } else {
      await db.query(
        `INSERT INTO game_identities
         (user_id, game_name, game_type, game_username)
         VALUES (?, ?, ?, ?)`,
        [userId, finalGameName, gameType, game_username.trim()]
      );
    }

    res.status(200).json({ success: true, message: 'Game identity saved!' });

  } catch (error) {
    console.error('Upsert Game Identity Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ============================================
// DELETE GAME IDENTITY
// ============================================
export const deleteGameIdentity = async (req, res) => {
  try {
    await db.query(
      'DELETE FROM game_identities WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    res.status(200).json({ success: true, message: 'Game identity removed!' });
  } catch (error) {
    console.error('Delete Game Identity Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ============================================
// SYNC PUBG PC
// ============================================
export const syncPUBG = async (req, res) => {
  try {
    const { game_username } = req.body;
    const userId = req.user.id;

    if (!game_username?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please enter your PUBG PC Steam username!'
      });
    }

    console.log(`🔍 Searching PUBG player: ${game_username}`);

    let player = null;
    try {
      const response = await axios.get(
        `https://api.pubg.com/shards/steam/players?filter[playerNames]=${encodeURIComponent(game_username.trim())}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.PUBG_API_KEY}`,
            Accept: 'application/vnd.api+json'
          }
        }
      );
      player = response.data?.data?.[0];
    } catch (e) {
      console.log('PUBG API error:', e.response?.data || e.message);
    }

    if (!player) {
      return res.status(404).json({
        success: false,
        message: 'PUBG PC player not found! Make sure you entered your exact Steam username.'
      });
    }

    const playerId = player.id;
    console.log(`✅ Found PUBG player: ${playerId}`);

    let stats = {
      player_id: playerId,
      kills: 0,
      wins: 0,
      matches: 0,
      losses: 0,
      kd_ratio: '0.00',
      win_rate: '0.0',
      damage: 0,
      top10s: 0,
      synced_at: new Date().toISOString()
    };

    try {
      const seasonRes = await axios.get(
        `https://api.pubg.com/shards/steam/players/${playerId}/seasons/division.bro.official.pc-2018-29`,
        {
          headers: {
            Authorization: `Bearer ${process.env.PUBG_API_KEY}`,
            Accept: 'application/vnd.api+json'
          }
        }
      );

      const gameModeStats = seasonRes.data?.data?.attributes?.gameModeStats;
      const s = gameModeStats?.['squad-fpp'] ||
                gameModeStats?.['squad'] ||
                gameModeStats?.['solo-fpp'] ||
                gameModeStats?.['solo'] || {};

      stats = {
        ...stats,
        kills: s.kills || 0,
        wins: s.wins || 0,
        matches: s.roundsPlayed || 0,
        losses: s.losses || 0,
        kd_ratio: s.losses > 0
          ? (s.kills / s.losses).toFixed(2)
          : '0.00',
        win_rate: s.roundsPlayed > 0
          ? ((s.wins / s.roundsPlayed) * 100).toFixed(1)
          : '0.0',
        damage: Math.round(s.damageDealt || 0),
        top10s: s.top10s || 0,
      };
    } catch (e) {
      console.log('⚠️ Season stats unavailable:', e.message);
    }

    await db.query(
      `UPDATE game_identities SET
       is_verified = TRUE, api_stats = ?, last_synced = NOW()
       WHERE user_id = ? AND game_name = 'PUBG PC'`,
      [JSON.stringify(stats), userId]
    );

    res.status(200).json({
      success: true,
      message: 'PUBG PC stats synced!',
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
// SYNC VALORANT
// ============================================
export const syncValorant = async (req, res) => {
  try {
    const { game_username } = req.body;
    const userId = req.user.id;

    if (!game_username?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please enter your Riot ID!'
      });
    }

    const parts = game_username.trim().split('#');
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      return res.status(400).json({
        success: false,
        message: 'Format must be: Username#Tag (e.g. Roni#LK1)'
      });
    }

    const [name, tag] = parts;
    console.log(`🔍 Searching Valorant: ${name}#${tag}`);

    const accountRes = await axios.get(
      `https://asia.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`,
      { headers: { 'X-Riot-Token': process.env.RIOT_API_KEY } }
    );

    const puuid = accountRes.data?.puuid;
    if (!puuid) {
      return res.status(404).json({
        success: false,
        message: 'Valorant account not found!'
      });
    }

    const stats = {
      puuid,
      gameName: accountRes.data.gameName,
      tagLine: accountRes.data.tagLine,
      rank: 'Check in-game',
      synced_at: new Date().toISOString()
    };

    await db.query(
      `UPDATE game_identities SET
       is_verified = TRUE, api_stats = ?, last_synced = NOW()
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
    if (error.response?.status === 404) {
      return res.status(404).json({
        success: false,
        message: 'Valorant account not found! Check format: Name#Tag'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to verify Valorant account!'
    });
  }
};

// ============================================
// SYNC LEAGUE OF LEGENDS
// ============================================
export const syncLoL = async (req, res) => {
  try {
    const { game_username } = req.body;
    const userId = req.user.id;

    if (!game_username?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please enter your Riot ID!'
      });
    }

    const parts = game_username.trim().split('#');
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      return res.status(400).json({
        success: false,
        message: 'Format must be: Username#Tag (e.g. Roni#LK1)'
      });
    }

    const [name, tag] = parts;
    console.log(`🔍 Searching LoL: ${name}#${tag}`);

    const accountRes = await axios.get(
      `https://asia.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`,
      { headers: { 'X-Riot-Token': process.env.RIOT_API_KEY } }
    );

    const puuid = accountRes.data?.puuid;
    if (!puuid) {
      return res.status(404).json({
        success: false,
        message: 'League of Legends account not found!'
      });
    }

    let stats = {
      puuid,
      gameName: accountRes.data.gameName,
      tagLine: accountRes.data.tagLine,
      summoner_level: 0,
      tier: 'Unranked',
      rank: '',
      lp: 0,
      wins: 0,
      losses: 0,
      win_rate: '0.0',
      synced_at: new Date().toISOString()
    };

    try {
      const summonerRes = await axios.get(
        `https://sg2.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`,
        { headers: { 'X-Riot-Token': process.env.RIOT_API_KEY } }
      );

      stats.summoner_level = summonerRes.data.summonerLevel || 0;

      const rankedRes = await axios.get(
        `https://sg2.api.riotgames.com/lol/league/v4/entries/by-summoner/${summonerRes.data.id}`,
        { headers: { 'X-Riot-Token': process.env.RIOT_API_KEY } }
      );

      const soloQueue = rankedRes.data?.find(
        e => e.queueType === 'RANKED_SOLO_5x5'
      );

      if (soloQueue) {
        stats.tier = soloQueue.tier;
        stats.rank = soloQueue.rank;
        stats.lp = soloQueue.leaguePoints;
        stats.wins = soloQueue.wins;
        stats.losses = soloQueue.losses;
        stats.win_rate = soloQueue.wins + soloQueue.losses > 0
          ? ((soloQueue.wins / (soloQueue.wins + soloQueue.losses)) * 100).toFixed(1)
          : '0.0';
      }
    } catch (e) {
      console.log('⚠️ LoL ranked data unavailable:', e.message);
    }

    await db.query(
      `UPDATE game_identities SET
       is_verified = TRUE, api_stats = ?, last_synced = NOW()
       WHERE user_id = ? AND game_name = 'League of Legends'`,
      [JSON.stringify(stats), userId]
    );

    res.status(200).json({
      success: true,
      message: 'League of Legends stats synced!',
      stats
    });

  } catch (error) {
    console.error('LoL Sync Error:', error.response?.data || error.message);
    if (error.response?.status === 404) {
      return res.status(404).json({
        success: false,
        message: 'League of Legends account not found!'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to sync LoL stats!'
    });
  }
};