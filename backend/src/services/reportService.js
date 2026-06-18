import Transaction from '../models/Transaction.js';
import Account from '../models/Account.js';

export async function getCashFlowReport(orgId, startDate, endDate) {
  const txs = await Transaction.find({
    org: orgId,
    date: { $gte: new Date(startDate), $lte: new Date(endDate) },
    type: { $in: ['income', 'expense'] },
  }).sort({ date: 1 });

  const totalIncome = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  // Group by category
  const byCategory = {};
  for (const tx of txs) {
    if (!byCategory[tx.category]) byCategory[tx.category] = { income: 0, expense: 0, count: 0 };
    byCategory[tx.category][tx.type] += tx.amount;
    byCategory[tx.category].count++;
  }

  // Group by month
  const byMonth = {};
  for (const tx of txs) {
    const key = tx.date.toISOString().slice(0, 7); // YYYY-MM
    if (!byMonth[key]) byMonth[key] = { income: 0, expense: 0, net: 0 };
    byMonth[key][tx.type] += tx.amount;
    byMonth[key].net = byMonth[key].income - byMonth[key].expense;
  }

  return {
    period: { startDate, endDate },
    summary: {
      totalIncome: Math.round(totalIncome * 100) / 100,
      totalExpense: Math.round(totalExpense * 100) / 100,
      netCashFlow: Math.round((totalIncome - totalExpense) * 100) / 100,
      transactionCount: txs.length,
    },
    byCategory: Object.entries(byCategory).map(([cat, data]) => ({
      category: cat,
      ...data,
      income: Math.round(data.income * 100) / 100,
      expense: Math.round(data.expense * 100) / 100,
    })),
    byMonth: Object.entries(byMonth).map(([month, data]) => ({
      month,
      ...data,
      income: Math.round(data.income * 100) / 100,
      expense: Math.round(data.expense * 100) / 100,
      net: Math.round(data.net * 100) / 100,
    })).sort((a, b) => a.month.localeCompare(b.month)),
  };
}

export async function getAccountBalanceSummary(orgId) {
  const accounts = await Account.find({ org: orgId, isActive: true });
  const totalBalance = accounts.filter(a => a.includeInTotal).reduce((s, a) => s + a.balance, 0);
  const byType = {};
  for (const acc of accounts) {
    if (!byType[acc.type]) byType[acc.type] = { count: 0, total: 0 };
    byType[acc.type].count++;
    byType[acc.type].total += acc.balance;
  }
  return {
    totalBalance: Math.round(totalBalance * 100) / 100,
    accountCount: accounts.length,
    byType,
    accounts: accounts.map(a => ({
      id: a._id,
      name: a.name,
      type: a.type,
      balance: a.balance,
      currency: a.currency,
      color: a.color,
    })),
  };
}
