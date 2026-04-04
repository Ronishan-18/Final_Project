import db from '../config/db.js';

// ── GET CHAT HISTORY WITH A FRIEND ──
export const getChatHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { friendId } = req.params;

    // SECURITY: verify they are actually friends
    const [friendship] = await db.query(
      `SELECT id FROM friendships
       WHERE ((requester_id = ? AND receiver_id = ?) OR (requester_id = ? AND receiver_id = ?))
       AND status = 'accepted'`,
      [userId, friendId, friendId, userId]
    );
    if (!friendship.length) {
      return res.status(403).json({ success: false, message: 'You are not friends with this user!' });
    }

    const [messages] = await db.query(
      `SELECT m.*, u.username as sender_username, p.avatar as sender_avatar
       FROM messages m
       JOIN users u ON u.id = m.sender_id
       LEFT JOIN profiles p ON p.user_id = m.sender_id
       WHERE (m.sender_id = ? AND m.receiver_id = ?) OR (m.sender_id = ? AND m.receiver_id = ?)
       ORDER BY m.created_at ASC
       LIMIT 100`,
      [userId, friendId, friendId, userId]
    );

    // Mark messages from friend as read
    await db.query(
      'UPDATE messages SET is_read = TRUE WHERE sender_id = ? AND receiver_id = ? AND is_read = FALSE',
      [friendId, userId]
    );

    res.json({ success: true, messages });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── GET ALL CONVERSATIONS (friends list with last message) ──
export const getConversations = async (req, res) => {
  try {
    const userId = req.user.id;

    const [friends] = await db.query(
      `SELECT
        CASE WHEN f.requester_id = ? THEN f.receiver_id ELSE f.requester_id END as friend_id,
        u.username, p.full_name, p.avatar,
        (SELECT content FROM messages
         WHERE (sender_id = ? AND receiver_id = u.id) OR (sender_id = u.id AND receiver_id = ?)
         ORDER BY created_at DESC LIMIT 1) as last_message,
        (SELECT created_at FROM messages
         WHERE (sender_id = ? AND receiver_id = u.id) OR (sender_id = u.id AND receiver_id = ?)
         ORDER BY created_at DESC LIMIT 1) as last_message_at,
        (SELECT COUNT(*) FROM messages
         WHERE sender_id = u.id AND receiver_id = ? AND is_read = FALSE) as unread_count
       FROM friendships f
       JOIN users u ON u.id = CASE WHEN f.requester_id = ? THEN f.receiver_id ELSE f.requester_id END
       LEFT JOIN profiles p ON p.user_id = u.id
       WHERE (f.requester_id = ? OR f.receiver_id = ?) AND f.status = 'accepted'
       ORDER BY last_message_at DESC`,
      [userId, userId, userId, userId, userId, userId, userId, userId, userId]
    );

    res.json({ success: true, conversations: friends });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── GET TOTAL UNREAD COUNT ──
export const getUnreadCount = async (req, res) => {
  try {
    const [[{ count }]] = await db.query(
      'SELECT COUNT(*) as count FROM messages WHERE receiver_id = ? AND is_read = FALSE',
      [req.user.id]
    );
    res.json({ success: true, unread: count });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};