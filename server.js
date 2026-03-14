import 'dotenv/config';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import mongoose from 'mongoose';
import { Orchestrator } from './agents/Orchestrator.js';
import vitalsRouter from './routes/vitals.js';
import auditRouter from './routes/audit.js';
import escalationRouter from './routes/escalation.js';

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/golden_hour';

// Express + HTTP
const app = express();
const server = http.createServer(app);

// Socket.io with CORS for Vite dev server
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:3000'] }));
app.use(express.json());

// Routes
app.use('/api/vitals', vitalsRouter);
app.use('/api/audit', auditRouter);
app.use('/api/escalation', escalationRouter);

// Health check
app.get('/api/health', (_, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`[Socket.io] Client connected: ${socket.id}`);
  socket.on('disconnect', () => console.log(`[Socket.io] Client disconnected: ${socket.id}`));
});

// MongoDB + Orchestrator startup
async function start() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('[MongoDB] Connected →', MONGO_URI);

    // Inject io into routes that need to broadcast
    app.set('io', io);

    // Initialize orchestrator (accessible globally for routes)
    const orchestrator = new Orchestrator(io);
    app.set('orchestrator', orchestrator);
    await orchestrator.init();

    server.listen(PORT, () => {
      console.log(`[Server] Golden Hour MAS running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('[Server] Startup error:', err.message);
    process.exit(1);
  }
}

start();
