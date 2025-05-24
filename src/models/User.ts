import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  subs_credentials: {
    user_name: { type: String, required: true, unique: true },
    password: { type: String, required: true }
  },
  plan_expiry: { type: Date, required: true },
  devices: { type: [String], default: [] },
  isAdmin: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.User || mongoose.model('User', userSchema);
