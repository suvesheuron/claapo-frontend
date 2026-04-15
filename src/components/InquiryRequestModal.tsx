/**
 * InquiryRequestModal — sends an inquiry message to a crew member/vendor before booking.
 * Similar to BookingRequestModal but simpler: just project selection + auto-sends inquiry message.
 */

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  FaXmark, FaCircleCheck, FaCalendarDay, FaBriefcase,
} from 'react-icons/fa6';

interface Project {
  id: string;
  title: string;
  status: string;
}

interface InquiryRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  // targetUserId not used currently but kept for future use
  targetUserId?: string;
  targetName: string;
  selectedDate: string;
  projects: Project[];
  projectsLoading: boolean;
  onSendInquiry: (projectId: string) => Promise<void>;
}

const formatDate = (iso: string) =>
  new Date(iso + 'T12:00:00').toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
  });

export default function InquiryRequestModal({
  isOpen,
  onClose,
  targetUserId: _targetUserId, // Prefix with underscore to indicate intentionally unused
  targetName,
  selectedDate,
  projects,
  projectsLoading,
  onSendInquiry,
}: InquiryRequestModalProps) {
  const [projectId, setProjectId] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setProjectId('');
      setSent(false);
    }
  }, [isOpen]);

  // ESC closes modal
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const initials = targetName
    .split(' ')
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) {
      toast.error('Please select a project.');
      return;
    }

    setLoading(true);
    try {
      await onSendInquiry(projectId);
      setSent(true);
    } catch (err) {
      // Error already handled in parent
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-neutral-900/60 backdrop-blur-sm p-4 animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[92vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 shrink-0">
          <div>
            <h2 className="text-base font-bold text-neutral-900 tracking-tight">Send Inquiry</h2>
            <p className="text-xs text-neutral-500 mt-0.5">Check availability with {targetName.split(' ')[0] || 'this person'}</p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-500 hover:bg-neutral-200 hover:text-neutral-700 transition-colors"
            aria-label="Close"
          >
            <FaXmark className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        {sent ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-4">
              <FaCircleCheck className="text-emerald-500 text-3xl" />
            </div>
            <h3 className="text-lg font-bold text-neutral-900 mb-1">Inquiry Sent!</h3>
            <p className="text-sm text-neutral-500 mb-6">
              Your inquiry to <span className="font-semibold text-neutral-800">{targetName}</span> has been sent.
              You'll be notified when they respond.
            </p>
            <button
              onClick={onClose}
              className="rounded-xl w-full py-2.5 bg-brand-primary text-white text-sm font-semibold hover:bg-brand-primary/90 transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-5">
              {/* Target user info */}
              <div className="rounded-2xl bg-gradient-to-br from-brand-primary/5 to-brand-primary/[0.02] border border-brand-primary/15 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-brand-primary text-white flex items-center justify-center font-bold text-sm shrink-0">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-neutral-900 truncate">{targetName}</h3>
                    <p className="text-xs text-neutral-500">Inquiry for specific date</p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-brand-primary/15 flex items-center gap-2">
                  <FaCalendarDay className="w-3.5 h-3.5 text-brand-primary" />
                  <p className="text-sm text-neutral-700">
                    <span className="font-semibold">Date:</span> {formatDate(selectedDate)}
                  </p>
                </div>
              </div>

              {/* Project selector */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wide flex items-center gap-1.5">
                  <FaBriefcase className="w-3 h-3 text-brand-primary" />
                  Project <span className="text-red-500">*</span>
                </label>
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  required
                  disabled={loading || projectsLoading}
                  className="w-full px-3.5 py-2.5 border border-neutral-300 rounded-xl bg-white text-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all disabled:opacity-50"
                >
                  <option value="">
                    {projectsLoading ? 'Loading projects…' : '— Select a project —'}
                  </option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Info */}
              <div className="rounded-xl bg-blue-50 border border-blue-200 p-3">
                <p className="text-xs text-blue-800 leading-relaxed">
                  This will send an inquiry message to {targetName.split(' ')[0] || 'them'} asking about their availability for this date. They can respond via chat.
                </p>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || !projectId}
                className="w-full rounded-xl py-3 bg-brand-primary text-white text-sm font-semibold hover:bg-brand-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? 'Sending…' : 'Send Inquiry'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
