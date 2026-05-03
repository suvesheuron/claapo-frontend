import { useEffect, useMemo, useState, useRef, type DragEvent } from 'react';
import { FaXmark, FaCloudArrowUp, FaPaperPlane } from 'react-icons/fa6';
import toast from 'react-hot-toast';
import { api, ApiException } from '../services/api';
import { useApiQuery } from '../hooks/useApiQuery';
import { rupeesToPaise } from '../utils/currency';
import DateInput from './DateInput';
type TaxTypeUi = 'gst' | 'igst';

const MAX_BYTES = 10 * 1024 * 1024;
const ACCEPT = 'application/pdf,image/jpeg,image/png,.pdf,.jpg,.jpeg,.png';

function toIssuedOnDay(iso: string): string | undefined {
  if (!iso?.trim()) return undefined;
  const d = iso.trim().slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : undefined;
}

interface BookingOption {
  id: string;
  status: string;
  project: { id: string; title: string; startDate: string; endDate: string };
  projectRole?: { roleName: string } | null;
}

export type OfflineInvoiceModalProps = {
  open: boolean;
  onClose: () => void;
  mode: 'company-upload' | 'vendor-send';
  onSuccess: () => void;
  /** Required when mode is company-upload */
  project?: { id: string; title: string; startDate: string; endDate: string };
};

export default function OfflineInvoiceModal({
  open,
  onClose,
  mode,
  onSuccess,
  project,
}: OfflineInvoiceModalProps) {
  const { data: bookingsData, loading: bookingsLoading } = useApiQuery<{ items: BookingOption[] }>(
    open && mode === 'vendor-send' ? '/bookings/incoming' : null,
  );
  const { data: myProfile } = useApiQuery<unknown>(
    open && mode === 'vendor-send' ? '/profile/me' : null,
  );

  const bookings = useMemo(
    () => (bookingsData?.items ?? []).filter((b) => b.status === 'accepted' || b.status === 'locked'),
    [bookingsData?.items],
  );

  const hasValidGst = useMemo(() => {
    const p = myProfile as { profile?: { gstNumber?: string | null } } | null;
    const gst = p?.profile?.gstNumber ?? null;
    if (!gst || typeof gst !== 'string') return false;
    return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(gst.trim().toUpperCase());
  }, [myProfile]);

  const [billingName, setBillingName] = useState('');
  const [department, setDepartment] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [selectedTaxType, setSelectedTaxType] = useState<TaxTypeUi>('gst');
  const [selectedTaxRate, setSelectedTaxRate] = useState<'5' | '18' | '0' | ''>('');
  const [selectedBookingId, setSelectedBookingId] = useState('');
  /** YYYY-MM-DD — editable project date → `issuedOn` (defaults from project / booking startDate). */
  const [invoiceDate, setInvoiceDate] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [fileDragActive, setFileDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedBooking = bookings.find((b) => b.id === selectedBookingId) ?? null;

  useEffect(() => {
    if (!open) {
      setBillingName('');
      setDepartment('');
      setAmountStr('');
      setSelectedTaxType('gst');
      setSelectedTaxRate('');
      setSelectedBookingId('');
      setInvoiceDate('');
      setFile(null);
      setSubmitting(false);
      setFileDragActive(false);
      return;
    }
    setSelectedTaxRate('18');
  }, [open, mode]);

  useEffect(() => {
    if (!open) return;
    const src =
      mode === 'company-upload' ? project?.startDate : selectedBooking?.project?.startDate;
    if (!src) {
      setInvoiceDate('');
      return;
    }
    const d = toIssuedOnDay(src);
    if (d) setInvoiceDate(d);
  }, [
    open,
    mode,
    project?.id,
    project?.startDate,
    selectedBookingId,
    selectedBooking?.project.startDate,
  ]);

  useEffect(() => {
    if (mode !== 'vendor-send') return;
    if (!hasValidGst && (selectedTaxRate === '5' || selectedTaxRate === '18')) {
      setSelectedTaxRate('0');
    }
  }, [hasValidGst, selectedTaxRate, mode]);

  const subtotalPaise = rupeesToPaise(amountStr);
  const taxRatePct = selectedTaxRate === '' ? null : Number(selectedTaxRate);
  const taxAmountPaise =
    taxRatePct !== null && taxRatePct > 0 ? Math.round(subtotalPaise * (taxRatePct / 100)) : 0;

  const projectTitle =
    mode === 'company-upload' ? project?.title ?? '' : selectedBooking?.project.title ?? '';
  const pickFile = (f: File | null) => {
    if (!f) return;
    if (f.size > MAX_BYTES) {
      toast.error('File must be 10MB or smaller.');
      return;
    }
    setFile(f);
  };

  const onFileDrag = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const onFileDrop = (e: DragEvent) => {
    onFileDrag(e);
    setFileDragActive(false);
    pickFile(e.dataTransfer.files?.[0] ?? null);
  };

  const submit = async () => {
    if (mode === 'company-upload') {
      if (!project) return;
      if (!billingName.trim()) {
        toast.error('Billing name is required.');
        return;
      }
      if (!department.trim()) {
        toast.error('Department is required.');
        return;
      }
    } else {
      if (!selectedBookingId || !selectedBooking) {
        toast.error('Please select a project.');
        return;
      }
    }
    if (!amountStr.trim() || subtotalPaise < 1) {
      toast.error('Enter a valid amount.');
      return;
    }
    if (!selectedTaxRate) {
      toast.error('Please select tax percentage.');
      return;
    }
    if ((selectedTaxRate === '5' || selectedTaxRate === '18') && mode === 'vendor-send' && !hasValidGst) {
      toast.error('A valid GST number is required to apply GST/IGST.');
      return;
    }
    if (!file) {
      toast.error('Please attach the offline invoice file.');
      return;
    }
    const issuedOnDay = invoiceDate.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(issuedOnDay)) {
      toast.error('Please select a valid project date.');
      return;
    }

    const taxRateNum = Number(selectedTaxRate);
    const normalizedTaxType = taxRateNum === 0 ? 'none' : selectedTaxType;

    const basePayload = {
      amountPaise: subtotalPaise,
      taxType: normalizedTaxType as 'none' | 'gst' | 'igst',
      taxRatePct: taxRateNum as 0 | 5 | 18,
      issuedOn: issuedOnDay,
    };

    setSubmitting(true);
    try {
      const endpoint =
        mode === 'company-upload' ? '/invoices/offline/company-record' : '/invoices/offline/vendor-send';
      const body =
        mode === 'company-upload'
          ? {
              ...basePayload,
              projectId: project!.id,
              billingName: billingName.trim(),
              department: department.trim(),
            }
          : {
              ...basePayload,
              projectId: selectedBooking!.project.id,
            };

      const created = await api.post<{ id: string }>(endpoint, body);
      const invoiceId = created.id;

      const { uploadUrl, key } = await api.get<{ uploadUrl: string; key: string }>(
        `/invoices/${invoiceId}/attachments/upload-url?contentType=${encodeURIComponent(file.type || 'application/octet-stream')}`,
      );
      const putResp = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
      });
      if (!putResp.ok) {
        throw new Error(`Attachment upload failed (${putResp.status})`);
      }
      await api.post(`/invoices/${invoiceId}/attachments`, {
        fileKey: key,
        fileName: file.name,
        mimeType: file.type || 'application/octet-stream',
        size: file.size,
      });

      toast.success(mode === 'company-upload' ? 'Offline invoice recorded.' : 'Offline invoice sent.');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err instanceof ApiException ? err.payload.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  const title = mode === 'company-upload' ? 'Upload Offline Invoice' : 'Send Offline Invoice';
  const modalMaxW = 'max-w-xl';

  const requiredStar = <span className="text-[#F40F02]">*</span>;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/45 backdrop-blur-[1px]">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="offline-invoice-title"
        className={`w-full ${modalMaxW} max-h-[92vh] overflow-y-auto rounded-2xl bg-white shadow-xl border border-neutral-200`}
      >
        <div className="sticky top-0 z-[1] flex items-center justify-between gap-3 px-5 py-4 border-b border-neutral-100 bg-white rounded-t-2xl">
          <h2 id="offline-invoice-title" className="text-lg font-bold text-neutral-900">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800 transition-colors"
            aria-label="Close"
          >
            <FaXmark className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {mode === 'vendor-send' ? (
            <>
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                  Project Name {requiredStar}
                </label>
                {bookingsLoading ? (
                  <div className="skeleton h-10 rounded-xl" />
                ) : (
                  <select
                    value={selectedBookingId}
                    onChange={(e) => setSelectedBookingId(e.target.value)}
                    className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-[#3678F1]/25"
                    required
                  >
                    <option value="">Select project</option>
                    {bookings.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.project.title}
                        {b.projectRole ? ` · ${b.projectRole.roleName}` : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label htmlFor="offline-invoice-date" className="block text-xs font-semibold text-neutral-700 mb-1.5">
                  Project Date
                </label>
                <DateInput
                  id="offline-invoice-date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  disabled={!selectedBooking}
                  placeholder="dd MMM yyyy"
                  className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm text-neutral-900 focus:outline-none focus:border-[#3678F1] focus:ring-2 focus:ring-[#3678F1]/20 disabled:bg-neutral-100 disabled:text-neutral-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                  Amount (₹) {requiredStar}
                </label>
                <input
                  value={amountStr}
                  onChange={(e) => setAmountStr(e.target.value)}
                  placeholder="Enter amount"
                  inputMode="decimal"
                  className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3678F1]/25"
                />
              </div>

              <div>
                <span className="block text-xs font-semibold text-neutral-700 mb-1.5">
                  Tax Type {requiredStar}
                </span>
                <div className="flex gap-6 pt-0.5">
                  <label className="inline-flex items-center gap-2 cursor-pointer text-sm font-medium text-neutral-800">
                    <input
                      type="radio"
                      name="offline-tax-type"
                      checked={selectedTaxType === 'gst'}
                      onChange={() => setSelectedTaxType('gst')}
                      className="text-[#3678F1] focus:ring-[#3678F1]"
                    />
                    GST
                  </label>
                  <label className="inline-flex items-center gap-2 cursor-pointer text-sm font-medium text-neutral-800">
                    <input
                      type="radio"
                      name="offline-tax-type"
                      checked={selectedTaxType === 'igst'}
                      onChange={() => setSelectedTaxType('igst')}
                      className="text-[#3678F1] focus:ring-[#3678F1]"
                    />
                    IGST
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                  Tax Percentage {requiredStar}
                </label>
                <select
                  value={selectedTaxRate}
                  onChange={(e) => setSelectedTaxRate(e.target.value as '5' | '18' | '0' | '')}
                  className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3678F1]/25"
                >
                  <option value="">Select</option>
                  <option value="0">Not applicable (0%)</option>
                  <option value="5" disabled={!hasValidGst}>5%</option>
                  <option value="18" disabled={!hasValidGst}>18%</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                  {selectedTaxType === 'igst' ? 'IGST Amount (₹)' : 'GST Amount (₹)'}
                </label>
                <input
                  readOnly
                  value={(taxAmountPaise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm text-neutral-700"
                />
              </div>

              <div className="rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] px-3 py-2.5 text-xs text-[#1e40af] leading-relaxed">
                GST Amount will be calculated automatically based on the amount and tax percentage.
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                  Attach Offline Invoice {requiredStar}
                </label>
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  onDragEnter={(e) => {
                    onFileDrag(e);
                    setFileDragActive(true);
                  }}
                  onDragLeave={(e) => {
                    onFileDrag(e);
                    setFileDragActive(false);
                  }}
                  onDragOver={onFileDrag}
                  onDrop={onFileDrop}
                  className={`w-full rounded-xl border-2 border-dashed px-4 py-10 flex flex-col items-center gap-2 transition-colors text-center ${
                    fileDragActive
                      ? 'border-[#3678F1] bg-[#EFF6FF]'
                      : 'border-neutral-200 hover:border-[#3678F1]/40 bg-neutral-50/50'
                  }`}
                >
                  <FaCloudArrowUp className="text-3xl text-[#3678F1]" />
                  <span className="text-sm font-semibold text-neutral-700">Click to upload or drag and drop</span>
                  <span className="text-xs text-neutral-500">PDF, JPG, PNG (Max. 10MB)</span>
                  {file && <span className="text-xs font-medium text-[#3678F1] mt-1">{file.name}</span>}
                </button>
                <input
                  ref={inputRef}
                  type="file"
                  accept={ACCEPT}
                  className="hidden"
                  onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
                />
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Project Name</label>
                  <input
                    readOnly
                    tabIndex={-1}
                    value={projectTitle}
                    className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm text-neutral-800 cursor-default"
                  />
                </div>
                <div>
                  <label htmlFor="offline-invoice-date-co" className="block text-xs font-semibold text-neutral-700 mb-1.5">
                    Project Date
                  </label>
                  <DateInput
                    id="offline-invoice-date-co"
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    disabled={!project}
                    placeholder="dd MMM yyyy"
                    className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm text-neutral-900 focus:outline-none focus:border-[#3678F1] focus:ring-2 focus:ring-[#3678F1]/20 disabled:bg-neutral-100 disabled:text-neutral-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                    Billing Name {requiredStar}
                  </label>
                  <input
                    value={billingName}
                    onChange={(e) => setBillingName(e.target.value)}
                    placeholder="Enter billing name"
                    className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3678F1]/25"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                    Department {requiredStar}
                  </label>
                  <input
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="Enter department"
                    className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3678F1]/25"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                  Amount (₹) {requiredStar}
                </label>
                <input
                  value={amountStr}
                  onChange={(e) => setAmountStr(e.target.value)}
                  placeholder="Enter amount"
                  inputMode="decimal"
                  className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3678F1]/25"
                />
              </div>

              <div>
                <span className="block text-xs font-semibold text-neutral-700 mb-1.5">
                  Tax Type {requiredStar}
                </span>
                <div className="flex gap-6 pt-0.5">
                  <label className="inline-flex items-center gap-2 cursor-pointer text-sm font-medium text-neutral-800">
                    <input
                      type="radio"
                      name="offline-tax-type-co"
                      checked={selectedTaxType === 'gst'}
                      onChange={() => setSelectedTaxType('gst')}
                      className="text-[#3678F1] focus:ring-[#3678F1]"
                    />
                    GST
                  </label>
                  <label className="inline-flex items-center gap-2 cursor-pointer text-sm font-medium text-neutral-800">
                    <input
                      type="radio"
                      name="offline-tax-type-co"
                      checked={selectedTaxType === 'igst'}
                      onChange={() => setSelectedTaxType('igst')}
                      className="text-[#3678F1] focus:ring-[#3678F1]"
                    />
                    IGST
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                    Tax Percentage {requiredStar}
                  </label>
                  <select
                    value={selectedTaxRate}
                    onChange={(e) => setSelectedTaxRate(e.target.value as '5' | '18' | '0' | '')}
                    className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3678F1]/25"
                  >
                    <option value="">Select</option>
                    <option value="0">Not applicable (0%)</option>
                    <option value="5">5%</option>
                    <option value="18">18%</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                    {selectedTaxType === 'igst' ? 'IGST Amount (₹)' : 'GST Amount (₹)'}
                  </label>
                  <input
                    readOnly
                    value={(taxAmountPaise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm text-neutral-700"
                  />
                </div>
              </div>

              <div className="rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] px-3 py-2.5 text-xs text-[#1e40af] leading-relaxed">
                GST Amount will be calculated automatically based on the amount and tax percentage.
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                  Attach Offline Invoice {requiredStar}
                </label>
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  onDragEnter={(e) => {
                    onFileDrag(e);
                    setFileDragActive(true);
                  }}
                  onDragLeave={(e) => {
                    onFileDrag(e);
                    setFileDragActive(false);
                  }}
                  onDragOver={onFileDrag}
                  onDrop={onFileDrop}
                  className={`w-full rounded-xl border-2 border-dashed px-4 py-10 flex flex-col items-center gap-2 transition-colors text-center ${
                    fileDragActive
                      ? 'border-[#3678F1] bg-[#EFF6FF]'
                      : 'border-neutral-200 hover:border-[#3678F1]/40 bg-neutral-50/50'
                  }`}
                >
                  <FaCloudArrowUp className="text-3xl text-[#3678F1]" />
                  <span className="text-sm font-semibold text-neutral-700">Click to upload or drag and drop</span>
                  <span className="text-xs text-neutral-500">PDF, JPG, PNG (Max. 10MB)</span>
                  {file && <span className="text-xs font-medium text-[#3678F1] mt-1">{file.name}</span>}
                </button>
                <input
                  ref={inputRef}
                  type="file"
                  accept={ACCEPT}
                  className="hidden"
                  onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
                />
              </div>
            </>
          )}

          <div className="flex flex-wrap justify-end gap-2 pt-2 border-t border-neutral-100">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl border border-neutral-300 bg-white text-sm font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void submit()}
              disabled={submitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#3678F1] text-white text-sm font-semibold hover:bg-[#2563EB] disabled:opacity-50"
            >
              {mode === 'vendor-send' ? <FaPaperPlane className="w-3.5 h-3.5" /> : null}
              {mode === 'company-upload' ? 'Upload Invoice' : 'Send Invoice'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
