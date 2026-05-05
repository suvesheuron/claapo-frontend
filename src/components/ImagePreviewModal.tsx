import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaXmark, FaCamera, FaImage } from 'react-icons/fa6';

export type ImagePreviewModalProps = {
  open: boolean;
  imageUrl: string | null;
  /** Header label, e.g. "Profile Photo" or "Cover Photo". */
  title?: string;
  /** Visual treatment — circular for avatars, rect for cover/banner. */
  shape?: 'circle' | 'rect';
  /** Rendered when imageUrl is null/empty (e.g. "No cover yet"). */
  emptyState?: ReactNode;
  onClose: () => void;
  /** When provided, shows a "Change photo" button that calls this. */
  onUploadNew?: () => void;
  uploadLabel?: string;
  uploading?: boolean;
};

/**
 * Lightbox-style preview for avatars and cover photos.
 *
 * Behavior:
 *   - Click backdrop or press ESC → close.
 *   - Body scroll is locked while open.
 *   - "Change photo" button (when wired) triggers the parent's file picker.
 *   - Renders into document.body via portal to avoid stacking-context conflicts
 *     with the surrounding profile-card transforms.
 */
export default function ImagePreviewModal({
  open,
  imageUrl,
  title = 'Photo',
  shape = 'rect',
  emptyState,
  onClose,
  onUploadNew,
  uploadLabel = 'Change photo',
  uploading = false,
}: ImagePreviewModalProps) {
  // ESC closes
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Lock background scroll while open
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  const isCircle = shape === 'circle';

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="img-preview-backdrop"
          className="fixed inset-0 z-[100] flex items-center justify-center px-4 sm:px-6 py-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          onClick={onClose}
          aria-modal="true"
          role="dialog"
          aria-label={title}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-neutral-950/85 backdrop-blur-sm" />

          {/* Content (stops propagation so backdrop click only fires on actual backdrop) */}
          <motion.div
            key="img-preview-content"
            className="relative w-full max-w-3xl flex flex-col items-center gap-5"
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header bar */}
            <div className="w-full flex items-center justify-between text-white">
              <h3 className="text-sm sm:text-base font-semibold tracking-tight opacity-95">
                {title}
              </h3>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close preview"
                className="w-9 h-9 inline-flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 active:bg-white/25 transition-colors text-white"
              >
                <FaXmark className="w-4 h-4" />
              </button>
            </div>

            {/* Image container */}
            <div
              className={`relative flex items-center justify-center ${
                isCircle ? '' : 'w-full'
              }`}
            >
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={title}
                  draggable={false}
                  className={
                    isCircle
                      ? 'w-[min(70vw,360px)] h-[min(70vw,360px)] sm:w-[min(60vw,420px)] sm:h-[min(60vw,420px)] rounded-full object-cover ring-4 ring-white/15 shadow-2xl select-none'
                      : 'w-full max-h-[70vh] object-contain rounded-2xl ring-1 ring-white/10 shadow-2xl select-none bg-neutral-900'
                  }
                />
              ) : (
                <div
                  className={
                    isCircle
                      ? 'w-[min(70vw,360px)] h-[min(70vw,360px)] sm:w-[min(60vw,420px)] sm:h-[min(60vw,420px)] rounded-full bg-gradient-to-br from-neutral-700/70 to-neutral-900/70 ring-4 ring-white/10 flex items-center justify-center text-white/70'
                      : 'w-full h-[40vh] rounded-2xl bg-gradient-to-br from-neutral-800/70 to-neutral-950/70 ring-1 ring-white/10 flex items-center justify-center text-white/70'
                  }
                >
                  <div className="flex flex-col items-center gap-2 text-center px-6">
                    <FaImage className="w-10 h-10 opacity-60" />
                    <p className="text-sm opacity-80">{emptyState ?? 'No photo uploaded yet.'}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Action row */}
            {onUploadNew && (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onUploadNew}
                  disabled={uploading}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-neutral-900 text-sm font-semibold shadow-lg hover:shadow-xl hover:bg-neutral-100 active:bg-neutral-200 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                >
                  {uploading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin" />
                      Uploading…
                    </>
                  ) : (
                    <>
                      <FaCamera className="w-3.5 h-3.5" />
                      {uploadLabel}
                    </>
                  )}
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
