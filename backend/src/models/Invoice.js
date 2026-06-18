import mongoose from 'mongoose';
import { nanoid } from 'nanoid';

const lineItemSchema = new mongoose.Schema({
  description: { type: String, required: true },
  quantity: { type: Number, default: 1 },
  unitPrice: { type: Number, required: true },
  taxRate: { type: Number, default: 0 },
  amount: { type: Number, required: true },
}, { _id: false });

const invoiceSchema = new mongoose.Schema({
  org: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
  invoiceNumber: { type: String, required: true },
  status: { type: String, enum: ['draft', 'sent', 'viewed', 'paid', 'partial', 'overdue', 'cancelled'], default: 'draft' },
  client: {
    name: { type: String, required: true },
    email: { type: String, default: '' },
    address: { type: String, default: '' },
    company: { type: String, default: '' },
  },
  lineItems: [lineItemSchema],
  subtotal: { type: Number, default: 0 },
  taxTotal: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  amountPaid: { type: Number, default: 0 },
  amountDue: { type: Number, default: 0 },
  currency: { type: String, default: 'USD' },
  issueDate: { type: Date, default: Date.now },
  dueDate: { type: Date, required: true },
  paidDate: { type: Date, default: null },
  notes: { type: String, default: '' },
  terms: { type: String, default: 'Net 30' },
  linkedAccount: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', default: null },
  slug: { type: String, unique: true, sparse: true, default: () => nanoid(10) },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

invoiceSchema.pre('save', function (next) {
  this.subtotal = this.lineItems.reduce((s, i) => s + i.amount, 0);
  this.taxTotal = this.lineItems.reduce((s, i) => s + (i.amount * i.taxRate / 100), 0);
  this.total = this.subtotal + this.taxTotal;
  this.amountDue = this.total - this.amountPaid;
  if (this.amountPaid >= this.total) this.status = 'paid';
  else if (this.amountPaid > 0) this.status = 'partial';
  else if (this.status !== 'draft' && this.status !== 'cancelled' && new Date() > this.dueDate) this.status = 'overdue';
  next();
});

invoiceSchema.index({ org: 1, status: 1 });
invoiceSchema.index({ org: 1, dueDate: 1 });
invoiceSchema.set('toJSON', { transform: (_, obj) => { delete obj.__v; return obj; } });

export default mongoose.model('Invoice', invoiceSchema);
