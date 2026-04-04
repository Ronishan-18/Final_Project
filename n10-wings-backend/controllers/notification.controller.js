import db from '../config/db.js';

// Get all notifications for logged-in user
export const getNotifications = async (req, res) => {
  try {
    const [notifications] = await db.query(
      `SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50`,
      [req.user.id]
    );
    const [[{ notifCount }]] = await db.query(
      `SELECT COUNT(*) as notifCount FROM notifications WHERE user_id = ? AND is_read = FALSE`,
      [req.user.id]
    );
    const [[{ msgCount }]] = await db.query(
      `SELECT COUNT(*) as msgCount FROM messages WHERE receiver_id = ? AND is_read = FALSE`,
      [req.user.id]
    );
    
    res.json({ 
      success: true, 
      notifications, 
      unreadCount: notifCount,
      unreadMessages: msgCount,
      totalUnread: notifCount + msgCount
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Mark one as read
export const markAsRead = async (req, res) => {
  try {
    await db.query(
      `UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?`,
      [req.params.id, req.user.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Mark all as read
export const markAllAsRead = async (req, res) => {
  try {
    await db.query(
      `UPDATE notifications SET is_read = TRUE WHERE user_id = ?`,
      [req.user.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Helper — create a notification (used internally by other controllers)
export const createNotification = async (userId, type, title, message, data = null) => {
  await db.query(
    `INSERT INTO notifications (user_id, type, title, message, data) VALUES (?, ?, ?, ?, ?)`,
    [userId, type, title, message, data ? JSON.stringify(data) : null]
  );
};

// Helper — notify ALL users (for tournament launched)
export const notifyAllUsers = async (type, title, message, data = null) => {
  const [users] = await db.query(`SELECT id FROM users WHERE is_active = TRUE AND is_verified = TRUE`);
  const values = users.map(u => [u.id, type, title, message, data ? JSON.stringify(data) : null]);
  if (values.length === 0) return;
  await db.query(
    `INSERT INTO notifications (user_id, type, title, message, data) VALUES ?`,
    [values]
  );
};