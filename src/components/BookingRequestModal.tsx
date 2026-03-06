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
  data: Project[];
}

type BookingRequestModalProps = {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  userRole: string;
  userRate: string;
  /** UUID of the user being booked — required for the API call */
  targetUserId: string;
  onSuccess?: () => void;
};

export default function BookingRequestModal({
  isOpen,
  onClose,
  userName,
  userRole,
  userRate,
  targetUserId,
  onSuccess,
}: BookingRequestModalProps) {
  const [projectId, setProjectId] = useState('');
  const [rateOffered, setRateOffered] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  // Load company's active / open projects for the dropdown
  const { data: projectsData } = useApiQuery<ProjectsResponse>(
    isOpen ? '/projects?limit=50' : null
  );

  const activeProjects = (projectsData?.data ?? []).filter(
    (p) => p.status === 'active' || p.status === 'open' || p.status === 'draft'
  );

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setProjectId('');
      setRateOffered('');
      setMessage('');
      setError(null);
      setSent(false);
    }
  }, [isOpen]);

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
        rateOffered: rateOffered ? Math.round(parseFloat(rateOffered.replace(/[^0-9.]/g, '')) * 100) : undefined,
        message: message.trim() || undefined,
      });
      setSent(true);
      onSuccess?.();
    } catch (err) {
      const msg =
        err instanceof ApiException ? err.payload.message : 'Failed to send request. Please try again.';
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
              <p className="text-xs text-neutral-500">{userRole}</p>
              <p className="text-sm font-semibold text-neutral-900 mt-1">{userRate}</p>
            </div>

            {/* Project selector */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                Project <span className="text-[#F40F02]">*</span>
              </label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                required
                disabled={loading}
                className="rounded-xl w-full px-3 py-2.5 border border-neutral-300 bg-[#F3F4F6] text-neutral-900 text-sm focus:outline-none focus:border-[#3678F1] focus:bg-white transition-all disabled:opacity-50"
              >
                <option value="">— Select a project —</option>
                {activeProjects.map((p) => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
              {activeProjects.length === 0 && projectsData && (
                <p className="text-xs text-neutral-400 mt-1">
                  No active projects found.{' '}
                  <a href="/dashboard/projects/new" className="text-[#3678F1] hover:underline">Create one first.</a>
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
