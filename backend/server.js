import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables for local development
dotenv.config();

// ES Modules __dirname setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// 1. Basic test route for deployment verification
app.get('/', (req, res) => {
  res.status(200).send('🚀 FitLife API is live and running perfectly on Render.');
});

// 2. Import API Routes
// Note: Ensure all route files use ES Module exports and have .js extensions
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

// Static file serving (frontend)
app.use(express.static(path.join(__dirname, '../frontend')));

// 3. Database Connection Logic (Requirement: Safe URI check + async/await)
const connectDB = async () => {
  const MONGO_URI = process.env.MONGO_URI;

  if (!MONGO_URI) {
    console.error('❌ FATAL ERROR: MONGO_URI is undefined.');
    console.error('SOLUTION: Set MONGO_URI in your Render environment variables or local .env file.');
    process.exit(1); // Exit safely if config is missing
  }

  try {
    console.log('🔄 Connecting to MongoDB...');
    const conn = await mongoose.connect(MONGO_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Failed: ${error.message}`);
    process.exit(1);
  }
};

// 4. Server Start Logic (Requirement: Dynamic PORT for Render)
const startServer = async () => {
  await connectDB();

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 FitLife Server running on port ${PORT}`);
    console.log(`🔗 Local URL: http://localhost:${PORT}`);
  });
};

startServer();
