// /backend/models/Suggestion.js
import mongoose from 'mongoose';

const SuggestionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  goal: { type: String, required: true },
  age: { type: Number, required: true },
  activityLevel: { type: String, required: true },
  workoutPlan: { type: String, default: '' },
  dietSuggestion: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('Suggestion', SuggestionSchema);
