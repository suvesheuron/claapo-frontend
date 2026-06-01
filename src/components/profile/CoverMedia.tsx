export type CoverType = 'image' | 'video' | null | undefined;

interface CoverMediaProps {
  url?: string | null;
  type?: CoverType;
  /** Extra classes for the foreground (object-contain) layer. */
  className?: string;
}

/**
 * Renders a profile cover/banner that may be an image OR a short motion-banner
 * video, with a blurred same-media backdrop filling any letterbox space. When
 * there's no cover it renders a subtle decorative placeholder.
 *
 * Shared by every role's profile page and the public profile so cover
 * rendering stays identical everywhere. Videos autoplay muted + looped (the
 * only way browsers allow autoplay) and are non-interactive — the surrounding
 * card owns the click/upload affordances.
 */
export default function CoverMedia({ url, type, className = '' }: CoverMediaProps) {
  if (!url) {
    return (
      <div
        className="absolute inset-0 opacity-25"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.35) 0%, transparent 50%), radial-gradient(circle at 80% 30%, rgba(255,255,255,0.25) 0%, transparent 50%)',
        }}
      />
    );
  }

  if (type === 'video') {
    return (
      <>
        <video
          src={url}
          autoPlay
          muted
          loop
          playsInline
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover scale-110 blur-2xl opacity-80 select-none pointer-events-none"
        />
        <video
          src={url}
          autoPlay
          muted
          loop
          playsInline
          className={`absolute inset-0 w-full h-full object-contain pointer-events-none ${className}`}
        />
      </>
    );
  }

  return (
    <>
      <img
        src={url}
        alt=""
        aria-hidden
        draggable={false}
        className="absolute inset-0 w-full h-full object-cover scale-110 blur-2xl opacity-80 select-none pointer-events-none"
      />
      <img
        src={url}
        alt="Cover"
        draggable={false}
        className={`absolute inset-0 w-full h-full object-contain transition-transform duration-500 group-hover:scale-[1.03] ${className}`}
      />
    </>
  );
}
