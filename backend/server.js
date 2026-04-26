// /backend/server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./config/db');
const logger = require('./middleware/logger');

// Routes
const authRoutes = require('./routes/auth');
const workoutRoutes = require('./routes/workout');
const profileRoutes = require('./routes/profile');
const goalRoutes = require('./routes/goal');
const aiRoutes = require('./routes/ai');

const app = express();
const server = http.createServer(app);

// Socket.IO setup
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(logger);

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../frontend')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/ai', aiRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// ---- Socket.IO Chat ----
const chatHistory = []; // In-memory chat (for demo; use DB for production)

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
    // Broadcast to everyone
    io.emit('chat:message', message);
  });

  socket.on('disconnect', () => {
    console.log(`🔌 User disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 FitLife server running on http://localhost:${PORT}`);
});
