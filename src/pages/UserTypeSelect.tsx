import { Link } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import {
  FaBuilding, FaUser, FaTruck, FaCheck, FaCircleCheck,
  FaArrowRight, FaVideo, FaUsers,
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

/* ── Account type data ── */
const accountTypes = [
  {
    icon: FaUsers,
    title: 'Freelancer',
    subtitle: 'Crew members & professionals',
    description: 'Get discovered by top agencies, manage your schedule, and get paid faster.',
    features: [
      'Professional profile & showreel',
      'Live availability calendar',
      'Booking notifications',
      'One-click invoicing with GST',
      'Past work portfolio',
    ],
    cta: 'Join as Freelancer',
    to: '/register/individual',
    featured: false,
  },
  {
    icon: FaVideo,
    title: 'Production House',
    subtitle: 'Companies & agencies',
    description: 'Centralize hiring, manage projects end-to-end, and collaborate with your team.',
    features: [
      'Verified crew database',
      'Project & budget management',
      'Team collaboration & sub-users',
      'Real-time availability checks',
      'Integrated payments',
    ],
    cta: 'Get Company Access',
    to: '/register/company',
    featured: true,
  },
  {
    icon: FaTruck,
    title: 'Vendor',
    subtitle: 'Equipment rental providers',
    description: 'List equipment, manage rental calendars, and receive direct booking requests.',
    features: [
      'Equipment inventory management',
      'Rental calendar & scheduling',
      'Direct quote requests',
      'GST verified badges',
      'Multi-city availability',
    ],
    cta: 'List Equipment',
    to: '/register/vendor',
    featured: false,
  },
];

const avatarColors = ['bg-purple-500', 'bg-blue-500', 'bg-emerald-500'];
const avatarInitials = ['PS', 'RV', 'AP'];

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
          <div className="inline-flex items-center gap-2 bg-white/60 backdrop-blur rounded-full px-4 py-1.5 mb-6 border border-white/80">
            <FaVideo className="text-[#3B5BDB] text-xs" />
            <span className="text-xs font-semibold text-slate-700">Free to join. No credit card required.</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-extrabold text-[#0f172a] leading-[1.1] mb-5 tracking-tight">
            Join <span className="text-[#3B5BDB]">Claapo</span>
          </h1>
          <p className="text-base sm:text-lg text-slate-500 leading-relaxed max-w-xl mx-auto mb-8">
            Choose how you want to use the platform. You can always add more roles later.
          </p>

          {/* Social proof */}
          <div className="inline-flex items-center gap-3 bg-white/50 backdrop-blur rounded-full px-5 py-2.5 border border-white/70">
            <div className="flex -space-x-2">
              {avatarInitials.map((init, i) => (
                <div key={i} className={`w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-[9px] font-bold text-white shadow-sm ${avatarColors[i]}`}>
                  {init}
                </div>
              ))}
              <div className="w-7 h-7 rounded-full border-2 border-white bg-[#3B5BDB] flex items-center justify-center text-[8px] font-bold text-white shadow-sm">+2k</div>
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-slate-700">2,000+ professionals</p>
              <p className="text-[11px] text-slate-400">already on the platform</p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          ACCOUNT TYPE CARDS
         ══════════════════════════════════════════════════════ */}
      <section
        ref={cards.ref}
        className="py-14 lg:py-20 flex-1"
        style={{ background: 'linear-gradient(180deg, #eaf3fd 0%, #eef5fd 100%)' }}
      >
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6">
            {accountTypes.map((type, idx) => {
              const isFeatured = type.featured;
              return (
                <div
                  key={type.title}
                  className={`
                    rounded-2xl p-7 sm:p-8 flex flex-col transition-all duration-700
                    ${isFeatured
                      ? 'bg-[#3B5BDB] shadow-2xl shadow-[#3B5BDB]/25 md:-translate-y-3'
                      : 'bg-white shadow-sm border border-slate-100 hover:shadow-lg hover:shadow-slate-200/60 hover:-translate-y-1'
                    }
                    ${cards.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
                  `}
                  style={{ transitionDelay: `${idx * 120}ms` }}
                >
                  {/* Popular badge for featured */}
                  {isFeatured && (
                    <div className="inline-flex self-start items-center gap-1.5 bg-white/20 rounded-full px-3 py-1 mb-5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-300 animate-pulse" />
                      <span className="text-[11px] font-semibold text-white/90 tracking-wide uppercase">Most Popular</span>
                    </div>
                  )}

                  {/* Icon */}
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${isFeatured ? 'bg-white/20' : 'bg-blue-50'}`}>
                    <type.icon className={`text-xl ${isFeatured ? 'text-white' : 'text-[#3B5BDB]'}`} />
                  </div>

                  {/* Title */}
                  <h3 className={`text-xl font-bold mb-1 ${isFeatured ? 'text-white' : 'text-slate-900'}`}>
                    {type.title}
                  </h3>
                  <p className={`text-sm mb-4 ${isFeatured ? 'text-blue-200' : 'text-slate-400'}`}>
                    {type.subtitle}
                  </p>

                  {/* Description */}
                  <p className={`text-sm leading-relaxed mb-7 ${isFeatured ? 'text-blue-100' : 'text-slate-500'}`}>
                    {type.description}
                  </p>

                  {/* Features */}
                  <ul className="space-y-3 mb-8 flex-1">
                    {type.features.map((f) => (
                      <li key={f} className="flex items-center gap-2.5">
                        {isFeatured
                          ? <FaCircleCheck className="text-white text-[12px] shrink-0" />
                          : <FaCheck className="text-[#3B5BDB] text-[11px] shrink-0" />
                        }
                        <span className={`text-sm ${isFeatured ? 'text-blue-100' : 'text-slate-600'}`}>{f}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <Link
                    to={type.to}
                    className={`
                      inline-flex items-center justify-center gap-2 rounded-xl w-full py-3.5 text-sm font-bold transition-all duration-200
                      ${isFeatured
                        ? 'bg-white text-[#3B5BDB] hover:bg-blue-50 shadow-lg shadow-black/10'
                        : 'bg-[#3B5BDB] text-white hover:bg-[#2f4ac2] shadow-lg shadow-[#3B5BDB]/20 hover:shadow-xl hover:shadow-[#3B5BDB]/30'
                      }
                    `}
                  >
                    {type.cta}
                    <FaArrowRight className="text-xs" />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          BOTTOM: TRUST + SIGN IN
         ══════════════════════════════════════════════════════ */}
      <section
        ref={bottom.ref}
        className="py-14 border-t border-slate-200/60"
        style={{ background: '#f0f6fd' }}
      >
        <div className={`max-w-3xl mx-auto px-6 text-center transition-all duration-700 ${bottom.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          {/* Trust indicators */}
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 mb-10">
            {[
              { icon: '🔒', text: 'Secure & Encrypted' },
              { icon: '⚡', text: 'Setup in 2 Minutes' },
              { icon: '🎯', text: '100% Free to Start' },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-2">
                <span className="text-base">{item.icon}</span>
                <span className="text-sm font-medium text-slate-500">{item.text}</span>
              </div>
            ))}
          </div>

          {/* Sign in link */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-8 py-6 inline-block">
            <p className="text-base text-slate-600">
              Already have an account?{' '}
              <Link to="/login" className="text-[#3B5BDB] font-bold hover:underline transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </section>

      <AppFooter variant="dark" />
    </div>
  );
}
