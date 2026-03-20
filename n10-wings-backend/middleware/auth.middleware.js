import jwt from 'jsonwebtoken';
import db from '../config/db.js';

export const protect = async (req, res, next) => {
  try {
    let token;

    if (req.cookies?.token) {
      token = req.cookies.token;
    } else if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Please login first.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const [users] = await db.query(
      `SELECT id, username, email, role,
       is_organizer, organizer_status, is_active
       FROM users WHERE id = ?`,
      [decoded.id]
    );

    if (users.length === 0) {
      return res.status(401).json({ success: false, message: 'User not found!' });
    }

    if (!users[0].is_active) {
      return res.status(401).json({ success: false, message: 'Account suspended!' });
    }

    req.user = users[0];
    next();

  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token!' });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied! Required role: ${roles.join(' or ')}`
      });
    }
    next();
  };
};

export const isOrganizer = (req, res, next) => {
  if (!req.user.is_organizer) {
    return res.status(403).json({
      success: false,
      message: 'Organizer access required! Please apply to become an organizer.'
    });
  }
  next();
};