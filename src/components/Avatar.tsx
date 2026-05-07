import React from 'react';

type AvatarProps = {
  src?: string;
  alt?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
};

export default function Avatar({ src, alt = 'Profile', name, size = 'md', className = '' }: AvatarProps) {
  const [imageError, setImageError] = React.useState(false);

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
  const hasValidSrc = src && src.trim() !== '';
  const showImage = hasValidSrc && !imageError;

  // The wrapper is always a perfect square (aspect-square + fixed w/h) with
  // overflow hidden, so the avatar stays circular regardless of the source
  // image's aspect ratio or how a parent flex/grid layout tries to stretch it.
  // The <img> inside fills the wrapper and is cropped via object-cover.
  // `flex items-center justify-center` keeps the image visually centered even
  // when fragmentary loading or print stylesheets briefly drop object-fit.
  const wrapperBase = `${sizeClasses[size]} aspect-square rounded-full overflow-hidden shrink-0 select-none flex items-center justify-center ${className}`;

  if (showImage) {
    return (
      <div className={wrapperBase}>
        <img
          src={src!.trim()}
          alt={alt}
          className="w-full h-full object-cover object-center block"
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

