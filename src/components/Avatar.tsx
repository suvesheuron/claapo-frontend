import React from 'react';
import { FaUser } from 'react-icons/fa6';

type AvatarProps = {
  src?: string;
  alt?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

export default function Avatar({ src, alt = 'Profile', name, size = 'md', className = '' }: AvatarProps) {
  const [imageError, setImageError] = React.useState(false);

  const sizeClasses = {
    sm: 'w-8 h-8 sm:w-9 sm:h-9',
    md: 'w-10 h-10 sm:w-12 sm:h-12',
    lg: 'w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16',
  };

  const iconSizes = {
    sm: 'text-base sm:text-lg',
    md: 'text-lg sm:text-xl',
    lg: 'text-xl sm:text-2xl',
  };

  // Generate a seed from name or use a default
  const seed = name ? name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) : 42;
  
  // Default avatar URL using DiceBear notionists style (black and white)
  const defaultAvatar = `https://api.dicebear.com/7.x/notionists/svg?seed=${seed}`;

  // Use provided src, or default avatar, or fallback to icon
  const imageSrc = src && src.trim() !== '' ? src : defaultAvatar;

  // Show image if no error occurred
  if (!imageError) {
    return (
      <img
        src={imageSrc}
        alt={alt}
        className={`${sizeClasses[size]} rounded-full object-cover shrink-0 ${className}`}
        onError={() => setImageError(true)}
      />
    );
  }

  // Fallback to user icon only if image fails to load
  return (
    <div className={`${sizeClasses[size]} rounded-full bg-neutral-200 flex items-center justify-center shrink-0 ${className}`}>
      <FaUser className={`${iconSizes[size]} text-neutral-600`} />
    </div>
  );
}

