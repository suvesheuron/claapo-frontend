import { useEffect, useState, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FaArrowLeft, FaPrint, FaTriangleExclamation, FaCheck, FaPaperPlane, FaCreditCard, FaXmark, FaPaperclip, FaDownload, FaTrash } from 'react-icons/fa6';
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
  address: string | null;
  panNumber: string | null;
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
  fromName: string;
  fromRole: string | null;
  fromCity: string | null;
  toName: string;
  toCity: string | null;
  issuerDetails?: IssuerRecipientDetails;
  recipientDetails?: IssuerRecipientDetails;
  lineItems: InvoiceLineItem[];
  subtotalPaise: number;
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

// ── Demo Razorpay-style Pay Modal (QR + UPI / Card) ─────────────────────────────
function DemoPayModal({ invoice, onClose, onPaid }: { invoice: InvoiceData; onClose: () => void; onPaid: () => void }) {
  const [paying, setPaying] = useState(false);
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [method, setMethod] = useState<'upi' | 'card'>('upi');
  const [cardNum, setCardNum] = useState('4111 1111 1111 1111');
  const [expiry, setExpiry] = useState('12/26');
  const [cvv, setCvv] = useState('123');
  const [name, setName] = useState('');
  const [upiId, setUpiId] = useState('customer@upi');

  const amountRupees = (invoice.totalPaise / 100).toFixed(2);
  const upiQrData = `upi://pay?pa=demo@razorpay&pn=${encodeURIComponent(invoice.fromName)}&am=${amountRupees}&cu=INR`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(upiQrData)}`;

  const handlePay = async () => {
    if (method === 'card' && !name.trim()) {
      toast.error('Please enter the cardholder name.');
      return;
    }
    setPaying(true);
    try {
      await api.patch(`/invoices/${invoice.id}/mark-paid`, {});
      setStep('success');
      setTimeout(() => { onPaid(); onClose(); }, 2000);
    } catch (err) {
      toast.error(err instanceof ApiException ? err.payload.message : 'Payment failed. Please try again.');
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-neutral-200">
        {step === 'success' ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <FaCheck className="text-green-600 text-2xl" />
            </div>
            <h3 className="text-lg font-bold text-neutral-900 mb-1">Payment Successful!</h3>
            <p className="text-sm text-neutral-500">{formatPaise(invoice.totalPaise)} paid to {invoice.fromName}</p>
          </div>
        ) : (
          <>
            {/* Razorpay-style header */}
            <div className="bg-[#0C2451] px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-white font-bold text-lg tracking-tight">Razorpay</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider bg-amber-400 text-[#0C2451] px-1.5 py-0.5 rounded">Demo</span>
              </div>
              <button onClick={onClose} className="text-white/70 hover:text-white transition-colors p-1" aria-label="Close">
                <FaXmark className="text-xl" />
              </button>
            </div>

            {/* Amount block */}
            <div className="px-5 py-4 border-b border-neutral-100 bg-neutral-50/80">
              <p className="text-xs text-neutral-500 uppercase tracking-wide">Amount to pay</p>
              <p className="text-2xl font-bold text-neutral-900 mt-0.5">{formatPaise(invoice.totalPaise)}</p>
              <p className="text-xs text-neutral-500 mt-0.5">{invoice.invoiceNumber} · {invoice.fromName}</p>
            </div>

            {/* Payment method tabs */}
            <div className="flex border-b border-neutral-200">
              <button
                type="button"
                onClick={() => setMethod('upi')}
                className={`flex-1 py-3 text-sm font-semibold transition-colors ${method === 'upi' ? 'text-[#0C2451] border-b-2 border-[#0C2451]' : 'text-neutral-500 hover:text-neutral-700'}`}
              >
                UPI
              </button>
              <button
                type="button"
                onClick={() => setMethod('card')}
                className={`flex-1 py-3 text-sm font-semibold transition-colors ${method === 'card' ? 'text-[#0C2451] border-b-2 border-[#0C2451]' : 'text-neutral-500 hover:text-neutral-700'}`}
              >
                Card
              </button>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                Demo mode — no real payment is processed.
              </p>

              {method === 'upi' ? (
                <>
                  <div className="flex flex-col items-center py-2">
                    <img src={qrImageUrl} alt="UPI QR Code" className="w-52 h-52 rounded-xl border border-neutral-200 bg-white" />
                    <p className="text-sm font-medium text-neutral-700 mt-3">Scan with any UPI app</p>
                    <p className="text-xs text-neutral-500 mt-0.5">or enter UPI ID below</p>
                  </div>
                  <div className="flex gap-2">
                    <input
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="yourname@upi"
                      className="flex-1 border border-neutral-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0C2451]"
                    />
                    <button
                      onClick={handlePay}
                      disabled={paying}
                      className="px-5 py-2.5 bg-[#0C2451] text-white rounded-xl font-semibold text-sm hover:bg-[#091d3a] disabled:opacity-50 transition-colors"
                    >
                      {paying ? '…' : 'Pay'}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1 block">Card Number</label>
                    <input value={cardNum} onChange={(e) => setCardNum(e.target.value)}
                      className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#0C2451]" />
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1 block">Expiry</label>
                      <input value={expiry} onChange={(e) => setExpiry(e.target.value)}
                        className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0C2451]" placeholder="MM/YY" />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1 block">CVV</label>
                      <input value={cvv} onChange={(e) => setCvv(e.target.value)} type="password" maxLength={4}
                        className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0C2451]" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1 block">Cardholder Name</label>
                    <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name on card"
                      className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0C2451]" />
                  </div>
                  <button
                    onClick={handlePay}
                    disabled={paying}
                    className="w-full py-3 bg-[#0C2451] text-white rounded-xl font-bold text-sm hover:bg-[#091d3a] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <FaCreditCard className="w-4 h-4" />
                    {paying ? 'Processing…' : `Pay ${formatPaise(invoice.totalPaise)}`}
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
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
  const [showPayModal, setShowPayModal] = useState(false);
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

  const isIssuer = invoice && user && invoice.issuerId === user.id;
  const isRecipient = invoice && user && invoice.recipientId === user.id;
  const canEditAttachments = isIssuer && invoice && (invoice.status === 'draft' || invoice.status === 'sent');
  const attachments = invoice?.attachments ?? [];

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
                  <Link to="/dashboard/invoices" className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-900 mb-4 text-sm transition-colors">
                    <FaArrowLeft className="w-4 h-4" />
                    Back to Invoices
                  </Link>
                </div>

                {loading && (
                  <div className="animate-pulse space-y-4">
                    <div className="h-10 bg-neutral-200 rounded-xl w-1/2" />
                    <div className="h-64 bg-neutral-200 rounded-2xl" />
                    <div className="h-32 bg-neutral-200 rounded-2xl" />
                  </div>
                )}

                {error && (
                  <div className="flex items-center gap-3 rounded-2xl bg-red-50 border border-red-200 p-5">
                    <FaTriangleExclamation className="text-red-500 text-xl shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-red-700">Failed to load invoice</p>
                      <p className="text-xs text-red-600 mt-0.5">{error}</p>
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
                          {(() => {
                            const cfg = STATUS_CONFIG[invoice.status] ?? STATUS_CONFIG.draft;
                            return (
                              <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${cfg.bg} ${cfg.text}`}>
                                {cfg.label}
                              </span>
                            );
                          })()}

                          {/* Issuer actions */}
                          {isIssuer && invoice.status === 'draft' && (
                            <button
                              onClick={handleSend}
                              disabled={sending}
                              className="no-print px-3 py-2 bg-[#3B5BDB] text-white rounded-xl text-sm font-semibold flex items-center gap-1.5 hover:bg-[#2f4ac2] disabled:opacity-50 transition-colors"
                            >
                              <FaPaperPlane className="w-3.5 h-3.5" />
                              {sending ? 'Sending…' : 'Send Invoice'}
                            </button>
                          )}

                          {/* Recipient/company actions */}
                          {isRecipient && invoice.status === 'sent' && (
                            <>
                              <button
                                onClick={() => setShowPayModal(true)}
                                className="no-print px-3 py-2 bg-[#22C55E] text-white rounded-xl text-sm font-semibold flex items-center gap-1.5 hover:bg-[#16a34a] transition-colors"
                              >
                                <FaCreditCard className="w-3.5 h-3.5" /> Pay Now
                              </button>
                              <button
                                onClick={handleMarkPaid}
                                disabled={markingPaid}
                                className="no-print px-3 py-2 border border-neutral-200 text-neutral-600 rounded-xl text-sm font-semibold flex items-center gap-1.5 hover:bg-neutral-50 disabled:opacity-50 transition-colors"
                              >
                                <FaCheck className="w-3.5 h-3.5" />
                                {markingPaid ? 'Saving…' : 'Mark Paid'}
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
                    </div>

                    {/* Printable invoice area */}
                    <div id="invoice-print-area" ref={printRef} className="bg-white rounded-2xl border border-neutral-200 p-6 sm:p-8">
                      {/* Claapo Logo + Invoice Header */}
                      <div className="flex items-center justify-between mb-6 pb-6 border-b border-neutral-200">
                        <div className="flex items-center gap-3">
                          <img src="/claapo-logo.svg" alt="Claapo" className="h-12 w-auto" />
                        </div>
                        <div className="text-right">
                          <h2 className="text-2xl font-bold text-neutral-900 tracking-tight">INVOICE</h2>
                          <p className="text-sm text-neutral-500 mt-0.5">{invoice.invoiceNumber}</p>
                        </div>
                      </div>

                      {/* From / To */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div>
                          <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">From</h3>
                          <p className="text-sm font-semibold text-neutral-900">{invoice.fromName}</p>
                          {invoice.fromRole && <p className="text-sm text-neutral-600">{invoice.fromRole}</p>}
                          {invoice.fromCity && <p className="text-sm text-neutral-500">{invoice.fromCity}</p>}
                          {invoice.issuerDetails?.gstNumber && <p className="text-xs text-neutral-500 mt-1">GST: {invoice.issuerDetails.gstNumber}</p>}
                          {invoice.issuerDetails?.address && <p className="text-xs text-neutral-500 mt-0.5">{invoice.issuerDetails.address}</p>}
                          {invoice.issuerDetails?.panNumber && <p className="text-xs text-neutral-500 mt-1">PAN: {invoice.issuerDetails.panNumber}</p>}
                          {(invoice.issuerDetails?.bankAccountName || invoice.issuerDetails?.bankAccountNumber) && (
                            <p className="text-xs text-neutral-500 mt-0.5">
                              {invoice.issuerDetails.bankName && `${invoice.issuerDetails.bankName} · `}
                              {invoice.issuerDetails.bankAccountNumber && `A/c ${invoice.issuerDetails.bankAccountNumber}`}
                              {invoice.issuerDetails.ifscCode && ` · IFSC ${invoice.issuerDetails.ifscCode}`}
                            </p>
                          )}
                        </div>
                        <div>
                          <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">To</h3>
                          <p className="text-sm font-semibold text-neutral-900">{invoice.toName}</p>
                          {invoice.toCity && <p className="text-sm text-neutral-500">{invoice.toCity}</p>}
                          {invoice.recipientDetails?.gstNumber && <p className="text-xs text-neutral-500 mt-1">GST: {invoice.recipientDetails.gstNumber}</p>}
                          {invoice.recipientDetails?.address && <p className="text-xs text-neutral-500 mt-0.5">{invoice.recipientDetails.address}</p>}
                          {invoice.recipientDetails?.panNumber && <p className="text-xs text-neutral-500 mt-1">PAN: {invoice.recipientDetails.panNumber}</p>}
                          {(invoice.recipientDetails?.bankAccountName || invoice.recipientDetails?.bankAccountNumber) && (
                            <p className="text-xs text-neutral-500 mt-0.5">
                              {invoice.recipientDetails.bankName && `${invoice.recipientDetails.bankName} · `}
                              {invoice.recipientDetails.bankAccountNumber && `A/c ${invoice.recipientDetails.bankAccountNumber}`}
                              {invoice.recipientDetails.ifscCode && ` · IFSC ${invoice.recipientDetails.ifscCode}`}
                            </p>
                          )}
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

                      {invoice.notes && (
                        <div className="mt-8 pt-6 border-t border-neutral-200">
                          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">Notes</p>
                          <p className="text-sm text-neutral-600 leading-relaxed">{invoice.notes}</p>
                        </div>
                      )}

                      {/* Attachments */}
                      <div className="mt-8 pt-6 border-t border-neutral-200">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Attachments</p>
                          {canEditAttachments && (
                            <>
                              <input ref={fileInputRef} type="file" className="hidden" onChange={handleAddAttachment} />
                              <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploadingAttachment}
                                className="no-print text-xs font-semibold text-[#3B5BDB] hover:underline disabled:opacity-50 flex items-center gap-1"
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
                                <a href={a.downloadUrl ?? '#'} target="_blank" rel="noopener noreferrer" className="text-sm text-[#3B5BDB] hover:underline truncate flex items-center gap-2 min-w-0">
                                  <FaDownload className="w-3 h-3 shrink-0" />
                                  <span className="truncate">{a.fileName}</span>
                                  <span className="text-xs text-neutral-400 shrink-0">({(a.size / 1024).toFixed(1)} KB)</span>
                                </a>
                                {canEditAttachments && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteAttachment(a.id)}
                                    disabled={deletingAttachmentId === a.id}
                                    className="no-print text-red-600 hover:text-red-700 p-1 disabled:opacity-50"
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

            <div className="no-print">
              <AppFooter />
            </div>
          </main>
        </div>
      </div>

      {showPayModal && invoice && (
        <DemoPayModal
          invoice={invoice}
          onClose={() => setShowPayModal(false)}
          onPaid={() => { toast.success('Payment recorded!'); refetch(); }}
        />
      )}
    </>
  );
}
