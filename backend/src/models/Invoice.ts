// Invoice model -- 2026-07-21 19:19:02
import mongoose, { Document, Schema } from 'mongoose';

export interface IInvoice extends Document {
  invoiceNumber: string;
  clientName: string;
  clientEmail: string;
  amount: number;
  currency: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  dueDate: Date;
  paidAt?: Date;
  lineItems: Array<{ description: string; quantity: number; unitPrice: number; total: number }>;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LineItemSchema = new Schema({
  description: { type: String, required: true },
  quantity: { type: Number, required: true, min: 0 },
  unitPrice: { type: Number, required: true, min: 0 },
  total: { type: Number, required: true },
});

const InvoiceSchema = new Schema<IInvoice>({
  invoiceNumber: { type: String, required: true, unique: true },
  clientName: { type: String, required: true },
  clientEmail: { type: String, required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  status: { type: String, enum: ['draft','sent','paid','overdue','cancelled'], default: 'draft' },
  dueDate: { type: Date, required: true },
  paidAt: Date,
  lineItems: [LineItemSchema],
  notes: String,
}, { timestamps: true });

InvoiceSchema.index({ status: 1, dueDate: 1 });
InvoiceSchema.index({ clientEmail: 1 });

export const Invoice = mongoose.model<IInvoice>('Invoice', InvoiceSchema);