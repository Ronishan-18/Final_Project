import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import db from '../config/db.js';

// Track online users: Map<userId, socketId>
const onlineUsers = new Map();

export const initSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // ── SECURITY: Authenticate every socket connection with JWT ──
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.userId;
    console.log(`Socket connected: user ${userId}`);

    // Register user as online
    onlineUsers.set(userId, socket.id);

    // Join a personal room so we can emit to a user by userId
    socket.join(`user:${userId}`);

    // Notify all friends that this user is now online
    await broadcastOnlineStatus(io, userId, true);

    // ── SEND MESSAGE ──
    socket.on('send_message', async ({ receiver_id, content }) => {
      try {
        if (!receiver_id || !content?.trim()) return;

        // SECURITY: verify sender and receiver are friends
        const [friendship] = await db.query(
          `SELECT id FROM friendships
           WHERE ((requester_id = ? AND receiver_id = ?) OR (requester_id = ? AND receiver_id = ?))
           AND status = 'accepted'`,
          [userId, receiver_id, receiver_id, userId]
        );
        if (!friendship.length) {
          socket.emit('error', { message: 'You are not friends with this user!' });
          return;
        }

        // Save message to DB
        const [result] = await db.query(
          'INSERT INTO messages (sender_id, receiver_id, content) VALUES (?, ?, ?)',
          [userId, receiver_id, content.trim()]
        );

        const [[saved]] = await db.query(
          `SELECT m.*, u.username as sender_username, p.avatar as sender_avatar
           FROM messages m
           JOIN users u ON u.id = m.sender_id
           LEFT JOIN profiles p ON p.user_id = m.sender_id
           WHERE m.id = ?`,
          [result.insertId]
        );

        // Emit to receiver if online
        io.to(`user:${receiver_id}`).emit('new_message', saved);

        // Emit back to sender for confirmation
        socket.emit('message_sent', saved);
      } catch (error) {
        console.error('Socket send_message error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // ── MARK MESSAGES AS READ ──
    socket.on('mark_read', async ({ sender_id }) => {
      try {
        await db.query(
          'UPDATE messages SET is_read = TRUE WHERE sender_id = ? AND receiver_id = ? AND is_read = FALSE',
          [sender_id, userId]
        );
        // Notify sender their messages were read
        io.to(`user:${sender_id}`).emit('messages_read', { by: userId });
      } catch (error) {
        console.error('Socket mark_read error:', error);
      }
    });

    // ── TYPING INDICATOR ──
    socket.on('typing', ({ receiver_id, is_typing }) => {
      io.to(`user:${receiver_id}`).emit('user_typing', { user_id: userId, is_typing });
    });

    // ── GET ONLINE STATUS OF FRIENDS ──
    socket.on('get_online_friends', async () => {
      try {
        const [friends] = await db.query(
          `SELECT CASE WHEN requester_id = ? THEN receiver_id ELSE requester_id END as friend_id
           FROM friendships WHERE (requester_id = ? OR receiver_id = ?) AND status = 'accepted'`,
          [userId, userId, userId]
        );
        const onlineStatuses = {};
        friends.forEach(f => {
          onlineStatuses[f.friend_id] = onlineUsers.has(f.friend_id);
        });
        socket.emit('online_statuses', onlineStatuses);
      } catch (error) {
        console.error('Socket get_online_friends error:', error);
      }
    });

    // ── DISCONNECT ──
    socket.on('disconnect', async () => {
      console.log(`Socket disconnected: user ${userId}`);
      onlineUsers.delete(userId);
      await broadcastOnlineStatus(io, userId, false);
    });
  });

  return io;
};

// ── Broadcast online/offline status to all friends ──
const broadcastOnlineStatus = async (io, userId, isOnline) => {
  try {
    // If going offline, update last_seen timestamp
    if (!isOnline) {
      await db.query('UPDATE users SET last_seen = NOW() WHERE id = ?', [userId]);
    }

    const [friends] = await db.query(
      `SELECT CASE WHEN requester_id = ? THEN receiver_id ELSE requester_id END as friend_id
       FROM friendships WHERE (requester_id = ? OR receiver_id = ?) AND status = 'accepted'`,
      [userId, userId, userId]
    );
    friends.forEach(f => {
      io.to(`user:${f.friend_id}`).emit('friend_status_change', { 
        user_id: userId, 
        is_online: isOnline,
        last_seen: !isOnline ? new Date() : null
      });
    });
  } catch (error) {
    console.error('broadcastOnlineStatus error:', error);
  }
};

// Export so other parts of app can check if user is online
export const isUserOnline = (userId) => onlineUsers.has(userId);