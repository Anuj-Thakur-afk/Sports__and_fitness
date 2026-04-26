import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';

import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

// ES Modules __dirname setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);

// Socket.IO setup for Chat functionality
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

// Middleware
app.use(cors());
app.use(express.json());

// 1. Basic test route (Health Check)
app.get('/api/health', (req, res) => {
  res.status(200).send('🚀 FitLife API is live and running perfectly on Render.');
});

// 2. Import API Routes
import authRoutes from './routes/auth.js';
import workoutRoutes from './routes/workout.js';
import profileRoutes from './routes/profile.js';
import goalRoutes from './routes/goal.js';
import aiRoutes from './routes/ai.js';

app.use('/api/auth', authRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/ai', aiRoutes);

// Static file serving
app.use(express.static(path.join(__dirname, '../frontend')));

// 3. Socket.IO Chat Logic
const chatHistory = [];
io.on('connection', (socket) => {
  console.log(`🔌 User connected: ${socket.id}`);

  // Send last 20 messages to newly connected user
  socket.emit('chat:history', chatHistory.slice(-20));

  // Listen for incoming messages
  socket.on('chat:message', (data) => {
    const message = {
      id: Date.now(),
      user: data.user || 'Anonymous',
      text: data.text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    chatHistory.push(message);
    io.emit('chat:message', message);
  });

  socket.on('disconnect', () => {
    console.log(`🔌 User disconnected: ${socket.id}`);
  });
});

// 5. Start Server
const startServer = () => {
  const PORT = process.env.PORT || 5000;
  httpServer.listen(PORT, () => {
    console.log(`🚀 FitLife Server running on port ${PORT}`);
    console.log(`🔗 Local URL: http://localhost:${PORT}`);
  });
};

startServer();
