// /backend/routes/profile.js
import express from 'express';
import { supabase } from '../config/supabase.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

// @route  GET /api/profile
// @desc   Get current user's profile
// @access Private
router.get('/', async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, email, age, weight, height, fitness_goal, activity_level, created_at, updated_at')
      .eq('id', req.user.id)
      .single();

    if (error) throw error;

    // Convert keys for frontend compatibility
    const profile = {
      _id: user.id,
      id: user.id,
      name: user.name,
      email: user.email,
      age: user.age,
      weight: user.weight,
      height: user.height,
      fitnessGoal: user.fitness_goal,
      activityLevel: user.activity_level,
      createdAt: user.created_at
    };

    res.json({ success: true, profile });
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
    if (fitnessGoal !== undefined) updates.fitness_goal = fitnessGoal;
    if (activityLevel !== undefined) updates.activity_level = activityLevel;

    const { data: user, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', req.user.id)
      .select('id, name, email, age, weight, height, fitness_goal, activity_level, created_at, updated_at')
      .single();

    if (error) throw error;

    const profile = {
      _id: user.id,
      id: user.id,
      name: user.name,
      email: user.email,
      age: user.age,
      weight: user.weight,
      height: user.height,
      fitnessGoal: user.fitness_goal,
      activityLevel: user.activity_level,
      createdAt: user.created_at
    };

    res.json({ success: true, profile });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
