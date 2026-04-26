// /backend/models/Goal.js
import mongoose from 'mongoose';

const GoalSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  date: {
    type: String, // stored as YYYY-MM-DD
    required: true,
  },
  calorieGoal: {
    type: Number,
    required: [true, 'Calorie goal is required'],
    min: [0, 'Goal cannot be negative'],
  },
  calorieProgress: {
    type: Number,
    default: 0,
    min: [0, 'Progress cannot be negative'],
  },
  notes: {
    type: String,
    maxlength: [300, 'Notes cannot exceed 300 characters'],
    default: '',
  },
}, { timestamps: true });

// Compound index: one goal entry per user per date
GoalSchema.index({ user: 1, date: 1 }, { unique: true });

export default mongoose.model('Goal', GoalSchema);
