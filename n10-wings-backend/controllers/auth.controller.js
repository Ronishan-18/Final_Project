import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../config/db.js';
import { sendVerificationEmail, sendPasswordResetEmail } from '../config/email.js';

// ── Generate OTP ──
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();




// ── Generate JWT ──
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
};

// ── Set Cookie ──
const setCookie = (res, token, role) => {
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: role === 'admin'
      ? 8 * 60 * 60 * 1000
      : 7 * 24 * 60 * 60 * 1000
  });
};

// ============================================
// REGISTER
// POST /api/auth/register
// ============================================
export const register = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    if (!password || password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password) || !/[^a-zA-Z0-9]/.test(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters, include an uppercase letter, a number, and a symbol.'
      });
    }

    // Check email exists
    const [existingEmail] = await db.query(
      'SELECT id FROM users WHERE email = ?', [email]
    );
    if (existingEmail.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered!'
      });
    }

    // Check username exists
    const [existingUsername] = await db.query(
      'SELECT id FROM users WHERE username = ?', [username]
    );
    if (existingUsername.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Username already taken!'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // OTP
    const otp = generateOTP();
    const hashedOtp = await bcrypt.hash(otp, 10);

    // Valid roles
    const validRoles = ['user', 'sponsor', 'admin'];
    const userRole = validRoles.includes(role) ? role : 'user';

    const pendingToken = jwt.sign(
      { username, email, hashedPassword, role: userRole, otpHash: hashedOtp },
      process.env.JWT_SECRET,
      { expiresIn: '10m' }
    );

    // Send OTP email
    await sendVerificationEmail(email, username, otp);

    res.status(201).json({
      success: true,
      message: 'Registration successful! Please check your email for OTP.',
      pendingToken
    });

  } catch (error) {
    console.error('Register Error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed!'
    });
  }
};

// ============================================
// VERIFY EMAIL
// POST /api/auth/verify-email
// ============================================
export const verifyEmail = async (req, res) => {
  try {
    const { email, otp, pendingToken } = req.body;

    if (pendingToken) {
      // New Stateless Verification Flow
      let decoded;
      try {
        decoded = jwt.verify(pendingToken, process.env.JWT_SECRET);
      } catch (err) {
        return res.status(400).json({ success: false, message: 'Registration session expired or invalid. Please register again.' });
      }

      if (decoded.email !== email) {
        return res.status(400).json({ success: false, message: 'Email mismatch!' });
      }

      const isOtpValid = await bcrypt.compare(otp, decoded.otpHash);
      if (!isOtpValid) {
        return res.status(400).json({ success: false, message: 'Invalid OTP!' });
      }

      // Ensure user doesn't exist already in case multiple verifications happen
      const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
      if (existing.length > 0) {
        return res.status(400).json({ success: false, message: 'User already verified/registered.' });
      }

      const [result] = await db.query(
        `INSERT INTO users (username, email, password, role, is_verified) VALUES (?, ?, ?, ?, ?)`,
        [decoded.username, decoded.email, decoded.hashedPassword, decoded.role, true]
      );

      const userId = result.insertId;
      await db.query('INSERT INTO profiles (user_id) VALUES (?)', [userId]);
      await db.query('INSERT INTO gamer_profiles (user_id) VALUES (?)', [userId]);
      
      if (decoded.role === 'sponsor') {
        await db.query('INSERT INTO sponsor_profiles (user_id) VALUES (?)', [userId]);
      }

      return res.status(200).json({
        success: true,
        message: 'Email verified successfully! You can now login.'
      });

    } else {
      // Old DB Verification Flow (Fallback)
      const [users] = await db.query(
        'SELECT * FROM users WHERE email = ?', [email]
      );

      if (users.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found!'
        });
      }

      const user = users[0];

      if (user.is_verified) {
        return res.status(400).json({
          success: false,
          message: 'Email already verified!'
        });
      }

      if (user.otp_code !== otp) {
        return res.status(400).json({
          success: false,
          message: 'Invalid OTP!'
        });
      }

      if (new Date() > new Date(user.otp_expires)) {
        return res.status(400).json({
          success: false,
          message: 'OTP expired! Please request a new one.'
        });
      }

      await db.query(
        `UPDATE users SET
         is_verified = TRUE,
         otp_code = NULL,
         otp_expires = NULL
         WHERE id = ?`,
        [user.id]
      );

      return res.status(200).json({
        success: true,
        message: 'Email verified successfully! You can now login.'
      });
    }

  } catch (error) {
    console.error('Verify Email Error:', error);
    res.status(500).json({
      success: false,
      message: 'Verification failed!'
    });
  }
};

// ============================================
// RESEND VERIFICATION
// POST /api/auth/resend-verification
// ============================================
export const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    const [users] = await db.query(
      'SELECT * FROM users WHERE email = ?', [email]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found!'
      });
    }

    const user = users[0];

    if (user.is_verified) {
      return res.status(400).json({
        success: false,
        message: 'Email already verified!'
      });
    }

    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000);

    await db.query(
      'UPDATE users SET otp_code = ?, otp_expires = ? WHERE id = ?',
      [otp, otpExpires, user.id]
    );

    await sendVerificationEmail(email, user.username, otp);

    res.status(200).json({
      success: true,
      message: 'OTP resent successfully!'
    });

  } catch (error) {
    console.error('Resend Verification Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resend OTP!'
    });
  }
};

// ============================================
// LOGIN
// POST /api/auth/login
// ============================================
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const [users] = await db.query(
      'SELECT * FROM users WHERE email = ?', [email]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password!'
      });
    }

    const user = users[0];

    if (!user.is_verified) {
      return res.status(401).json({
        success: false,
        message: 'Please verify your email first!',
        needsVerification: true,
        email: user.email
      });
    }

    if (!user.is_active) {
      // Changed from standard 401 to pass suspension state
      return res.status(401).json({
        success: false,
        message: 'Account suspended! Contact admin.',
        suspended: true,
        user_id: user.id,
        type: 'account'
      });
    }

    // Google users have no password
    if (!user.password) {
      return res.status(401).json({
        success: false,
        message: 'Please login with Google!'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password!'
      });
    }

    const token = generateToken(user);
    setCookie(res, token, user.role);

    res.status(200).json({
      success: true,
      message: 'Login successful!',
      token,
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        is_organizer: user.is_organizer,
        organizer_status: user.organizer_status
      }
    });

  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed!'
    });
  }
};

// ============================================
// GET ME
// GET /api/auth/me
// ============================================
export const getMe = async (req, res) => {
  try {
    const [users] = await db.query(
      `SELECT id, username, email, role,
       is_organizer, organizer_status,
       is_verified, is_active, created_at
       FROM users WHERE id = ?`,
      [req.user.id]
    );

    res.status(200).json({
      success: true,
      user: users[0]
    });

  } catch (error) {
    console.error('Get Me Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error!'
    });
  }
};

// ============================================
// LOGOUT
// POST /api/auth/logout
// ============================================
export const logout = async (req, res) => {
  res.clearCookie('token');
  res.status(200).json({
    success: true,
    message: 'Logged out successfully!'
  });
};

// ============================================
// FORGOT PASSWORD
// POST /api/auth/forgot-password
// ============================================
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const [users] = await db.query(
      'SELECT * FROM users WHERE email = ?', [email]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Email not found!'
      });
    }

    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000);

    await db.query(
      `UPDATE users SET
       reset_password_token = ?,
       reset_token_expires = ?
       WHERE id = ?`,
      [otp, otpExpires, users[0].id]
    );

    await sendPasswordResetEmail(email, users[0].username, otp);

    res.status(200).json({
      success: true,
      message: 'OTP sent to your email!'
    });

  } catch (error) {
    console.error('Forgot Password Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send OTP!'
    });
  }
};

// ============================================
// VERIFY RESET OTP
// POST /api/auth/verify-reset-otp
// ============================================
export const verifyResetOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const [users] = await db.query(
      'SELECT * FROM users WHERE email = ?', [email]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found!'
      });
    }

    const user = users[0];

    if (user.reset_password_token !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP!'
      });
    }

    if (new Date() > new Date(user.reset_token_expires)) {
      return res.status(400).json({
        success: false,
        message: 'OTP expired!'
      });
    }

    res.status(200).json({
      success: true,
      message: 'OTP verified successfully!'
    });

  } catch (error) {
    console.error('Verify Reset OTP Error:', error);
    res.status(500).json({
      success: false,
      message: 'Verification failed!'
    });
  }
};

// ============================================
// RESET PASSWORD
// POST /api/auth/reset-password
// ============================================
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    const [users] = await db.query(
      'SELECT * FROM users WHERE email = ?', [email]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found!'
      });
    }

    const user = users[0];

    if (user.reset_password_token !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP!'
      });
    }

    if (new Date() > new Date(user.reset_token_expires)) {
      return res.status(400).json({
        success: false,
        message: 'OTP expired!'
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await db.query(
      `UPDATE users SET
       password = ?,
       reset_password_token = NULL,
       reset_token_expires = NULL
       WHERE id = ?`,
      [hashedPassword, user.id]
    );

    res.status(200).json({
      success: true,
      message: 'Password reset successfully! You can now login.'
    });

  } catch (error) {
    console.error('Reset Password Error:', error);
    res.status(500).json({
      success: false,
      message: 'Reset failed!'
    });
  }
};

// ============================================
// CHANGE PASSWORD
// POST /api/auth/change-password
// ============================================
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const [users] = await db.query(
      'SELECT * FROM users WHERE id = ?', [req.user.id]
    );

    if (!users[0].password) {
      return res.status(400).json({
        success: false,
        message: 'Google accounts cannot change password here!'
      });
    }

    const isMatch = await bcrypt.compare(currentPassword, users[0].password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect!'
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await db.query(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, req.user.id]
    );

    res.status(200).json({
      success: true,
      message: 'Password changed successfully!'
    });

  } catch (error) {
    console.error('Change Password Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password!'
    });
  }
};

// ============================================
// UPDATE EMAIL
// PUT /api/auth/update-email
// ============================================
export const updateEmail = async (req, res) => {
  try {
    const { email } = req.body;

    const [existing] = await db.query(
      'SELECT id FROM users WHERE email = ? AND id != ?',
      [email, req.user.id]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Email already in use!'
      });
    }

    await db.query(
      'UPDATE users SET email = ? WHERE id = ?',
      [email, req.user.id]
    );

    res.status(200).json({
      success: true,
      message: 'Email updated successfully!'
    });

  } catch (error) {
    console.error('Update Email Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update email!'
    });
  }
};

// ============================================
// GET ALL USERS (Admin)
// GET /api/auth/users
// ============================================
export const getAllUsers = async (req, res) => {
  try {
    const [users] = await db.query(
      `SELECT id, username, email, role,
       is_organizer, organizer_status,
       is_verified, is_active, created_at
       FROM users ORDER BY created_at DESC`
    );

    res.status(200).json({
      success: true,
      total: users.length,
      users
    });

  } catch (error) {
    console.error('Get All Users Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error!'
    });
  }
};

// ============================================
// EDIT USER ROLE (Admin)
// PUT /api/auth/users/:id/role
// ============================================
export const editUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const { id } = req.params;

    const validRoles = ['user', 'sponsor', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role!'
      });
    }

    await db.query(
      'UPDATE users SET role = ? WHERE id = ?',
      [role, id]
    );

    res.status(200).json({
      success: true,
      message: 'User role updated!'
    });

  } catch (error) {
    console.error('Edit User Role Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error!'
    });
  }
};

// ============================================
// GOOGLE OAuth — Redirect
// GET /api/auth/google
// ============================================
export const googleAuth = (req, res, next) => {
  next();
};

// ============================================
// GOOGLE OAuth — Callback
// GET /api/auth/google/callback
// ============================================
export const googleCallback = async (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      return res.redirect(
        `${process.env.CLIENT_URL}/login?error=google_auth_failed`
      );
    }

    if (!user.is_active) {
      return res.redirect(
        `${process.env.CLIENT_URL}/suspended?user_id=${user.id}&type=account`
      );
    }

    const token = generateToken(user);
    setCookie(res, token, user.role);

    res.redirect(
      `${process.env.CLIENT_URL}/auth/success?token=${token}&role=${user.role}&username=${user.username}`
    );

  } catch (error) {
    console.error('Google Callback Error:', error);
    res.redirect(
      `${process.env.CLIENT_URL}/login?error=server_error`
    );
  }
};