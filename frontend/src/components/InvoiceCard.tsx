// InvoiceCard component -- 2026-07-21 19:13:26
import React from 'react';

interface Invoice {
  _id: string;
  invoiceNumber: string;
  clientName: string;
  amount: number;
  currency: string;
  status: string;
  dueDate: string;
}

interface Props {
  invoice: Invoice;
  onMarkPaid?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  sent: 'bg-blue-100 text-blue-700',
  paid: 'bg-green-100 text-green-700',
  overdue: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-200 text-gray-500',
};

export default function InvoiceCard({ invoice, onMarkPaid, onDelete }: Props) {
  const isOverdue = invoice.status === 'overdue';
  const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: invoice.currency });

  return (
    <div className={ounded-xl border p-4 shadow-sm }>
      <div className='flex items-start justify-between'>
        <div>
          <p className='text-xs text-gray-400'>{invoice.invoiceNumber}</p>
          <h3 className='font-semibold text-gray-900'>{invoice.clientName}</h3>
          <p className='text-2xl font-bold mt-1'>{fmt.format(invoice.amount)}</p>
        </div>
        <span className={	ext-xs font-medium px-2 py-1 rounded-full }>
          {invoice.status.toUpperCase()}
        </span>
      </div>
      <p className='text-sm text-gray-500 mt-2'>Due: {new Date(invoice.dueDate).toLocaleDateString()}</p>
      <div className='flex gap-2 mt-3'>
        {invoice.status === 'sent' && onMarkPaid && (
          <button onClick={() => onMarkPaid(invoice._id)} className='text-xs px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-500'>
            Mark Paid
          </button>
        )}
        {onDelete && (
          <button onClick={() => onDelete(invoice._id)} className='text-xs px-3 py-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200'>
            Delete
          </button>
        )}
      </div>
    </div>
  );
}