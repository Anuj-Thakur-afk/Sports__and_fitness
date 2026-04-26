// /backend/routes/goal.js
import express from 'express';
import { supabase } from '../config/supabase.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

// @route  GET /api/goals
// @desc   Get goal for today (or a specific date via ?date=YYYY-MM-DD)
// @access Private
router.get('/', async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().split('T')[0];
    const { data: goal, error } = await supabase
      .from('goals')
      .select('id, _id:id, date, calorieGoal:calorie_goal, calorieProgress:calorie_progress, notes, createdAt:created_at')
      .eq('user_id', req.user.id)
      .eq('date', date)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "no rows returned"

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
    const { data: goal, error } = await supabase
      .from('goals')
      .upsert({
        user_id: req.user.id,
        date: targetDate,
        calorie_goal: calorieGoal,
        calorie_progress: calorieProgress || 0,
        notes: notes || ''
      }, { onConflict: 'user_id,date' })
      .select('id, _id:id, date, calorieGoal:calorie_goal, calorieProgress:calorie_progress, notes, createdAt:created_at')
      .single();

    if (error) throw error;

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

    const { data: goal, error } = await supabase
      .from('goals')
      .update({ calorie_progress: calorieProgress })
      .eq('user_id', req.user.id)
      .eq('date', targetDate)
      .select('id, _id:id, date, calorieGoal:calorie_goal, calorieProgress:calorie_progress, notes, createdAt:created_at')
      .single();

    if (error) {
       if (error.code === 'PGRST116') return res.status(404).json({ success: false, message: 'No goal set for this date' });
       throw error;
    }

    res.json({ success: true, goal });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
