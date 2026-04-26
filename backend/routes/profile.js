// /backend/routes/profile.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

// @route  GET /api/profile
// @desc   Get current user's profile
// @access Private
router.get('/', async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json({ success: true, profile: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route  PUT /api/profile
// @desc   Update user profile
// @access Private
router.put('/', async (req, res) => {
  try {
    const { name, age, weight, height, fitnessGoal, activityLevel } = req.body;

    // Build update object with only allowed fields
    const updates = {};
    if (name) updates.name = name;
    if (age !== undefined) updates.age = age;
    if (weight !== undefined) updates.weight = weight;
    if (height !== undefined) updates.height = height;
    if (fitnessGoal !== undefined) updates.fitnessGoal = fitnessGoal;
    if (activityLevel !== undefined) updates.activityLevel = activityLevel;

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    }).select('-password');

    res.json({ success: true, profile: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
