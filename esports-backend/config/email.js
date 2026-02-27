const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

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

module.exports = { sendVerificationEmail };