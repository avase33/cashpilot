// Transaction model -- 2026-06-29 14:28:07
import mongoose, { Document, Schema } from 'mongoose';

export interface ITransaction extends Document {
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  currency: string;
  category: string;
  description: string;
  date: Date;
  invoiceId?: string;
  tags: string[];
  createdAt: Date;
}

const TransactionSchema = new Schema<ITransaction>({
  type: { type: String, enum: ['income','expense','transfer'], required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  category: { type: String, required: true },
  description: { type: String, required: true },
  date: { type: Date, required: true },
  invoiceId: String,
  tags: [String],
}, { timestamps: true });

TransactionSchema.index({ type: 1, date: -1 });
TransactionSchema.index({ category: 1 });

export const Transaction = mongoose.model<ITransaction>('Transaction', TransactionSchema);