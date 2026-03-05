import jwt from 'jsonwebtoken';
import db from '../config/db.js';

export const protect = async (req, res, next) => {
  try {
    let token;

    // ✅ Check cookie first
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }
    // ✅ Then check Authorization header (Postman/mobile)
    else if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized. No token provided.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const [users] = await db.query(
      'SELECT id, username, email, role, is_active FROM users WHERE id = ?',
      [decoded.id]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'User no longer exists'
      });
    }

    if (!users[0].is_active) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been suspended'
      });
    }

    req.user = users[0];
    next();

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please log in again.'
      });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    }
    console.error('Auth Middleware Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. This route is for: ${roles.join(', ')}`
      });
    }
    next();
  };
};