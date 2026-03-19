import { FaStar, FaStarHalfStroke } from 'react-icons/fa6';

interface StarRatingProps {
  rating: number;
  onChange?: (rating: number) => void;
  size?: 'sm' | 'md' | 'lg';
}

const SIZE_MAP = { sm: 'w-4 h-4', md: 'w-5 h-5', lg: 'w-6 h-6' } as const;

export default function StarRating({ rating, onChange, size = 'md' }: StarRatingProps) {
  const sizeClass = SIZE_MAP[size];
  const interactive = !!onChange;

  return (
    <div className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const isFull = rating >= star;
        const isHalf = !isFull && rating >= star - 0.5;

        const Icon = isHalf ? FaStarHalfStroke : FaStar;
        const colorClass = isFull || isHalf ? 'text-[#F59E0B]' : 'text-neutral-300';

        return (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            onClick={() => onChange?.(star)}
            className={`${colorClass} ${sizeClass} ${
              interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'
            } disabled:opacity-100 bg-transparent border-none p-0`}
            aria-label={`${star} star${star > 1 ? 's' : ''}`}
          >
            <Icon className="w-full h-full" />
          </button>
        );
      })}
    </div>
  );
}
