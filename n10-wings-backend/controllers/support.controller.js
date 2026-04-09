import db from '../config/db.js';
import { sendSupportReplyEmail } from '../config/email.js';

// ── SUBMIT CONTACT MESSAGE (PUBLIC) ──
export const submitContactMessage = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ success: false, message: 'All fields are required!' });
    }

    await db.query(
      'INSERT INTO support_messages (name, email, subject, message) VALUES (?, ?, ?, ?)',
      [name, email, subject, message]
    );

    res.status(201).json({ success: true, message: 'Your message has been sent successfully!' });
  } catch (error) {
    console.error('Submit Contact Error:', error);
    res.status(500).json({ success: false, message: 'Failed to send message.' });
  }
};

// ── GET ALL MESSAGES (ADMIN) ──
export const getSupportMessages = async (req, res) => {
  try {
    const [messages] = await db.query('SELECT * FROM support_messages ORDER BY created_at DESC');
    res.json({ success: true, messages });
  } catch (error) {
    console.error('Get Support Messages Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── REPLY TO MESSAGE (ADMIN) ──
export const replyToSupportMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { reply } = req.body;

    if (!reply) {
      return res.status(400).json({ success: false, message: 'Reply content is required!' });
    }

    const [messages] = await db.query('SELECT * FROM support_messages WHERE id = ?', [id]);
    if (!messages.length) {
      return res.status(404).json({ success: false, message: 'Message not found.' });
    }
    const msg = messages[0];

    // Send Email via helper in config/email.js
    await sendSupportReplyEmail(msg.email, msg.name, msg.subject, msg.message, reply);

    // Update DB
    await db.query(
      'UPDATE support_messages SET status = "replied", admin_reply = ? WHERE id = ?',
      [reply, id]
    );

    res.json({ success: true, message: 'Reply sent successfully!' });
  } catch (error) {
    console.error('Reply to Support Error:', error);
    res.status(500).json({ success: false, message: 'Failed to send reply.' });
  }
};
