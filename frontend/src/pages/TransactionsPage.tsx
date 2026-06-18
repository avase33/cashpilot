import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionsApi, accountsApi } from '../lib/api';
import { Plus, Search, ArrowUpRight, ArrowDownRight, ArrowLeftRight, X, Trash2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import type { Transaction } from '../types';

const CATEGORIES_INCOME = ['revenue', 'consulting', 'subscription', 'investment', 'loan', 'refund', 'other_income'];
const CATEGORIES_EXPENSE = ['payroll', 'rent', 'utilities', 'software', 'marketing', 'travel', 'equipment', 'insurance', 'taxes', 'legal', 'accounting', 'supplies', 'meals', 'other_expense'];

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}

function AddTxModal({ onClose, accounts }: { onClose: () => void; accounts: { _id: string; name: string }[] }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    account: accounts[0]?._id || '',
    type: 'expense' as 'income' | 'expense' | 'transfer',
    amount: '',
    description: '',
    category: 'other_expense',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });
  const setF = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const mutation = useMutation({
    mutationFn: () => transactionsApi.create({ ...form, amount: Number(form.amount) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['transactions'] }); qc.invalidateQueries({ queryKey: ['accounts'] }); onClose(); },
  });

  const categories = form.type === 'income' ? CATEGORIES_INCOME : CATEGORIES_EXPENSE;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">Add Transaction</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300"><X size={20} /></button>
        </div>
        <div className="space-y-4">
          <div className="flex gap-2">
            {(['income', 'expense', 'transfer'] as const).map(t => (
              <button key={t} onClick={() => setForm(f => ({ ...f, type: t, category: t === 'income' ? 'revenue' : 'other_expense' }))}
                className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${form.type === t ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
                {t}
              </button>
            ))}
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Account</label>
            <select className="input" value={form.account} onChange={setF('account')}>
              {accounts.map(a => <option key={a._id} value={a._id}>{a.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Amount</label>
              <input className="input" type="number" min="0.01" step="0.01" value={form.amount} onChange={setF('amount')} placeholder="0.00" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Date</label>
              <input className="input" type="date" value={form.date} onChange={setF('date')} />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Description</label>
            <input className="input" value={form.description} onChange={setF('description')} placeholder="What's this for?" />
          </div>
          {form.type !== 'transfer' && (
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Category</label>
              <select className="input" value={form.category} onChange={setF('category')}>
                {categories.map(c => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
          )}
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={() => mutation.mutate()} disabled={!form.amount || !form.description || mutation.isPending} className="btn-primary flex-1">
            {mutation.isPending ? 'Adding...' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  );
}

const TYPE_ICON = {
  income: <ArrowUpRight size={14} className="text-green-400" />,
  expense: <ArrowDownRight size={14} className="text-red-400" />,
  transfer: <ArrowLeftRight size={14} className="text-blue-400" />,
};

export default function TransactionsPage() {
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const qc = useQueryClient();

  const { data: txData, isLoading } = useQuery({
    queryKey: ['transactions', { search, type: typeFilter }],
    queryFn: () => transactionsApi.list({ search: search || undefined, type: typeFilter || undefined, limit: 100 }),
  });

  const { data: acctData } = useQuery({ queryKey: ['accounts'], queryFn: () => accountsApi.list() });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => transactionsApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['transactions'] }); qc.invalidateQueries({ queryKey: ['accounts'] }); },
  });

  const transactions: Transaction[] = txData?.transactions || [];

  return (
    <div className="p-8">
      {showAdd && <AddTxModal onClose={() => setShowAdd(false)} accounts={acctData?.accounts || []} />}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-white">Transactions</h1>
        <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add Transaction
        </button>
      </div>

      <div className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input className="input pl-9" placeholder="Search transactions..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2">
          {['', 'income', 'expense', 'transfer'].map(t => (
            <button key={t || 'all'} onClick={() => setTypeFilter(t)}
              className={`px-3 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${typeFilter === t ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
              {t || 'All'}
            </button>
          ))}
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-16 text-gray-500">No transactions found</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left text-xs text-gray-500 font-medium px-6 py-3">Description</th>
                <th className="text-left text-xs text-gray-500 font-medium px-4 py-3">Account</th>
                <th className="text-left text-xs text-gray-500 font-medium px-4 py-3">Category</th>
                <th className="text-left text-xs text-gray-500 font-medium px-4 py-3">Date</th>
                <th className="text-right text-xs text-gray-500 font-medium px-6 py-3">Amount</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {transactions.map(tx => (
                <tr key={tx._id} className="border-b border-gray-800/50 hover:bg-gray-800/30 group">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      {TYPE_ICON[tx.type]}
                      <span className="text-sm text-gray-200">{tx.description}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: (tx.account as any).color || '#6b7280' }} />
                      <span className="text-xs text-gray-400">{(tx.account as any).name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-gray-500 capitalize">{tx.category?.replace(/_/g, ' ')}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{format(parseISO(tx.date), 'MMM d, yyyy')}</td>
                  <td className={`px-6 py-3 text-sm font-medium text-right ${tx.type === 'income' ? 'text-green-400' : tx.type === 'expense' ? 'text-red-400' : 'text-blue-400'}`}>
                    {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : ''}{fmt(tx.amount)}
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => deleteMutation.mutate(tx._id)}
                      className="text-gray-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                      <Trash2 size={13} />
                    </button>
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
