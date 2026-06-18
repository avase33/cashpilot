import mongoose from 'mongoose';

const memberSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, enum: ['owner', 'admin', 'accountant', 'viewer'], default: 'viewer' },
  joinedAt: { type: Date, default: Date.now },
});

const orgSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, unique: true, sparse: true },
  industry: { type: String, default: '' },
  currency: { type: String, default: 'USD' },
  fiscalYearStart: { type: Number, default: 1 }, // month 1-12
  members: [memberSchema],
  runwayAlertDays: { type: Number, default: 60 },
  lowBalanceThreshold: { type: Number, default: 1000 },
  plan: { type: String, enum: ['free', 'pro', 'enterprise'], default: 'free' },
}, { timestamps: true });

orgSchema.set('toJSON', { transform: (_, obj) => { delete obj.__v; return obj; } });

export default mongoose.model('Organization', orgSchema);
