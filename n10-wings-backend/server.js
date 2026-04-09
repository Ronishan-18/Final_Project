import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import passport from './config/passport.js';
import { createServer } from 'http';
import { initSocket } from './config/socket.js';

// Route Imports
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
import friendRoutes from './routes/friend.routes.js';
import messageRoutes from './routes/message.routes.js';
import prizeClaimRoutes from './routes/prizeClaim.routes.js';

const app = express();

console.log('--- RESTORING PRODUCTION SERVICES ---');

app.set('trust proxy', 1);

// Standard Production CORS
app.use(cors({
  origin: true, // Allow all temporarily for verification
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

// Static files
app.use('/uploads', express.static('uploads'));

// Safe Session (MemoryStore) - Prevents the crash we saw
app.use(session({
  secret: process.env.JWT_SECRET || 'n10_wings_default_secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000
  }
}));

app.use(passport.initialize());
app.use(passport.session());

// All API Routes
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
app.use('/api/prize-claims', prizeClaimRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({
    success: true,
    status: '🚀 API FULLY RESTORED & RUNNING',
    production: true
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('SERVER ERROR:', err.stack);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
const httpServer = createServer(app);

// Initialize Socket.io
try {
  initSocket(httpServer);
  console.log('✅ Sockets Initialized');
} catch (err) {
  console.error('❌ Socket Initialization Failed:', err.message);
}

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server stabilized on port ${PORT}`);
});