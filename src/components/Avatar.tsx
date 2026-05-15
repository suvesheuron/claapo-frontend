import React from 'react';

type AvatarProps = {
  src?: string;
  alt?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  /**
   * Hint for the browser. Default is `lazy` so off-screen avatars in long lists
   * (search results, conversation lists) don't compete with critical resources.
   * Pass `eager` for avatars that are above the fold on first paint — e.g. the
   * hero avatar on a profile page.
   */
  loading?: 'lazy' | 'eager';
};

export default function Avatar({ src, alt = 'Profile', name, size = 'md', className = '', loading = 'lazy' }: AvatarProps) {
  const [imageError, setImageError] = React.useState(false);

  // Reset error state when `src` changes — otherwise an avatar that previously
  // errored would keep the stale flag when this component is reused for a
  // different user (virtualized lists, swapping search pages, etc.).
  React.useEffect(() => {
    setImageError(false);
  }, [src]);

  const sizeClasses = {
    sm: 'w-8 h-8 sm:w-9 sm:h-9',
    md: 'w-10 h-10 sm:w-12 sm:h-12',
    lg: 'w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16',
    // xl: hero size for profile pages — pure circular, much bigger than lg
    xl: 'w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32',
  };

  const iconSizes = {
    sm: 'text-base sm:text-lg',
    md: 'text-lg sm:text-xl',
    lg: 'text-xl sm:text-2xl',
    xl: 'text-3xl sm:text-4xl md:text-5xl',
  };

  // Generate a seed from name for consistent bg color
  const seed = name ? name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) : 42;
  const initials = name
    ? name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((w) => w[0])
        .join('')
        .toUpperCase() || '?'
    : '?';
  const hue = (seed % 360);
  const bgColor = `hsl(${hue}, 55%, 45%)`;
  const trimmedSrc = src?.trim();
  const hasValidSrc = !!trimmedSrc;
  const showImage = hasValidSrc && !imageError;

  // The wrapper is always a perfect square (aspect-square + fixed w/h) with
  // overflow hidden, so the avatar stays circular regardless of the source
  // image's aspect ratio or how a parent flex/grid layout tries to stretch it.
  // The <img> inside fills the wrapper and is cropped via object-cover.
  // `flex items-center justify-center` keeps the image visually centered even
  // when fragmentary loading or print stylesheets briefly drop object-fit.
  const wrapperBase = `${sizeClasses[size]} aspect-square rounded-full overflow-hidden shrink-0 select-none flex items-center justify-center ${className}`;

  if (showImage) {
    // The initials sit underneath the image (same wrapper, behind absolute <img>)
    // so the circle is never blank while the image is in flight. The image
    // itself is always visible — no opacity gating — to avoid the cached-image
    // race where `onLoad` fires before React attaches the listener and the
    // image stays invisible despite being fully decoded.
    return (
      <div
        className={`${wrapperBase} relative font-semibold text-white`}
        style={{ backgroundColor: bgColor }}
      >
        <span className={iconSizes[size]} aria-hidden>{initials}</span>
        <img
          src={trimmedSrc}
          alt={alt}
          loading={loading}
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover object-center block"
          onError={() => setImageError(true)}
          draggable={false}
        />
      </div>
    );
  }

  return (
    <div
      className={`${wrapperBase} font-semibold text-white`}
      style={{ backgroundColor: bgColor }}
    >
      <span className={iconSizes[size]}>{initials}</span>
    </div>
  );
}
