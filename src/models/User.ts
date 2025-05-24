import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  subs_credentials: {
    user_name: { type: String, required: true, unique: true },
    password: { type: String, required: true }
  },
  other_preferences: {
    plan: { type: String, enum: ['free', 'basic', 'premium'], default: 'free' },
    plan_expiry: Date
  },
  devices: [String],
});

export default mongoose.models.User || mongoose.model('User', userSchema);
