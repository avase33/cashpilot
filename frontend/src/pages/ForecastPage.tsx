import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { forecastApi } from '../lib/api';
import { TrendingUp, AlertTriangle, CalendarDays } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import type { ForecastPoint } from '../types';

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl p-3 text-xs shadow-xl">
      <p className="text-gray-400 mb-1.5">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }}>{p.name}: {fmt(p.value)}</p>
      ))}
    </div>
  );
};

export default function ForecastPage() {
  const [days, setDays] = useState(90);

  const { data, isLoading } = useQuery({
    queryKey: ['forecast', days],
    queryFn: () => forecastApi.get(days),
  });

  const forecast = data?.forecast;
  const points: ForecastPoint[] = forecast?.forecastPoints || [];

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Cash Flow Forecast</h1>
          <p className="text-gray-400 text-sm mt-1">Projected based on historical trends and upcoming bills/invoices</p>
        </div>
        <div className="flex gap-2">
          {[30, 60, 90].map(d => (
            <button key={d} onClick={() => setDays(d)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${days === d ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
              {d}d
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-32"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : !forecast ? null : (
        <>
          {/* Key metrics */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="card">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl bg-blue-900/30 flex items-center justify-center">
                  <TrendingUp size={18} className="text-blue-400" />
                </div>
                <p className="text-sm text-gray-400">Ending Balance</p>
              </div>
              <p className={`text-2xl font-bold ${forecast.endingBalance >= 0 ? 'text-white' : 'text-red-400'}`}>{fmt(forecast.endingBalance)}</p>
              <p className="text-xs text-gray-500 mt-1">in {days} days</p>
            </div>

            <div className="card">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${forecast.runwayDays > 60 ? 'bg-green-900/30' : forecast.runwayDays > 30 ? 'bg-yellow-900/30' : 'bg-red-900/30'}`}>
                  <CalendarDays size={18} className={forecast.runwayDays > 60 ? 'text-green-400' : forecast.runwayDays > 30 ? 'text-yellow-400' : 'text-red-400'} />
                </div>
                <p className="text-sm text-gray-400">Cash Runway</p>
              </div>
              <p className={`text-2xl font-bold ${forecast.runwayDays > 60 ? 'text-green-400' : forecast.runwayDays > 30 ? 'text-yellow-400' : 'text-red-400'}`}>
                {forecast.runwayDays} days
              </p>
              <p className="text-xs text-gray-500 mt-1">before balance hits zero</p>
            </div>

            <div className="card">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl bg-purple-900/30 flex items-center justify-center">
                  <AlertTriangle size={18} className="text-purple-400" />
                </div>
                <p className="text-sm text-gray-400">Avg Monthly Burn</p>
              </div>
              <p className="text-2xl font-bold text-white">{fmt(forecast.avgMonthlyExpense)}</p>
              <p className="text-xs text-gray-500 mt-1">vs {fmt(forecast.avgMonthlyIncome)} income</p>
            </div>
          </div>

          {forecast.runwayDays < 30 && (
            <div className="bg-red-900/20 border border-red-800/50 rounded-xl px-4 py-3 mb-6 flex items-center gap-3">
              <AlertTriangle size={16} className="text-red-400 shrink-0" />
              <p className="text-sm text-red-300">
                <strong>Critical:</strong> At current burn rate, you'll run out of cash in {forecast.runwayDays} days. Consider reducing expenses or accelerating collections.
              </p>
            </div>
          )}

          {/* Forecast chart */}
          <div className="card">
            <h2 className="text-base font-semibold text-white mb-1">Balance Projection</h2>
            <p className="text-xs text-gray-500 mb-5">Weekly forecast · Shaded areas represent scheduled bills and expected invoices</p>
            <ResponsiveContainer width="100%" height={340}>
              <AreaChart data={points} margin={{ left: 10, right: 10, bottom: 0, top: 10 }}>
                <defs>
                  <linearGradient id="balGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="incGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="weekLabel" tick={{ fill: '#6b7280', fontSize: 11 }} interval={Math.floor(points.length / 6)} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="4 4" strokeOpacity={0.5} />
                <Area type="monotone" dataKey="projectedBalance" stroke="#3b82f6" fill="url(#balGrad)" strokeWidth={2.5} name="Balance" dot={false} />
                <Area type="monotone" dataKey="expectedIncome" stroke="#10b981" fill="url(#incGrad)" strokeWidth={1.5} name="Expected income" dot={false} strokeDasharray="5 3" />
                <Area type="monotone" dataKey="scheduledExpense" stroke="#ef4444" fill="url(#expGrad)" strokeWidth={1.5} name="Scheduled expense" dot={false} strokeDasharray="5 3" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Weekly breakdown table */}
          {points.length > 0 && (
            <div className="card p-0 overflow-hidden mt-6">
              <div className="px-5 py-3 border-b border-gray-800">
                <h3 className="text-sm font-semibold text-white">Weekly Breakdown</h3>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800">
                    {['Week', 'Expected Income', 'Scheduled Expenses', 'Net', 'Projected Balance'].map(h => (
                      <th key={h} className="text-left text-xs text-gray-500 font-medium px-5 py-2.5">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {points.map((p, i) => (
                    <tr key={i} className="border-b border-gray-800/50 hover:bg-gray-800/20">
                      <td className="px-5 py-2.5 text-xs text-gray-400">{p.weekLabel}</td>
                      <td className="px-5 py-2.5 text-xs text-green-400">{fmt(p.expectedIncome)}</td>
                      <td className="px-5 py-2.5 text-xs text-red-400">{fmt(p.scheduledExpense)}</td>
                      <td className={`px-5 py-2.5 text-xs font-medium ${p.expectedIncome - p.scheduledExpense >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {fmt(p.expectedIncome - p.scheduledExpense)}
                      </td>
                      <td className={`px-5 py-2.5 text-xs font-semibold ${p.projectedBalance >= 0 ? 'text-gray-200' : 'text-red-400'}`}>{fmt(p.projectedBalance)}</td>
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
