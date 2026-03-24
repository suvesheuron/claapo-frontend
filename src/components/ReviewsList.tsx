import { FaStar, FaTriangleExclamation } from 'react-icons/fa6';
import { useApiQuery } from '../hooks/useApiQuery';
import StarRating from './StarRating';

interface Reviewer {
  id: string;
  displayName: string;
}

interface Review {
  id: string;
  rating: number;
  text: string;
  createdAt: string;
  reviewer: Reviewer;
}

interface ReviewsResponse {
  items: Review[];
}

interface ReviewsListProps {
  userId: string;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function ReviewsList({ userId }: ReviewsListProps) {
  const { data, loading, error } = useApiQuery<ReviewsResponse>(`/reviews/user/${userId}`);
  const reviews = data?.items ?? [];

  const avgRating =
    reviews.length > 0
      ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10) / 10
      : 0;

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl bg-white border border-neutral-200 p-5 animate-pulse">
            <div className="h-4 bg-neutral-200 rounded w-1/3 mb-3" />
            <div className="h-3 bg-neutral-100 rounded w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-3 rounded-2xl bg-red-50 border border-red-200 p-4">
        <FaTriangleExclamation className="text-red-500 shrink-0" />
        <p className="text-sm text-red-700">{error}</p>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="rounded-2xl bg-white border border-neutral-200 p-12 text-center">
        <div className="w-14 h-14 rounded-2xl bg-[#EEF2FF] flex items-center justify-center mx-auto mb-4">
          <FaStar className="text-[#3B5BDB] text-2xl" />
        </div>
        <h3 className="text-base font-bold text-neutral-900 mb-2">No reviews yet</h3>
        <p className="text-sm text-neutral-500">Reviews will appear here once they are submitted.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Average rating header */}
      <div className="rounded-2xl bg-white border border-neutral-200 p-5 flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-[#EEF2FF] flex items-center justify-center">
          <span className="text-lg font-bold text-[#3B5BDB]">{avgRating}</span>
        </div>
        <div>
          <StarRating rating={Math.round(avgRating * 2) / 2} size="md" />
          <p className="text-xs text-neutral-500 mt-1">
            Based on {reviews.length} review{reviews.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Individual reviews */}
      {reviews.map((review) => (
        <div key={review.id} className="rounded-2xl bg-white border border-neutral-200 p-5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <StarRating rating={review.rating} size="sm" />
              <span className="text-xs font-semibold text-neutral-700">{review.reviewer.displayName}</span>
            </div>
            <span className="text-[11px] text-neutral-400">{formatDate(review.createdAt)}</span>
          </div>
          {review.text && (
            <p className="text-sm text-neutral-600 leading-relaxed">{review.text}</p>
          )}
        </div>
      ))}
    </div>
  );
}
