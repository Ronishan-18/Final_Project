import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../config/db.js';
import { sendVerificationEmail, sendPasswordResetEmail } from '../config/email.js';

// ============================================
// HELPER — Generate 6 digit OTP
// ============================================
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// ============================================
// REGISTER
// POST /api/auth/register
// ============================================
export const register = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    // Check duplicate
    const [existing] = await db.query(
      'SELECT id FROM users WHERE email = ? OR username = ?',
      [email, username]
    );
    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Email or username already in use'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate OTP (5 minutes)
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

    // Save user
    const [result] = await db.query(
      `INSERT INTO users 
       (username, email, password, role, is_verified, otp_code, otp_expires)
       VALUES (?, ?, ?, ?, FALSE, ?, ?)`,
      [username, email, hashedPassword, role, otp, otpExpiry]
    );

    // Send OTP email
    await sendVerificationEmail(email, username, otp);

    res.status(201).json({
      success: true,
      message: 'Registration successful! Please check your email for the OTP to verify your account.',
      userId: result.insertId
    });

  } catch (error) {
    console.error('Register Error:', error);
    res.status(500).json({ success: false, message: 'Server error during registration' });
  }
};

// ============================================
// VERIFY EMAIL WITH OTP
// POST /api/auth/verify-email
// ============================================
export const verifyEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required'
      });
    }

    const [users] = await db.query(
      'SELECT id, otp_code, otp_expires, is_verified FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email'
      });
    }

    const user = users[0];

    // Already verified
    if (user.is_verified) {
      return res.status(400).json({
        success: false,
        message: 'This account is already verified'
      });
    }

    // Check OTP exists
    if (!user.otp_code) {
      return res.status(400).json({
        success: false,
        message: 'No OTP found. Please request a new one.'
      });
    }

    // Check OTP expiry
    if (new Date() > new Date(user.otp_expires)) {
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new one.'
      });
    }

    // Check OTP match
    if (user.otp_code !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP. Please try again.'
      });
    }

    // Mark verified + clear OTP
    await db.query(
      'UPDATE users SET is_verified = TRUE, otp_code = NULL, otp_expires = NULL WHERE id = ?',
      [user.id]
    );

    res.status(200).json({
      success: true,
      message: 'Email verified successfully! You can now log in.'
    });

  } catch (error) {
    console.error('Verify Email Error:', error);
    res.status(500).json({ success: false, message: 'Server error during email verification' });
  }
};

// ============================================
// RESEND VERIFICATION OTP
// POST /api/auth/resend-verification
// ============================================
export const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    const [users] = await db.query(
      'SELECT id, username, is_verified FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email'
      });
    }

    const user = users[0];

    if (user.is_verified) {
      return res.status(400).json({
        success: false,
        message: 'This account is already verified'
      });
    }

    // Generate new OTP (5 minutes)
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

    await db.query(
      'UPDATE users SET otp_code = ?, otp_expires = ? WHERE id = ?',
      [otp, otpExpiry, user.id]
    );

    await sendVerificationEmail(email, user.username, otp);

    res.status(200).json({
      success: true,
      message: 'New OTP sent! Please check your inbox.'
    });

  } catch (error) {
    console.error('Resend Verification Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
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
      'SELECT id, username, email, password, role, is_verified, is_active FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const user = users[0];

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been suspended. Contact support.'
      });
    }

    if (!user.is_verified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email before logging in.'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Different expiry for admin
    const tokenExpiry = user.role === 'admin' ? '8h' : '7d';
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: tokenExpiry }
    );

    // ✅ Set cookie
    const cookieOptions = {
      httpOnly: true,    // JS cannot access → XSS protection
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      sameSite: 'strict', // CSRF protection
      maxAge: user.role === 'admin'
        ? 8 * 60 * 60 * 1000        // 8 hours (admin)
        : 7 * 24 * 60 * 60 * 1000   // 7 days (others)
    };

    res.cookie('token', token, cookieOptions);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,  // ← also in body for Postman/mobile
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
};

// ============================================
// FORGOT PASSWORD — Send OTP
// POST /api/auth/forgot-password
// ============================================
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const [users] = await db.query(
      'SELECT id, username FROM users WHERE email = ?',
      [email]
    );

    // Always return success (security)
    if (users.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'If an account exists with this email, an OTP has been sent.'
      });
    }

    const user = users[0];

    // Generate OTP (5 minutes)
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

    await db.query(
      'UPDATE users SET otp_code = ?, otp_expires = ? WHERE id = ?',
      [otp, otpExpiry, user.id]
    );

    await sendPasswordResetEmail(email, user.username, otp);

    res.status(200).json({
      success: true,
      message: 'OTP sent to your email!'
    });

  } catch (error) {
    console.error('Forgot Password Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ============================================
// VERIFY RESET OTP
// POST /api/auth/verify-reset-otp
// ============================================
export const verifyResetOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required'
      });
    }

    const [users] = await db.query(
      'SELECT id, otp_code, otp_expires FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email'
      });
    }

    const user = users[0];

    // Check OTP exists
    if (!user.otp_code) {
      return res.status(400).json({
        success: false,
        message: 'No OTP found. Please request a new one.'
      });
    }

    // Check OTP expiry
    if (new Date() > new Date(user.otp_expires)) {
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new one.'
      });
    }

    // Check OTP match
    if (user.otp_code !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP. Please try again.'
      });
    }

    // OTP valid — generate reset token for next step
    const resetToken = `${user.id}-${Date.now()}`;

    await db.query(
      'UPDATE users SET reset_password_token = ?, otp_code = NULL, otp_expires = NULL WHERE id = ?',
      [resetToken, user.id]
    );

    res.status(200).json({
      success: true,
      message: 'OTP verified! You can now reset your password.',
      resetToken  // frontend uses this to reset password
    });

  } catch (error) {
    console.error('Verify Reset OTP Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ============================================
// RESET PASSWORD
// POST /api/auth/reset-password
// ============================================
export const resetPassword = async (req, res) => {
  try {
    const { resetToken, password } = req.body;

    if (!resetToken || !password) {
      return res.status(400).json({
        success: false,
        message: 'Reset token and new password are required'
      });
    }

    const [users] = await db.query(
      'SELECT id FROM users WHERE reset_password_token = ?',
      [resetToken]
    );

    if (users.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    const user = users[0];

    // Hash new password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Update password + clear reset token
    await db.query(
      'UPDATE users SET password = ?, reset_password_token = NULL WHERE id = ?',
      [hashedPassword, user.id]
    );

    res.status(200).json({
      success: true,
      message: 'Password reset successful! You can now log in.'
    });

  } catch (error) {
    console.error('Reset Password Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
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
      'SELECT id, password FROM users WHERE id = ?',
      [req.user.id]
    );

    const user = users[0];

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

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
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ============================================
// UPDATE EMAIL
// PUT /api/auth/update-email
// ============================================
export const updateEmail = async (req, res) => {
  try {
    const { newEmail, password } = req.body;

    const [existing] = await db.query(
      'SELECT id FROM users WHERE email = ?',
      [newEmail]
    );
    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'This email is already in use'
      });
    }

    const [users] = await db.query(
      'SELECT id, username, password FROM users WHERE id = ?',
      [req.user.id]
    );

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Password is incorrect'
      });
    }

    // Generate OTP for new email verification (5 minutes)
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

    await db.query(
      'UPDATE users SET email = ?, is_verified = FALSE, otp_code = ?, otp_expires = ? WHERE id = ?',
      [newEmail, otp, otpExpiry, req.user.id]
    );

    await sendVerificationEmail(newEmail, user.username, otp);

    res.status(200).json({
      success: true,
      message: 'Email updated! Please check your new email for OTP to verify.'
    });

  } catch (error) {
    console.error('Update Email Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ============================================
// GET ME
// GET /api/auth/me
// ============================================
export const getMe = async (req, res) => {
  try {
    const [users] = await db.query(
      'SELECT id, username, email, role, is_verified, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({ success: true, user: users[0] });

  } catch (error) {
    console.error('GetMe Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ============================================
// LOGOUT
// POST /api/auth/logout
// ============================================
export const logout = (req, res) => {
  // ✅ Clear cookie on logout
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
};

// ============================================
// GET ALL USERS (Admin only)
// GET /api/auth/users
// ============================================
export const getAllUsers = async (req, res) => {
  try {
    const [users] = await db.query(
      `SELECT id, username, email, role, is_verified, is_active, created_at
       FROM users ORDER BY created_at DESC`
    );

    res.status(200).json({
      success: true,
      total: users.length,
      users
    });

  } catch (error) {
    console.error('Get All Users Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ============================================
// EDIT USER ROLE (Admin only)
// PUT /api/auth/users/:id/role
// ============================================
export const editUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const [users] = await db.query(
      'SELECT id, username, email, role FROM users WHERE id = ?',
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (parseInt(id) === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot change your own role'
      });
    }

    await db.query('UPDATE users SET role = ? WHERE id = ?', [role, id]);

    res.status(200).json({
      success: true,
      message: 'User role updated successfully!',
      user: {
        id: users[0].id,
        username: users[0].username,
        email: users[0].email,
        role: role
      }
    });

  } catch (error) {
    console.error('Edit User Role Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};