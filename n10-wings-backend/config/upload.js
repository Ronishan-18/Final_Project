import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';

// Create uploads folder if not exists
const folders = ['uploads/avatars', 'uploads/teams'];
folders.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Determine folder based on request (custom header or middleware property)
    const folder = req.uploadFolder || 'uploads/avatars';
    cb(null, folder);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const prefix = req.filePrefix || 'file';
    const filename = `${prefix}_${uuidv4()}${ext}`;
    cb(null, filename);
  }
});

// File filter — images only
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPG, PNG and WEBP images are allowed!'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB max
});

export default upload;