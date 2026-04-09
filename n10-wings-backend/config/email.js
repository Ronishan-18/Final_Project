import nodemailer from 'nodemailer';
import 'dotenv/config';

// ── Auto-switch: Gmail for local dev, Brevo for Railway production ──
// Local:      NODE_ENV=development → uses Gmail App Password
// Production: NODE_ENV=production  → uses Brevo SMTP (works on Railway)

export const transporter = (process.env.EMAIL_USER && process.env.EMAIL_PASS)
  ? nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    })
  : nodemailer.createTransport({
      host: 'smtp-relay.brevo.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.BREVO_USER,
        pass: process.env.BREVO_SMTP_KEY
      }
    });

// ── Send Verification OTP Email ──
export const sendVerificationEmail = async (email, username, otp) => {
  await transporter.sendMail({
    from: `"N-10 Wings E-Sports" <${process.env.EMAIL_USER || process.env.BREVO_USER}>`,
    to: email,
    subject: '✅ Verify Your N-10 Wings Account - OTP',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;background:#070709;color:#E8EAF0;border-radius:12px;overflow:hidden;border:1px solid #1a1a2e;">
        <div style="background:linear-gradient(135deg,#00F5FF22,#8B00FF22);padding:32px;text-align:center;border-bottom:1px solid #1a1a2e;">
          <div style="font-family:monospace;font-size:28px;font-weight:900;color:#00F5FF;letter-spacing:4px;">N-10 WINGS</div>
          <div style="color:#8892A4;font-size:12px;letter-spacing:2px;margin-top:6px;">E-SPORTS PLATFORM</div>
        </div>
        <div style="padding:32px;text-align:center;">
          <h2 style="color:#fff;margin:0 0 8px;">Welcome, ${username}! 🎮</h2>
          <p style="color:#8892A4;margin:0 0 28px;">Your email verification code:</p>
          <div style="background:#0D0D16;border:1px solid rgba(0,245,255,0.3);border-radius:12px;padding:24px;display:inline-block;margin-bottom:24px;">
            <span style="color:#00F5FF;font-size:36px;font-weight:900;letter-spacing:12px;font-family:monospace;">${otp}</span>
          </div>
          <p style="color:#8892A4;font-size:13px;margin:0;">Expires in <strong style="color:#E8EAF0;">5 minutes</strong>. If you didn't create this account, ignore this email.</p>
        </div>
        <div style="padding:20px 32px;border-top:1px solid #1a1a2e;text-align:center;">
          <p style="color:#8892A4;font-size:11px;margin:0;">N-10 Wings E-Sports Development & Management System</p>
        </div>
      </div>
    `
  });
};

// ── Send Password Reset OTP Email ──
export const sendPasswordResetEmail = async (email, username, otp) => {
  await transporter.sendMail({
    from: `"N-10 Wings E-Sports" <${process.env.EMAIL_USER || process.env.BREVO_USER}>`,
    to: email,
    subject: '🔐 Reset Your N-10 Wings Password - OTP',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;background:#070709;color:#E8EAF0;border-radius:12px;overflow:hidden;border:1px solid #1a1a2e;">
        <div style="background:linear-gradient(135deg,#FF006E22,#8B00FF22);padding:32px;text-align:center;border-bottom:1px solid #1a1a2e;">
          <div style="font-family:monospace;font-size:28px;font-weight:900;color:#00F5FF;letter-spacing:4px;">N-10 WINGS</div>
        </div>
        <div style="padding:32px;text-align:center;">
          <h2 style="color:#FF006E;margin:0 0 8px;">Password Reset 🔐</h2>
          <p style="color:#8892A4;margin:0 0 8px;">Hi <strong style="color:#E8EAF0;">${username}</strong>, your reset code:</p>
          <div style="background:#0D0D16;border:1px solid rgba(255,0,110,0.3);border-radius:12px;padding:24px;display:inline-block;margin:20px 0;">
            <span style="color:#FF006E;font-size:36px;font-weight:900;letter-spacing:12px;font-family:monospace;">${otp}</span>
          </div>
          <p style="color:#8892A4;font-size:13px;margin:0;">Expires in <strong style="color:#E8EAF0;">5 minutes</strong>. If you didn't request this, ignore this email.</p>
        </div>
        <div style="padding:20px 32px;border-top:1px solid #1a1a2e;text-align:center;">
          <p style="color:#8892A4;font-size:11px;margin:0;">N-10 Wings E-Sports Development & Management System</p>
        </div>
      </div>
    `
  });
};

// ── Send Admin Welcome Email ──
export const sendAdminWelcomeEmail = async (email, username) => {
  await transporter.sendMail({
    from: `"N-10 Wings E-Sports" <${process.env.EMAIL_USER || process.env.BREVO_USER}>`,
    to: email,
    subject: '👑 Admin Access Granted — N-10 Wings',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;background:#070709;color:#E8EAF0;border-radius:12px;overflow:hidden;border:1px solid #1a1a2e;">
        <div style="background:linear-gradient(135deg,#FFD70022,#FF6B0022);padding:32px;text-align:center;border-bottom:1px solid #1a1a2e;">
          <div style="font-family:monospace;font-size:28px;font-weight:900;color:#FFD700;letter-spacing:4px;">N-10 WINGS</div>
        </div>
        <div style="padding:32px;text-align:center;">
          <h2 style="color:#FFD700;margin:0 0 12px;">Admin Access Granted 👑</h2>
          <p style="color:#8892A4;">Hi <strong style="color:#E8EAF0;">${username}</strong>, you now have full admin access to N-10 Wings.</p>
        </div>
        <div style="padding:20px 32px;border-top:1px solid #1a1a2e;text-align:center;">
          <p style="color:#8892A4;font-size:11px;margin:0;">N-10 Wings E-Sports Development & Management System</p>
        </div>
      </div>
    `
  });
};

// ── Send Support Reply Email ──
export const sendSupportReplyEmail = async (email, name, subject, message, reply) => {
  await transporter.sendMail({
    from: `"N-10 Wings Support" <${process.env.EMAIL_USER || process.env.BREVO_USER}>`,
    to: email,
    subject: `Re: ${subject}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;background:#070709;color:#E8EAF0;border-radius:12px;overflow:hidden;border:1px solid #1a1a2e;">
        <div style="background:linear-gradient(135deg,#00F5FF22,#8B00FF22);padding:32px;text-align:center;border-bottom:1px solid #1a1a2e;">
          <div style="font-family:monospace;font-size:28px;font-weight:900;color:#00F5FF;letter-spacing:4px;">N-10 WINGS</div>
          <div style="color:#8892A4;font-size:12px;letter-spacing:2px;margin-top:6px;">SUPPORT TEAM</div>
        </div>
        <div style="padding:32px;">
          <h2 style="color:#fff;margin:0 0 16px;">Hi ${name},</h2>
          <p style="color:#8892A4;line-height:1.6;margin-bottom:24px;">Thank you for reaching out to us. Here is our response to your inquiry:</p>
          
          <div style="background:#0D0D16;border-left:4px solid #00F5FF;padding:20px;margin-bottom:24px;border-radius:0 8px 8px 0;">
            <p style="color:#8892A4;font-size:13px;margin:0 0 8px;font-style:italic;">Your Message:</p>
            <p style="color:#E8EAF0;margin:0;line-height:1.5;">"${message}"</p>
          </div>

          <div style="background:rgba(0,245,255,0.05);border:1px solid rgba(0,245,255,0.1);border-radius:12px;padding:24px;">
            <p style="color:#00F5FF;font-size:13px;margin:0 0 8px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Our Response:</p>
            <p style="color:#E8EAF0;margin:0;line-height:1.6;white-space:pre-wrap;">${reply}</p>
          </div>

          <p style="color:#8892A4;font-size:13px;margin-top:24px;line-height:1.6;">If you have any further questions, simply reply to this email or visit our platform.</p>
        </div>
        <div style="padding:20px 32px;border-top:1px solid #1a1a2e;text-align:center;">
          <p style="color:#8892A4;font-size:11px;margin:0;">N-10 Wings E-Sports Development & Management System</p>
        </div>
      </div>
    `
  });
};