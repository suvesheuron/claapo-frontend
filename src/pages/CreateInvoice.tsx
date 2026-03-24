import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FaArrowLeft, FaPlus, FaTrash, FaFileInvoice } from 'react-icons/fa6';
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

export default function CreateInvoice() {
  useEffect(() => { document.title = 'Create Invoice – Claapo'; }, []);
  const navigate = useNavigate();

  const { data: bookingsData, loading: bookingsLoading } = useApiQuery<{ items: BookingItem[] }>('/bookings/incoming');
  const bookings = (bookingsData?.items ?? []).filter((b) => b.status === 'accepted' || b.status === 'locked');

  const [selectedBookingId, setSelectedBookingId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [lineItems, setLineItems] = useState<LineItem[]>([{ description: '', quantity: '1', unitPrice: '' }]);
  const [submitting, setSubmitting] = useState(false);

  const selectedBooking = bookings.find((b) => b.id === selectedBookingId) ?? null;

  // Pre-fill a line item when booking is selected
  useEffect(() => {
    if (selectedBooking?.rateOffered) {
      setLineItems([{
        description: selectedBooking.projectRole?.roleName ?? 'Services rendered',
        quantity: '1',
        unitPrice: String(selectedBooking.rateOffered / 100),
      }]);
    }
  }, [selectedBookingId]);

  const addLine = () => setLineItems((prev) => [...prev, { description: '', quantity: '1', unitPrice: '' }]);
  const removeLine = (i: number) => setLineItems((prev) => prev.filter((_, idx) => idx !== i));
  const updateLine = (i: number, key: keyof LineItem, val: string) => {
    setLineItems((prev) => prev.map((l, idx) => idx === i ? { ...l, [key]: val } : l));
  };

  const subtotalPaise = lineItems.reduce((sum, l) => {
    const qty = parseFloat(l.quantity) || 0;
    const price = rupeesToPaise(l.unitPrice);
    return sum + qty * price;
  }, 0);
  const gstPaise = Math.round(subtotalPaise * 0.18);
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
      toast.success('Invoice created as draft!');
      navigate(`/dashboard/invoice/${created.id}`);
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
          <Link to="/dashboard/invoices" className="inline-flex items-center gap-2 text-neutral-500 hover:text-neutral-900 text-sm mb-5 transition-colors">
            <FaArrowLeft className="w-3.5 h-3.5" /> Back to Invoices
          </Link>

          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-[#EEF4FF] flex items-center justify-center">
              <FaFileInvoice className="text-[#3B5BDB]" />
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
                <div className="h-10 bg-neutral-100 rounded-xl animate-pulse" />
              ) : bookings.length === 0 ? (
                <p className="text-sm text-neutral-500">
                  No accepted or locked bookings found. You can only create invoices for projects where you have an accepted booking.
                </p>
              ) : (
                <select
                  value={selectedBookingId}
                  onChange={(e) => setSelectedBookingId(e.target.value)}
                  className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-[#3B5BDB] focus:border-transparent"
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
                className="border border-neutral-200 rounded-xl px-3 py-2.5 text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-[#3B5BDB] focus:border-transparent"
              />
            </div>

            {/* Line Items */}
            <div className="bg-white rounded-2xl border border-neutral-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-neutral-700">Line Items</h2>
                <button type="button" onClick={addLine} className="flex items-center gap-1.5 text-[#3B5BDB] text-xs font-semibold hover:text-[#2f4ac2] transition-colors">
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
                        className="w-full border border-neutral-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3B5BDB] focus:border-transparent mb-1.5"
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
                            className="w-full border border-neutral-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#3B5BDB]"
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
                            className="w-full border border-neutral-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#3B5BDB]"
                            required
                          />
                        </div>
                        <span className="text-xs font-semibold text-neutral-700 whitespace-nowrap w-24 text-right">
                          {formatPaise(rupeesToPaise(line.unitPrice) * (parseFloat(line.quantity) || 0))}
                        </span>
                      </div>
                    </div>
                    {lineItems.length > 1 && (
                      <button type="button" onClick={() => removeLine(i)} className="text-red-400 hover:text-red-600 p-2 mt-1 transition-colors">
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
                  <span className="text-neutral-500">GST (18%)</span>
                  <span className="font-semibold">{formatPaise(gstPaise)}</span>
                </div>
                <div className="flex justify-between text-base pt-2 border-t border-neutral-200">
                  <span className="font-bold text-neutral-900">Total</span>
                  <span className="font-bold text-[#3B5BDB]">{formatPaise(totalPaise)}</span>
                </div>
              </div>
            </div>

            {/* GST Note */}
            <p className="text-xs text-neutral-400">
              GST @ 18% is auto-calculated and added to your invoice total.
              The invoice will be created as a <strong>Draft</strong> — you can review and send it from the invoice detail page.
            </p>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={submitting || bookings.length === 0}
                className="flex-1 py-3 bg-[#3B5BDB] text-white rounded-xl font-semibold text-sm hover:bg-[#2f4ac2] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? 'Creating…' : 'Create Invoice (Draft)'}
              </button>
              <Link to="/dashboard/invoices" className="px-4 py-3 border border-neutral-200 rounded-xl text-sm text-neutral-600 hover:bg-neutral-50 transition-colors">
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
