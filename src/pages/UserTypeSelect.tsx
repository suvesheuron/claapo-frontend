import { Link } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import {
  FaTruck, FaCheck, FaArrowRight, FaVideo, FaUsers,
  FaShieldHalved, FaBolt, FaGift, FaCircleQuestion,
} from 'react-icons/fa6';
import AppHeader from '../components/AppHeader';
import AppFooter from '../components/AppFooter';

/* ── Intersection observer hook ── */
function useInView(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

/* ── Account types — equal treatment for all three ── */
type AccountType = {
  key: 'company' | 'individual' | 'vendor';
  icon: typeof FaVideo;
  label: string;
  title: string;
  subtitle: string;
  description: string;
  features: string[];
  cta: string;
  to: string;
  accent: {
    ring: string;     // border/ring hover color
    iconBg: string;   // icon pill bg
    iconText: string; // icon color
    check: string;    // feature check color
    badge: string;    // "For X" overline
    btnBg: string;    // CTA background
    btnHover: string; // CTA hover
    shadow: string;   // CTA shadow
  };
};

const accountTypes: AccountType[] = [
  {
    key: 'company',
    icon: FaVideo,
    label: 'For Companies',
    title: 'Company',
    subtitle: 'Production houses & agencies',
    description: 'Centralize hiring, manage projects end-to-end, and collaborate with your team.',
    features: [
      'Verified crew & vendor database',
      'Project & budget management',
      'Team collaboration & sub-users',
      'Real-time availability checks',
      'Integrated payments',
    ],
    cta: 'Continue as Company',
    to: '/register/company',
    accent: {
      ring: 'hover:border-[#3B5BDB]/60',
      iconBg: 'bg-blue-100',
      iconText: 'text-[#3B5BDB]',
      check: 'text-[#3B5BDB]',
      badge: 'text-[#3B5BDB]',
      btnBg: 'bg-[#3B5BDB]',
      btnHover: 'hover:bg-[#2f4ac2]',
      shadow: 'shadow-[#3B5BDB]/25',
    },
  },
  {
    key: 'individual',
    icon: FaUsers,
    label: 'For Individuals',
    title: 'Individual',
    subtitle: 'Freelance crew & professionals',
    description: 'Get discovered by top agencies, manage your schedule, and get paid faster.',
    features: [
      'Professional profile & showreel',
      'Live availability calendar',
      'Booking notifications',
      'One-click invoicing with GST',
      'Past work portfolio',
    ],
    cta: 'Continue as Individual',
    to: '/register/individual',
    accent: {
      ring: 'hover:border-emerald-500/60',
      iconBg: 'bg-emerald-100',
      iconText: 'text-emerald-600',
      check: 'text-emerald-600',
      badge: 'text-emerald-600',
      btnBg: 'bg-emerald-600',
      btnHover: 'hover:bg-emerald-700',
      shadow: 'shadow-emerald-500/25',
    },
  },
  {
    key: 'vendor',
    icon: FaTruck,
    label: 'For Vendors',
    title: 'Vendor',
    subtitle: 'Equipment & rental providers',
    description: 'List equipment, manage rental calendars, and receive direct booking requests.',
    features: [
      'Equipment inventory management',
      'Rental calendar & scheduling',
      'Direct quote requests',
      'GST verified badges',
      'Multi-city availability',
    ],
    cta: 'Continue as Vendor',
    to: '/register/vendor',
    accent: {
      ring: 'hover:border-purple-500/60',
      iconBg: 'bg-purple-100',
      iconText: 'text-purple-600',
      check: 'text-purple-600',
      badge: 'text-purple-600',
      btnBg: 'bg-purple-600',
      btnHover: 'hover:bg-purple-700',
      shadow: 'shadow-purple-500/25',
    },
  },
];

const avatarColors = ['bg-blue-500', 'bg-emerald-500', 'bg-purple-500'];
const avatarInitials = ['Co', 'In', 'Vd'];

export default function UserTypeSelect() {
  useEffect(() => {
    document.title = 'Join Claapo \u2014 Choose Your Account Type';
  }, []);

  const hero = useInView(0.05);
  const cards = useInView(0.08);
  const bottom = useInView(0.1);

  return (
    <div className="flex flex-col w-full min-h-screen" style={{ background: '#eef5fd' }}>
      <AppHeader variant="landing" />

      {/* ══════════════════════════════════════════════════════
          HERO
         ══════════════════════════════════════════════════════ */}
      <section
        ref={hero.ref}
        className="relative overflow-hidden pt-16 pb-10 lg:pt-24 lg:pb-14"
        style={{ background: 'linear-gradient(145deg, #a8c8f0 0%, #c2dcf7 30%, #d8eaf9 60%, #eaf3fd 100%)' }}
      >
        {/* Decorative blobs */}
        <div className="absolute -top-24 -left-24 w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(168,200,240,0.5) 0%, transparent 70%)' }} />
        <div className="absolute -bottom-32 -right-32 w-[400px] h-[400px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(59,91,219,0.12) 0%, transparent 70%)' }} />

        <div className={`max-w-4xl mx-auto px-6 text-center relative z-10 transition-all duration-700 ${hero.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          {/* Step indicator */}
          <div className="inline-flex items-center gap-2.5 mb-6">
            <span className="flex items-center gap-2 text-[11px] font-bold tracking-[0.18em] uppercase text-[#3B5BDB]">
              <span className="w-6 h-6 rounded-full bg-[#3B5BDB] text-white flex items-center justify-center text-[11px] font-bold">1</span>
              Choose Account
            </span>
            <span className="w-8 h-px bg-slate-300" />
            <span className="flex items-center gap-2 text-[11px] font-bold tracking-[0.18em] uppercase text-slate-400">
              <span className="w-6 h-6 rounded-full border border-slate-300 text-slate-400 flex items-center justify-center text-[11px] font-bold">2</span>
              Create Profile
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-extrabold text-[#0f172a] leading-[1.08] mb-5 tracking-tight">
            Join <span className="text-[#3B5BDB]">Claapo</span>
          </h1>
          <p className="text-base sm:text-lg text-slate-500 leading-relaxed max-w-xl mx-auto mb-8">
            Pick the account that best describes you. Companies, Individuals, and Vendors all get
            access to the same powerful tools &mdash; tailored for how you work.
          </p>

          {/* Social proof — mirrors landing page */}
          <div className="inline-flex items-center gap-3 bg-white/60 backdrop-blur rounded-full px-5 py-2.5 border border-white/70 shadow-sm">
            <div className="flex -space-x-2">
              {avatarInitials.map((init, i) => (
                <div key={i} className={`w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-[9px] font-bold text-white shadow-sm ${avatarColors[i]}`}>
                  {init}
                </div>
              ))}
              <div className="w-7 h-7 rounded-full border-2 border-white bg-[#3B5BDB] flex items-center justify-center text-[8px] font-bold text-white shadow-sm">+3k</div>
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-slate-700">3,000+ members</p>
              <p className="text-[11px] text-slate-400">Companies &middot; Individuals &middot; Vendors</p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          ACCOUNT TYPE CARDS — equal weight, three accents
         ══════════════════════════════════════════════════════ */}
      <section
        ref={cards.ref}
        className="py-14 lg:py-20 flex-1"
        style={{ background: 'linear-gradient(180deg, #eaf3fd 0%, #eef5fd 100%)' }}
      >
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6">
            {accountTypes.map((type, idx) => (
              <div
                key={type.key}
                className={`
                  group relative rounded-2xl bg-white border border-slate-100 p-7 sm:p-8 flex flex-col
                  shadow-sm hover:shadow-xl hover:shadow-slate-200/60 hover:-translate-y-1
                  transition-all duration-500 ${type.accent.ring}
                  ${cards.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
                `}
                style={{ transitionDelay: `${idx * 120}ms` }}
              >
                {/* Overline label */}
                <span className={`text-[10px] font-bold tracking-[0.2em] uppercase mb-3 ${type.accent.badge}`}>
                  {type.label}
                </span>

                {/* Icon */}
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${type.accent.iconBg}`}>
                  <type.icon className={`text-xl ${type.accent.iconText}`} />
                </div>

                {/* Title */}
                <h3 className="text-2xl font-bold text-slate-900 mb-1 tracking-tight">
                  {type.title}
                </h3>
                <p className="text-sm text-slate-400 mb-5">
                  {type.subtitle}
                </p>

                {/* Divider */}
                <div className="h-px bg-slate-100 mb-5" />

                {/* Description */}
                <p className="text-sm text-slate-500 leading-relaxed mb-6">
                  {type.description}
                </p>

                {/* Features */}
                <ul className="space-y-3 mb-8 flex-1">
                  {type.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <FaCheck className={`${type.accent.check} text-[11px] shrink-0 mt-1`} />
                      <span className="text-sm text-slate-600 leading-snug">{f}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <Link
                  to={type.to}
                  className={`
                    inline-flex items-center justify-center gap-2 rounded-xl w-full py-3.5 text-sm font-bold text-white
                    transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5
                    ${type.accent.btnBg} ${type.accent.btnHover} ${type.accent.shadow}
                  `}
                >
                  {type.cta}
                  <FaArrowRight className="text-xs" />
                </Link>
              </div>
            ))}
          </div>

          {/* Help text under cards */}
          <div className={`mt-10 flex items-center justify-center gap-2 text-xs text-slate-400 transition-all duration-700 ${cards.visible ? 'opacity-100' : 'opacity-0'}`} style={{ transitionDelay: '500ms' }}>
            <FaCircleQuestion className="text-slate-300" />
            <span>Not sure which one fits you? All accounts are free to start &mdash; you can switch anytime.</span>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          BOTTOM: TRUST + SIGN IN
         ══════════════════════════════════════════════════════ */}
      <section
        ref={bottom.ref}
        className="py-16 border-t border-slate-200/60"
        style={{ background: '#f0f6fd' }}
      >
        <div className={`max-w-4xl mx-auto px-6 transition-all duration-700 ${bottom.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          {/* Trust indicators */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
            {[
              { Icon: FaShieldHalved, title: 'Secure & Encrypted', desc: 'Bank-grade encryption & JWT auth' },
              { Icon: FaBolt,          title: 'Setup in 2 Minutes', desc: 'Simple onboarding, no paperwork' },
              { Icon: FaGift,          title: '100% Free to Start', desc: 'No credit card. No hidden fees.' },
            ].map(({ Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-3 bg-white/60 backdrop-blur rounded-xl border border-white px-5 py-4">
                <div className="w-9 h-9 rounded-lg bg-[#3B5BDB]/10 flex items-center justify-center shrink-0">
                  <Icon className="text-[#3B5BDB] text-sm" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-slate-800">{title}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Sign in link */}
          <div className="text-center">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-8 py-5 inline-flex items-center gap-3">
              <p className="text-sm text-slate-600">Already have an account?</p>
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-sm text-[#3B5BDB] font-bold hover:gap-2 transition-all"
              >
                Sign in <FaArrowRight className="text-[10px]" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <AppFooter variant="dark" />
    </div>
  );
}
