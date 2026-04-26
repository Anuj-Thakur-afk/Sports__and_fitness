// /backend/routes/ai.js
const express = require('express');
const router = express.Router();
const OpenAI = require('openai');
const Suggestion = require('../models/Suggestion');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

// @route  POST /api/ai/suggest
// @desc   Get AI fitness suggestion
// @access Private
router.post('/suggest', async (req, res) => {
  try {
    const { goal, age, activityLevel } = req.body;

    if (!goal || !age || !activityLevel) {
      return res.status(400).json({ success: false, message: 'Goal, age, and activity level are required' });
    }

    let workoutPlan = '';
    let dietSuggestion = '';

    // Try OpenAI if key is set
    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here') {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const prompt = `You are a professional fitness trainer. Based on the following details, provide a personalized weekly workout plan and diet suggestion.
      
User Details:
- Fitness Goal: ${goal}
- Age: ${age} years
- Activity Level: ${activityLevel}

Please provide:
1. A 7-day workout plan (detailed, day by day)
2. A diet suggestion with meal ideas for breakfast, lunch, dinner, and snacks

Keep it practical, motivating, and safe.`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 800,
      });

      const responseText = completion.choices[0].message.content;
      // Split response into workout and diet parts
      const parts = responseText.split(/diet suggestion|2\./i);
      workoutPlan = parts[0] ? parts[0].replace(/1\.\s*/i, '').trim() : responseText;
      dietSuggestion = parts[1] ? parts[1].trim() : 'See full response above.';
    } else {
      // Fallback mock response when OpenAI key not set
      workoutPlan = generateMockWorkoutPlan(goal, age, activityLevel);
      dietSuggestion = generateMockDiet(goal);
    }

    // Save suggestion to DB
    const suggestion = await Suggestion.create({
      user: req.user._id,
      goal,
      age,
      activityLevel,
      workoutPlan,
      dietSuggestion,
    });

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
    const suggestions = await Suggestion.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(5);
    res.json({ success: true, suggestions });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// --- Mock generators (used when OpenAI key is not set) ---

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

module.exports = router;
