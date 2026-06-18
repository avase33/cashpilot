import mongoose from 'mongoose';

const billSchema = new mongoose.Schema({
  org: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
  vendor: { type: String, required: true, trim: true },
  category: { type: String, default: 'other_expense' },
  amount: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'USD' },
  status: { type: String, enum: ['pending', 'scheduled', 'paid', 'overdue', 'cancelled'], default: 'pending' },
  dueDate: { type: Date, required: true },
  paidDate: { type: Date, default: null },
  isRecurring: { type: Boolean, default: false },
  recurrence: {
    frequency: { type: String, enum: ['weekly', 'biweekly', 'monthly', 'quarterly', 'yearly'], default: 'monthly' },
    nextDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
  },
  linkedAccount: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', default: null },
  description: { type: String, default: '' },
  attachmentUrl: { type: String, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

billSchema.index({ org: 1, status: 1 });
billSchema.index({ org: 1, dueDate: 1 });
billSchema.set('toJSON', { transform: (_, obj) => { delete obj.__v; return obj; } });

export default mongoose.model('Bill', billSchema);
