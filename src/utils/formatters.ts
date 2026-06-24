/**
 * Formatting utilities for CashPilot
 * Provides consistent formatting for currency, numbers, and dates.
 */

/**
 * Format a number as a currency string.
 * @param amount - The numeric amount to format
 * @param currency - ISO 4217 currency code (default: 'USD')
 * @param locale - BCP 47 locale string (default: 'en-US')
 */
export function formatCurrency(amount: number, currency = 'USD', locale = 'en-US'): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);
}

/**
 * Format a number with thousand separators and fixed decimal places.
 * @param value - The number to format
 * @param decimals - Number of decimal places (default: 2)
 */
export function formatNumber(value: number, decimals = 2): string {
  return value.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

/**
 * Format a decimal as a percentage string.
 * @param value - Decimal value (e.g. 0.1523 → '15.23%')
 * @param decimals - Decimal places in the output (default: 2)
 */
export function formatPercent(value: number, decimals = 2): string {
  return (value * 100).toFixed(decimals) + '%';
}

/**
 * Format an ISO date string to a human-readable date.
 * @param isoDate - ISO 8601 date string
 * @param locale - BCP 47 locale string (default: 'en-US')
 */
export function formatDate(isoDate: string, locale = 'en-US'): string {
  return new Date(isoDate).toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' });
}

/**
 * Abbreviate large numbers with K/M/B suffixes.
 * @param value - The number to abbreviate
 */
export function abbreviateNumber(value: number): string {
  if (Math.abs(value) >= 1e9) return (value / 1e9).toFixed(1) + 'B';
  if (Math.abs(value) >= 1e6) return (value / 1e6).toFixed(1) + 'M';
  if (Math.abs(value) >= 1e3) return (value / 1e3).toFixed(1) + 'K';
  return String(value);
}
