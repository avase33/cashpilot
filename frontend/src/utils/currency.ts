/**
 * CashPilot -- Currency Utility Functions
 */

export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'INR' | 'CAD' | 'AUD';

export function formatCurrency(amount: number, currency: CurrencyCode = 'USD', locale = 'en-US'): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency, minimumFractionDigits: 2 }).format(amount);
}

export function roundMoney(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

export function percentChange(oldVal: number, newVal: number): number {
  if (oldVal === 0) return newVal > 0 ? 100 : 0;
  return roundMoney(((newVal - oldVal) / Math.abs(oldVal)) * 100);
}

export function runwayLabel(days: number): string {
  if (days < 0) return 'Overdue';
  if (days === 0) return 'Today';
  if (days < 7) return days + 'd';
  if (days < 30) return Math.floor(days / 7) + 'w';
  const months = Math.floor(days / 30);
  return months >= 12 ? Math.floor(months / 12) + 'y' : months + 'mo';
}

export function sumInvoices(invoices: Array<{ amount: number }>): number {
  return roundMoney(invoices.reduce((acc, inv) => acc + inv.amount, 0));
}

export function isOverdue(dueDate: Date | string): boolean {
  return new Date(dueDate) < new Date();
}