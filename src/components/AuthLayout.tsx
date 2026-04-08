import { Link } from 'react-router-dom';
import type { ComponentType, ReactNode } from 'react';
import { FaArrowLeft } from 'react-icons/fa6';
import Logo from './Logo';

export type AuthHighlight = {
  icon: ComponentType<{ className?: string }>;
  title: string;
  body: string;
};

export type AuthBrandPanel = {
  eyebrow?: string;
  headline: ReactNode;          // can include line breaks / spans
  description: string;
  highlights: AuthHighlight[];
  bottomText?: string;
};

type AuthLayoutProps = {
  /** Right-column heading */
  title: string;
  subtitle?: string;

  /** Back link rendered inside the form card, top-left */
  backTo?: string;
  backLabel?: string;

  /** Left brand panel content */
  brand: AuthBrandPanel;

  /** Form content placed inside the white card */
  children: ReactNode;

  /** Optional micro-copy below the card (e.g., terms / privacy line) */
  footer?: ReactNode;

  /** Wider card for forms with grid fields (registration). Default: false (login). */
  wide?: boolean;
};

/**
 * Shared authentication layout used by /login and /register/* pages.
 *
 *  • No top navbar — back link lives inside the card.
 *  • lg+ : 2-column split — sticky brand panel on the left, scrollable form on the right.
 *  • <lg : single column — brand panel hidden, mobile logo + heading at the top.
 */
export default function AuthLayout({
  title,
  subtitle,
  backTo = '/',
  backLabel = 'Back',
  brand,
  children,
  footer,
  wide = false,
}: AuthLayoutProps) {
  const cardWidth = wide ? 'max-w-[560px]' : 'max-w-[460px]';

  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden w-full grid grid-cols-1 lg:grid-cols-2 bg-white">

      {/* ═════════════════ Left brand panel (lg+) ═════════════════ */}
      <aside
        className="hidden lg:flex relative flex-col justify-between p-12 xl:p-16 overflow-hidden text-white lg:h-screen"
        style={{
          background: 'linear-gradient(155deg, #1e3aa8 0%, #3B5BDB 45%, #5b78e8 100%)',
        }}
      >
        {/* Decorative blobs */}
        <div
          className="absolute -top-24 -right-24 w-[460px] h-[460px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.18) 0%, transparent 65%)' }}
        />
        <div
          className="absolute -bottom-32 -left-20 w-[380px] h-[380px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.10) 0%, transparent 70%)' }}
        />
        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.07] pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        {/* Top: logo */}
        <div className="relative z-10">
          <Logo size="lg" variant="mono-light" to="/" />
        </div>

        {/* Middle: brand content */}
        <div className="relative z-10 max-w-md">
          {brand.eyebrow && (
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70 mb-4">
              {brand.eyebrow}
            </p>
          )}
          <h2 className="text-4xl xl:text-[44px] font-extrabold leading-[1.1] tracking-tight mb-5">
            {brand.headline}
          </h2>
          <p className="text-[15px] text-white/80 leading-relaxed mb-10 max-w-sm">
            {brand.description}
          </p>

          <ul className="space-y-5">
            {brand.highlights.map(({ icon: Icon, title: hTitle, body }) => (
              <li key={hTitle} className="flex items-start gap-3.5">
                <span className="shrink-0 w-9 h-9 rounded-xl bg-white/15 backdrop-blur border border-white/25 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-white" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">{hTitle}</p>
                  <p className="text-[13px] text-white/70 leading-snug">{body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom: social proof */}
        {brand.bottomText && (
          <div className="relative z-10 flex items-center gap-3 text-xs text-white/65">
            <div className="flex -space-x-2">
              {['bg-purple-400', 'bg-emerald-400', 'bg-amber-400'].map((c, i) => (
                <span
                  key={i}
                  className={`w-7 h-7 rounded-full border-2 border-white/40 ${c}`}
                />
              ))}
            </div>
            <span>{brand.bottomText}</span>
          </div>
        )}
      </aside>

      {/* ═════════════════ Right form column ═════════════════ */}
      <section className="relative flex flex-col items-center px-5 sm:px-8 py-10 sm:py-14 bg-[#F8FAFC] min-h-screen lg:h-screen lg:overflow-y-auto">
        <div className={`w-full ${cardWidth} lg:my-auto`}>

          {/* Mobile-only logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <Logo size="lg" to="/" />
          </div>

          {/* Heading */}
          <div className="mb-6 text-center lg:text-left">
            <h1 className="text-[28px] sm:text-[32px] font-extrabold tracking-tight text-neutral-900 leading-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="text-[15px] text-neutral-500 mt-2">{subtitle}</p>
            )}
          </div>

          {/* Card */}
          <div className="rounded-2xl bg-white border border-neutral-200/80 p-6 sm:p-8 shadow-[0_1px_0_0_rgba(15,23,42,0.04),0_24px_48px_-24px_rgba(15,23,42,0.18)]">
            {/* Back link inside card */}
            <div className="mb-5 -ml-1">
              <Link
                to={backTo}
                className="inline-flex items-center gap-2 px-2.5 py-1.5 -my-1 rounded-lg text-[13px] font-semibold text-neutral-500 hover:text-[#3B5BDB] hover:bg-neutral-100 transition-colors"
              >
                <FaArrowLeft className="w-3 h-3" aria-hidden />
                {backLabel}
              </Link>
            </div>

            {children}
          </div>

          {footer && (
            <div className="mt-6 text-center text-[11px] text-neutral-400 leading-relaxed">
              {footer}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
