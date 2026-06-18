import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '../lib/api';
import {
  DollarSign, TrendingUp, TrendingDown, CreditCard,
  AlertTriangle, Clock, Bell, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell,
} from 'recharts';
import type { DashboardData } from '../types';

function StatCard({ label, value, icon: Icon, trend, color = 'blue' }: {
  label: string; value: string; icon: React.ElementType;
  trend?: { value: string; positive: boolean }; color?: string;
}) {
  const colors: Record<string, string> = {
    blue: 'text-blue-400 bg-blue-900/30',
    green: 'text-green-400 bg-green-900/30',
    red: 'text-red-400 bg-red-900/30',
    yellow: 'text-yellow-400 bg-yellow-900/30',
  };
  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-400 mb-1">{label}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
          {trend && (
            <div className={`flex items-center gap-1 mt-1 text-xs ${trend.positive ? 'text-green-400' : 'text-red-400'}`}>
              {trend.positive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
              {trend.value}
            </div>
          )}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors[color]}`}>
          <Icon size={20} className={colors[color].split(' ')[0]} />
        </div>
      </div>
    </div>
  );
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

const CATEGORY_COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444'];

export default function DashboardPage() {
  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ['dashboard'],
    queryFn: () => reportsApi.dashboard(),
    refetchInterval: 30000,
  });

  if (isLoading) return (
    <div className="flex items-center justify-center h-full">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!data) return null;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 text-sm mt-1">Your financial overview for {format(new Date(), 'MMMM yyyy')}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total Balance"
          value={fmt(data.totalBalance)}
          icon={DollarSign}
          color={data.totalBalance >= 0 ? 'blue' : 'red'}
        />
        <StatCard
          label="Monthly Income"
          value={fmt(data.monthlyIncome)}
          icon={TrendingUp}
          color="green"
        />
        <StatCard
          label="Monthly Expenses"
          value={fmt(data.monthlyExpense)}
          icon={TrendingDown}
          color="red"
        />
        <StatCard
          label="Net Cash Flow"
          value={fmt(data.monthlyNet)}
          icon={CreditCard}
          color={data.monthlyNet >= 0 ? 'green' : 'red'}
        />
      </div>

      <div className="grid grid-cols-3 gap-6 mb-6">
        {/* Cash flow chart */}
        <div className="card col-span-2">
          <h2 className="text-base font-semibold text-white mb-4">Cash Flow Trend</h2>
          {data.cashFlowByMonth.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={data.cashFlowByMonth}>
                <defs>
                  <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 12 }} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: 8 }}
                  labelStyle={{ color: '#f9fafb' }}
                  formatter={(v: number) => fmt(v)}
                />
                <Area type="monotone" dataKey="income" stroke="#10b981" fill="url(#incomeGrad)" strokeWidth={2} name="Income" />
                <Area type="monotone" dataKey="expense" stroke="#ef4444" fill="url(#expenseGrad)" strokeWidth={2} name="Expenses" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-gray-500 text-sm">
              No transactions yet — add your first one!
            </div>
          )}
        </div>

        {/* Expense breakdown */}
        <div className="card">
          <h2 className="text-base font-semibold text-white mb-4">Expense Breakdown</h2>
          {data.expenseByCategory.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={data.expenseByCategory.slice(0, 5)} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="category" tick={{ fill: '#9ca3af', fontSize: 11 }} width={80} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: 8 }}
                    formatter={(v: number) => fmt(v)}
                  />
                  <Bar dataKey="expense" radius={[0, 4, 4, 0]}>
                    {data.expenseByCategory.slice(0, 5).map((_, i) => (
                      <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-2 space-y-1">
                {data.expenseByCategory.slice(0, 4).map((cat, i) => (
                  <div key={cat.category} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[i] }} />
                      <span className="text-gray-400 capitalize">{cat.category.replace(/_/g, ' ')}</span>
                    </div>
                    <span className="text-gray-300">{fmt(cat.expense)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[160px] flex items-center justify-center text-gray-500 text-sm">No expenses this month</div>
          )}
        </div>
      </div>

      {/* Alerts row */}
      <div className="grid grid-cols-2 gap-6">
        {/* Overdue invoices */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-white">Overdue Invoices</h2>
            {data.overdueInvoices.length > 0 && (
              <span className="badge-red">{data.overdueInvoices.length} overdue</span>
            )}
          </div>
          {data.overdueInvoices.length === 0 ? (
            <p className="text-gray-500 text-sm">No overdue invoices</p>
          ) : (
            <div className="space-y-2">
              {data.overdueInvoices.slice(0, 4).map(inv => (
                <div key={inv._id} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                  <div>
                    <p className="text-sm text-gray-200">{inv.client.name}</p>
                    <p className="text-xs text-gray-500">Due {format(parseISO(inv.dueDate), 'MMM d')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-red-400">{fmt(inv.amountDue)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming bills */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-white">Upcoming Bills (7 days)</h2>
            {data.upcomingBills.length > 0 && (
              <span className="badge-yellow">{data.upcomingBills.length} due</span>
            )}
          </div>
          {data.upcomingBills.length === 0 ? (
            <p className="text-gray-500 text-sm">No bills due in the next 7 days</p>
          ) : (
            <div className="space-y-2">
              {data.upcomingBills.slice(0, 4).map(bill => (
                <div key={bill._id} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                  <div>
                    <p className="text-sm text-gray-200">{bill.vendor}</p>
                    <p className="text-xs text-gray-500">Due {format(parseISO(bill.dueDate), 'MMM d')}</p>
                  </div>
                  <p className="text-sm font-medium text-yellow-400">{fmt(bill.amount)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
