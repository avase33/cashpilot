import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { accountsApi } from '../lib/api';
import { Plus, CreditCard, Trash2, X } from 'lucide-react';
import type { Account } from '../types';

const ACCOUNT_TYPES = ['checking', 'savings', 'credit', 'investment', 'cash', 'crypto', 'other'];
const COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4'];

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}

function AddAccountModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: '', type: 'checking', initialBalance: '0', currency: 'USD', institution: '', color: COLORS[0] });
  const setF = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const mutation = useMutation({
    mutationFn: () => accountsApi.create({ ...form, initialBalance: Number(form.initialBalance) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['accounts'] }); onClose(); },
  });

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">Add Account</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300"><X size={20} /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Account name</label>
            <input className="input" value={form.name} onChange={setF('name')} placeholder="Main Checking" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Type</label>
              <select className="input" value={form.type} onChange={setF('type')}>
                {ACCOUNT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Current balance</label>
              <input className="input" type="number" step="0.01" value={form.initialBalance} onChange={setF('initialBalance')} />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Institution (optional)</label>
            <input className="input" value={form.institution} onChange={setF('institution')} placeholder="Chase, Wells Fargo..." />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Color</label>
            <div className="flex gap-2">
              {COLORS.map(c => (
                <button key={c} onClick={() => setForm(f => ({ ...f, color: c }))}
                  className={`w-7 h-7 rounded-full border-2 transition-all ${form.color === c ? 'border-white scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={() => mutation.mutate()} disabled={!form.name || mutation.isPending} className="btn-primary flex-1">
            {mutation.isPending ? 'Adding...' : 'Add Account'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AccountsPage() {
  const [showAdd, setShowAdd] = useState(false);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => accountsApi.list(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => accountsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['accounts'] }),
  });

  if (isLoading) return (
    <div className="flex items-center justify-center h-full">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const accounts: Account[] = data?.accounts || [];
  const totalBalance: number = data?.totalBalance || 0;

  return (
    <div className="p-8">
      {showAdd && <AddAccountModal onClose={() => setShowAdd(false)} />}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Accounts</h1>
          <p className="text-gray-400 text-sm mt-1">Total balance: <span className="text-white font-semibold">{fmt(totalBalance)}</span></p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add Account
        </button>
      </div>

      {accounts.length === 0 ? (
        <div className="card text-center py-16">
          <CreditCard size={40} className="text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">No accounts yet</p>
          <p className="text-gray-600 text-sm mt-1">Add your first bank account to get started</p>
          <button onClick={() => setShowAdd(true)} className="btn-primary mt-4">Add Account</button>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {accounts.map(acc => (
            <div key={acc._id} className="card hover:border-gray-700 transition-colors group">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: acc.color + '30', color: acc.color }}>
                    <CreditCard size={18} />
                  </div>
                  <div>
                    <p className="font-medium text-white text-sm">{acc.name}</p>
                    <p className="text-xs text-gray-500 capitalize">{acc.type}{acc.institution ? ` · ${acc.institution}` : ''}</p>
                  </div>
                </div>
                <button
                  onClick={() => deleteMutation.mutate(acc._id)}
                  className="text-gray-700 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <p className={`text-2xl font-bold ${acc.balance >= 0 ? 'text-white' : 'text-red-400'}`}>{fmt(acc.balance)}</p>
              <p className="text-xs text-gray-500 mt-1">{acc.currency}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
