const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../config/email');

// ============================================
// REGISTER
// POST /api/auth/register
// ============================================
const register = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    if (!username || !email || !password || !role) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    const allowedRoles = ['gamer', 'organizer', 'sponsor'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role. Choose: gamer, organizer, or sponsor' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const [existing] = await db.query(
      'SELECT id FROM users WHERE email = ? OR username = ?',
      [email, username]
    );

    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'Email or username already in use' });
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate email verification token
    const verificationToken = uuidv4();
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const [result] = await db.query(
      `INSERT INTO users (username, email, password, role, is_verified, verification_token, verification_token_expires)
       VALUES (?, ?, ?, ?, FALSE, ?, ?)`,
      [username, email, hashedPassword, role, verificationToken, tokenExpiry]
    );

    // Send verification email
    await sendVerificationEmail(email, username, verificationToken);

    res.status(201).json({
      success: true,
      message: 'Registration successful! Please check your email to verify your account.',
      userId: result.insertId
    });

  } catch (error) {
    console.error('Register Error:', error);
    res.status(500).json({ success: false, message: 'Server error during registration' });
  }
};

// ============================================
// VERIFY EMAIL
// GET /api/auth/verify-email/:token
// ============================================
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    const [users] = await db.query(
      'SELECT id, verification_token_expires FROM users WHERE verification_token = ?',
      [token]
    );

    if (users.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid or expired verification link' });
    }

    const user = users[0];

    if (new Date() > new Date(user.verification_token_expires)) {
      return res.status(400).json({ success: false, message: 'Verification link expired. Please request a new one.' });
    }

    await db.query(
      'UPDATE users SET is_verified = TRUE, verification_token = NULL, verification_token_expires = NULL WHERE id = ?',
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
// RESEND VERIFICATION EMAIL
// POST /api/auth/resend-verification
// ============================================
const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const [users] = await db.query(
      'SELECT id, username, is_verified FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'No account found with this email' });
    }

    const user = users[0];

    if (user.is_verified) {
      return res.status(400).json({ success: false, message: 'This account is already verified' });
    }

    // Generate new token
    const verificationToken = uuidv4();
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await db.query(
      'UPDATE users SET verification_token = ?, verification_token_expires = ? WHERE id = ?',
      [verificationToken, tokenExpiry, user.id]
    );

    await sendVerificationEmail(email, user.username, verificationToken);

    res.status(200).json({
      success: true,
      message: 'Verification email resent! Please check your inbox.',
      verificationToken
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
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const [users] = await db.query(
      'SELECT id, username, email, password, role, is_verified, is_active FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const user = users[0];

    if (!user.is_active) {
      return res.status(403).json({ success: false, message: 'Your account has been suspended. Contact support.' });
    }

    if (!user.is_verified) {
      return res.status(403).json({ success: false, message: 'Please verify your email before logging in.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
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
// FORGOT PASSWORD
// POST /api/auth/forgot-password
// ============================================
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const [users] = await db.query(
      'SELECT id, username FROM users WHERE email = ?',
      [email]
    );

    // Always return success (security: don't reveal if email exists)
    if (users.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'If an account exists with this email, a reset link has been sent.'
      });
    }

    const user = users[0];

    // Generate reset token
    const resetToken = uuidv4();
    const resetExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await db.query(
      'UPDATE users SET reset_password_token = ?, reset_password_expires = ? WHERE id = ?',
      [resetToken, resetExpiry, user.id]
    );

    await sendPasswordResetEmail(email, user.username, resetToken);

    res.status(200).json({
      success: true,
      message: 'Password reset link sent to your email!'
    });

  } catch (error) {
    console.error('Forgot Password Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ============================================
// RESET PASSWORD
// POST /api/auth/reset-password/:token
// ============================================
const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ success: false, message: 'New password is required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const [users] = await db.query(
      'SELECT id, reset_password_expires FROM users WHERE reset_password_token = ?',
      [token]
    );

    if (users.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset link' });
    }

    const user = users[0];

    if (new Date() > new Date(user.reset_password_expires)) {
      return res.status(400).json({ success: false, message: 'Reset link has expired. Please request a new one.' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Update password and clear reset token
    await db.query(
      'UPDATE users SET password = ?, reset_password_token = NULL, reset_password_expires = NULL WHERE id = ?',
      [hashedPassword, user.id]
    );

    res.status(200).json({
      success: true,
      message: 'Password reset successful! You can now log in with your new password.'
    });

  } catch (error) {
    console.error('Reset Password Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ============================================
// CHANGE PASSWORD (logged in user)
// POST /api/auth/change-password
// ============================================
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
    }

    // Get user with password
    const [users] = await db.query(
      'SELECT id, password FROM users WHERE id = ?',
      [req.user.id]
    );

    const user = users[0];

    // Check current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    // Hash new password
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
// UPDATE EMAIL (logged in user)
// PUT /api/auth/update-email
// ============================================
const updateEmail = async (req, res) => {
  try {
    const { newEmail, password } = req.body;

    if (!newEmail || !password) {
      return res.status(400).json({ success: false, message: 'New email and password are required' });
    }

    // Check if new email already exists
    const [existing] = await db.query(
      'SELECT id FROM users WHERE email = ?',
      [newEmail]
    );

    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'This email is already in use' });
    }

    // Verify password
    const [users] = await db.query(
      'SELECT id, password FROM users WHERE id = ?',
      [req.user.id]
    );

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Password is incorrect' });
    }

    // Generate new verification token for new email
    const verificationToken = uuidv4();
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await db.query(
      'UPDATE users SET email = ?, is_verified = FALSE, verification_token = ?, verification_token_expires = ? WHERE id = ?',
      [newEmail, verificationToken, tokenExpiry, req.user.id]
    );

    // Send verification to new email
    await sendVerificationEmail(newEmail, req.user.username, verificationToken);

    res.status(200).json({
      success: true,
      message: 'Email updated! Please verify your new email address.'
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
const getMe = async (req, res) => {
  try {
    const [users] = await db.query(
      'SELECT id, username, email, role, is_verified, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
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
const logout = (req, res) => {
  res.status(200).json({ success: true, message: 'Logged out successfully' });
};

// ============================================
// CHANGE USER ROLE (Admin only)
// PUT /api/auth/change-role
// ============================================
const changeUserRole = async (req, res) => {
  try {
    const { userId, newRole } = req.body;

    // Validate
    if (!userId || !newRole) {
      return res.status(400).json({ 
        success: false, 
        message: 'userId and newRole are required' 
      });
    }

    const allowedRoles = ['admin', 'gamer', 'organizer', 'sponsor'];
    if (!allowedRoles.includes(newRole)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid role. Choose: admin, gamer, organizer, sponsor' 
      });
    }

    // Check if user exists
    const [users] = await db.query(
      'SELECT id, username, role FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Prevent admin changing their own role
    if (users[0].id === req.user.id) {
      return res.status(400).json({ 
        success: false, 
        message: 'You cannot change your own role' 
      });
    }

    // Update role
    await db.query(
      'UPDATE users SET role = ? WHERE id = ?',
      [newRole, userId]
    );

    res.status(200).json({
      success: true,
      message: `Role updated successfully!`,
      data: {
        userId: users[0].id,
        username: users[0].username,
        oldRole: users[0].role,
        newRole: newRole
      }
    });

  } catch (error) {
    console.error('Change Role Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  register,
  verifyEmail,
  resendVerification,
  login,
  forgotPassword,
  resetPassword,
  changePassword,
  updateEmail,
  getMe,
  logout,
  changeUserRole   
};