import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FaArrowLeft, FaDownload, FaTriangleExclamation } from 'react-icons/fa6';
import DashboardHeader from '../components/DashboardHeader';
import AppFooter from '../components/AppFooter';
import { useApiQuery } from '../hooks/useApiQuery';
import { formatPaise } from '../utils/currency';

interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitAmountPaise: number;
}

interface InvoiceData {
  id: string;
  invoiceNumber: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  issuedAt: string;
  dueDate: string | null;
  projectTitle: string | null;
  fromName: string;
  fromRole: string | null;
  fromCity: string | null;
  toName: string;
  toCity: string | null;
  lineItems: InvoiceLineItem[];
  subtotalPaise: number;
  taxRatePct: number;
  taxAmountPaise: number;
  totalPaise: number;
  notes: string | null;
}

const STATUS_CONFIG = {
  draft:     { bg: 'bg-[#F3F4F6]',  text: 'text-neutral-600',  label: 'Draft' },
  sent:      { bg: 'bg-[#DBEAFE]',  text: 'text-[#1D4ED8]',    label: 'Sent' },
  paid:      { bg: 'bg-[#DCFCE7]',  text: 'text-[#15803D]',    label: 'Paid' },
  overdue:   { bg: 'bg-[#FEE2E2]',  text: 'text-[#B91C1C]',    label: 'Overdue' },
  cancelled: { bg: 'bg-[#F3F4F6]',  text: 'text-neutral-500',  label: 'Cancelled' },
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function Invoice() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const { data: invoice, loading, error } = useApiQuery<InvoiceData>(
    invoiceId ? `/invoices/${invoiceId}` : null
  );

  useEffect(() => {
    document.title = invoice ? `Invoice ${invoice.invoiceNumber} – Claapo` : 'Invoice – Claapo';
  }, [invoice]);

  const handleDownload = () => {
    alert('PDF export coming soon.');
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-neutral-50 min-w-0 w-full">
      <DashboardHeader />

      <div className="flex-1 flex min-h-0 overflow-hidden">
        <main className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
          <div className="flex-1 min-h-0 overflow-auto">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 py-4 sm:py-6">
              <Link to="/dashboard" className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-900 mb-4 text-sm">
                <FaArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </Link>

              {/* Loading */}
              {loading && (
                <div className="animate-pulse space-y-4">
                  <div className="h-10 bg-neutral-200 rounded-xl w-1/2" />
                  <div className="h-64 bg-neutral-200 rounded-2xl" />
                  <div className="h-32 bg-neutral-200 rounded-2xl" />
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="flex items-center gap-3 rounded-2xl bg-red-50 border border-red-200 p-5">
                  <FaTriangleExclamation className="text-red-500 text-xl shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-red-700">Failed to load invoice</p>
                    <p className="text-xs text-red-600 mt-0.5">{error}</p>
                  </div>
                </div>
              )}

              {/* Invoice content */}
              {invoice && (
                <>
                  <div className="mb-4 sm:mb-5">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-neutral-900">
                          Invoice {invoice.invoiceNumber}
                        </h1>
                        {invoice.projectTitle && (
                          <p className="text-sm text-neutral-600 mt-0.5">
                            {invoice.projectTitle}
                            {invoice.issuedAt && ` • ${formatDate(invoice.issuedAt)}`}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        {(() => {
                          const cfg = STATUS_CONFIG[invoice.status] ?? STATUS_CONFIG.draft;
                          return (
                            <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${cfg.bg} ${cfg.text}`}>
                              {cfg.label}
                            </span>
                          );
                        })()}
                        <button
                          onClick={handleDownload}
                          className="px-4 py-2 bg-[#3678F1] text-white rounded-xl hover:bg-[#2c65d4] text-sm font-semibold flex items-center gap-2 transition-colors"
                        >
                          <FaDownload className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Download PDF</span>
                        </button>
                      </div>
                    </div>
                    {invoice.dueDate && (
                      <p className="text-xs text-neutral-500">Due: {formatDate(invoice.dueDate)}</p>
                    )}
                  </div>

                  <div className="bg-white rounded-2xl border border-neutral-200 p-6 sm:p-8">
                    {/* From / To */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                      <div>
                        <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">From</h3>
                        <p className="text-sm font-semibold text-neutral-900">{invoice.fromName}</p>
                        {invoice.fromRole && <p className="text-sm text-neutral-600">{invoice.fromRole}</p>}
                        {invoice.fromCity && <p className="text-sm text-neutral-500">{invoice.fromCity}</p>}
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">To</h3>
                        <p className="text-sm font-semibold text-neutral-900">{invoice.toName}</p>
                        {invoice.toCity && <p className="text-sm text-neutral-500">{invoice.toCity}</p>}
                      </div>
                    </div>

                    {/* Line items */}
                    <div className="border-t border-neutral-200 pt-6 mb-6 overflow-x-auto">
                      <table className="w-full min-w-[400px]">
                        <thead>
                          <tr className="border-b border-neutral-200">
                            <th className="text-left py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Description</th>
                            <th className="text-right py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Qty</th>
                            <th className="text-right py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Rate</th>
                            <th className="text-right py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {invoice.lineItems.map((item, idx) => (
                            <tr key={idx} className="border-b border-neutral-100">
                              <td className="py-3 text-sm text-neutral-700">{item.description}</td>
                              <td className="py-3 text-sm text-neutral-700 text-right">{item.quantity}</td>
                              <td className="py-3 text-sm text-neutral-700 text-right">{formatPaise(item.unitAmountPaise)}</td>
                              <td className="py-3 text-sm font-semibold text-neutral-900 text-right">{formatPaise(item.unitAmountPaise * item.quantity)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Totals */}
                    <div className="border-t border-neutral-200 pt-6">
                      <div className="flex justify-end">
                        <div className="w-full md:w-64 space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-neutral-500">Subtotal</span>
                            <span className="font-semibold text-neutral-900">{formatPaise(invoice.subtotalPaise)}</span>
                          </div>
                          {invoice.taxRatePct > 0 && (
                            <div className="flex justify-between text-sm">
                              <span className="text-neutral-500">GST ({invoice.taxRatePct}%)</span>
                              <span className="font-semibold text-neutral-900">{formatPaise(invoice.taxAmountPaise)}</span>
                            </div>
                          )}
                          <div className="flex justify-between text-base pt-2 border-t border-neutral-200">
                            <span className="font-bold text-neutral-900">Total</span>
                            <span className="font-bold text-neutral-900">{formatPaise(invoice.totalPaise)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Notes */}
                    {invoice.notes && (
                      <div className="mt-8 pt-6 border-t border-neutral-200">
                        <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">Notes</p>
                        <p className="text-sm text-neutral-600 leading-relaxed">{invoice.notes}</p>
                      </div>
                    )}

                    <div className="mt-6 pt-4 border-t border-neutral-100">
                      <p className="text-xs text-neutral-400">
                        Payment due within 30 days. Please make payment to the account details provided.
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <AppFooter />
        </main>
      </div>
    </div>
  );
}
