import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';

const app = express();

// ── MINIMALIST STARTUP TO BREAK 502 CYCLE ──
console.log('--- STARTING SERVER ---');
console.log('PORT:', process.env.PORT);
console.log('NODE_ENV:', process.env.NODE_ENV);

app.set('trust proxy', 1);
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// ── Health check (FIRST ROUTE) ──
app.get('/', (req, res) => {
  console.log('Health check hit!');
  res.json({
    success: true,
    status: '🚀 API IS RUNNING - STABILIZED MODE',
    timestamp: new Date()
  });
});

// Basic error handler
app.use((err, req, res, next) => {
  console.error('Fatal Startup Error:', err);
  res.status(500).json({ success: false, error: err.message });
});

const PORT = process.env.PORT || 5000;
const httpServer = createServer(app);

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ EXTREME STABILITY MODE: Server running on port ${PORT}`);
});