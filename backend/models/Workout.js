// /backend/models/Workout.js
const mongoose = require('mongoose');

const WorkoutSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: [true, 'Workout title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters'],
  },
  type: {
    type: String,
    required: [true, 'Workout type is required'],
    enum: ['cardio', 'strength', 'flexibility', 'hiit', 'yoga', 'sports', 'other'],
  },
  duration: {
    type: Number, // in minutes
    required: [true, 'Duration is required'],
    min: [1, 'Duration must be at least 1 minute'],
  },
  caloriesBurned: {
    type: Number,
    required: [true, 'Calories burned is required'],
    min: [0, 'Calories cannot be negative'],
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters'],
    default: '',
  },
  date: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

module.exports = mongoose.model('Workout', WorkoutSchema);
