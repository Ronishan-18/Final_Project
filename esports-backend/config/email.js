const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();

// Create Gmail transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// ============================================
// Send Verification Email
// ============================================
const sendVerificationEmail = async (email, username, token) => {
  const verifyUrl = `${process.env.SERVER_URL}/api/auth/verify-email/${token}`;

  const mailOptions = {
    from: `"E-Sports Platform" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: '✅ Verify Your E-Sports Account',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 30px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #6C63FF;">Welcome to E-Sports Platform, ${username}! 🎮</h2>
        <p>Thank you for registering. Please verify your email address to activate your account.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verifyUrl}" 
             style="background-color: #6C63FF; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-size: 16px;">
            Verify My Email
          </a>
        </div>
        <p style="color: #999; font-size: 13px;">This link will expire in <strong>24 hours</strong>.</p>
        <p style="color: #999; font-size: 13px;">If you didn't create this account, you can safely ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #eee;" />
        <p style="color: #bbb; font-size: 12px; text-align: center;">E-Sports Development & Management System</p>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
};

// ============================================
// Send Password Reset Email
// ============================================
const sendPasswordResetEmail = async (email, username, token) => {
  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${token}`;

  const mailOptions = {
    from: `"E-Sports Platform" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: '🔐 Reset Your E-Sports Password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 30px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #6C63FF;">Password Reset Request 🔐</h2>
        <p>Hi <strong>${username}</strong>,</p>
        <p>We received a request to reset your password. Click the button below to reset it.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" 
             style="background-color: #e74c3c; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-size: 16px;">
            Reset My Password
          </a>
        </div>
        <p style="color: #999; font-size: 13px;">This link will expire in <strong>1 hour</strong>.</p>
        <p style="color: #999; font-size: 13px;">If you didn't request a password reset, you can safely ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #eee;" />
        <p style="color: #bbb; font-size: 12px; text-align: center;">E-Sports Development & Management System</p>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendVerificationEmail, sendPasswordResetEmail };