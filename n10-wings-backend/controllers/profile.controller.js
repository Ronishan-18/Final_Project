import db from '../config/db.js';

// ============================================
// GET MY PROFILE
// GET /api/profile/me
// ============================================
export const getMyProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const [users] = await db.query(
      `SELECT id, username, email, role,
       is_organizer, organizer_status, created_at
       FROM users WHERE id = ?`,
      [userId]
    );

    const [profiles] = await db.query(
      'SELECT * FROM profiles WHERE user_id = ?', [userId]
    );

    const [gamerProfiles] = await db.query(
      'SELECT * FROM gamer_profiles WHERE user_id = ?', [userId]
    );

    let organizerProfile = null;
    if (req.user.is_organizer) {
      const [rows] = await db.query(
        'SELECT * FROM organizer_profiles WHERE user_id = ?', [userId]
      );
      organizerProfile = rows[0] || null;
    }

    let sponsorProfile = null;
    if (req.user.role === 'sponsor') {
      const [rows] = await db.query(
        'SELECT * FROM sponsor_profiles WHERE user_id = ?', [userId]
      );
      sponsorProfile = rows[0] || null;
    }

    const [gameIdentities] = await db.query(
      'SELECT * FROM game_identities WHERE user_id = ?', [userId]
    );

    res.status(200).json({
      success: true,
      user: users[0],
      profile: profiles[0] || null,
      gamerProfile: gamerProfiles[0] || null,
      organizerProfile,
      sponsorProfile,
      gameIdentities
    });

  } catch (error) {
    console.error('Get My Profile Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ============================================
// UPDATE MY PROFILE
// PUT /api/profile/me
// ============================================
export const updateMyProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      // Account Info
      first_name, last_name, gender, nic_passport,
      // Personal Info
      full_name, bio, avatar, date_of_birth, country, city, phone, address, nickname,
      // Social/Game Links & IDs
      social_facebook, social_instagram, social_youtube, social_twitter,
      social_google, social_steam, social_discord,
      arena_of_valor_id, cricket_sixes_id, minecraft_id, krunker_id,
      fifa_mobile_id, honor_of_kings_id, identity_v_id,
      // Gamer Specific
      game_preferences, player_rank, playstyle,
      // Organizer
      organization_name, experience_years, website,
      // Sponsor
      company_name, industry, budget_range, interests
    } = req.body;

    // --- PROPER VALIDATION ---
    if (phone && !/^\+?[0-9]{10,15}$/.test(phone)) {
        return res.status(400).json({ success: false, message: 'Invalid phone number format!' });
    }

    if (nic_passport && nic_passport.length < 5) {
        return res.status(400).json({ success: false, message: 'NIC/Passport should be at least 5 characters!' });
    }

    // Update common profile
    const dateOfBirth = date_of_birth && date_of_birth !== '' ? date_of_birth : null;
    const socialFacebook = social_facebook && social_facebook !== '' ? social_facebook : null;
    const socialInstagram = social_instagram && social_instagram !== '' ? social_instagram : null;
    const socialYoutube = social_youtube && social_youtube !== '' ? social_youtube : null;
    const socialTwitter = social_twitter && social_twitter !== '' ? social_twitter : null;
    const socialGoogle = social_google && social_google !== '' ? social_google : null;
    const socialSteam = social_steam && social_steam !== '' ? social_steam : null;
    const socialDiscord = social_discord && social_discord !== '' ? social_discord : null;

    await db.query(
      `UPDATE profiles SET
       full_name = COALESCE(?, full_name),
       first_name = COALESCE(?, first_name),
       last_name = COALESCE(?, last_name),
       bio = COALESCE(?, bio),
       avatar = COALESCE(?, avatar),
       date_of_birth = COALESCE(?, date_of_birth),
       gender = COALESCE(?, gender),
       nic_passport = COALESCE(?, nic_passport),
       country = COALESCE(?, country),
       city = COALESCE(?, city),
       phone = COALESCE(?, phone),
       address = COALESCE(?, address),
       nickname = COALESCE(?, nickname),
       social_facebook = COALESCE(?, social_facebook),
       social_instagram = COALESCE(?, social_instagram),
       social_youtube = COALESCE(?, social_youtube),
       social_twitter = COALESCE(?, social_twitter),
       social_google = COALESCE(?, social_google),
       social_steam = COALESCE(?, social_steam),
       social_discord = COALESCE(?, social_discord),
       arena_of_valor_id = COALESCE(?, arena_of_valor_id),
       cricket_sixes_id = COALESCE(?, cricket_sixes_id),
       minecraft_id = COALESCE(?, minecraft_id),
       krunker_id = COALESCE(?, krunker_id),
       fifa_mobile_id = COALESCE(?, fifa_mobile_id),
       honor_of_kings_id = COALESCE(?, honor_of_kings_id),
       identity_v_id = COALESCE(?, identity_v_id)
       WHERE user_id = ?`,
      [
        full_name || null, first_name || null, last_name || null,
        bio || null, avatar || null, dateOfBirth, gender || null, nic_passport || null,
        country || null, city || null, phone || null, address || null, nickname || null,
        socialFacebook, socialInstagram, socialYoutube, socialTwitter,
        socialGoogle, socialSteam, socialDiscord,
        arena_of_valor_id || null, cricket_sixes_id || null, minecraft_id || null,
        krunker_id || null, fifa_mobile_id || null, honor_of_kings_id || null,
        identity_v_id || null,
        userId
      ]
    );

    // Update gamer profile
    await db.query(
      `UPDATE gamer_profiles SET
       game_preferences = COALESCE(?, game_preferences),
       player_rank = COALESCE(?, player_rank),
       playstyle = COALESCE(?, playstyle)
       WHERE user_id = ?`,
      [game_preferences, player_rank, playstyle, userId]
    );

    // Update organizer profile
    if (req.user.is_organizer) {
      const [existing] = await db.query(
        'SELECT id FROM organizer_profiles WHERE user_id = ?', [userId]
      );

      if (existing.length > 0) {
        await db.query(
          `UPDATE organizer_profiles SET
           organization_name = COALESCE(?, organization_name),
           experience_years = COALESCE(?, experience_years),
           website = COALESCE(?, website),
           bio = COALESCE(?, bio)
           WHERE user_id = ?`,
          [organization_name, experience_years, website, bio, userId]
        );
      } else {
        await db.query(
          `INSERT INTO organizer_profiles
           (user_id, organization_name, experience_years, website)
           VALUES (?, ?, ?, ?)`,
          [userId, organization_name, experience_years || 0, website]
        );
      }
    }

    // Update sponsor profile
    if (req.user.role === 'sponsor') {
      await db.query(
        `UPDATE sponsor_profiles SET
         company_name = COALESCE(?, company_name),
         industry = COALESCE(?, industry),
         budget_range = COALESCE(?, budget_range),
         interests = COALESCE(?, interests),
         website = COALESCE(?, website)
         WHERE user_id = ?`,
        [company_name, industry, budget_range, interests, website, userId]
      );
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully!'
    });

  } catch (error) {
    console.error('Update Profile Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ============================================
// GET PROFILE BY ID (Public)
// GET /api/profile/:id
// ============================================
export const getProfileById = async (req, res) => {
  try {
    const { id } = req.params;

    const [users] = await db.query(
      `SELECT id, username, role,
       is_organizer, created_at
       FROM users WHERE id = ? AND is_active = TRUE`,
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found!' });
    }

    const user = users[0];

    const [profiles] = await db.query(
      'SELECT * FROM profiles WHERE user_id = ?', [id]
    );

    const [gamerProfiles] = await db.query(
      'SELECT * FROM gamer_profiles WHERE user_id = ?', [id]
    );

    const [gameIdentities] = await db.query(
      'SELECT * FROM game_identities WHERE user_id = ?', [id]
    );

    let organizerProfile = null;
    if (user.is_organizer) {
      const [rows] = await db.query(
        'SELECT * FROM organizer_profiles WHERE user_id = ?', [id]
      );
      organizerProfile = rows[0] || null;
    }

    res.status(200).json({
      success: true,
      user,
      profile: profiles[0] || null,
      gamerProfile: gamerProfiles[0] || null,
      organizerProfile,
      gameIdentities
    });

  } catch (error) {
    console.error('Get Profile By ID Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ============================================
// SEARCH GAMERS (Public)
// GET /api/profile/search
// ============================================
export const searchGamers = async (req, res) => {
  try {
    const { game, rank, country, username } = req.query;

    let query = `
      SELECT
        u.id, u.username, u.role,
        u.is_organizer, u.created_at,
        p.full_name, p.avatar, p.country,
        gp.game_preferences, gp.player_rank,
        gp.playstyle, gp.wins, gp.losses,
        gp.points, gp.tournaments_played
      FROM users u
      LEFT JOIN profiles p ON u.id = p.user_id
      LEFT JOIN gamer_profiles gp ON u.id = gp.user_id
      WHERE u.is_active = TRUE
      AND u.role = 'user'
    `;

    const params = [];

    if (game) {
      query += ' AND gp.game_preferences LIKE ?';
      params.push(`%${game}%`);
    }
    if (rank) {
      query += ' AND gp.player_rank LIKE ?';
      params.push(`%${rank}%`);
    }
    if (country) {
      query += ' AND p.country LIKE ?';
      params.push(`%${country}%`);
    }
    if (username) {
      query += ' AND u.username LIKE ?';
      params.push(`%${username}%`);
    }

    query += ' ORDER BY gp.points DESC';

    const [gamers] = await db.query(query, params);

    res.status(200).json({
      success: true,
      total: gamers.length,
      gamers
    });

  } catch (error) {
    console.error('Search Gamers Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ============================================
// APPLY FOR ORGANIZER
// POST /api/profile/apply-organizer
// ============================================
export const applyForOrganizer = async (req, res) => {
  try {
    const userId = req.user.id;

    const [users] = await db.query(
      'SELECT organizer_status FROM users WHERE id = ?', [userId]
    );

    if (users[0].organizer_status === 'pending') {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending application!'
      });
    }

    if (users[0].organizer_status === 'approved') {
      return res.status(400).json({
        success: false,
        message: 'You are already an organizer!'
      });
    }

    await db.query(
      `UPDATE users SET organizer_status = 'pending' WHERE id = ?`,
      [userId]
    );

    res.status(200).json({
      success: true,
      message: 'Organizer application submitted! Waiting for admin approval.'
    });

  } catch (error) {
    console.error('Apply Organizer Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};