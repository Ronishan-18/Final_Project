import express from 'express';
import upload from '../config/upload.js';
import { protect } from '../middleware/auth.middleware.js';
import db from '../config/db.js';

const router = express.Router();

// ── UPLOAD AVATAR ──
router.post('/avatar', protect, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded!'
      });
    }

    // Build avatar URL
    const avatarUrl = `${process.env.SERVER_URL}/uploads/avatars/${req.file.filename}`;

    // Save to database
    await db.query(
      'UPDATE profiles SET avatar = ? WHERE user_id = ?',
      [avatarUrl, req.user.id]
    );

    res.status(200).json({
      success: true,
      message: 'Avatar uploaded successfully!',
      avatar: avatarUrl
    });

  } catch (error) {
    console.error('Upload Avatar Error:', error);
    res.status(500).json({
      success: false,
      message: 'Upload failed!'
    });
  }
});

export default router;