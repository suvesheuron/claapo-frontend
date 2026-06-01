import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FaXmark } from 'react-icons/fa6';

export interface LightboxMedia {
  url: string;
  type: 'image' | 'video';
  title?: string;
}

/**
 * App-wide full-screen lightbox for previewing an image or video in-place.
 *
 * Use this anywhere the app would otherwise navigate the browser to a raw
 * (signed S3) media URL — chat images, invoice attachments, showcase media,
 * etc. Keeping media in an in-app overlay avoids leaking the storage host into
 * the address bar and gives videos a real player.
 *
 * Controlled: pass `media` to open, `null` to close. Closes on backdrop click
 * or Escape and locks body scroll while open. Rendered into document.body via
 * portal so it escapes any transformed/overflow-hidden ancestor.
 */
export default function MediaLightbox({
  media,
  onClose,
}: {
  media: LightboxMedia | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!media) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [media, onClose]);

  if (!media) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={media.title ?? 'Media preview'}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close preview"
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors"
      >
        <FaXmark className="text-lg" />
      </button>
      <div className="max-w-5xl w-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
        {media.type === 'video' ? (
          <video
            src={media.url}
            controls
            autoPlay
            playsInline
            className="max-h-[86vh] max-w-full rounded-lg bg-black shadow-2xl"
          />
        ) : (
          <img
            src={media.url}
            alt={media.title ?? ''}
            className="max-h-[86vh] max-w-full object-contain rounded-lg shadow-2xl"
          />
        )}
      </div>
    </div>,
    document.body,
  );
}
