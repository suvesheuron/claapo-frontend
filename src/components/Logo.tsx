import { Link } from 'react-router-dom';
import { useId } from 'react';

export type LogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type LogoVariant = 'default' | 'mono-dark' | 'mono-light';

type LogoProps = {
  size?: LogoSize;
  variant?: LogoVariant;
  iconOnly?: boolean;
  to?: string | null;          // null disables link wrapper
  className?: string;
  ariaLabel?: string;
};

const SIZE_MAP: Record<LogoSize, { mark: number; text: string; gap: string }> = {
  xs: { mark: 22, text: 'text-[15px]', gap: 'gap-1.5' },
  sm: { mark: 26, text: 'text-[17px]', gap: 'gap-2'   },
  md: { mark: 30, text: 'text-[19px]', gap: 'gap-2.5' },
  lg: { mark: 40, text: 'text-2xl',    gap: 'gap-3'   },
  xl: { mark: 56, text: 'text-4xl',    gap: 'gap-3.5' },
};

const COLOR_MAP: Record<LogoVariant, {
  tileTop: string;
  tileBottom: string;
  mark: string;
  text: string;
}> = {
  default:      { tileTop: '#4B6CF7', tileBottom: '#2F4AC2', mark: '#FFFFFF', text: 'text-neutral-900' },
  'mono-dark':  { tileTop: '#1E293B', tileBottom: '#0F172A', mark: '#FFFFFF', text: 'text-neutral-900' },
  'mono-light': { tileTop: '#FFFFFF', tileBottom: '#F1F5F9', mark: '#3B5BDB', text: 'text-white'       },
};

/**
 * Claapo brand mark.
 * - Inline SVG icon (no external font dependency, scales perfectly).
 * - Subtle vertical gradient on the tile for depth.
 * - Tile + double-chevron "clap" referencing a clapperboard.
 * - Wordmark uses the inherited UI font with tight tracking.
 */
export default function Logo({
  size = 'md',
  variant = 'default',
  iconOnly = false,
  to = '/',
  className = '',
  ariaLabel = 'Claapo',
}: LogoProps) {
  const s = SIZE_MAP[size];
  const c = COLOR_MAP[variant];
  // React's useId() returns strings like ":r0:" — colons aren't safe inside
  // SVG `url(#…)` fragment references and silently break the gradient fill on
  // some browsers (the tile then renders with no fill, making the icon look
  // invisible on a white navbar). Strip them to keep ids alphanumeric.
  const reactId = useId().replace(/:/g, '');
  const gradientId = `claapo-tile-grad-${reactId}`;
  const highlightId = `claapo-tile-hi-${reactId}`;

  const inner = (
    <span
      className={`inline-flex items-center ${s.gap} ${className}`}
      aria-label={ariaLabel}
    >
      <svg
        width={s.mark}
        height={s.mark}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="shrink-0"
      >
        <defs>
          {/* Subtle vertical gradient on the tile */}
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"  stopColor={c.tileTop} />
            <stop offset="100%" stopColor={c.tileBottom} />
          </linearGradient>
          {/* Inner top highlight for a touch of dimension */}
          <linearGradient id={highlightId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"  stopColor="#FFFFFF" stopOpacity="0.22" />
            <stop offset="55%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Tile */}
        <rect x="1" y="1" width="38" height="38" rx="11" fill={`url(#${gradientId})`} />
        {/* Top highlight */}
        <rect x="1" y="1" width="38" height="38" rx="11" fill={`url(#${highlightId})`} />
        {/* Hairline inner stroke */}
        <rect
          x="1.5"
          y="1.5"
          width="37"
          height="37"
          rx="10.5"
          fill="none"
          stroke="#FFFFFF"
          strokeOpacity="0.18"
          strokeWidth="1"
        />

        {/* Top chevron — main "clap" */}
        <polyline
          points="11,18 20,11 29,18"
          stroke={c.mark}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Bottom chevron — echo, lighter */}
        <polyline
          points="13,27 20,21 27,27"
          stroke={c.mark}
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          opacity="0.65"
        />
      </svg>

      {!iconOnly && (
        <span
          className={`font-extrabold tracking-tight leading-none ${s.text} ${c.text}`}
          style={{ letterSpacing: '-0.028em' }}
        >
          Claapo
        </span>
      )}
    </span>
  );

  if (to === null) return inner;

  return (
    <Link
      to={to}
      className="inline-flex items-center shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-[#3B5BDB]/40 rounded-lg transition-transform hover:-translate-y-px"
    >
      {inner}
    </Link>
  );
}
