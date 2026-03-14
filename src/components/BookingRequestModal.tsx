/**
 * BookingRequestModal — sends a booking request to a crew member or vendor.
 *
 * Requires:
 *  - targetUserId  — UUID of the person being booked (from search results)
 *  - Company selects a project from their list (loaded from API)
 *  - Optional message and rateOffered
 *
 * Calls POST /v1/bookings/request on submission.
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FaXmark, FaCircleCheck, FaTriangleExclamation } from 'react-icons/fa6';
import { api, ApiException } from '../services/api';
import { useApiQuery } from '../hooks/useApiQuery';

interface Project {
  id: string;
  title: string;
  status: string;
  startDate: string;
  endDate: string;
}

interface ProjectsResponse {
  items: Project[];
  meta?: { total: number; page: number; limit: number };
}

type BookingRequestModalProps = {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  /** Display label e.g. "equipment", "Director" */
  userRole: string;
  userRate: string;
  /** UUID of the user being booked — required for the API call */
  targetUserId: string;
  /** True when booking a vendor (so we fetch and show their equipment + rates) */
  isVendor?: boolean;
  /** When booking a vendor, pre-select this equipment (e.g. from search result) */
  initialVendorEquipmentId?: string;
  onSuccess?: () => void;
};

export default function BookingRequestModal({
  isOpen,
  onClose,
  userName,
  userRole,
  userRate,
  targetUserId,
  isVendor = false,
  initialVendorEquipmentId,
  onSuccess,
}: BookingRequestModalProps) {
  const [projectId, setProjectId] = useState('');
  const [rateOffered, setRateOffered] = useState('');
  const [message, setMessage] = useState('');
  const [selectedEquipmentId, setSelectedEquipmentId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  // Load company's active / open projects for the dropdown (API returns { items, meta })
  const { data: projectsData, loading: projectsLoading, error: projectsError, refetch: refetchProjects } = useApiQuery<ProjectsResponse>(
    isOpen ? '/projects?limit=50' : null
  );

  // Refetch projects when modal opens so the list is always fresh
  useEffect(() => {
    if (isOpen) refetchProjects();
  }, [isOpen, refetchProjects]);

  // When booking a vendor, load their equipment list (names + daily rates)
  const { data: vendorEquipment, loading: equipmentLoading } = useApiQuery<{ id: string; name: string; dailyRateMin?: number | null; dailyRateMax?: number | null; daily_rate_min?: number | null; daily_rate_max?: number | null }[] | { data?: unknown[]; items?: unknown[] }>(
    isOpen && targetUserId && isVendor ? `/equipment/vendor/${targetUserId}` : null
  );
  const rawList = Array.isArray(vendorEquipment) ? vendorEquipment : (vendorEquipment as { data?: unknown[]; items?: unknown[] })?.data ?? (vendorEquipment as { items?: unknown[] })?.items ?? [];
  const equipmentList = (Array.isArray(rawList) ? rawList : []) as Record<string, unknown>[];

  const getPaise = (eq: Record<string, unknown>): number[] => {
    const min = (eq.dailyRateMin ?? eq.daily_rate_min) as number | null | undefined;
    const max = (eq.dailyRateMax ?? eq.daily_rate_max) as number | null | undefined;
    return [min, max].filter((n): n is number => typeof n === 'number' && !Number.isNaN(n));
  };

  const vendorRateDisplay = (() => {
    if (!isVendor) return userRate;
    if (userRate && userRate !== '—') return userRate;
    if (equipmentLoading) return 'Loading…';
    if (equipmentList.length === 0) return 'Rates on request';
    const paiseList = equipmentList.flatMap((eq) => getPaise(eq));
    if (paiseList.length === 0) return 'Rates on request';
    const minPaise = Math.min(...paiseList);
    const maxPaise = Math.max(...paiseList);
    if (minPaise === maxPaise) return `₹${(minPaise / 100).toLocaleString('en-IN')}/day`;
    return `From ₹${(minPaise / 100).toLocaleString('en-IN')}/day`;
  })();

  // Support both { items } and direct array from API
  const rawItems = Array.isArray(projectsData) ? projectsData : (projectsData as ProjectsResponse | undefined)?.items;
  const activeProjects = (rawItems ?? []).filter(
    (p) => p.status === 'active' || p.status === 'open' || p.status === 'draft'
  );

  // Reset state when modal opens; pre-select equipment when provided or only one
  useEffect(() => {
    if (isOpen) {
      setProjectId('');
      setRateOffered('');
      setMessage('');
      setError(null);
      setSent(false);
      setSelectedEquipmentId('');
    }
  }, [isOpen]);
  useEffect(() => {
    if (!isOpen || !isVendor) return;
    const list = (Array.isArray(rawList) ? rawList : []) as { id?: string }[];
    if (initialVendorEquipmentId && list.some((eq) => eq.id === initialVendorEquipmentId)) {
      setSelectedEquipmentId(initialVendorEquipmentId);
    } else if (list.length === 1 && list[0]?.id) {
      setSelectedEquipmentId(list[0].id);
    }
  }, [isOpen, isVendor, initialVendorEquipmentId, rawList]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) { setError('Please select a project.'); return; }
    setError(null);
    setLoading(true);

    try {
      await api.post('/bookings/request', {
        projectId,
        targetUserId,
        vendorEquipmentId: selectedEquipmentId || undefined,
        rateOffered: rateOffered ? Math.round(parseFloat(rateOffered.replace(/[^0-9.]/g, '')) * 100) : undefined,
        message: message.trim() || undefined,
      });
      toast.success('Booking request sent!');
      setSent(true);
      onSuccess?.();
    } catch (err) {
      const msg =
        err instanceof ApiException ? err.payload.message : 'Failed to send request. Please try again.';
      toast.error(msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-neutral-200">
          <h2 className="text-base font-bold text-neutral-900">Send Booking Request</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-500 hover:bg-neutral-200 transition-colors"
            aria-label="Close"
          >
            <FaXmark className="w-4 h-4" />
          </button>
        </div>

        {/* Success state */}
        {sent ? (
          <div className="p-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-green-50 border-2 border-green-200 flex items-center justify-center mx-auto mb-4">
              <FaCircleCheck className="text-green-500 text-2xl" />
            </div>
            <h3 className="text-base font-bold text-neutral-900 mb-1">Request Sent!</h3>
            <p className="text-sm text-neutral-500 mb-5">
              Your booking request to <span className="font-semibold text-neutral-700">{userName}</span> has been sent.
              You'll be notified when they respond.
            </p>
            <button
              onClick={onClose}
              className="rounded-xl w-full py-2.5 bg-[#3678F1] text-white text-sm font-semibold hover:bg-[#2563d4] transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {/* Target user info */}
            <div className="rounded-xl bg-neutral-50 border border-neutral-200 p-4">
              <h3 className="text-sm font-bold text-neutral-900 mb-0.5">{userName}</h3>
              <p className="text-xs text-neutral-500 capitalize">{userRole}</p>
              <p className="text-sm font-semibold text-neutral-900 mt-1">{vendorRateDisplay}</p>
              {isVendor && (
                <div className="mt-3 pt-3 border-t border-neutral-200">
                  <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">Equipment offered & daily rate</p>
                  {equipmentLoading ? (
                    <p className="text-xs text-neutral-500">Loading equipment…</p>
                  ) : equipmentList.length === 0 ? (
                    <p className="text-xs text-neutral-500">No equipment listed yet.</p>
                  ) : (
                    <ul className="space-y-1.5">
                      {equipmentList.slice(0, 8).map((eq, idx) => {
                        const paise = getPaise(eq);
                        const ratePaise = paise.length ? Math.min(...paise) : null;
                        const rateStr = ratePaise != null ? `₹${(ratePaise / 100).toLocaleString('en-IN')}/day` : 'Rate on request';
                        return (
                          <li key={(eq.id as string) || idx} className="text-xs text-neutral-800 flex justify-between items-center gap-3">
                            <span className="truncate font-medium">{String(eq.name ?? '')}</span>
                            <span className="shrink-0 font-semibold text-[#3678F1]">{rateStr}</span>
                          </li>
                        );
                      })}
                      {equipmentList.length > 8 && <li className="text-[10px] text-neutral-400">+{equipmentList.length - 8} more</li>}
                    </ul>
                  )}
                </div>
              )}
            </div>

            {/* Equipment selector (vendor only) */}
            {isVendor && equipmentList.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                  Equipment for this request
                  <span className="ml-1 text-[9px] font-normal text-neutral-400 bg-neutral-100 px-1.5 py-0.5 rounded-full">Optional</span>
                </label>
                <select
                  value={selectedEquipmentId}
                  onChange={(e) => setSelectedEquipmentId(e.target.value)}
                  disabled={loading || equipmentLoading}
                  className="rounded-xl w-full px-3 py-2.5 border border-neutral-300 bg-[#F3F4F6] text-neutral-900 text-sm focus:outline-none focus:border-[#3678F1] focus:bg-white transition-all disabled:opacity-50"
                >
                  <option value="">— Any equipment —</option>
                  {equipmentList.map((eq, idx) => (
                    <option key={(eq.id as string) || idx} value={(eq.id as string) ?? ''}>{String(eq.name ?? '')}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Project selector */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                Project <span className="text-[#F40F02]">*</span>
              </label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                required
                disabled={loading || projectsLoading}
                className="rounded-xl w-full px-3 py-2.5 border border-neutral-300 bg-[#F3F4F6] text-neutral-900 text-sm focus:outline-none focus:border-[#3678F1] focus:bg-white transition-all disabled:opacity-50"
              >
                <option value="">
                  {projectsLoading ? 'Loading projects…' : '— Select a project —'}
                </option>
                {activeProjects.map((p) => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
              {projectsError && (
                <p className="text-xs text-red-600 mt-1">{projectsError}</p>
              )}
              {!projectsLoading && !projectsError && activeProjects.length === 0 && (projectsData !== undefined || rawItems !== undefined) && (
                <p className="text-xs text-neutral-400 mt-1">
                  No active projects found.{' '}
                  <Link to="/dashboard/projects/new" className="text-[#3678F1] hover:underline">Create one first.</Link>
                </p>
              )}
            </div>

            {/* Optional rate */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                Offered Rate (₹/day)
                <span className="ml-1 text-[9px] font-normal text-neutral-400 bg-neutral-100 px-1.5 py-0.5 rounded-full">Optional</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm">₹</span>
                <input
                  type="number"
                  value={rateOffered}
                  onChange={(e) => setRateOffered(e.target.value)}
                  placeholder="e.g., 25000"
                  disabled={loading}
                  className="rounded-xl w-full pl-7 pr-4 py-2.5 border border-neutral-300 bg-[#F3F4F6] text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-[#3678F1] focus:bg-white text-sm transition-all disabled:opacity-50"
                />
              </div>
            </div>

            {/* Message */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                Message
                <span className="ml-1 text-[9px] font-normal text-neutral-400 bg-neutral-100 px-1.5 py-0.5 rounded-full">Optional</span>
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                placeholder="Add any specific requirements or notes..."
                disabled={loading}
                className="rounded-xl w-full px-3 py-2.5 border border-neutral-300 bg-[#F3F4F6] text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-[#3678F1] focus:bg-white text-sm transition-all resize-none disabled:opacity-50"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-200 px-3.5 py-3">
                <FaTriangleExclamation className="text-red-500 text-sm shrink-0 mt-0.5" />
                <p className="text-xs text-red-700 leading-snug">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 rounded-xl py-2.5 border border-neutral-300 text-neutral-700 text-sm font-medium hover:bg-neutral-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !projectId}
                className="flex-1 rounded-xl py-2.5 bg-[#F4C430] text-neutral-900 text-sm font-bold hover:bg-[#e6b820] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><span className="w-4 h-4 border-2 border-neutral-900/30 border-t-neutral-900 rounded-full animate-spin" />Sending…</>
                ) : 'Send Request'}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
