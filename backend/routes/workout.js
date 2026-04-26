// /backend/routes/workout.js
import express from 'express';
import { supabase } from '../config/supabase.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// @route  GET /api/workouts
// @desc   Get all workouts for current user (paginated)
// @access Private
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    const { data: workouts, count: total, error } = await supabase
      .from('workouts')
      .select('id, _id:id, title, type, duration, caloriesBurned:calories_burned, notes, date, createdAt:created_at', { count: 'exact' })
      .eq('user_id', req.user.id)
      .order('date', { ascending: false })
      .range(skip, skip + limit - 1);

    if (error) throw error;

    res.json({
      success: true,
      workouts,
      pagination: {
        total: total || 0,
        page,
        pages: Math.ceil((total || 0) / limit),
        limit,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route  GET /api/workouts/stats
// @desc   Get workout stats (total count, total calories)
// @access Private
router.get('/stats', async (req, res) => {
  try {
    const { data: workouts, error } = await supabase
      .from('workouts')
      .select('calories_burned, duration')
      .eq('user_id', req.user.id);

    if (error) throw error;

    const stats = workouts.reduce((acc, w) => {
      acc.totalWorkouts += 1;
      acc.totalCalories += Number(w.calories_burned || 0);
      acc.totalDuration += Number(w.duration || 0);
      return acc;
    }, { totalWorkouts: 0, totalCalories: 0, totalDuration: 0 });

    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route  POST /api/workouts
// @desc   Add a workout
// @access Private
router.post('/', async (req, res) => {
  try {
    const { title, type, duration, caloriesBurned, notes, date } = req.body;

    if (!title || !type || !duration || !caloriesBurned) {
      return res.status(400).json({ success: false, message: 'Title, type, duration, and calories are required' });
    }

    const { data: workout, error } = await supabase
      .from('workouts')
      .insert([{
        user_id: req.user.id,
        title,
        type,
        duration,
        calories_burned: caloriesBurned,
        notes,
        date: date ? new Date(date).toISOString() : new Date().toISOString()
      }])
      .select('id, _id:id, title, type, duration, caloriesBurned:calories_burned, notes, date, createdAt:created_at')
      .single();

    if (error) throw error;

    res.status(201).json({ success: true, workout });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route  PUT /api/workouts/:id
// @desc   Update a workout
// @access Private
router.put('/:id', async (req, res) => {
  try {
    // Map frontend camelCase to snake_case
    const updates = { ...req.body };
    if (updates.caloriesBurned !== undefined) {
      updates.calories_burned = updates.caloriesBurned;
      delete updates.caloriesBurned;
    }

    const { data: workout, error } = await supabase
      .from('workouts')
      .update(updates)
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .select('id, _id:id, title, type, duration, caloriesBurned:calories_burned, notes, date, createdAt:created_at')
      .single();

    if (error) {
      if (error.code === 'PGRST116') return res.status(404).json({ success: false, message: 'Workout not found or unauthorized' });
      throw error;
    }

    res.json({ success: true, workout });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route  DELETE /api/workouts/:id
// @desc   Delete a workout
// @access Private
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('workouts')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id);

    if (error) throw error;

    res.json({ success: true, message: 'Workout deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
