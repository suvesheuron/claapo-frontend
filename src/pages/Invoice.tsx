import { useEffect, useState, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FaArrowLeft, FaPrint, FaTriangleExclamation, FaCheck, FaPaperPlane, FaPaperclip, FaDownload, FaTrash } from 'react-icons/fa6';
import DashboardHeader from '../components/DashboardHeader';
import AppFooter from '../components/AppFooter';
import toast from 'react-hot-toast';
import { useApiQuery } from '../hooks/useApiQuery';
import { useAuth } from '../contexts/AuthContext';
import { api, ApiException } from '../services/api';
import { formatPaise } from '../utils/currency';

interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitAmountPaise: number;
}

interface IssuerRecipientDetails {
  name: string;
  gstNumber: string | null;
  sacCode?: string | null;
  address: string | null;
  panNumber: string | null;
  upiId: string | null;
  email: string | null;
  phone: string | null;
  bankAccountName: string | null;
  bankAccountNumber: string | null;
  ifscCode: string | null;
  bankName: string | null;
}

interface InvoiceAttachment {
  id: string;
  fileName: string;
  mimeType: string;
  size: number;
  downloadUrl: string | null;
}

interface InvoiceData {
  id: string;
  invoiceNumber: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  issuedAt: string;
  dueDate: string | null;
  paidAt: string | null;
  projectTitle: string | null;
  projectId: string;
  projectShootDates?: string[] | null;
  projectShootLocations?: string[] | null;
  fromName: string;
  fromRole: string | null;
  fromCity: string | null;
  toName: string;
  toCity: string | null;
  issuerDetails?: IssuerRecipientDetails;
  recipientDetails?: IssuerRecipientDetails;
  lineItems: InvoiceLineItem[];
  subtotalPaise: number;
  taxType?: 'none' | 'gst' | 'igst';
  taxRatePct: number;
  taxAmountPaise: number;
  totalPaise: number;
  notes: string | null;
  issuerId: string;
  recipientId: string;
  attachments?: InvoiceAttachment[];
}

const STATUS_CONFIG = {
  draft:     { bg: 'bg-[#F3F4F6]', text: 'text-neutral-600',  label: 'Draft' },
  sent:      { bg: 'bg-[#DBEAFE]', text: 'text-[#1D4ED8]',    label: 'Sent' },
  paid:      { bg: 'bg-[#DCFCE7]', text: 'text-[#15803D]',    label: 'Paid' },
  overdue:   { bg: 'bg-[#FEE2E2]', text: 'text-[#B91C1C]',    label: 'Overdue' },
  cancelled: { bg: 'bg-[#F3F4F6]', text: 'text-neutral-500',  label: 'Cancelled' },
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function Invoice() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const { user } = useAuth();
  const printRef = useRef<HTMLDivElement>(null);

  const { data: invoice, loading, error, refetch } = useApiQuery<InvoiceData>(
    invoiceId ? `/invoices/${invoiceId}` : null
  );

  const [sending, setSending] = useState(false);
  const [markingPaid, setMarkingPaid] = useState(false);
  const [declining, setDeclining] = useState(false);
  const [showDeclineBox, setShowDeclineBox] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [deletingAttachmentId, setDeletingAttachmentId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.title = invoice ? `Invoice ${invoice.invoiceNumber} – Claapo` : 'Invoice – Claapo';
  }, [invoice]);

  const handlePrint = () => {
    window.print();
  };

  const handleSend = async () => {
    if (!invoiceId) return;
    setSending(true);
    try {
      await api.post(`/invoices/${invoiceId}/send`, {});
      toast.success('Invoice sent to client!');
      refetch();
    } catch (err) {
      toast.error(err instanceof ApiException ? err.payload.message : 'Failed to send invoice.');
    } finally {
      setSending(false);
    }
  };

  const handleMarkPaid = async () => {
    if (!invoiceId) return;
    setMarkingPaid(true);
    try {
      await api.patch(`/invoices/${invoiceId}/mark-paid`, {});
      toast.success('Invoice marked as paid!');
      refetch();
    } catch (err) {
      toast.error(err instanceof ApiException ? err.payload.message : 'Failed to mark as paid.');
    } finally {
      setMarkingPaid(false);
    }
  };

  const handleDecline = async () => {
    if (!invoiceId) return;
    if (!declineReason.trim()) {
      toast.error('Please enter a reason before declining.');
      return;
    }
    setDeclining(true);
    try {
      await api.patch(`/invoices/${invoiceId}/decline`, { reason: declineReason.trim() });
      toast.success('Invoice declined.');
      setShowDeclineBox(false);
      setDeclineReason('');
      refetch();
    } catch (err) {
      toast.error(err instanceof ApiException ? err.payload.message : 'Failed to decline invoice.');
    } finally {
      setDeclining(false);
    }
  };

  const isIssuer = invoice && user && invoice.issuerId === user.id;
  const isRecipient = invoice && user && invoice.recipientId === user.id;
  const invoiceHeading = invoice?.issuerDetails?.gstNumber ? 'TAX INVOICE' : 'INVOICE';
  const canEditAttachments = isIssuer && invoice && (invoice.status === 'draft' || invoice.status === 'sent');
  const attachments = invoice?.attachments ?? [];
  const cgstAmountPaise = invoice ? Math.floor(invoice.taxAmountPaise / 2) : 0;
  const sgstAmountPaise = invoice ? invoice.taxAmountPaise - cgstAmountPaise : 0;

  const handleAddAttachment = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !invoiceId || !invoice) return;
    setUploadingAttachment(true);
    try {
      const { uploadUrl, key } = await api.get<{ uploadUrl: string; key: string }>(`/invoices/${invoiceId}/attachments/upload-url?contentType=${encodeURIComponent(file.type || 'application/octet-stream')}`);
      await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type || 'application/octet-stream' } });
      await api.post(`/invoices/${invoiceId}/attachments`, { fileKey: key, fileName: file.name, mimeType: file.type || 'application/octet-stream', size: file.size });
      toast.success('Attachment added.');
      refetch();
    } catch (err) {
      toast.error(err instanceof ApiException ? err.payload.message : 'Failed to add attachment.');
    } finally {
      setUploadingAttachment(false);
      e.target.value = '';
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!invoiceId) return;
    setDeletingAttachmentId(attachmentId);
    try {
      await api.delete(`/invoices/attachments/${attachmentId}`);
      toast.success('Attachment removed.');
      refetch();
    } catch (err) {
      toast.error(err instanceof ApiException ? err.payload.message : 'Failed to remove attachment.');
    } finally {
      setDeletingAttachmentId(null);
    }
  };

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #invoice-print-area, #invoice-print-area * { visibility: visible; }
          #invoice-print-area { position: fixed; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="h-screen flex flex-col overflow-hidden bg-neutral-50 min-w-0 w-full">
        <div className="no-print">
          <DashboardHeader />
        </div>

        <div className="flex-1 flex min-h-0 overflow-hidden">
          <main className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
            <div className="flex-1 min-h-0 overflow-auto">
              <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 py-4 sm:py-6">
                <div className="no-print">
                  <Link to="/invoices" className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-900 mb-4 text-sm transition-colors">
                    <FaArrowLeft className="w-4 h-4" />
                    Back to Invoices
                  </Link>
                </div>

                {loading && (
                  <div className="space-y-4">
                    <div className="skeleton h-10 w-1/2 rounded-xl" />
                    <div className="skeleton h-64 rounded-2xl" />
                    <div className="skeleton h-32 rounded-2xl" />
                  </div>
                )}

                {error && (
                  <div className="flex items-center gap-3 rounded-2xl bg-[#FEEBEA] border border-[#F40F02]/30 p-5">
                    <FaTriangleExclamation className="text-[#F40F02] text-xl shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-[#991B1B]">Failed to load invoice</p>
                      <p className="text-xs text-[#991B1B]/80 mt-0.5">{error}</p>
                    </div>
                  </div>
                )}

                {invoice && (
                  <>
                    {/* Header bar */}
                    <div className="mb-4 sm:mb-5">
                      <div className="flex items-start justify-between gap-4 mb-2 flex-wrap">
                        <div>
                          <h1 className="text-xl sm:text-2xl font-bold text-neutral-900">
                            Invoice {invoice.invoiceNumber}
                          </h1>
                          {invoice.projectTitle && (
                            <p className="text-sm text-neutral-600 mt-0.5">
                              {invoice.projectTitle}
                              {invoice.issuedAt && ` · ${formatDate(invoice.issuedAt)}`}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0 flex-wrap">
                          {!isRecipient || invoice.status !== 'sent'
                            ? (() => {
                                const cfg = STATUS_CONFIG[invoice.status] ?? STATUS_CONFIG.draft;
                                return (
                                  <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${cfg.bg} ${cfg.text}`}>
                                    {cfg.label}
                                  </span>
                                );
                              })()
                            : null}

                          {/* Issuer actions */}
                          {isIssuer && invoice.status === 'draft' && (
                            <button
                              onClick={handleSend}
                              disabled={sending}
                              className="no-print px-3 py-2 bg-gradient-to-br from-[#3678F1] to-[#2563EB] text-white rounded-xl text-sm font-semibold flex items-center gap-1.5 hover:from-[#2563EB] hover:to-[#1D4ED8] shadow-brand disabled:opacity-50 transition-colors"
                            >
                              <FaPaperPlane className="w-3.5 h-3.5" />
                              {sending ? 'Sending…' : 'Send Invoice'}
                            </button>
                          )}

                          {/* Recipient/company actions */}
                          {isRecipient && invoice.status === 'sent' && (
                            <>
                              <button
                                onClick={handleMarkPaid}
                                disabled={markingPaid || declining}
                                className="no-print px-3 py-2 bg-[#22C55E] text-white rounded-xl text-sm font-semibold flex items-center gap-1.5 hover:bg-[#16a34a] disabled:opacity-50 transition-colors"
                              >
                                <FaCheck className="w-3.5 h-3.5" />
                                {markingPaid ? 'Saving…' : 'Mark as paid'}
                              </button>
                              <button
                                onClick={() => setShowDeclineBox((v) => !v)}
                                disabled={markingPaid || declining}
                                className="no-print px-3 py-2 bg-[#FEEBEA] border border-[#F40F02]/30 text-[#991B1B] rounded-xl text-sm font-semibold hover:bg-[#FDD8D5] disabled:opacity-50 transition-colors"
                              >
                                Decline Invoice
                              </button>
                            </>
                          )}

                          <button
                            onClick={handlePrint}
                            className="no-print px-3 py-2 border border-neutral-200 text-neutral-600 rounded-xl hover:bg-neutral-50 text-sm font-semibold flex items-center gap-1.5 transition-colors"
                          >
                            <FaPrint className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Print / PDF</span>
                          </button>
                        </div>
                      </div>
                      {invoice.dueDate && (
                        <p className="text-xs text-neutral-500">Due: {formatDate(invoice.dueDate)}</p>
                      )}
                      {invoice.paidAt && (
                        <p className="text-xs text-green-600 font-semibold mt-0.5">Paid on {formatDate(invoice.paidAt)}</p>
                      )}
                      {isRecipient && invoice.status === 'sent' && showDeclineBox && (
                        <div className="no-print mt-3 max-w-md rounded-xl border border-[#F40F02]/20 bg-[#FFF7F6] p-3">
                          <label className="block text-xs font-semibold text-[#991B1B] mb-1.5">Reason for declining</label>
                          <textarea
                            value={declineReason}
                            onChange={(e) => setDeclineReason(e.target.value)}
                            rows={3}
                            placeholder="Please mention why this invoice is being declined..."
                            className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-[#F40F02]/20"
                          />
                          <div className="mt-2 flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setShowDeclineBox(false);
                                setDeclineReason('');
                              }}
                              disabled={declining}
                              className="px-3 py-1.5 text-xs font-semibold text-neutral-600 border border-neutral-200 rounded-lg hover:bg-white"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={handleDecline}
                              disabled={declining}
                              className="px-3 py-1.5 text-xs font-semibold text-white bg-[#F40F02] rounded-lg hover:bg-[#C20D02] disabled:opacity-50"
                            >
                              {declining ? 'Declining…' : 'Confirm Decline'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Printable invoice area */}
                    <div id="invoice-print-area" ref={printRef} className="bg-white rounded-2xl border border-neutral-200 p-6 sm:p-10">
                      {/* Claapo Logo + Invoice Header */}
                      <div className="flex items-start justify-between mb-8 pb-6 border-b-2 border-neutral-900">
                        <div className="flex items-center gap-3">
                          <img src="/claapo-logo.svg" alt="Claapo" className="h-12 w-auto" />
                        </div>
                        <div className="text-right">
                          <h2 className="text-3xl font-bold text-neutral-900 tracking-tight">{invoiceHeading}</h2>
                          <p className="text-sm font-mono text-neutral-600 mt-1">{invoice.invoiceNumber}</p>
                          <div className="mt-3 space-y-0.5 text-xs text-neutral-600">
                            <p>
                              <span className="text-neutral-400">Issued:&nbsp;</span>
                              <span className="font-semibold text-neutral-800">{formatDate(invoice.issuedAt)}</span>
                            </p>
                            {invoice.dueDate && (
                              <p>
                                <span className="text-neutral-400">Due:&nbsp;</span>
                                <span className="font-semibold text-neutral-800">{formatDate(invoice.dueDate)}</span>
                              </p>
                            )}
                            {invoice.paidAt && (
                              <p className="text-[#15803D] font-semibold">Paid on {formatDate(invoice.paidAt)}</p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Bill From / Bill To */}
                      <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Bill From */}
                        <div>
                          <h3 className="text-[11px] font-bold text-neutral-500 uppercase tracking-[0.15em] mb-3">Bill From</h3>
                          <div className="pl-4 border-l-2 border-neutral-200">
                            <p className="text-base font-bold text-neutral-900">{invoice.fromName}</p>
                            {invoice.fromRole && <p className="text-xs text-neutral-600 mt-0.5">{invoice.fromRole}</p>}
                            {invoice.fromCity && <p className="text-sm text-neutral-600 mt-0.5">{invoice.fromCity}</p>}
                            {invoice.issuerDetails?.address && (
                              <p className="text-xs text-neutral-600 mt-1 leading-relaxed whitespace-pre-wrap">{invoice.issuerDetails.address}</p>
                            )}
                            {(invoice.issuerDetails?.panNumber || invoice.issuerDetails?.gstNumber || invoice.issuerDetails?.sacCode) && (
                              <div className="mt-2 space-y-0.5">
                                {invoice.issuerDetails.panNumber && (
                                  <p className="text-xs text-neutral-500"><span className="text-neutral-400">PAN:&nbsp;</span><span className="font-mono text-neutral-700">{invoice.issuerDetails.panNumber}</span></p>
                                )}
                                {invoice.issuerDetails.gstNumber && (
                                  <p className="text-xs text-neutral-500"><span className="text-neutral-400">GST:&nbsp;</span><span className="font-mono text-neutral-700">{invoice.issuerDetails.gstNumber}</span></p>
                                )}
                                {invoice.issuerDetails.sacCode && (
                                  <p className="text-xs text-neutral-500"><span className="text-neutral-400">SAC:&nbsp;</span><span className="font-mono text-neutral-700">{invoice.issuerDetails.sacCode}</span></p>
                                )}
                              </div>
                            )}
                            {(invoice.issuerDetails?.email || invoice.issuerDetails?.phone) && (
                              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5">
                                {invoice.issuerDetails.email && (
                                  <p className="text-xs text-neutral-500">{invoice.issuerDetails.email}</p>
                                )}
                                {invoice.issuerDetails.phone && (
                                  <p className="text-xs text-neutral-500">{invoice.issuerDetails.phone}</p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Bill To */}
                        <div>
                          <h3 className="text-[11px] font-bold text-neutral-500 uppercase tracking-[0.15em] mb-3">Bill To</h3>
                          <div className="pl-4 border-l-2 border-neutral-200">
                            <p className="text-base font-bold text-neutral-900">{invoice.toName}</p>
                            {invoice.toCity && <p className="text-sm text-neutral-600 mt-0.5">{invoice.toCity}</p>}
                            {invoice.recipientDetails?.address && (
                              <p className="text-xs text-neutral-600 mt-1 leading-relaxed whitespace-pre-wrap">{invoice.recipientDetails.address}</p>
                            )}
                            {(invoice.recipientDetails?.panNumber || invoice.recipientDetails?.gstNumber || invoice.recipientDetails?.sacCode) && (
                              <div className="mt-2 space-y-0.5">
                                {invoice.recipientDetails.panNumber && (
                                  <p className="text-xs text-neutral-500"><span className="text-neutral-400">PAN:&nbsp;</span><span className="font-mono text-neutral-700">{invoice.recipientDetails.panNumber}</span></p>
                                )}
                                {invoice.recipientDetails.gstNumber && (
                                  <p className="text-xs text-neutral-500"><span className="text-neutral-400">GST:&nbsp;</span><span className="font-mono text-neutral-700">{invoice.recipientDetails.gstNumber}</span></p>
                                )}
                                {invoice.recipientDetails.sacCode && (
                                  <p className="text-xs text-neutral-500"><span className="text-neutral-400">SAC:&nbsp;</span><span className="font-mono text-neutral-700">{invoice.recipientDetails.sacCode}</span></p>
                                )}
                              </div>
                            )}
                            {(invoice.recipientDetails?.email || invoice.recipientDetails?.phone) && (
                              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5">
                                {invoice.recipientDetails.email && (
                                  <p className="text-xs text-neutral-500">{invoice.recipientDetails.email}</p>
                                )}
                                {invoice.recipientDetails.phone && (
                                  <p className="text-xs text-neutral-500">{invoice.recipientDetails.phone}</p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Project Details */}
                      {(invoice.projectTitle || invoice.projectShootDates?.length || invoice.projectShootLocations?.length) && (
                        <div className="mb-8 p-4 rounded-xl bg-[#E8F0FE] border border-[#3678F1]/10">
                          <h3 className="text-xs font-bold text-[#3678F1] uppercase tracking-wider mb-3 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                            </svg>
                            Project Details
                          </h3>
                          <div className="space-y-2 text-sm">
                            {invoice.projectTitle && (
                              <div className="flex gap-2">
                                <span className="text-neutral-500 shrink-0 w-24">Project:</span>
                                <span className="font-semibold text-neutral-900">{invoice.projectTitle}</span>
                              </div>
                            )}
                            {invoice.projectShootDates && invoice.projectShootDates.length > 0 && (
                              <div className="flex gap-2">
                                <span className="text-neutral-500 shrink-0 w-24">Shoot Dates:</span>
                                <span className="font-semibold text-neutral-900">
                                  {invoice.projectShootDates.map((d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })).join(', ')}
                                </span>
                              </div>
                            )}
                            {invoice.projectShootLocations && invoice.projectShootLocations.length > 0 && (
                              <div className="flex gap-2">
                                <span className="text-neutral-500 shrink-0 w-24">Location:</span>
                                <span className="font-semibold text-neutral-900">{invoice.projectShootLocations.join(', ')}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

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
                            {invoice.taxRatePct > 0 && invoice.taxType === 'gst' && (
                              <>
                                <div className="flex justify-between text-sm">
                                  <span className="text-neutral-500">CGST ({invoice.taxRatePct / 2}%)</span>
                                  <span className="font-semibold text-neutral-900">{formatPaise(cgstAmountPaise)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-neutral-500">SGST ({invoice.taxRatePct / 2}%)</span>
                                  <span className="font-semibold text-neutral-900">{formatPaise(sgstAmountPaise)}</span>
                                </div>
                              </>
                            )}
                            {invoice.taxRatePct > 0 && invoice.taxType === 'igst' && (
                              <div className="flex justify-between text-sm">
                                <span className="text-neutral-500">IGST ({invoice.taxRatePct}%)</span>
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

                      {invoice.notes && (
                        <div className="mt-8 pt-6 border-t border-neutral-200">
                          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">Notes</p>
                          <p className="text-sm text-neutral-600 leading-relaxed">{invoice.notes}</p>
                        </div>
                      )}

                      {/* Signature / Payable to */}
                      <div className="mt-10 pt-6 border-t-2 border-neutral-900">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          {/* Signature */}
                          <div>
                            <h3 className="text-[11px] font-bold text-neutral-500 uppercase tracking-[0.15em] mb-3">Signature</h3>
                            <div className="border-b-2 border-neutral-300 pb-16" />
                            <p className="text-xs text-neutral-500 mt-2">Authorised Signatory</p>
                          </div>

                          {/* Payable to */}
                          {(invoice.issuerDetails?.bankAccountName ||
                            invoice.issuerDetails?.bankAccountNumber ||
                            invoice.issuerDetails?.bankName ||
                            invoice.issuerDetails?.ifscCode ||
                            invoice.issuerDetails?.upiId) ? (
                            <div className="md:border-l md:border-neutral-200 md:pl-8">
                              <h3 className="text-[11px] font-bold text-neutral-500 uppercase tracking-[0.15em] mb-3">Bill Payable To</h3>
                              <div className="space-y-1">
                                {invoice.issuerDetails.bankAccountName && (
                                  <p className="text-sm font-semibold text-neutral-900">{invoice.issuerDetails.bankAccountName}</p>
                                )}
                                {invoice.issuerDetails.bankName && (
                                  <p className="text-xs text-neutral-600">{invoice.issuerDetails.bankName}</p>
                                )}
                                {invoice.issuerDetails.bankAccountNumber && (
                                  <p className="text-xs text-neutral-700">
                                    <span className="text-neutral-400">A/c No.&nbsp;</span>
                                    <span className="font-mono">{invoice.issuerDetails.bankAccountNumber}</span>
                                  </p>
                                )}
                                {invoice.issuerDetails.ifscCode && (
                                  <p className="text-xs text-neutral-700">
                                    <span className="text-neutral-400">IFSC&nbsp;</span>
                                    <span className="font-mono">{invoice.issuerDetails.ifscCode}</span>
                                  </p>
                                )}
                                {invoice.issuerDetails.upiId && (
                                  <p className="text-xs text-neutral-700">
                                    <span className="text-neutral-400">UPI ID&nbsp;</span>
                                    <span className="font-mono">{invoice.issuerDetails.upiId}</span>
                                  </p>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="md:border-l md:border-neutral-200 md:pl-8">
                              <h3 className="text-[11px] font-bold text-neutral-500 uppercase tracking-[0.15em] mb-3">Payment Terms</h3>
                              <p className="text-xs text-neutral-600 leading-relaxed">
                                Payment due {invoice.dueDate ? `by ${formatDate(invoice.dueDate)}` : 'within 30 days of issue'}. Contact the issuer for payment instructions.
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="mt-8 pt-4 border-t border-neutral-100 flex items-center justify-between gap-4 flex-wrap">
                          <p className="text-[10px] text-neutral-400 uppercase tracking-wider">
                            Payment due within 30 days · This is a computer-generated invoice and does not require a signature
                          </p>
                          <p className="text-[10px] text-neutral-400">Powered by Claapo</p>
                        </div>
                      </div>
                    </div>

                    {/* Attachments — supporting files, not part of the printed invoice */}
                    <div className="no-print mt-6 bg-white rounded-2xl border border-neutral-200 p-5 sm:p-6">
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div>
                          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Supporting Documents</p>
                          <p className="text-[11px] text-neutral-400 mt-0.5">Files attached for reference — not included in the printed invoice.</p>
                        </div>
                        {canEditAttachments && (
                          <>
                            <input ref={fileInputRef} type="file" className="hidden" onChange={handleAddAttachment} />
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              disabled={uploadingAttachment}
                              className="text-xs font-semibold text-[#3678F1] hover:underline disabled:opacity-50 flex items-center gap-1 shrink-0"
                            >
                              <FaPaperclip className="w-3 h-3" />
                              {uploadingAttachment ? 'Uploading…' : 'Add attachment'}
                            </button>
                          </>
                        )}
                      </div>
                      {attachments.length === 0 ? (
                        <p className="text-sm text-neutral-400">No attachments</p>
                      ) : (
                        <ul className="space-y-2">
                          {attachments.map((a) => (
                            <li key={a.id} className="flex items-center justify-between gap-2 py-1.5 px-2 rounded-lg bg-neutral-50 border border-neutral-100">
                              <a href={a.downloadUrl ?? '#'} target="_blank" rel="noopener noreferrer" className="text-sm text-[#3678F1] hover:underline truncate flex items-center gap-2 min-w-0">
                                <FaDownload className="w-3 h-3 shrink-0" />
                                <span className="truncate">{a.fileName}</span>
                                <span className="text-xs text-neutral-400 shrink-0">({(a.size / 1024).toFixed(1)} KB)</span>
                              </a>
                              {canEditAttachments && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteAttachment(a.id)}
                                  disabled={deletingAttachmentId === a.id}
                                  className="text-[#F40F02] hover:text-[#C20D02] p-1 disabled:opacity-50"
                                  aria-label="Remove attachment"
                                >
                                  <FaTrash className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="no-print">
              <AppFooter />
            </div>
          </main>
        </div>
      </div>

    </>
  );
}
