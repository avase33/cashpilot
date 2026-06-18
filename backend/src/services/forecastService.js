import Transaction from '../models/Transaction.js';
import Bill from '../models/Bill.js';
import Invoice from '../models/Invoice.js';
import Account from '../models/Account.js';

/**
 * Generate a 90-day cash flow forecast based on:
 * 1. Recurring transactions (last 90 days patterns)
 * 2. Upcoming bills (due dates)
 * 3. Outstanding invoices (expected income)
 * 4. Historical average income/expense per period
 */
export async function generateForecast(orgId, days = 90) {
  const now = new Date();
  const endDate = new Date(now.getTime() + days * 86400000);

  // Get current total balance
  const accounts = await Account.find({ org: orgId, isActive: true, includeInTotal: true });
  const currentBalance = accounts.reduce((s, a) => s + a.balance, 0);

  // Get last 90 days of transactions to compute monthly averages
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 86400000);
  const historicalTx = await Transaction.find({
    org: orgId,
    date: { $gte: ninetyDaysAgo, $lte: now },
    type: { $in: ['income', 'expense'] },
  });

  const totalIncome = historicalTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = historicalTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const avgMonthlyIncome = (totalIncome / 3);
  const avgMonthlyExpense = (totalExpense / 3);

  // Get upcoming bills
  const upcomingBills = await Bill.find({
    org: orgId,
    status: { $in: ['pending', 'scheduled'] },
    dueDate: { $gte: now, $lte: endDate },
  }).sort({ dueDate: 1 });

  // Get outstanding invoices
  const outstandingInvoices = await Invoice.find({
    org: orgId,
    status: { $in: ['sent', 'viewed', 'partial', 'overdue'] },
    dueDate: { $lte: endDate },
  }).sort({ dueDate: 1 });

  // Build daily forecast points (weekly buckets)
  const weeks = Math.ceil(days / 7);
  const forecastPoints = [];
  let runningBalance = currentBalance;

  const weeklyIncome = avgMonthlyIncome / 4.33;
  const weeklyExpense = avgMonthlyExpense / 4.33;

  for (let w = 0; w < weeks; w++) {
    const weekStart = new Date(now.getTime() + w * 7 * 86400000);
    const weekEnd = new Date(weekStart.getTime() + 7 * 86400000);

    // Bills due this week
    const billsThisWeek = upcomingBills.filter(b =>
      b.dueDate >= weekStart && b.dueDate < weekEnd
    );
    const billAmount = billsThisWeek.reduce((s, b) => s + b.amount, 0);

    // Invoices expected this week
    const invoicesThisWeek = outstandingInvoices.filter(i =>
      i.dueDate >= weekStart && i.dueDate < weekEnd
    );
    // Assume 70% collection rate
    const expectedInvoiceIncome = invoicesThisWeek.reduce((s, i) => s + i.amountDue * 0.7, 0);

    const projectedIncome = weeklyIncome + expectedInvoiceIncome;
    const projectedExpense = weeklyExpense + billAmount;
    const netCashFlow = projectedIncome - projectedExpense;
    runningBalance += netCashFlow;

    forecastPoints.push({
      weekStart: weekStart.toISOString().split('T')[0],
      weekEnd: weekEnd.toISOString().split('T')[0],
      projectedIncome: Math.round(projectedIncome * 100) / 100,
      projectedExpense: Math.round(projectedExpense * 100) / 100,
      netCashFlow: Math.round(netCashFlow * 100) / 100,
      runningBalance: Math.round(runningBalance * 100) / 100,
      scheduledBills: billsThisWeek.map(b => ({ id: b._id, vendor: b.vendor, amount: b.amount, dueDate: b.dueDate })),
      expectedInvoices: invoicesThisWeek.map(i => ({ id: i._id, client: i.client.name, amount: i.amountDue, dueDate: i.dueDate })),
    });
  }

  // Compute runway (days until balance hits zero)
  const dailyBurn = avgMonthlyExpense / 30 - avgMonthlyIncome / 30;
  const runwayDays = dailyBurn > 0 ? Math.floor(currentBalance / dailyBurn) : null;

  return {
    currentBalance: Math.round(currentBalance * 100) / 100,
    avgMonthlyIncome: Math.round(avgMonthlyIncome * 100) / 100,
    avgMonthlyExpense: Math.round(avgMonthlyExpense * 100) / 100,
    avgMonthlyBurn: Math.round((avgMonthlyExpense - avgMonthlyIncome) * 100) / 100,
    runwayDays,
    forecastPoints,
    upcomingBillsTotal: upcomingBills.reduce((s, b) => s + b.amount, 0),
    outstandingInvoicesTotal: outstandingInvoices.reduce((s, i) => s + i.amountDue, 0),
    generatedAt: now,
  };
}
