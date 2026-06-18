import mongoose from 'mongoose';

const alertSchema = new mongoose.Schema({
  org: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
  type: {
    type: String,
    enum: ['low_balance', 'overdue_invoice', 'bill_due', 'runway_warning', 'large_transaction', 'goal_reached', 'custom'],
    required: true,
  },
  severity: { type: String, enum: ['info', 'warning', 'critical'], default: 'warning' },
  title: { type: String, required: true },
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  isResolved: { type: Boolean, default: false },
  resolvedAt: { type: Date, default: null },
  linkedEntity: {
    model: { type: String, enum: ['Account', 'Invoice', 'Bill', 'Transaction'], default: null },
    id: { type: mongoose.Schema.Types.ObjectId, default: null },
  },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

alertSchema.index({ org: 1, isRead: 1, createdAt: -1 });
alertSchema.index({ org: 1, isResolved: 1 });
alertSchema.set('toJSON', { transform: (_, obj) => { delete obj.__v; return obj; } });

export default mongoose.model('Alert', alertSchema);
