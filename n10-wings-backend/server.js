import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import passport from './config/passport.js';
import 'dotenv/config';
import authRoutes from './routes/auth.routes.js';
import profileRoutes from './routes/profile.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import gameIdentityRoutes from './routes/gameIdentity.routes.js';
import adminRoutes from './routes/admin.routes.js';
import tournamentRoutes from './routes/tournament.routes.js';


const app = express();

// ── Middleware (MUST come before ALL routes) ──
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/api/tournaments', tournamentRoutes);
app.use('/api/admin', adminRoutes);


// ── Static files ──
app.use('/uploads', express.static('uploads'));

// ── Session & Passport ──
app.use(session({
  secret: process.env.JWT_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000
  }
}));

app.use(passport.initialize());
app.use(passport.session());

// ── Routes (AFTER all middleware) ──
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/game-identities', gameIdentityRoutes);

// ── Health check ──
app.get('/', (req, res) => {
  res.json({
    success: true,
    app: 'N-10 Wings',
    version: '1.0.0',
    status: '🚀 API is running!'
  });
});

// ── 404 handler ──
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ── Error handler ──
app.use((err, req, res, next) => {
  console.error('Server Error:', err.stack);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ N-10 Wings API running on port ${PORT}`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
});