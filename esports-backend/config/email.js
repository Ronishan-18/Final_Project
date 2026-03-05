import nodemailer from 'nodemailer';
import 'dotenv/config';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// ============================================
// Send Verification OTP Email
// ============================================
export const sendVerificationEmail = async (email, username, otp) => {
  const mailOptions = {
    from: `"E-Sports Platform" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: '✅ Verify Your E-Sports Account - OTP',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 30px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #6C63FF;">Welcome to E-Sports Platform, ${username}! 🎮</h2>
        <p>Your email verification OTP is:</p>
        <div style="text-align: center; margin: 30px 0;">
          <span style="background-color: #6C63FF; color: white; padding: 14px 40px; border-radius: 6px; font-size: 32px; font-weight: bold; letter-spacing: 8px;">
            ${otp}
          </span>
        </div>
        <p style="color: #999; font-size: 13px;">This OTP will expire in <strong>5 minutes</strong>.</p>
        <p style="color: #999; font-size: 13px;">If you didn't create this account, ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #eee;" />
        <p style="color: #bbb; font-size: 12px; text-align: center;">E-Sports Development & Management System</p>
      </div>
    `
  };
  await transporter.sendMail(mailOptions);
};

// ============================================
// Send Password Reset OTP Email
// ============================================
export const sendPasswordResetEmail = async (email, username, otp) => {
  const mailOptions = {
    from: `"E-Sports Platform" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: '🔐 Reset Your E-Sports Password - OTP',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 30px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #e74c3c;">Password Reset Request 🔐</h2>
        <p>Hi <strong>${username}</strong>,</p>
        <p>Your password reset OTP is:</p>
        <div style="text-align: center; margin: 30px 0;">
          <span style="background-color: #e74c3c; color: white; padding: 14px 40px; border-radius: 6px; font-size: 32px; font-weight: bold; letter-spacing: 8px;">
            ${otp}
          </span>
        </div>
        <p style="color: #999; font-size: 13px;">This OTP will expire in <strong>5 minutes</strong>.</p>
        <p style="color: #999; font-size: 13px;">If you didn't request this, ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #eee;" />
        <p style="color: #bbb; font-size: 12px; text-align: center;">E-Sports Development & Management System</p>
      </div>
    `
  };
  await transporter.sendMail(mailOptions);
};