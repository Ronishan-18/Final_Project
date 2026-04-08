import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import passport from './config/passport.js';
import authRoutes from './routes/auth.routes.js';
import profileRoutes from './routes/profile.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import gameIdentityRoutes from './routes/gameIdentity.routes.js';
import adminRoutes from './routes/admin.routes.js';
import tournamentRoutes from './routes/tournament.routes.js';
import teamRoutes from './routes/team.routes.js';
import publicRoutes from './routes/public.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import { createServer } from 'http';
import { initSocket } from './config/socket.js';
import friendRoutes from './routes/friend.routes.js';
import messageRoutes from './routes/message.routes.js';
import { pool_raw } from './config/db.js';


const app = express();

// ── Production Settings ──
app.set('trust proxy', 1); // Required for Railway/Vercel cookies

// ── Middleware (MUST come before ALL routes) ──
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    const allowed = [
      'http://localhost:3000', 
      'http://localhost:3001',
      process.env.CLIENT_URL,
      'https://final-project-kappa-peach.vercel.app'
    ];
    if (allowed.includes(origin) || origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

// ── Static files ──
app.use('/uploads', express.static('uploads'));



// ── Static files ──
app.use('/uploads', express.static('uploads'));

// ── Session & Passport ──
app.use(session({
  key: 'n10_wings_session',
  secret: process.env.JWT_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // Required for cross-site cookies
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
app.use('/api/tournaments', tournamentRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/messages', messageRoutes);

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
  res.status(500).json({ 
    success: false, 
    message: 'Internal server error',
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined 
  });
});

const PORT = process.env.PORT || 5000;
const httpServer = createServer(app);
initSocket(httpServer);
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});