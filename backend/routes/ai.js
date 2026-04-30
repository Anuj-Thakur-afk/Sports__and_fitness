// /backend/routes/ai.js
import express from 'express';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from '../config/supabase.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.use(protect);

// @route  POST /api/ai/suggest
// @desc   Get AI fitness suggestion
// @access Private
router.post('/suggest', async (req, res) => {
  try {
    const { goal, age, activityLevel: activity } = req.body;

    if (!goal || !age || !activity) {
      return res.status(400).json({ success: false, message: 'Goal, age, and activity level are required' });
    }

    let workoutPlan = '';
    let dietSuggestion = '';

    // Try Gemini if key is set
    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_key') {
      try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        
        const prompt = `Provide a SHORT weekly workout plan and diet suggestion for a ${age} year old with a goal of "${goal}" and activity level "${activity}". 
        Format:
        Workout: [Short plan]
        Diet: [Short suggestion]
        Limit response to 500 characters.`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        // Split response into workout and diet parts
        const parts = responseText.split(/Diet:/i);
        workoutPlan = parts[0] ? parts[0].replace(/Workout:/i, '').trim() : responseText;
        dietSuggestion = parts[1] ? parts[1].trim() : 'Balanced nutrition plan recommended.';
      } catch (apiError) {
        console.error('Gemini API Error:', apiError.message);
        // Fallback to mock data
        workoutPlan = generateMockWorkoutPlan(goal, age, activity);
        dietSuggestion = generateMockDiet(goal);
      }
    } else {
      // Fallback mock response when Gemini key not set
      workoutPlan = generateMockWorkoutPlan(goal, age, activity);
      dietSuggestion = generateMockDiet(goal);
    }

    // Save suggestion to DB
    const { data: suggestion, error } = await supabase
      .from('suggestions')
      .insert([{
        user_id: req.user.id,
        goal,
        age,
        activity_level: activity,
        workout_plan: workoutPlan,
        diet_suggestion: dietSuggestion
      }])
      .select('id, _id:id, goal, age, activityLevel:activity_level, workoutPlan:workout_plan, dietSuggestion:diet_suggestion, createdAt:created_at')
      .single();

    if (error) throw error;

    res.json({ success: true, suggestion });
  } catch (error) {
    console.error('AI Error:', error.message);
    res.status(500).json({ success: false, message: 'AI service error: ' + error.message });
  }
});

// @route  GET /api/ai/history
// @desc   Get past AI suggestions for user
// @access Private
router.get('/history', async (req, res) => {
  try {
    const { data: suggestions, error } = await supabase
      .from('suggestions')
      .select('id, _id:id, goal, age, activityLevel:activity_level, workoutPlan:workout_plan, dietSuggestion:diet_suggestion, createdAt:created_at')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) throw error;

    res.json({ success: true, suggestions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// --- Mock generators (used when Gemini key is not set) ---

function generateMockWorkoutPlan(goal, age, activityLevel) {
  const intensity = activityLevel === 'sedentary' ? 'Low' : activityLevel === 'active' ? 'High' : 'Moderate';
  return `📅 7-Day Workout Plan (${intensity} Intensity)

Day 1 - Monday: 30-min brisk walk + 15-min stretching
Day 2 - Tuesday: Strength training (3 sets × 12 reps: squats, push-ups, lunges)
Day 3 - Wednesday: Active rest – yoga or light swimming (20 min)
Day 4 - Thursday: HIIT cardio (20 min intervals: 40s on / 20s off)
Day 5 - Friday: Upper body strength (dumbbell rows, shoulder press, curls)
Day 6 - Saturday: Long walk or cycling (45 min at easy pace)
Day 7 - Sunday: Full rest – foam rolling and hydration focus

Goal: ${goal} | Age: ${age} | Level: ${activityLevel}`;
}

function generateMockDiet(goal) {
  if (goal === 'lose_weight') {
    return `🥗 Diet Plan (Calorie Deficit Focus)

🌅 Breakfast: Oats with berries + black coffee
🌞 Lunch: Grilled chicken salad with quinoa
🌆 Dinner: Steamed vegetables + baked fish
🍎 Snacks: Apple, handful of almonds, Greek yogurt

Target: ~1,800 cal/day | High protein, low sugar`;
  }
  if (goal === 'gain_muscle') {
    return `💪 Diet Plan (Muscle Building Focus)

🌅 Breakfast: 4 scrambled eggs + whole grain toast + banana
🌞 Lunch: Brown rice + chicken breast + broccoli
🌆 Dinner: Salmon + sweet potato + spinach
🍎 Snacks: Protein shake, peanut butter on rice cakes

Target: ~2,800 cal/day | High protein (1.6g/kg body weight)`;
  }
  return `⚖️ Diet Plan (Maintenance & Balance)

🌅 Breakfast: Smoothie bowl with granola + nuts
🌞 Lunch: Wrap with turkey, avocado, veggies
🌆 Dinner: Stir-fry tofu or chicken with rice
🍎 Snacks: Mixed nuts, fruit, hummus with crackers

Target: ~2,200 cal/day | Balanced macros`;
}

export default router;
