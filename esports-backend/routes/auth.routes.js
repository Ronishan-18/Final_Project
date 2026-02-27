const express = require('express');
const router = express.Router();

const { register, login, getMe, logout } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');

// PUBLIC
router.post('/register', register);
router.post('/login', login);

// PROTECTED
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);

module.exports = router;