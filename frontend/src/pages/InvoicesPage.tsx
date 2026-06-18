import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invoicesApi } from '../lib/api';
import { Plus, FileText, CheckCircle, X, Trash2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import type { Invoice, InvoiceStatus } from '../types';

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}

const STATUS_BADGE: Record<InvoiceStatus, string> = {
  draft: 'badge-gray',
  sent: 'badge-blue',
  viewed: 'badge-blue',
  paid: 'badge-green',
  partial: 'badge-yellow',
  overdue: 'badge-red',
  cancelled: 'badge-gray',
};

function AddInvoiceModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    clientName: '', clientEmail: '', dueDate: '',
    description: '', quantity: '1', unitPrice: '',
    notes: '', terms: 'Net 30',
  });
  const setF = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const mutation = useMutation({
    mutationFn: () => invoicesApi.create({
      client: { name: form.clientName, email: form.clientEmail, address: '', company: '' },
      dueDate: form.dueDate,
      notes: form.notes,
      terms: form.terms,
      lineItems: [{
        description: form.description,
        quantity: Number(form.quantity),
        unitPrice: Number(form.unitPrice),
        taxRate: 0,
        amount: Number(form.quantity) * Number(form.unitPrice),
      }],
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['invoices'] }); onClose(); },
  });

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">New Invoice</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300"><X size={20} /></button>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Client name</label>
              <input className="input" value={form.clientName} onChange={setF('clientName')} placeholder="Acme Corp" required />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Client email</label>
              <input className="input" type="email" value={form.clientEmail} onChange={setF('clientEmail')} placeholder="billing@acme.com" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Due date</label>
              <input className="input" type="date" value={form.dueDate} onChange={setF('dueDate')} required />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Terms</label>
              <input className="input" value={form.terms} onChange={setF('terms')} placeholder="Net 30" />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Item description</label>
            <input className="input" value={form.description} onChange={setF('description')} placeholder="Design services, consulting..." required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Quantity</label>
              <input className="input" type="number" min="1" value={form.quantity} onChange={setF('quantity')} />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Unit price</label>
              <input className="input" type="number" min="0.01" step="0.01" value={form.unitPrice} onChange={setF('unitPrice')} placeholder="0.00" required />
            </div>
          </div>
          {form.quantity && form.unitPrice && (
            <div className="bg-blue-900/20 border border-blue-800/40 rounded-lg px-4 py-3 text-sm">
              <span className="text-gray-400">Total: </span>
              <span className="text-white font-semibold">{fmt(Number(form.quantity) * Number(form.unitPrice))}</span>
            </div>
          )}
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={() => mutation.mutate()}
            disabled={!form.clientName || !form.dueDate || !form.description || !form.unitPrice || mutation.isPending}
            className="btn-primary flex-1">
            {mutation.isPending ? 'Creating...' : 'Create Invoice'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function InvoicesPage() {
  const [showAdd, setShowAdd] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['invoices', statusFilter],
    queryFn: () => invoicesApi.list({ status: statusFilter || undefined }),
  });

  const markPaidMutation = useMutation({
    mutationFn: (id: string) => invoicesApi.markPaid(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['invoices'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => invoicesApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['invoices'] }),
  });

  const invoices: Invoice[] = data?.invoices || [];
  const stats = data?.stats;

  return (
    <div className="p-8">
      {showAdd && <AddInvoiceModal onClose={() => setShowAdd(false)} />}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Invoices</h1>
        <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> New Invoice
        </button>
      </div>

      {stats && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="card py-4">
            <p className="text-xs text-gray-500 mb-1">Outstanding</p>
            <p className="text-lg font-bold text-white">{fmt(stats.totalOutstanding)}</p>
          </div>
          <div className="card py-4">
            <p className="text-xs text-gray-500 mb-1">Overdue</p>
            <p className="text-lg font-bold text-red-400">{fmt(stats.totalOverdue)}</p>
          </div>
          <div className="card py-4">
            <p className="text-xs text-gray-500 mb-1">Paid this month</p>
            <p className="text-lg font-bold text-green-400">{fmt(stats.totalPaidThisMonth)}</p>
          </div>
          <div className="card py-4">
            <p className="text-xs text-gray-500 mb-1">Drafts</p>
            <p className="text-lg font-bold text-gray-300">{stats.countDraft}</p>
          </div>
        </div>
      )}

      <div className="flex gap-2 mb-4">
        {['', 'draft', 'sent', 'paid', 'overdue', 'cancelled'].map(s => (
          <button key={s || 'all'} onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${statusFilter === s ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
            {s || 'All'}
          </button>
        ))}
      </div>

      <div className="card p-0 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16"><div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : invoices.length === 0 ? (
          <div className="text-center py-16">
            <FileText size={36} className="text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500">No invoices yet</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                {['Invoice #', 'Client', 'Status', 'Issue Date', 'Due Date', 'Total', 'Balance Due', ''].map(h => (
                  <th key={h} className="text-left text-xs text-gray-500 font-medium px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {invoices.map(inv => (
                <tr key={inv._id} className="border-b border-gray-800/50 hover:bg-gray-800/20 group">
                  <td className="px-5 py-3 text-sm text-blue-400 font-mono">{inv.invoiceNumber}</td>
                  <td className="px-5 py-3"><p className="text-sm text-gray-200">{inv.client.name}</p><p className="text-xs text-gray-500">{inv.client.email}</p></td>
                  <td className="px-5 py-3"><span className={STATUS_BADGE[inv.status]}>{inv.status}</span></td>
                  <td className="px-5 py-3 text-xs text-gray-500">{format(parseISO(inv.issueDate), 'MMM d, yyyy')}</td>
                  <td className="px-5 py-3 text-xs text-gray-500">{format(parseISO(inv.dueDate), 'MMM d, yyyy')}</td>
                  <td className="px-5 py-3 text-sm text-gray-200">{fmt(inv.total)}</td>
                  <td className="px-5 py-3 text-sm font-medium text-yellow-400">{inv.amountDue > 0 ? fmt(inv.amountDue) : '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      {['sent', 'viewed', 'partial', 'overdue'].includes(inv.status) && (
                        <button onClick={() => markPaidMutation.mutate(inv._id)} className="text-green-500 hover:text-green-400" title="Mark paid"><CheckCircle size={14} /></button>
                      )}
                      <button onClick={() => deleteMutation.mutate(inv._id)} className="text-gray-600 hover:text-red-400"><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
