// useDashboard hook -- 2026-06-26 09:28:53
import { useState, useEffect } from 'react';

interface DashboardData {
  runwayDays: number;
  runwayMonths: number;
  currentBalance: number;
  monthlyBurn: number;
  monthlyRevenue: number;
  netMonthlyCashflow: number;
  overdueInvoices: number;
}

export function useDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const [runway, overdue] = await Promise.all([
          fetch('/api/analytics/runway').then(r => r.json()),
          fetch('/api/invoices?status=overdue').then(r => r.json()),
        ]);
        setData({ ...runway, overdueInvoices: overdue.count ?? 0 });
      } catch (err) {
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 60000);
    return () => clearInterval(interval);
  }, []);

  return { data, loading, error };
}