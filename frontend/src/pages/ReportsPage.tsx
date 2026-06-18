import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '../lib/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell,
} from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#06b6d4'];

export default function ReportsPage() {
  const [range, setRange] = useState(() => {
    const now = new Date();
    return {
      start: format(startOfMonth(subMonths(now, 5)), 'yyyy-MM-dd'),
      end: format(endOfMonth(now), 'yyyy-MM-dd'),
    };
  });

  const { data: cashFlow, isLoading: cfLoading } = useQuery({
    queryKey: ['reports', 'cashflow', range],
    queryFn: () => reportsApi.cashFlow(range.start, range.end),
  });

  const { data: balanceSummary, isLoading: bsLoading } = useQuery({
    queryKey: ['reports', 'balance'],
    queryFn: () => reportsApi.balanceSummary(),
  });

  const presets = [
    { label: 'Last 3M', start: format(startOfMonth(subMonths(new Date(), 2)), 'yyyy-MM-dd'), end: format(endOfMonth(new Date()), 'yyyy-MM-dd') },
    { label: 'Last 6M', start: format(startOfMonth(subMonths(new Date(), 5)), 'yyyy-MM-dd'), end: format(endOfMonth(new Date()), 'yyyy-MM-dd') },
    { label: 'Last 12M', start: format(startOfMonth(subMonths(new Date(), 11)), 'yyyy-MM-dd'), end: format(endOfMonth(new Date()), 'yyyy-MM-dd') },
    { label: 'YTD', start: format(new Date(new Date().getFullYear(), 0, 1), 'yyyy-MM-dd'), end: format(endOfMonth(new Date()), 'yyyy-MM-dd') },
  ];

  const byMonth = cashFlow?.byMonth || [];
  const byCategory = cashFlow?.byCategory || [];
  const balance = balanceSummary?.byType || [];

  const totalIncome = byMonth.reduce((s: number, m: any) => s + m.income, 0);
  const totalExpense = byMonth.reduce((s: number, m: any) => s + m.expense, 0);
  const netCashFlow = totalIncome - totalExpense;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Reports</h1>
        <div className="flex items-center gap-3">
          {presets.map(p => (
            <button key={p.label} onClick={() => setRange({ start: p.start, end: p.end })}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${range.start === p.start && range.end === p.end ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
              {p.label}
            </button>
          ))}
          <div className="flex items-center gap-2 ml-2">
            <input className="input text-xs py-1.5 w-36" type="date" value={range.start} onChange={e => setRange(r => ({ ...r, start: e.target.value }))} />
            <span className="text-gray-500 text-xs">—</span>
            <input className="input text-xs py-1.5 w-36" type="date" value={range.end} onChange={e => setRange(r => ({ ...r, end: e.target.value }))} />
          </div>
        </div>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card py-4">
          <p className="text-xs text-gray-500 mb-1">Total Income</p>
          <p className="text-xl font-bold text-green-400">{fmt(totalIncome)}</p>
        </div>
        <div className="card py-4">
          <p className="text-xs text-gray-500 mb-1">Total Expenses</p>
          <p className="text-xl font-bold text-red-400">{fmt(totalExpense)}</p>
        </div>
        <div className="card py-4">
          <p className="text-xs text-gray-500 mb-1">Net Cash Flow</p>
          <p className={`text-xl font-bold ${netCashFlow >= 0 ? 'text-blue-400' : 'text-red-400'}`}>{fmt(netCashFlow)}</p>
        </div>
      </div>

      {cfLoading ? (
        <div className="flex items-center justify-center py-24"><div className="w-7 h-7 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <>
          {/* Monthly breakdown */}
          <div className="card mb-6">
            <h2 className="text-base font-semibold text-white mb-5">Monthly Income vs Expenses</h2>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={byMonth} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 12 }} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: 8 }}
                  formatter={(v: number) => fmt(v)}
                />
                <Legend wrapperStyle={{ color: '#9ca3af', fontSize: 12 }} />
                <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" name="Expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            {/* Expense by category */}
            <div className="card">
              <h2 className="text-base font-semibold text-white mb-4">Expenses by Category</h2>
              {byCategory.length === 0 ? (
                <p className="text-gray-500 text-sm py-8 text-center">No expense data</p>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={byCategory.slice(0, 8)} layout="vertical">
                      <XAxis type="number" hide />
                      <YAxis type="category" dataKey="category" tick={{ fill: '#9ca3af', fontSize: 11 }} width={90}
                        tickFormatter={(v: string) => v.replace(/_/g, ' ')} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: 8 }}
                        formatter={(v: number) => fmt(v)}
                      />
                      <Bar dataKey="expense" radius={[0, 4, 4, 0]}>
                        {byCategory.slice(0, 8).map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="mt-3 space-y-1.5">
                    {byCategory.slice(0, 5).map((c: any, i: number) => (
                      <div key={c.category} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                          <span className="text-gray-400 capitalize">{c.category.replace(/_/g, ' ')}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-gray-500">{totalExpense ? ((c.expense / totalExpense) * 100).toFixed(1) : 0}%</span>
                          <span className="text-gray-300 w-20 text-right">{fmt(c.expense)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Balance by account type */}
            <div className="card">
              <h2 className="text-base font-semibold text-white mb-4">Balance by Account Type</h2>
              {bsLoading ? (
                <div className="flex items-center justify-center py-12"><div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
              ) : balance.length === 0 ? (
                <p className="text-gray-500 text-sm py-8 text-center">No accounts</p>
              ) : (
                <div className="space-y-3 pt-2">
                  {balance.map((b: any, i: number) => {
                    const maxBalance = Math.max(...balance.map((x: any) => Math.abs(x.totalBalance)));
                    const pct = maxBalance ? (Math.abs(b.totalBalance) / maxBalance) * 100 : 0;
                    return (
                      <div key={b._id}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm text-gray-400 capitalize">{b._id}</span>
                          <span className={`text-sm font-medium ${b.totalBalance >= 0 ? 'text-gray-200' : 'text-red-400'}`}>{fmt(b.totalBalance)}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-gray-800 overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                        </div>
                        <p className="text-xs text-gray-600 mt-0.5">{b.count} account{b.count !== 1 ? 's' : ''}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Monthly table */}
          {byMonth.length > 0 && (
            <div className="card p-0 overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-800">
                <h3 className="text-sm font-semibold text-white">Monthly Summary</h3>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800">
                    {['Month', 'Income', 'Expenses', 'Net', 'Transactions'].map(h => (
                      <th key={h} className="text-left text-xs text-gray-500 font-medium px-5 py-2.5">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {byMonth.map((m: any) => (
                    <tr key={m.month} className="border-b border-gray-800/50 hover:bg-gray-800/20">
                      <td className="px-5 py-2.5 text-sm text-gray-300">{m.month}</td>
                      <td className="px-5 py-2.5 text-sm text-green-400">{fmt(m.income)}</td>
                      <td className="px-5 py-2.5 text-sm text-red-400">{fmt(m.expense)}</td>
                      <td className={`px-5 py-2.5 text-sm font-medium ${m.income - m.expense >= 0 ? 'text-blue-400' : 'text-red-400'}`}>{fmt(m.income - m.expense)}</td>
                      <td className="px-5 py-2.5 text-sm text-gray-500">{m.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
