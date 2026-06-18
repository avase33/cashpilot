import { Router } from 'express';
import { requireAuth, requireOrgAccess } from '../middleware/auth.js';
import { getCashFlowReport, getAccountBalanceSummary } from '../services/reportService.js';

const router = Router();
router.use(requireAuth, requireOrgAccess);

// GET /api/reports/cash-flow?startDate=...&endDate=...
router.get('/cash-flow', async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const now = new Date();
    const start = startDate || new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const end = endDate || now.toISOString();
    const report = await getCashFlowReport(req.org._id, start, end);
    res.json(report);
  } catch (err) { next(err); }
});

// GET /api/reports/account-summary
router.get('/account-summary', async (req, res, next) => {
  try {
    const summary = await getAccountBalanceSummary(req.org._id);
    res.json(summary);
  } catch (err) { next(err); }
});

// GET /api/reports/dashboard
router.get('/dashboard', async (req, res, next) => {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const [cashFlow, accountSummary] = await Promise.all([
      getCashFlowReport(req.org._id, monthStart.toISOString(), now.toISOString()),
      getAccountBalanceSummary(req.org._id),
    ]);

    const { default: Invoice } = await import('../models/Invoice.js');
    const { default: Bill } = await import('../models/Bill.js');
    const { default: Alert } = await import('../models/Alert.js');

    const [overdueInvoices, upcomingBills, unreadAlerts] = await Promise.all([
      Invoice.find({ org: req.org._id, status: 'overdue' }).select('client total amountDue dueDate'),
      Bill.find({ org: req.org._id, status: { $in: ['pending', 'scheduled'] }, dueDate: { $lte: new Date(Date.now() + 7 * 86400000) } }).select('vendor amount dueDate'),
      Alert.countDocuments({ org: req.org._id, isRead: false, isResolved: false }),
    ]);

    res.json({
      totalBalance: accountSummary.totalBalance,
      monthlyIncome: cashFlow.summary.totalIncome,
      monthlyExpense: cashFlow.summary.totalExpense,
      monthlyNet: cashFlow.summary.netCashFlow,
      accountCount: accountSummary.accountCount,
      overdueInvoices,
      upcomingBills,
      unreadAlerts,
      cashFlowByMonth: cashFlow.byMonth,
      expenseByCategory: cashFlow.byCategory.filter(c => c.expense > 0).sort((a, b) => b.expense - a.expense).slice(0, 6),
    });
  } catch (err) { next(err); }
});

export default router;
