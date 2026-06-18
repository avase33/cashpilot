import Account from '../models/Account.js';
import Invoice from '../models/Invoice.js';
import Bill from '../models/Bill.js';
import Alert from '../models/Alert.js';
import Organization from '../models/Organization.js';

async function createAlertIfNew(orgId, type, linkedEntity, title, message, severity, metadata = {}) {
  // Avoid duplicate unresolved alerts for same type + entity
  const existing = await Alert.findOne({
    org: orgId,
    type,
    isResolved: false,
    'linkedEntity.id': linkedEntity?.id || null,
  });
  if (existing) return;
  await Alert.create({ org: orgId, type, severity, title, message, linkedEntity, metadata });
}

export async function runAlertChecks(orgId) {
  const org = await Organization.findById(orgId);
  if (!org) return;

  const now = new Date();
  const soon = new Date(now.getTime() + 7 * 86400000); // 7 days from now

  // 1. Low balance alerts
  const accounts = await Account.find({ org: orgId, isActive: true, includeInTotal: true });
  for (const account of accounts) {
    if (account.balance < org.lowBalanceThreshold) {
      await createAlertIfNew(
        orgId, 'low_balance',
        { model: 'Account', id: account._id },
        `Low balance: ${account.name}`,
        `${account.name} balance is $${account.balance.toFixed(2)}, below threshold of $${org.lowBalanceThreshold}.`,
        account.balance < 0 ? 'critical' : 'warning',
        { accountName: account.name, balance: account.balance }
      );
    }
  }

  // 2. Overdue invoices
  const overdueInvoices = await Invoice.find({
    org: orgId,
    status: { $in: ['sent', 'viewed', 'partial'] },
    dueDate: { $lt: now },
  });
  for (const inv of overdueInvoices) {
    const daysOverdue = Math.floor((now - inv.dueDate) / 86400000);
    await createAlertIfNew(
      orgId, 'overdue_invoice',
      { model: 'Invoice', id: inv._id },
      `Overdue invoice: ${inv.client.name}`,
      `Invoice #${inv.invoiceNumber} for ${inv.client.name} is ${daysOverdue} day(s) overdue. Amount due: $${inv.amountDue.toFixed(2)}.`,
      daysOverdue > 30 ? 'critical' : 'warning',
      { invoiceNumber: inv.invoiceNumber, daysOverdue, amountDue: inv.amountDue }
    );
    // Update invoice status to overdue
    await Invoice.findByIdAndUpdate(inv._id, { status: 'overdue' });
  }

  // 3. Bills due soon (within 7 days)
  const dueSoonBills = await Bill.find({
    org: orgId,
    status: { $in: ['pending', 'scheduled'] },
    dueDate: { $gte: now, $lte: soon },
  });
  for (const bill of dueSoonBills) {
    const daysUntilDue = Math.floor((bill.dueDate - now) / 86400000);
    await createAlertIfNew(
      orgId, 'bill_due',
      { model: 'Bill', id: bill._id },
      `Bill due soon: ${bill.vendor}`,
      `Bill from ${bill.vendor} for $${bill.amount.toFixed(2)} is due in ${daysUntilDue} day(s).`,
      daysUntilDue <= 2 ? 'critical' : 'warning',
      { vendor: bill.vendor, amount: bill.amount, daysUntilDue }
    );
  }

  // 4. Runway warning
  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);
  const { default: Transaction } = await import('../models/Transaction.js');
  const recentTx = await Transaction.find({
    org: orgId,
    date: { $gte: thirtyDaysAgo },
    type: { $in: ['income', 'expense'] },
  });
  const monthlyIncome = recentTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const monthlyExpense = recentTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const monthlyBurn = monthlyExpense - monthlyIncome;
  if (monthlyBurn > 0) {
    const runwayDays = Math.floor((totalBalance / monthlyBurn) * 30);
    if (runwayDays <= org.runwayAlertDays) {
      const existing = await Alert.findOne({ org: orgId, type: 'runway_warning', isResolved: false });
      if (!existing) {
        await Alert.create({
          org: orgId,
          type: 'runway_warning',
          severity: runwayDays <= 30 ? 'critical' : 'warning',
          title: `Runway warning: ${runwayDays} days remaining`,
          message: `At current burn rate of $${monthlyBurn.toFixed(2)}/month, you have approximately ${runwayDays} days of runway remaining.`,
          metadata: { runwayDays, monthlyBurn, totalBalance },
        });
      }
    }
  }
}
