import { useMemo, useState } from 'react';
import { FaPenToSquare, FaCircleInfo } from 'react-icons/fa6';
import { useApiQuery } from '../hooks/useApiQuery';
import ReviewForm from './ReviewForm';

interface OutgoingBooking {
  id: string;
  status: string;
  targetUserId: string;
  createdAt: string;
  project?: { id: string; title: string } | null;
}

interface OutgoingBookingsResponse {
  items: OutgoingBooking[];
}

interface LeaveReviewSectionProps {
  targetUserId: string;
  targetName: string;
  onSubmitted: () => void;
}

const REVIEWABLE_STATUSES = new Set(['accepted', 'locked']);

export default function LeaveReviewSection({
  targetUserId,
  targetName,
  onSubmitted,
}: LeaveReviewSectionProps) {
  const { data, loading, error } = useApiQuery<OutgoingBookingsResponse>('/bookings/outgoing');
  const [open, setOpen] = useState(false);

  const eligibleBookings = useMemo(() => {
    return (data?.items ?? [])
      .filter((b) => b.targetUserId === targetUserId && REVIEWABLE_STATUSES.has(b.status))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [data, targetUserId]);

  const [selectedBookingId, setSelectedBookingId] = useState<string>('');
  const activeBookingId = selectedBookingId || eligibleBookings[0]?.id || '';

  if (loading) {
    return (
      <div className="rounded-2xl bg-white border border-neutral-200 p-5 animate-pulse">
        <div className="h-4 w-1/3 bg-neutral-200 rounded mb-3" />
        <div className="h-3 w-2/3 bg-neutral-100 rounded" />
      </div>
    );
  }

  if (error) {
    return null;
  }

  if (eligibleBookings.length === 0) {
    return (
      <div className="rounded-2xl bg-[#F9FAFB] border border-dashed border-neutral-200 p-5 flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-white border border-neutral-200 flex items-center justify-center shrink-0">
          <FaCircleInfo className="text-neutral-400 w-4 h-4" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-neutral-800">Reviews are tied to bookings</p>
          <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
            You can leave a review for {targetName} once you have an accepted or locked booking with them.
          </p>
        </div>
      </div>
    );
  }

  if (!open) {
    const projectTitle = eligibleBookings[0]?.project?.title;
    return (
      <div className="rounded-2xl bg-white border border-neutral-200 p-5 flex items-center justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-neutral-900">Leave a review for {targetName}</p>
          <p className="text-xs text-neutral-500 mt-1">
            {eligibleBookings.length === 1 ? (
              projectTitle ? (
                <>For project <span className="font-semibold text-neutral-700">{projectTitle}</span>.</>
              ) : (
                <>You have one eligible booking with this user.</>
              )
            ) : (
              <>You have {eligibleBookings.length} eligible bookings — pick one in the next step.</>
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#3B5BDB] text-white text-xs font-semibold hover:bg-[#2f4ac2] shadow-sm transition-colors shrink-0"
        >
          <FaPenToSquare className="w-3.5 h-3.5" />
          Write a review
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {eligibleBookings.length > 1 && (
        <div className="rounded-2xl bg-white border border-neutral-200 p-4">
          <label className="block text-xs font-semibold text-neutral-600 mb-2">Which booking are you reviewing?</label>
          <select
            value={activeBookingId}
            onChange={(e) => setSelectedBookingId(e.target.value)}
            className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-[#3B5BDB]/40 focus:ring-2 focus:ring-[#3B5BDB]/10"
          >
            {eligibleBookings.map((b) => (
              <option key={b.id} value={b.id}>
                {b.project?.title ?? 'Booking'} — {new Date(b.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </option>
            ))}
          </select>
        </div>
      )}
      <ReviewForm
        bookingId={activeBookingId}
        onSubmitted={() => {
          setOpen(false);
          onSubmitted();
        }}
      />
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="text-xs text-neutral-500 hover:text-neutral-700 underline"
      >
        Cancel
      </button>
    </div>
  );
}
