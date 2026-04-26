// /backend/routes/goal.js
const express = require('express');
const router = express.Router();
const Goal = require('../models/Goal');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

// @route  GET /api/goals
// @desc   Get goal for today (or a specific date via ?date=YYYY-MM-DD)
// @access Private
router.get('/', async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().split('T')[0];
    const goal = await Goal.findOne({ user: req.user._id, date });
    res.json({ success: true, goal: goal || null });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route  POST /api/goals
// @desc   Create or update today's goal
// @access Private
router.post('/', async (req, res) => {
  try {
    const { calorieGoal, calorieProgress, notes, date } = req.body;

    if (calorieGoal === undefined || calorieGoal === null) {
      return res.status(400).json({ success: false, message: 'Calorie goal is required' });
    }

    const targetDate = date || new Date().toISOString().split('T')[0];

    // Upsert: update if exists, create if not
    const goal = await Goal.findOneAndUpdate(
      { user: req.user._id, date: targetDate },
      { calorieGoal, calorieProgress: calorieProgress || 0, notes: notes || '' },
      { new: true, upsert: true, runValidators: true }
    );

    res.json({ success: true, goal });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route  PUT /api/goals/progress
// @desc   Update progress for today's goal
// @access Private
router.put('/progress', async (req, res) => {
  try {
    const { calorieProgress, date } = req.body;
    const targetDate = date || new Date().toISOString().split('T')[0];

    if (calorieProgress === undefined) {
      return res.status(400).json({ success: false, message: 'Progress value is required' });
    }

    const goal = await Goal.findOneAndUpdate(
      { user: req.user._id, date: targetDate },
      { calorieProgress },
      { new: true }
    );

    if (!goal) {
      return res.status(404).json({ success: false, message: 'No goal set for this date' });
    }

    res.json({ success: true, goal });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
