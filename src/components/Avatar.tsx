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

  if (showImage) {
    return (
      <img
        src={src!.trim()}
        alt={alt}
        className={`${sizeClasses[size]} rounded-full object-cover shrink-0 select-none ${className}`}
        onError={() => setImageError(true)}
        draggable={false}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center shrink-0 font-semibold text-white select-none ${className}`}
      style={{ backgroundColor: bgColor }}
    >
      <span className={iconSizes[size]}>{initials}</span>
    </div>
  );
}

