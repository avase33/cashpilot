export interface User {
  _id: string;
  name: string;
  email: string;
  avatar: string;
  initials: string;
  timezone: string;
  currency: string;
  orgs: string[];
  activeOrg: string | null;
  createdAt: string;
}

export interface OrgMember {
  user: Pick<User, '_id' | 'name' | 'email' | 'avatar'>;
  role: 'owner' | 'admin' | 'accountant' | 'viewer';
  joinedAt: string;
}

export interface Organization {
  _id: string;
  name: string;
  currency: string;
  plan: 'free' | 'pro' | 'enterprise';
  members: OrgMember[];
  runwayAlertDays: number;
  lowBalanceThreshold: number;
}

export type AccountType = 'checking' | 'savings' | 'credit' | 'investment' | 'cash' | 'crypto' | 'other';

export interface Account {
  _id: string;
  org: string;
  name: string;
  type: AccountType;
  currency: string;
  balance: number;
  initialBalance: number;
  institution: string;
  color: string;
  icon: string;
  isActive: boolean;
  includeInTotal: boolean;
  notes: string;
  createdAt: string;
}

export type TransactionType = 'income' | 'expense' | 'transfer';

export interface Transaction {
  _id: string;
  org: string;
  account: Pick<Account, '_id' | 'name' | 'color' | 'type'>;
  type: TransactionType;
  amount: number;
  currency: string;
  category: string;
  description: string;
  date: string;
  reference: string;
  tags: string[];
  notes: string;
  isRecurring: boolean;
  linkedInvoice: string | null;
  linkedBill: string | null;
  createdAt: string;
}

export type InvoiceStatus = 'draft' | 'sent' | 'viewed' | 'paid' | 'partial' | 'overdue' | 'cancelled';

export interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  amount: number;
}

export interface Invoice {
  _id: string;
  org: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  client: { name: string; email: string; address: string; company: string };
  lineItems: LineItem[];
  subtotal: number;
  taxTotal: number;
  total: number;
  amountPaid: number;
  amountDue: number;
  currency: string;
  issueDate: string;
  dueDate: string;
  paidDate: string | null;
  notes: string;
  terms: string;
  slug: string;
  createdAt: string;
}

export type BillStatus = 'pending' | 'scheduled' | 'paid' | 'overdue' | 'cancelled';

export interface Bill {
  _id: string;
  org: string;
  vendor: string;
  category: string;
  amount: number;
  currency: string;
  status: BillStatus;
  dueDate: string;
  paidDate: string | null;
  isRecurring: boolean;
  recurrence: {
    frequency: 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';
    nextDate: string | null;
    endDate: string | null;
  };
  description: string;
  createdAt: string;
}

export type AlertType = 'low_balance' | 'overdue_invoice' | 'bill_due' | 'runway_warning' | 'large_transaction' | 'goal_reached' | 'custom';
export type AlertSeverity = 'info' | 'warning' | 'critical';

export interface Alert {
  _id: string;
  org: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  isRead: boolean;
  isResolved: boolean;
  resolvedAt: string | null;
  linkedEntity: { model: string; id: string } | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface ForecastPoint {
  weekStart: string;
  weekEnd: string;
  projectedIncome: number;
  projectedExpense: number;
  netCashFlow: number;
  runningBalance: number;
  scheduledBills: { id: string; vendor: string; amount: number; dueDate: string }[];
  expectedInvoices: { id: string; client: string; amount: number; dueDate: string }[];
}

export interface Forecast {
  currentBalance: number;
  avgMonthlyIncome: number;
  avgMonthlyExpense: number;
  avgMonthlyBurn: number;
  runwayDays: number | null;
  forecastPoints: ForecastPoint[];
  upcomingBillsTotal: number;
  outstandingInvoicesTotal: number;
  generatedAt: string;
}

export interface DashboardData {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpense: number;
  monthlyNet: number;
  accountCount: number;
  overdueInvoices: Pick<Invoice, '_id' | 'client' | 'total' | 'amountDue' | 'dueDate'>[];
  upcomingBills: Pick<Bill, '_id' | 'vendor' | 'amount' | 'dueDate'>[];
  unreadAlerts: number;
  cashFlowByMonth: { month: string; income: number; expense: number; net: number }[];
  expenseByCategory: { category: string; expense: number; count: number }[];
}
