import mongoose from 'mongoose';

const accountSchema = new mongoose.Schema({
  org: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
  name: { type: String, required: true, trim: true },
  type: {
    type: String,
    enum: ['checking', 'savings', 'credit', 'investment', 'cash', 'crypto', 'other'],
    default: 'checking',
  },
  currency: { type: String, default: 'USD' },
  balance: { type: Number, default: 0 },
  initialBalance: { type: Number, default: 0 },
  institution: { type: String, default: '' },
  accountNumber: { type: String, default: '' }, // last 4 digits only
  color: { type: String, default: '#3B82F6' },
  icon: { type: String, default: 'bank' },
  isActive: { type: Boolean, default: true },
  includeInTotal: { type: Boolean, default: true },
  notes: { type: String, default: '' },
}, { timestamps: true });

accountSchema.index({ org: 1, isActive: 1 });
accountSchema.set('toJSON', { transform: (_, obj) => { delete obj.__v; return obj; } });

export default mongoose.model('Account', accountSchema);
