import { useState } from 'react';
import { FaPaperPlane } from 'react-icons/fa6';
import toast from 'react-hot-toast';
import { api, ApiException } from '../services/api';
import StarRating from './StarRating';

interface ReviewFormProps {
  bookingId: string;
  onSubmitted?: () => void;
}

export default function ReviewForm({ bookingId, onSubmitted }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      toast.error('Please select a rating.');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/reviews', { bookingId, rating, text: text.trim() || undefined });
      toast.success('Review submitted successfully!');
      setRating(0);
      setText('');
      onSubmitted?.();
    } catch (err) {
      const msg = err instanceof ApiException ? err.payload.message : 'Failed to submit review.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl bg-white border border-neutral-200 p-5 space-y-4">
      <h3 className="text-sm font-bold text-neutral-900">Leave a Review</h3>

      <div>
        <label className="block text-xs font-medium text-neutral-600 mb-1.5">Rating</label>
        <StarRating rating={rating} onChange={setRating} size="lg" />
      </div>

      <div>
        <label htmlFor="review-text" className="block text-xs font-medium text-neutral-600 mb-1.5">
          Your review (optional)
        </label>
        <textarea
          id="review-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          placeholder="Share your experience…"
          className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm placeholder-neutral-400 focus:outline-none focus:border-[#3B5BDB]/40 focus:ring-2 focus:ring-[#3B5BDB]/10 transition-all resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={submitting || rating === 0}
        className="flex items-center gap-2 px-5 py-2.5 bg-[#3B5BDB] text-white rounded-xl text-sm font-semibold hover:bg-[#2f4ac2] shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <FaPaperPlane className="w-3.5 h-3.5" />
        {submitting ? 'Submitting…' : 'Submit Review'}
      </button>
    </form>
  );
}
