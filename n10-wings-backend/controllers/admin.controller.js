import db from '../config/db.js';

// ============================================
// GET PLATFORM STATS
// GET /api/admin/stats
// ============================================
export const getPlatformStats = async (req, res) => {
  try {
    const [[{ total_users }]] = await db.query(`SELECT COUNT(*) as total_users FROM users`);
    const [[{ total_gamers }]] = await db.query(`SELECT COUNT(*) as total_gamers FROM users WHERE role = 'user'`);
    const [[{ total_sponsors }]] = await db.query(`SELECT COUNT(*) as total_sponsors FROM users WHERE role = 'sponsor'`);
    const [[{ total_organizers }]] = await db.query(`SELECT COUNT(*) as total_organizers FROM users WHERE is_organizer = TRUE`);
    const [[{ pending_applications }]] = await db.query(`SELECT COUNT(*) as pending_applications FROM users WHERE organizer_status = 'pending'`);
    const [[{ total_tournaments }]] = await db.query(`SELECT COUNT(*) as total_tournaments FROM tournaments`).catch(() => [[{ total_tournaments: 0 }]]);
    const [[{ total_teams }]] = await db.query(`SELECT COUNT(*) as total_teams FROM teams`).catch(() => [[{ total_teams: 0 }]]);
    const [[{ active_users }]] = await db.query(`SELECT COUNT(*) as active_users FROM users WHERE is_active = TRUE`);
    const [[{ suspended_users }]] = await db.query(`SELECT COUNT(*) as suspended_users FROM users WHERE is_active = FALSE`);
    const [[{ verified_users }]] = await db.query(`SELECT COUNT(*) as verified_users FROM users WHERE is_verified = TRUE`);

    // New users last 30 days
    const [[{ new_users_30d }]] = await db.query(
      `SELECT COUNT(*) as new_users_30d FROM users WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)`
    );

    // Monthly growth - last 6 months (GROUP BY must include SELECT expression)
    const [monthly_growth] = await db.query(`
      SELECT
        DATE_FORMAT(created_at, '%b %Y') as month,
        COUNT(*) as count
      FROM users
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(created_at, '%b %Y'), YEAR(created_at), MONTH(created_at)
      ORDER BY YEAR(created_at), MONTH(created_at)
    `);

    res.status(200).json({
      success: true,
      stats: {
        total_users,
        total_gamers,
        total_sponsors,
        total_organizers,
        pending_applications,
        total_tournaments,
        total_teams,
        active_users,
        suspended_users,
        verified_users,
        new_users_30d,
        monthly_growth,
      }
    });
  } catch (error) {
    console.error('Admin Stats Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ============================================
// GET ALL USERS (with search & filter)
// GET /api/admin/users
// ============================================
export const getAllUsers = async (req, res) => {
  try {
    const { search, role, status, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = `
      SELECT
        u.id, u.username, u.email, u.role,
        u.is_organizer, u.organizer_status,
        u.is_verified, u.is_active, u.created_at,
        p.full_name, p.avatar, p.country
      FROM users u
      LEFT JOIN profiles p ON u.id = p.user_id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += ` AND (u.username LIKE ? OR u.email LIKE ? OR p.full_name LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (role) {
      query += ` AND u.role = ?`;
      params.push(role);
    }
    if (status === 'active') {
      query += ` AND u.is_active = TRUE`;
    } else if (status === 'suspended') {
      query += ` AND u.is_active = FALSE`;
    } else if (status === 'unverified') {
      query += ` AND u.is_verified = FALSE`;
    }

    // Count total
    const countQuery = `SELECT COUNT(*) as total FROM (${query}) as sub`;
    const [[{ total }]] = await db.query(countQuery, params);

    query += ` ORDER BY u.created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), offset);

    const [users] = await db.query(query, params);

    res.status(200).json({
      success: true,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      users
    });
  } catch (error) {
    console.error('Admin Get Users Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ============================================
// SUSPEND / ACTIVATE USER
// PUT /api/admin/users/:id/suspend
// ============================================
export const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;

    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ success: false, message: 'Cannot suspend yourself!' });
    }

    const [users] = await db.query('SELECT is_active, role FROM users WHERE id = ?', [id]);
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found!' });
    }

    if (users[0].role === 'admin') {
      return res.status(400).json({ success: false, message: 'Cannot suspend another admin!' });
    }

    const newStatus = !users[0].is_active;
    await db.query('UPDATE users SET is_active = ? WHERE id = ?', [newStatus, id]);

    res.status(200).json({
      success: true,
      message: newStatus ? 'User activated!' : 'User suspended!',
      is_active: newStatus
    });
  } catch (error) {
    console.error('Toggle User Status Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ============================================
// CHANGE USER ROLE
// PUT /api/admin/users/:id/role
// ============================================
export const changeUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const validRoles = ['user', 'sponsor', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role!' });
    }

    await db.query('UPDATE users SET role = ? WHERE id = ?', [role, id]);

    res.status(200).json({ success: true, message: 'User role updated!' });
  } catch (error) {
    console.error('Change Role Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ============================================
// GET ORGANIZER APPLICATIONS
// GET /api/admin/organizer-applications
// ============================================
export const getOrganizerApplications = async (req, res) => {
  try {
    const { status = 'pending' } = req.query;

    const [applications] = await db.query(`
      SELECT
        u.id, u.username, u.email, u.created_at,
        u.organizer_status,
        p.full_name, p.avatar, p.country, p.bio
      FROM users u
      LEFT JOIN profiles p ON u.id = p.user_id
      WHERE u.organizer_status = ?
      ORDER BY u.created_at DESC
    `, [status]);

    res.status(200).json({
      success: true,
      total: applications.length,
      applications
    });
  } catch (error) {
    console.error('Get Applications Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ============================================
// APPROVE / REJECT ORGANIZER APPLICATION
// PUT /api/admin/organizer-applications/:id
// ============================================
export const handleOrganizerApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'approve' | 'reject'

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Invalid action!' });
    }

    if (action === 'approve') {
      await db.query(
        `UPDATE users SET
         organizer_status = 'approved',
         is_organizer = TRUE
         WHERE id = ?`,
        [id]
      );

      // Create organizer profile if not exists
      const [existing] = await db.query('SELECT id FROM organizer_profiles WHERE user_id = ?', [id]);
      if (existing.length === 0) {
        await db.query('INSERT INTO organizer_profiles (user_id) VALUES (?)', [id]);
      }

      res.status(200).json({ success: true, message: 'Organizer approved!' });
    } else {
      await db.query(
        `UPDATE users SET organizer_status = 'rejected' WHERE id = ?`,
        [id]
      );
      res.status(200).json({ success: true, message: 'Application rejected!' });
    }
  } catch (error) {
    console.error('Handle Application Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};