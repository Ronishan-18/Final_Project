import db from '../config/db.js';
import { createNotification } from './notification.controller.js';

// ── SEND FRIEND REQUEST ──
export const sendFriendRequest = async (req, res) => {
  try {
    const requesterId = req.user.id;
    const { username } = req.body;

    if (!username) return res.status(400).json({ success: false, message: 'Username is required!' });

    const [users] = await db.query('SELECT id, username FROM users WHERE username = ?', [username]);
    if (!users.length) return res.status(404).json({ success: false, message: 'Player not found!' });

    const receiverId = users[0].id;
    if (receiverId === requesterId) return res.status(400).json({ success: false, message: 'Cannot send friend request to yourself!' });

    // Check existing friendship in either direction
    const [existing] = await db.query(
      `SELECT * FROM friendships
       WHERE (requester_id = ? AND receiver_id = ?) OR (requester_id = ? AND receiver_id = ?)`,
      [requesterId, receiverId, receiverId, requesterId]
    );

    let friendshipId;
    if (existing.length) {
      const f = existing[0];
      if (f.status === 'accepted') return res.status(400).json({ success: false, message: 'Already friends!' });
      if (f.status === 'pending') return res.status(400).json({ success: false, message: 'Friend request already sent!' });
      if (f.status === 'blocked') return res.status(400).json({ success: false, message: 'Cannot send request!' });
      // If declined, allow resend
      await db.query('UPDATE friendships SET status = ?, updated_at = NOW() WHERE id = ?', ['pending', f.id]);
      friendshipId = f.id;
    } else {
      const [result] = await db.query(
        'INSERT INTO friendships (requester_id, receiver_id, status) VALUES (?, ?, ?)',
        [requesterId, receiverId, 'pending']
      );
      friendshipId = result.insertId;
    }

    // Get requester username for notification
    const [[requester]] = await db.query('SELECT username FROM users WHERE id = ?', [requesterId]);

    await createNotification(
      receiverId,
      'friend_request',
      '👥 Friend Request',
      `${requester.username} sent you a friend request.`,
      { type: 'friend_request', requester_id: requesterId, requester_username: requester.username, friendship_id: friendshipId }
    );

    res.json({ success: true, message: `Friend request sent to ${username}!` });
  } catch (error) {
    console.error('Send Friend Request Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── RESPOND TO FRIEND REQUEST ──
export const respondToFriendRequest = async (req, res) => {
  try {
    const receiverId = req.user.id;
    const { friendship_id, requester_id, action, notification_id } = req.body;

    if (!['accept', 'decline'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Invalid action!' });
    }

    // Try finding by friendship_id first, then fallback to requester_id
    let friendships = [];
    if (friendship_id) {
      [friendships] = await db.query(
        "SELECT * FROM friendships WHERE id = ? AND receiver_id = ?",
        [friendship_id, receiverId]
      );
    } else if (requester_id) {
      [friendships] = await db.query(
        "SELECT * FROM friendships WHERE requester_id = ? AND receiver_id = ?",
        [requester_id, receiverId]
      );
    }

    if (!friendships.length) {
      return res.status(404).json({ success: false, message: 'Friend request not found!' });
    }

    const friendship = friendships[0];
    const fId = friendship.id;

    // If already processed, just return success
    if (friendship.status !== 'pending') {
      // Still try to mark notification as acted if it was missed
      if (notification_id) {
        await db.query('UPDATE notifications SET is_acted = TRUE WHERE id = ?', [notification_id]);
      }
      return res.json({ 
        success: true, 
        message: friendship.status === 'accepted' ? 'Already accepted!' : 'Already declined.' 
      });
    }

    const newStatus = action === 'accept' ? 'accepted' : 'declined';
    await db.query('UPDATE friendships SET status = ?, updated_at = NOW() WHERE id = ?', [newStatus, fId]);

    // Mark notification as acted upon if ID provided
    if (notification_id) {
      await db.query('UPDATE notifications SET is_acted = TRUE WHERE id = ?', [notification_id]);
    } else {
      // Fallback: try to find it by data
      await db.query(
        "UPDATE notifications SET is_acted = TRUE WHERE type = 'friend_request' AND user_id = ? AND (JSON_EXTRACT(data, '$.friendship_id') = ? OR JSON_EXTRACT(data, '$.requester_id') = ?)",
        [receiverId, fId, requester_id]
      );
    }

    if (action === 'accept') {
      const [[receiver]] = await db.query('SELECT username FROM users WHERE id = ?', [receiverId]);
      await createNotification(
        friendship.requester_id,
        'friend_accepted',
        '👥 Friend Request Accepted',
        `${receiver.username} accepted your friend request!`,
        { type: 'friend_accepted', user_id: receiverId }
      );
    }

    res.json({ success: true, message: action === 'accept' ? 'Friend request accepted!' : 'Friend request declined.' });
  } catch (error) {
    console.error('Respond to Friend Request Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── GET MY FRIENDS ──
export const getMyFriends = async (req, res) => {
  try {
    const userId = req.user.id;
    const [friends] = await db.query(
      `SELECT
        f.id as friendship_id,
        f.created_at as friends_since,
        CASE WHEN f.requester_id = ? THEN f.receiver_id ELSE f.requester_id END as friend_id,
        u.username, u.role, u.last_seen,
        p.full_name, p.avatar, p.country
       FROM friendships f
       JOIN users u ON u.id = CASE WHEN f.requester_id = ? THEN f.receiver_id ELSE f.requester_id END
       LEFT JOIN profiles p ON p.user_id = u.id
       WHERE (f.requester_id = ? OR f.receiver_id = ?) AND f.status = 'accepted'
       ORDER BY u.username ASC`,
      [userId, userId, userId, userId]
    );
    res.json({ success: true, friends });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── GET PENDING REQUESTS ──
export const getPendingRequests = async (req, res) => {
  try {
    const userId = req.user.id;
    const [received] = await db.query(
      `SELECT f.id as friendship_id, f.created_at,
        u.id as requester_id, u.username, p.full_name, p.avatar
       FROM friendships f
       JOIN users u ON u.id = f.requester_id
       LEFT JOIN profiles p ON p.user_id = u.id
       WHERE f.receiver_id = ? AND f.status = 'pending'
       ORDER BY f.created_at DESC`,
      [userId]
    );
    const [sent] = await db.query(
      `SELECT f.id as friendship_id, f.created_at,
        u.id as receiver_id, u.username, p.full_name, p.avatar
       FROM friendships f
       JOIN users u ON u.id = f.receiver_id
       LEFT JOIN profiles p ON p.user_id = u.id
       WHERE f.requester_id = ? AND f.status = 'pending'
       ORDER BY f.created_at DESC`,
      [userId]
    );
    res.json({ success: true, received, sent });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── REMOVE FRIEND ──
export const removeFriend = async (req, res) => {
  try {
    const userId = req.user.id;
    const { friendship_id } = req.params;
    await db.query(
      'DELETE FROM friendships WHERE id = ? AND (requester_id = ? OR receiver_id = ?)',
      [friendship_id, userId, userId]
    );
    res.json({ success: true, message: 'Friend removed.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── GET FRIENDSHIP STATUS WITH A USER ──
export const getFriendshipStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const { targetId } = req.params;
    const [rows] = await db.query(
      `SELECT * FROM friendships
       WHERE (requester_id = ? AND receiver_id = ?) OR (requester_id = ? AND receiver_id = ?)`,
      [userId, targetId, targetId, userId]
    );
    if (!rows.length) return res.json({ success: true, status: 'none', friendship_id: null });
    res.json({ success: true, status: rows[0].status, friendship_id: rows[0].id, is_requester: rows[0].requester_id === userId });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};