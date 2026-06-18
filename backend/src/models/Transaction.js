import mongoose from 'mongoose';

const CATEGORIES = [
  'revenue', 'consulting', 'subscription', 'investment', 'loan', 'refund', 'other_income',
  'payroll', 'rent', 'utilities', 'software', 'marketing', 'travel', 'equipment',
  'insurance', 'taxes', 'legal', 'accounting', 'supplies', 'meals', 'other_expense',
];

const transactionSchema = new mongoose.Schema({
  org: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
  account: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true },
  type: { type: String, enum: ['income', 'expense', 'transfer'], required: true },
  amount: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'USD' },
  category: { type: String, enum: CATEGORIES, default: 'other_expense' },
  subcategory: { type: String, default: '' },
  description: { type: String, required: true, trim: true },
  date: { type: Date, required: true, default: Date.now },
  reference: { type: String, default: '' },
  tags: [{ type: String, trim: true }],
  notes: { type: String, default: '' },
  isRecurring: { type: Boolean, default: false },
  recurringId: { type: mongoose.Schema.Types.ObjectId, default: null },
  linkedInvoice: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', default: null },
  linkedBill: { type: mongoose.Schema.Types.ObjectId, ref: 'Bill', default: null },
  transferToAccount: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', default: null },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

transactionSchema.index({ org: 1, date: -1 });
transactionSchema.index({ org: 1, account: 1, date: -1 });
transactionSchema.index({ org: 1, type: 1, date: -1 });
transactionSchema.index({ org: 1, category: 1 });

transactionSchema.set('toJSON', { transform: (_, obj) => { delete obj.__v; return obj; } });

export const TRANSACTION_CATEGORIES = CATEGORIES;
export default mongoose.model('Transaction', transactionSchema);
