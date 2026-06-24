/**
 * Input validation utilities for CashPilot
 */

/** Check if a value is a valid finite number */
export function isValidAmount(value: unknown): value is number {
  return typeof value === 'number' && isFinite(value) && value >= 0;
}

/** Validate an ISO 4217 currency code (3 uppercase letters) */
export function isValidCurrencyCode(code: string): boolean {
  return /^[A-Z]{3}$/.test(code);
}

/** Validate an ISO 8601 date string */
export function isValidDate(dateStr: string): boolean {
  const d = new Date(dateStr);
  return !isNaN(d.getTime());
}

/** Check that a transaction object has required fields */
export function isValidTransaction(tx: Record<string, unknown>): boolean {
  return (
    typeof tx.id === 'string' &&
    typeof tx.amount === 'number' &&
    typeof tx.currency === 'string' &&
    typeof tx.date === 'string' &&
    isValidAmount(tx.amount) &&
    isValidCurrencyCode(tx.currency) &&
    isValidDate(tx.date)
  );
}
