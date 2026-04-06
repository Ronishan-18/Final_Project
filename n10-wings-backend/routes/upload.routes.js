import express from 'express';
import upload from '../config/upload.js';
import { protect } from '../middleware/auth.middleware.js';
import db from '../config/db.js';

const router = express.Router();

// ── UPLOAD AVATAR ──
router.post('/avatar', protect, (req, res, next) => {
  req.uploadFolder = 'uploads/avatars';
  req.filePrefix = 'avatar';
  next();
}, upload.single('avatar'), async (req, res) => {
  // Existing logic...
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded!' });
    const avatarPath = `/uploads/avatars/${req.file.filename}`;
    await db.query('UPDATE profiles SET avatar = ? WHERE user_id = ?', [avatarPath, req.user.id]);
    res.status(200).json({ success: true, message: 'Avatar uploaded successfully!', avatar: avatarPath });
  } catch (error) {
    console.error('Upload Avatar Error:', error);
    res.status(500).json({ success: false, message: 'Upload failed!' });
  }
});

// ── UPLOAD TEAM LOGO ──
router.post('/team-logo', protect, (req, res, next) => {
  req.uploadFolder = 'uploads/teams';
  req.filePrefix = 'team';
  next();
}, upload.single('logo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded!'
      });
    }

    const logoPath = `/uploads/teams/${req.file.filename}`;

    res.status(200).json({
      success: true,
      message: 'Team logo uploaded successfully!',
      logo: logoPath
    });

  } catch (error) {
    console.error('Upload Team Logo Error:', error);
    res.status(500).json({
      success: false,
      message: 'Upload failed!'
    });
  }
});

export default router;