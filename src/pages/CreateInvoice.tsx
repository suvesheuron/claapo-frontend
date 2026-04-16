import { useEffect, useMemo, useState, useRef } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { FaArrowLeft, FaPlus, FaTrash, FaFileInvoice, FaPaperclip, FaUpload } from 'react-icons/fa6';
import DashboardHeader from '../components/DashboardHeader';
import AppFooter from '../components/AppFooter';
import { api, ApiException } from '../services/api';
import { useApiQuery } from '../hooks/useApiQuery';
import { formatPaise, rupeesToPaise } from '../utils/currency';
import toast from 'react-hot-toast';

interface BookingItem {
  id: string;
  status: string;
  rateOffered?: number | null;
  project: { id: string; title: string };
  requester: { id: string };
  projectRole?: { roleName: string } | null;
}

interface LineItem {
  description: string;
  quantity: string;
  unitPrice: string;
}

interface PendingAttachment {
  file: File;
  previewUrl?: string;
  uploading: boolean;
}

export default function CreateInvoice() {
  useEffect(() => { document.title = 'Create Invoice – Claapo'; }, []);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const bookingIdFromUrl = searchParams.get('bookingId')?.trim() ?? '';

  const { data: bookingsData, loading: bookingsLoading } = useApiQuery<{ items: BookingItem[] }>('/bookings/incoming');
  const { data: myProfile } = useApiQuery<any>('/profile/me');
  const bookings = useMemo(
    () => (bookingsData?.items ?? []).filter((b) => b.status === 'accepted' || b.status === 'locked'),
    [bookingsData?.items],
  );

  const [selectedBookingId, setSelectedBookingId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [lineItems, setLineItems] = useState<LineItem[]>([{ description: '', quantity: '1', unitPrice: '' }]);
  const [submitting, setSubmitting] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedBooking = bookings.find((b) => b.id === selectedBookingId) ?? null;

  useEffect(() => {
    if (bookingsLoading || !bookingIdFromUrl) return;
    const items = bookingsData?.items ?? [];
    const match = items.find(
      (b) => (b.status === 'accepted' || b.status === 'locked') && b.id === bookingIdFromUrl,
    );
    if (match) setSelectedBookingId(bookingIdFromUrl);
  }, [bookingsLoading, bookingIdFromUrl, bookingsData]);

  // Keep line items blank when booking is selected — no auto pre-fill
  useEffect(() => {
    if (!selectedBooking) return;
    // Do not pre-fill — user enters particulars manually
  }, [selectedBooking?.id]);

  const addLine = () => setLineItems((prev) => [...prev, { description: '', quantity: '1', unitPrice: '' }]);
  const removeLine = (i: number) => setLineItems((prev) => prev.filter((_, idx) => idx !== i));
  const updateLine = (i: number, key: keyof LineItem, val: string) => {
    setLineItems((prev) => prev.map((l, idx) => idx === i ? { ...l, [key]: val } : l));
  };

  const handleAddAttachments = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const newAttachments: PendingAttachment[] = Array.from(files).map((file) => ({
      file,
      previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
      uploading: false,
    }));
    setPendingAttachments((prev) => [...prev, ...newAttachments]);
    e.target.value = '';
  };

  const removePendingAttachment = (i: number) => {
    setPendingAttachments((prev) => prev.filter((_, idx) => idx !== i));
  };

  const hasValidGst = useMemo(() => {
    const gst =
      myProfile?.individualProfile?.gstNumber
      ?? myProfile?.vendorProfile?.gstNumber
      ?? null;
    if (!gst || typeof gst !== 'string') return false;
    return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(gst.trim().toUpperCase());
  }, [myProfile]);

  const subtotalPaise = lineItems.reduce((sum, l) => {
    const qty = parseFloat(l.quantity) || 0;
    const price = rupeesToPaise(l.unitPrice);
    return sum + qty * price;
  }, 0);
  const gstPaise = hasValidGst ? Math.round(subtotalPaise * 0.18) : 0;
  const totalPaise = subtotalPaise + gstPaise;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookingId) { toast.error('Please select a project booking.'); return; }
    if (lineItems.some((l) => !l.description || !l.unitPrice)) {
      toast.error('Please fill in all line item descriptions and prices.');
      return;
    }
    setSubmitting(true);
    try {
      const dto = {
        projectId: selectedBooking!.project.id,
        recipientUserId: selectedBooking!.requester.id,
        dueDate: dueDate || undefined,
        lineItems: lineItems.map((l) => ({
          description: l.description,
          quantity: Math.max(1, parseInt(l.quantity) || 1),
          unitPrice: rupeesToPaise(l.unitPrice),
        })),
      };
      const created = await api.post<{ id: string }>('/invoices', dto);
      const invoiceId = created.id;

      // Upload pending attachments
      for (const att of pendingAttachments) {
        try {
          const { uploadUrl, key } = await api.get<{ uploadUrl: string; key: string }>(
            `/invoices/${invoiceId}/attachments/upload-url?contentType=${encodeURIComponent(att.file.type || 'application/octet-stream')}`,
          );
          await fetch(uploadUrl, {
            method: 'PUT',
            body: att.file,
            headers: { 'Content-Type': att.file.type || 'application/octet-stream' },
          });
          await api.post(`/invoices/${invoiceId}/attachments`, {
            fileKey: key,
            fileName: att.file.name,
            mimeType: att.file.type || 'application/octet-stream',
            size: att.file.size,
          });
        } catch {
          // Silently skip failed attachments — user can add them later
        }
      }

      toast.success('Invoice created as draft!');
      navigate(`/invoice/${invoiceId}`);
    } catch (err) {
      toast.error(err instanceof ApiException ? err.payload.message : 'Failed to create invoice.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-neutral-50 w-full">
      <DashboardHeader />
      <div className="flex-1 min-h-0 overflow-auto">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-5">
          <Link to="/invoices" className="inline-flex items-center gap-2 text-neutral-500 hover:text-neutral-900 text-sm mb-5 transition-colors">
            <FaArrowLeft className="w-3.5 h-3.5" /> Back to Invoices
          </Link>

          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-[#E8F0FE] flex items-center justify-center">
              <FaFileInvoice className="text-[#3678F1]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-neutral-900">Create Invoice</h1>
              <p className="text-sm text-neutral-500">For a project you were booked on</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Project Selection */}
            <div className="bg-white rounded-2xl border border-neutral-200 p-5">
              <h2 className="text-sm font-bold text-neutral-700 mb-3">Project</h2>
              {bookingsLoading ? (
                <div className="skeleton h-10 rounded-xl" />
              ) : bookings.length === 0 ? (
                <p className="text-sm text-neutral-500">
                  No accepted or locked bookings found. You can only create invoices for projects where you have an accepted booking.
                </p>
              ) : (
                <select
                  value={selectedBookingId}
                  onChange={(e) => setSelectedBookingId(e.target.value)}
                  className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-[#3678F1] focus:border-transparent"
                  required
                >
                  <option value="">— Select a booking —</option>
                  {bookings.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.project.title}{b.projectRole ? ` · ${b.projectRole.roleName}` : ''}
                      {b.rateOffered ? ` · ${formatPaise(b.rateOffered)}` : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Due Date */}
            <div className="bg-white rounded-2xl border border-neutral-200 p-5">
              <h2 className="text-sm font-bold text-neutral-700 mb-3">Due Date <span className="font-normal text-neutral-400">(optional)</span></h2>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="border border-neutral-200 rounded-xl px-3 py-2.5 text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-[#3678F1] focus:border-transparent"
              />
            </div>

            {/* Particulars */}
            <div className="bg-white rounded-2xl border border-neutral-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-neutral-700">Particulars</h2>
                <button type="button" onClick={addLine} className="flex items-center gap-1.5 text-[#3678F1] text-xs font-semibold hover:text-[#2563EB] transition-colors">
                  <FaPlus className="w-3 h-3" /> Add Item
                </button>
              </div>

              <div className="space-y-3">
                {lineItems.map((line, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <input
                        type="text"
                        placeholder="Description (e.g. Direction services)"
                        value={line.description}
                        onChange={(e) => updateLine(i, 'description', e.target.value)}
                        className="w-full border border-neutral-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3678F1] focus:border-transparent mb-1.5"
                        required
                      />
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 w-24">
                          <span className="text-xs text-neutral-400">Qty</span>
                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={line.quantity}
                            onChange={(e) => updateLine(i, 'quantity', e.target.value)}
                            className="w-full border border-neutral-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#3678F1]"
                          />
                        </div>
                        <div className="flex items-center gap-1 flex-1">
                          <span className="text-xs text-neutral-400 whitespace-nowrap">₹ Rate</span>
                          <input
                            type="number"
                            min="0"
                            step="100"
                            placeholder="0"
                            value={line.unitPrice}
                            onChange={(e) => updateLine(i, 'unitPrice', e.target.value)}
                            className="w-full border border-neutral-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#3678F1]"
                            required
                          />
                        </div>
                        <span className="text-xs font-semibold text-neutral-700 whitespace-nowrap w-24 text-right">
                          {formatPaise(rupeesToPaise(line.unitPrice) * (parseFloat(line.quantity) || 0))}
                        </span>
                      </div>
                    </div>
                    {lineItems.length > 1 && (
                      <button type="button" onClick={() => removeLine(i)} className="text-[#F40F02]/70 hover:text-[#F40F02] p-2 mt-1 transition-colors">
                        <FaTrash className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="mt-4 pt-4 border-t border-neutral-100 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">Subtotal</span>
                  <span className="font-semibold">{formatPaise(subtotalPaise)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">{hasValidGst ? 'GST (18%)' : 'GST (Not Applied)'}</span>
                  <span className="font-semibold">{formatPaise(gstPaise)}</span>
                </div>
                <div className="flex justify-between text-base pt-2 border-t border-neutral-200">
                  <span className="font-bold text-neutral-900">Total</span>
                  <span className="font-bold text-[#3678F1]">{formatPaise(totalPaise)}</span>
                </div>
              </div>
            </div>

            {/* GST Note */}
            <p className="text-xs text-neutral-400">
              {hasValidGst
                ? 'GST @ 18% is auto-calculated and added to your invoice total.'
                : 'GST is not applied because no valid GST number is present on your profile.'}
              The invoice will be created as a <strong>Draft</strong> — you can review and send it from the invoice detail page.
            </p>

            {/* Attach Files */}
            <div className="bg-white rounded-2xl border border-neutral-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-neutral-700">Attach Files</h2>
                <label className="flex items-center gap-1.5 text-[#3678F1] text-xs font-semibold hover:text-[#2563EB] transition-colors cursor-pointer">
                  <FaUpload className="w-3 h-3" />
                  Choose Files
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                    className="hidden"
                    onChange={handleAddAttachments}
                  />
                </label>
              </div>
              {pendingAttachments.length === 0 ? (
                <p className="text-sm text-neutral-400">No files attached</p>
              ) : (
                <div className="space-y-2">
                  {/* Image preview grid */}
                  {pendingAttachments.some((a) => a.previewUrl) && (
                    <div className="flex flex-wrap gap-2">
                      {pendingAttachments.map((a, i) =>
                        a.previewUrl ? (
                          <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-neutral-200 shrink-0">
                            <img src={a.previewUrl} alt={a.file.name} className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => removePendingAttachment(i)}
                              className="absolute top-0.5 right-0.5 w-4 h-4 bg-[#F40F02] text-white rounded-full flex items-center justify-center text-[10px] hover:bg-[#C20D02]"
                            >
                              ×
                            </button>
                          </div>
                        ) : null,
                      )}
                    </div>
                  )}
                  {/* File list */}
                  {pendingAttachments.map((a, i) => (
                    <div key={i} className="flex items-center justify-between gap-2 py-1.5 px-2 rounded-lg bg-neutral-50 border border-neutral-100">
                      <div className="flex items-center gap-2 min-w-0">
                        <FaPaperclip className="w-3 h-3 text-neutral-400 shrink-0" />
                        <span className="text-sm text-neutral-700 truncate">{a.file.name}</span>
                        <span className="text-xs text-neutral-400 shrink-0">({(a.file.size / 1024).toFixed(1)} KB)</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removePendingAttachment(i)}
                        className="text-[#F40F02]/70 hover:text-[#F40F02] p-1 shrink-0 transition-colors"
                        aria-label="Remove file"
                      >
                        <FaTrash className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={submitting || bookings.length === 0}
                className="flex-1 py-3 bg-gradient-to-br from-[#3678F1] to-[#2563EB] text-white rounded-xl font-semibold text-sm hover:from-[#2563EB] hover:to-[#1D4ED8] shadow-brand disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? 'Creating…' : 'Create Invoice (Draft)'}
              </button>
              <Link to="/invoices" className="px-4 py-3 border border-neutral-200 rounded-xl text-sm text-neutral-600 hover:bg-neutral-50 transition-colors">
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
      <AppFooter />
    </div>
  );
}
