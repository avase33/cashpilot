import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { billsApi } from '../lib/api';
import { Plus, Receipt, CheckCircle, X, Trash2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import type { Bill, BillStatus } from '../types';

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}

const STATUS_BADGE: Record<BillStatus, string> = {
  pending: 'badge-yellow',
  scheduled: 'badge-blue',
  paid: 'badge-green',
  overdue: 'badge-red',
  cancelled: 'badge-gray',
};

const EXPENSE_CATEGORIES = ['payroll', 'rent', 'utilities', 'software', 'marketing', 'travel', 'equipment', 'insurance', 'taxes', 'legal', 'accounting', 'supplies', 'meals', 'other_expense'];

function AddBillModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ vendor: '', amount: '', dueDate: '', category: 'other_expense', description: '', isRecurring: false, frequency: 'monthly' });
  const setF = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const mutation = useMutation({
    mutationFn: () => billsApi.create({
      ...form,
      amount: Number(form.amount),
      isRecurring: form.isRecurring,
      recurrence: form.isRecurring ? { frequency: form.frequency } : undefined,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['bills'] }); onClose(); },
  });

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">Add Bill</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300"><X size={20} /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Vendor</label>
            <input className="input" value={form.vendor} onChange={setF('vendor')} placeholder="AWS, Rent, Payroll..." required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Amount</label>
              <input className="input" type="number" min="0.01" step="0.01" value={form.amount} onChange={setF('amount')} />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Due date</label>
              <input className="input" type="date" value={form.dueDate} onChange={setF('dueDate')} required />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Category</label>
            <select className="input" value={form.category} onChange={setF('category')}>
              {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
            </select>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="w-4 h-4" checked={form.isRecurring}
              onChange={e => setForm(f => ({ ...f, isRecurring: e.target.checked }))} />
            <span className="text-sm text-gray-300">Recurring bill</span>
          </label>
          {form.isRecurring && (
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Frequency</label>
              <select className="input" value={form.frequency} onChange={setF('frequency')}>
                {['weekly', 'biweekly', 'monthly', 'quarterly', 'yearly'].map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
          )}
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={() => mutation.mutate()} disabled={!form.vendor || !form.amount || !form.dueDate || mutation.isPending} className="btn-primary flex-1">
            {mutation.isPending ? 'Adding...' : 'Add Bill'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BillsPage() {
  const [showAdd, setShowAdd] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['bills', statusFilter],
    queryFn: () => billsApi.list({ status: statusFilter || undefined }),
  });

  const payMutation = useMutation({
    mutationFn: (id: string) => billsApi.pay(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bills'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => billsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bills'] }),
  });

  const bills: Bill[] = data?.bills || [];
  const stats = data?.stats;

  return (
    <div className="p-8">
      {showAdd && <AddBillModal onClose={() => setShowAdd(false)} />}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Bills</h1>
        <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add Bill
        </button>
      </div>

      {stats && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="card py-4">
            <p className="text-xs text-gray-500 mb-1">Due in 30 days</p>
            <p className="text-lg font-bold text-yellow-400">{fmt(stats.totalUpcoming30Days)}</p>
            <p className="text-xs text-gray-600 mt-0.5">{stats.countUpcoming} bills</p>
          </div>
          <div className="card py-4">
            <p className="text-xs text-gray-500 mb-1">Overdue</p>
            <p className="text-lg font-bold text-red-400">{stats.countOverdue}</p>
          </div>
          <div className="card py-4">
            <p className="text-xs text-gray-500 mb-1">Total bills</p>
            <p className="text-lg font-bold text-gray-300">{data?.total || 0}</p>
          </div>
        </div>
      )}

      <div className="flex gap-2 mb-4">
        {['', 'pending', 'paid', 'overdue', 'cancelled'].map(s => (
          <button key={s || 'all'} onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${statusFilter === s ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
            {s || 'All'}
          </button>
        ))}
      </div>

      <div className="card p-0 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16"><div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : bills.length === 0 ? (
          <div className="text-center py-16"><Receipt size={36} className="text-gray-600 mx-auto mb-3" /><p className="text-gray-500">No bills found</p></div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                {['Vendor', 'Category', 'Status', 'Due Date', 'Recurring', 'Amount', ''].map(h => (
                  <th key={h} className="text-left text-xs text-gray-500 font-medium px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bills.map(bill => (
                <tr key={bill._id} className="border-b border-gray-800/50 hover:bg-gray-800/20 group">
                  <td className="px-5 py-3 text-sm text-gray-200">{bill.vendor}</td>
                  <td className="px-5 py-3 text-xs text-gray-500 capitalize">{bill.category?.replace(/_/g, ' ')}</td>
                  <td className="px-5 py-3"><span className={STATUS_BADGE[bill.status]}>{bill.status}</span></td>
                  <td className="px-5 py-3 text-xs text-gray-500">{format(parseISO(bill.dueDate), 'MMM d, yyyy')}</td>
                  <td className="px-5 py-3 text-xs text-gray-500">{bill.isRecurring ? `${bill.recurrence?.frequency}` : '—'}</td>
                  <td className="px-5 py-3 text-sm font-medium text-gray-200">{fmt(bill.amount)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      {bill.status !== 'paid' && bill.status !== 'cancelled' && (
                        <button onClick={() => payMutation.mutate(bill._id)} className="text-green-500 hover:text-green-400" title="Mark paid"><CheckCircle size={14} /></button>
                      )}
                      <button onClick={() => deleteMutation.mutate(bill._id)} className="text-gray-600 hover:text-red-400"><Trash2 size={13} /></button>
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
