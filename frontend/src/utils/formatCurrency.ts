// Currency formatting utils -- 2026-07-07 14:01:33

export function formatCurrency(amount: number, currency = 'USD', locale = 'en-US'): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);
}

export function formatCompact(amount: number): string {
  if (Math.abs(amount) >= 1_000_000) return (amount / 1_000_000).toFixed(1) + 'M';
  if (Math.abs(amount) >= 1_000) return (amount / 1_000).toFixed(1) + 'K';
  return amount.toFixed(2);
}

export function parseAmount(value: string): number {
  return parseFloat(value.replace(/[^0-9.-]+/g, ''));
}

export function runwayColor(days: number): string {
  if (days >= 365) return 'text-green-600';
  if (days >= 180) return 'text-yellow-600';
  if (days >= 90) return 'text-orange-600';
  return 'text-red-600';
}

export function runwayLabel(days: number): string {
  if (days >= 999) return 'Profitable';
  if (days >= 365) return days + ' days (healthy)';
  if (days >= 90) return days + ' days (watch)';
  return days + ' days (critical)';
}