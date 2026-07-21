// CashFlow Analyzer -- 2026-07-21 17:45:54
import { Transaction } from '../models/Transaction';
import { Invoice } from '../models/Invoice';

export interface RunwaySummary {
  currentBalance: number;
  monthlyBurn: number;
  monthlyRevenue: number;
  netMonthlyCashflow: number;
  runwayDays: number;
  runwayMonths: number;
}

export async function getRunwaySummary(months = 3): Promise<RunwaySummary> {
  const since = new Date();
  since.setMonth(since.getMonth() - months);

  const transactions = await Transaction.find({ date: { $gte: since } });
  const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  const monthlyRevenue = income / months;
  const monthlyBurn = expenses / months;
  const net = monthlyRevenue - monthlyBurn;

  const balanceResult = await Transaction.aggregate([
    { $group: { _id: null, total: { $sum: { $cond: [{ $eq: ["$type", "income"] }, "$amount", { $multiply: ["$amount", -1] }] } } } }
  ]);
  const currentBalance = balanceResult[0]?.total ?? 0;
  const runwayDays = net < 0 ? Math.floor(currentBalance / (monthlyBurn / 30)) : 999;

  return { currentBalance, monthlyBurn, monthlyRevenue, netMonthlyCashflow: net, runwayDays, runwayMonths: Math.floor(runwayDays / 30) };
}

export async function getOverdueInvoices() {
  return Invoice.find({ status: "sent", dueDate: { $lt: new Date() } }).sort({ dueDate: 1 });
}

export async function getCashflowByCategory(months = 6) {
  const since = new Date();
  since.setMonth(since.getMonth() - months);
  return Transaction.aggregate([
    { $match: { date: { $gte: since }, type: "expense" } },
    { $group: { _id: "$category", total: { $sum: "$amount" }, count: { $sum: 1 } } },
    { $sort: { total: -1 } }
  ]);
}