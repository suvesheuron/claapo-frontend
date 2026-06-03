import { Link } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import {
  FaTruck, FaArrowRight, FaVideo, FaUsers, FaChevronRight,
  FaShieldHalved, FaBolt, FaGift, FaStar, FaBuilding,
} from 'react-icons/fa6';
import AppHeader from '../components/AppHeader';
import AppFooter from '../components/AppFooter';
import { useTheme } from '../contexts/ThemeContext';

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

/* ── Account types — compact picker rows (Company / Crew / Vendor / Cast) ── */
type AccountType = {
  key: 'company' | 'individual' | 'vendor' | 'cast' | 'location';
  icon: typeof FaVideo;
  title: string;
  subtitle: string;
  to: string;
  iconBg: string;
  iconText: string;
};

const accountTypes: AccountType[] = [
  {
    key: 'company',
    icon: FaVideo,
    title: 'Company',
    subtitle: 'Production houses & agencies',
    to: '/register/company',
    iconBg: 'bg-[#E8F0FE] dark:bg-[#3678F1]/15',
    iconText: 'text-[#3678F1] dark:text-[#5C9EFF]',
  },
  {
    key: 'individual',
    icon: FaUsers,
    title: 'Crew',
    subtitle: 'Freelance crew & professionals',
    to: '/register/individual',
    iconBg: 'bg-[#DCFCE7] dark:bg-[#22C55E]/15',
    iconText: 'text-[#22C55E]',
  },
  {
    key: 'vendor',
    icon: FaTruck,
    title: 'Vendor',
    subtitle: 'Equipment & rental providers',
    to: '/register/vendor',
    iconBg: 'bg-[#FEF7E0] dark:bg-[#F4C430]/15',
    iconText: 'text-[#8A6508] dark:text-[#F4C430]',
  },
  {
    key: 'cast',
    icon: FaStar,
    title: 'Cast',
    subtitle: 'Actors & models',
    to: '/register/cast',
    iconBg: 'bg-[#F3E8FF] dark:bg-[#9333EA]/20',
    iconText: 'text-[#9333EA] dark:text-[#C084FC]',
  },
  {
    key: 'location',
    icon: FaBuilding,
    title: 'Location',
    subtitle: 'Bungalows, studios & set-ups',
    to: '/register/location',
    iconBg: 'bg-[#E0F2F1] dark:bg-[#0F766E]/20',
    iconText: 'text-[#0F766E] dark:text-[#5EEAD4]',
  },
];

const avatarColors = ['bg-[#3678F1]', 'bg-[#22C55E]', 'bg-[#F4C430]'];
const avatarInitials = ['Co', 'In', 'Vd'];

export default function UserTypeSelect() {
  useEffect(() => {
    document.title = 'Join Claapo — Choose Your Account Type';
  }, []);

  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const bg = {
    page:   isDark ? '#0A0E17' : '#eef5fd',
    hero:   isDark
      ? 'linear-gradient(145deg, #0F1A2E 0%, #0D1326 40%, #0A0E17 100%)'
      : 'linear-gradient(145deg, #a8c8f0 0%, #c2dcf7 30%, #d8eaf9 60%, #eaf3fd 100%)',
    blob1:  isDark
      ? 'radial-gradient(circle, rgba(96,165,250,0.10) 0%, transparent 70%)'
      : 'radial-gradient(circle, rgba(168,200,240,0.5) 0%, transparent 70%)',
    blob2:  isDark
      ? 'radial-gradient(circle, rgba(59,91,219,0.20) 0%, transparent 70%)'
      : 'radial-gradient(circle, rgba(59,91,219,0.12) 0%, transparent 70%)',
    bottom: isDark ? '#0D1326' : '#f0f6fd',
  };

  const hero = useInView(0.05);
  const bottom = useInView(0.1);

  return (
    <div className="flex flex-col w-full min-h-screen" style={{ background: bg.page }}>
      <AppHeader variant="landing" />

      {/* ══════════════════════════════════════════════════════
          HERO — two columns: pitch (left) + profile picker (right)
         ══════════════════════════════════════════════════════ */}
      <section
        ref={hero.ref}
        className="relative overflow-hidden flex-1 pt-14 pb-16 lg:pt-20 lg:pb-24"
        style={{ background: bg.hero }}
      >
        {/* Decorative blobs */}
        <div className="absolute -top-24 -left-24 w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{ background: bg.blob1 }} />
        <div className="absolute -bottom-32 -right-32 w-[420px] h-[420px] rounded-full pointer-events-none"
          style={{ background: bg.blob2 }} />

        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* ── Left: pitch ── */}
            <div className={`transition-all duration-700 ${hero.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
              {/* Step indicator */}
              <div className="inline-flex items-center gap-2.5 mb-7">
                <span className="flex items-center gap-2 text-[11px] font-bold tracking-[0.18em] uppercase text-[#3678F1] dark:text-[#5C9EFF]">
                  <span className="w-6 h-6 rounded-full bg-[#3678F1] dark:bg-[#5C9EFF] text-white flex items-center justify-center text-[11px] font-bold">1</span>
                  Choose Account
                </span>
                <span className="w-8 h-px bg-slate-300 dark:bg-[#354763]" />
                <span className="flex items-center gap-2 text-[11px] font-bold tracking-[0.18em] uppercase text-slate-400 dark:text-[#7A8499]">
                  <span className="w-6 h-6 rounded-full border border-slate-300 dark:border-[#354763] text-slate-400 dark:text-[#7A8499] flex items-center justify-center text-[11px] font-bold">2</span>
                  Create Profile
                </span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-[64px] font-extrabold text-[#0f172a] dark:text-[#F1F5F9] leading-[1.05] mb-5 tracking-tight">
                Join <span className="text-[#3678F1] dark:text-[#5C9EFF]">Claapo</span>
              </h1>
              <p className="text-base sm:text-lg text-slate-500 dark:text-[#A1ADC4] leading-relaxed max-w-md mb-8">
                Pick the account that best describes you. Companies, Crew, Vendors and Cast all get
                access to the same powerful tools &mdash; tailored for how you work.
              </p>

              {/* Social proof */}
              <div className="inline-flex items-center gap-3 bg-white/60 dark:bg-[#141A28]/70 backdrop-blur rounded-full px-5 py-2.5 border border-white/70 dark:border-white/10 shadow-sm">
                <div className="flex -space-x-2">
                  {avatarInitials.map((init, i) => (
                    <div key={i} className={`w-7 h-7 rounded-full border-2 border-white dark:border-[#141A28] flex items-center justify-center text-[9px] font-bold text-white shadow-sm ${avatarColors[i]}`}>
                      {init}
                    </div>
                  ))}
                  <div className="w-7 h-7 rounded-full border-2 border-white dark:border-[#141A28] bg-[#3678F1] flex items-center justify-center text-[8px] font-bold text-white shadow-sm">+3k</div>
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-slate-700 dark:text-[#F1F5F9]">3,000+ members</p>
                  <p className="text-[11px] text-slate-400 dark:text-[#7A8499]">Companies &middot; Crew &middot; Vendors &middot; Cast</p>
                </div>
              </div>
            </div>

            {/* ── Right: profile picker list ── */}
            <div className={`transition-all duration-700 ${hero.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '120ms' }}>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0f172a] dark:text-[#F1F5F9] tracking-tight">
                Select which profile
              </h2>
              <p className="text-sm text-slate-500 dark:text-[#A1ADC4] mb-6">suits best for you.</p>

              <div className="space-y-3.5">
                {accountTypes.map((type, idx) => (
                  <Link
                    key={type.key}
                    to={type.to}
                    aria-label={`Continue as ${type.title}`}
                    className={`
                      group flex items-center gap-4 rounded-2xl bg-white dark:bg-[#141A28]
                      border border-white/70 dark:border-[#1F2940] shadow-sm
                      px-5 py-4
                      transition-all duration-200 hover:shadow-md hover:border-[#3678F1]/40 hover:-translate-y-0.5
                      ${hero.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
                    `}
                    style={{ transitionDelay: `${180 + idx * 80}ms` }}
                  >
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${type.iconBg}`}>
                      <type.icon className={`text-lg ${type.iconText}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-bold text-slate-900 dark:text-[#F1F5F9] leading-tight">{type.title}</p>
                      <p className="text-xs text-slate-400 dark:text-[#7A8499] mt-0.5 truncate">{type.subtitle}</p>
                    </div>
                    <FaChevronRight className="text-slate-300 dark:text-[#4B5676] text-sm shrink-0 transition-all group-hover:text-[#3678F1] group-hover:translate-x-0.5" />
                  </Link>
                ))}
              </div>

              {/* Sign in */}
              <div className="mt-6 flex items-center justify-center gap-2 text-sm">
                <span className="text-slate-500 dark:text-[#A1ADC4]">Already have an account?</span>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-[#3678F1] dark:text-[#5C9EFF] font-bold hover:gap-2 transition-all"
                >
                  Sign in <FaArrowRight className="text-[10px]" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          BOTTOM: TRUST
         ══════════════════════════════════════════════════════ */}
      <section
        ref={bottom.ref}
        className="py-14 border-t border-slate-200/60 dark:border-[#1F2940]"
        style={{ background: bg.bottom }}
      >
        <div className={`max-w-4xl mx-auto px-6 transition-all duration-700 ${bottom.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { Icon: FaShieldHalved, title: 'Secure & Encrypted', desc: 'Bank-grade encryption & JWT auth' },
              { Icon: FaBolt,          title: 'Setup in 2 Minutes', desc: 'Simple onboarding, no paperwork' },
              { Icon: FaGift,          title: '100% Free to Start', desc: 'No credit card. No hidden fees.' },
            ].map(({ Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-3 bg-white/60 dark:bg-[#141A28]/70 backdrop-blur rounded-xl border border-white dark:border-[#1F2940] px-5 py-4">
                <div className="w-9 h-9 rounded-lg bg-[#3678F1]/10 dark:bg-[#5C9EFF]/15 flex items-center justify-center shrink-0">
                  <Icon className="text-[#3678F1] dark:text-[#5C9EFF] text-sm" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-slate-800 dark:text-[#F1F5F9]">{title}</p>
                  <p className="text-[11px] text-slate-500 dark:text-[#A1ADC4] mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <AppFooter variant="dark" />
    </div>
  );
}
