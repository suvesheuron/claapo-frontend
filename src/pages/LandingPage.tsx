import { Link } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import {
  FaVideo, FaCalendar, FaUsers, FaTruck, FaCircleCheck, FaLock,
  FaArrowRight, FaMagnifyingGlass, FaCalendarCheck, FaChevronDown,
} from 'react-icons/fa6';
import AppHeader from '../components/AppHeader';
import AppFooter from '../components/AppFooter';

const howItWorks = [
  { step: '01', icon: FaMagnifyingGlass, title: 'Search & Discover', description: 'Browse verified crew and vendors filtered by skill, location and availability.', bg: 'bg-[#EEF4FF]', ic: 'text-[#3678F1]' },
  { step: '02', icon: FaCalendarCheck,   title: 'Book via Calendar',  description: 'Check real-time availability, send requests and get confirmations instantly.',   bg: 'bg-[#DCFCE7]', ic: 'text-[#15803D]' },
  { step: '03', icon: FaLock,            title: 'Lock & Manage',      description: 'Lock your confirmed team, track bookings and manage invoices in one place.',     bg: 'bg-[#FEF9E6]', ic: 'text-[#92400E]' },
];

const features = [
  { icon: FaCalendar, title: 'Calendar-First',    description: 'Crew & vendor availability on one shared calendar.',   bg: 'bg-[#DBEAFE]', ic: 'text-[#1D4ED8]' },
  { icon: FaUsers,    title: 'Structured Hiring', description: 'Search, filter, chat, hire — no more WhatsApp chaos.',  bg: 'bg-[#DCFCE7]', ic: 'text-[#15803D]' },
  { icon: FaLock,     title: 'Lock & Confirm',    description: 'Once your team is set, lock it. No double-bookings.',   bg: 'bg-[#FEF9E6]', ic: 'text-[#92400E]' },
  { icon: FaVideo,    title: 'Project History',   description: 'View completed bookings by navigating past months.',     bg: 'bg-[#F3E8FF]', ic: 'text-[#7C3AED]' },
];

const userTypes = [
  { icon: FaUsers, title: 'Production Companies', description: 'Search, book and manage crew & vendors across all your projects.',   checks: ['Filter by skill & availability', 'Manage project calendars', 'Lock confirmed bookings'],   bg: 'bg-[#EEF4FF]', ic: 'text-[#3678F1]', cta: 'Register as Company',    to: '/register/company' },
  { icon: FaVideo, title: 'Freelancers',           description: 'Showcase your reel and let productions find and hire you.',          checks: ['Manage your availability calendar', 'Accept booking requests', 'Track history & invoices'],  bg: 'bg-[#F3E8FF]', ic: 'text-[#7C3AED]', cta: 'Register as Freelancer', to: '/register/individual' },
  { icon: FaTruck, title: 'Vendors',               description: 'List equipment and get discovered by active productions.',           checks: ['List equipment with rates',         'Accept rental requests',    'Track bookings & payments'], bg: 'bg-[#FEF9E6]', ic: 'text-[#92400E]', cta: 'Register as Vendor',     to: '/register/vendor' },
];

const stats = [
  { value: '500+',   label: 'Verified Crew' },
  { value: '200+',   label: 'Equipment Vendors' },
  { value: '1,000+', label: 'Projects Managed' },
  { value: '100%',   label: 'GST Verified' },
];

function useInView(threshold = 0.15) {
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

function SectionLabel({ text, color }: { text: string; color: string }) {
  return (
    <span className={`inline-block text-[11px] font-bold px-3 py-1 rounded-full mb-3 border ${color}`}>
      {text}
    </span>
  );
}

export default function LandingPage() {
  useEffect(() => { document.title = 'CrewCall – Hire Film Crews & Vendors'; }, []);

  const s1 = useInView(0.1);
  const s2 = useInView();
  const s3 = useInView();
  const s4 = useInView();
  const s5 = useInView();

  return (
    <div className="flex flex-col w-full bg-white">
      <AppHeader variant="landing" />

      {/* ── HERO ──────────────────────────────────────── */}
      <section ref={s1.ref} className="relative bg-white overflow-hidden py-16 sm:py-20">
        <div className="absolute -top-16 -right-16 w-72 h-72 bg-[#EEF4FF] rounded-full blur-3xl opacity-70 pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-56 h-56 bg-[#FEF9E6] rounded-full blur-3xl opacity-60 pointer-events-none" />

        <div className={`max-w-3xl mx-auto px-5 text-center relative z-10 transition-all duration-700 ${s1.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#EEF4FF] text-[#3678F1] text-xs font-semibold mb-6 border border-[#BFDBFE]">
            <FaCalendar className="w-3 h-3" />
            Streamline hiring—crews, vendors &amp; projects in one place
          </div>

          <h1 className="text-[32px] sm:text-[42px] font-bold text-neutral-900 leading-snug mb-4 tracking-tight">
            The Production Platform
            <br />
            <span className="text-[#3678F1] relative inline-block">
              Built for Film
              <svg className="absolute -bottom-1 left-0 w-full" viewBox="0 0 300 6" fill="none">
                <path d="M2 4C60 1 150 1 298 3" stroke="#F4C430" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
            </span>
            {' '}&amp; Advertising
          </h1>

          <p className="text-sm text-neutral-500 leading-relaxed mb-7 max-w-xl mx-auto">
            Replace messy WhatsApp groups and spreadsheets with a structured, calendar-first platform for hiring crew, booking vendors, and managing productions end-to-end.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-10">
            <Link to="/dashboard" className="inline-flex justify-center items-center gap-2 rounded-xl bg-[#3678F1] text-white px-6 py-3 text-sm font-bold hover:bg-[#2563d4] transition-all shadow-md shadow-[#3678F1]/20 hover:-translate-y-0.5">
              View Dashboard <FaArrowRight className="w-3 h-3" />
            </Link>
            <Link to="/register" className="inline-flex justify-center items-center rounded-xl border-2 border-neutral-200 text-neutral-700 px-6 py-3 text-sm font-bold hover:border-[#3678F1] hover:text-[#3678F1] transition-all">
              Get Started Free
            </Link>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12 pt-6 border-t border-neutral-100">
            {stats.map(({ value, label }) => (
              <div key={label} className="text-center">
                <p className="text-xl font-bold text-neutral-900">{value}</p>
                <p className="text-xs text-neutral-400 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll hint */}
        <div className="flex flex-col items-center gap-1 mt-12 animate-bounce">
          <p className="text-[11px] text-neutral-400 tracking-wide">Scroll to explore</p>
          <FaChevronDown className="text-neutral-300 text-sm" />
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────── */}
      <section ref={s2.ref} className="bg-[#F3F4F6] py-12 sm:py-16">
        <div className="max-w-5xl mx-auto px-5">
          <div className={`text-center mb-8 transition-all duration-700 ${s2.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
            <SectionLabel text="HOW IT WORKS" color="text-[#3678F1] bg-[#EEF4FF] border-[#BFDBFE]" />
            <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 mb-1.5">From discovery to locked bookings</h2>
            <p className="text-xs text-neutral-500">Three steps—no spreadsheets required</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {howItWorks.map((step, idx) => (
              <div
                key={step.title}
                className={`rounded-2xl bg-white border border-neutral-200 p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-500 ${s2.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}
                style={{ transitionDelay: `${idx * 120}ms` }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${step.bg}`}>
                    <step.icon className={`text-sm ${step.ic}`} />
                  </div>
                  <span className="text-2xl font-black text-neutral-900">{step.step}</span>
                </div>
                <h3 className="text-sm font-bold text-neutral-900 mb-1">{step.title}</h3>
                <p className="text-xs text-neutral-500 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CAPABILITIES ──────────────────────────────── */}
      <section ref={s3.ref} className="bg-white py-12 sm:py-16">
        <div className="max-w-5xl mx-auto px-5">
          <div className={`text-center mb-8 transition-all duration-700 ${s3.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
            <SectionLabel text="CAPABILITIES" color="text-[#15803D] bg-[#DCFCE7] border-[#86EFAC]" />
            <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 mb-1.5">Everything you need to run a production</h2>
            <p className="text-xs text-neutral-500">Four capabilities that streamline every stage of your workflow</p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((feature, idx) => (
              <div
                key={feature.title}
                className={`rounded-2xl bg-[#F3F4F6] border border-neutral-200 p-5 hover:bg-white hover:shadow-md hover:-translate-y-1 transition-all duration-500 ${s3.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}
                style={{ transitionDelay: `${idx * 100}ms` }}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${feature.bg}`}>
                  <feature.icon className={`text-sm ${feature.ic}`} />
                </div>
                <h3 className="text-sm font-bold text-neutral-900 mb-1">{feature.title}</h3>
                <p className="text-xs text-neutral-500 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHO IS IT FOR ─────────────────────────────── */}
      <section ref={s4.ref} className="bg-[#F3F4F6] py-12 sm:py-16">
        <div className="max-w-5xl mx-auto px-5">
          <div className={`text-center mb-8 transition-all duration-700 ${s4.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
            <SectionLabel text="WHO IS IT FOR" color="text-[#7C3AED] bg-[#F3E8FF] border-[#DDD6FE]" />
            <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 mb-1.5">Built for everyone in production</h2>
            <p className="text-xs text-neutral-500">Whether you're hiring, getting hired, or providing equipment</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {userTypes.map((type, idx) => (
              <div
                key={type.title}
                className={`rounded-2xl bg-white border border-neutral-200 p-5 hover:shadow-md transition-all duration-500 flex flex-col ${s4.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}
                style={{ transitionDelay: `${idx * 120}ms` }}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${type.bg}`}>
                  <type.icon className={`text-sm ${type.ic}`} />
                </div>
                <h3 className="text-sm font-bold text-neutral-900 mb-1">{type.title}</h3>
                <p className="text-xs text-neutral-500 mb-3 leading-relaxed">
                  {type.title === 'Freelancers' && (
                    <>
                      Showcase your reel and let productions
                      <br />
                      find and hire you.
                    </>
                  )}
                  {type.title === 'Vendors' && (
                    <>
                      List equipment and get discovered by
                      <br />
                      active productions.
                    </>
                  )}
                  {type.title === 'Production Companies' && type.description}
                </p>
                <ul className="space-y-1.5 mb-4 flex-1">
                  {type.checks.map((c) => (
                    <li key={c} className="flex items-start gap-1.5">
                      <FaCircleCheck className="text-[#22C55E] mt-0.5 shrink-0 text-[10px]" />
                      <span className="text-xs text-neutral-600">{c}</span>
                    </li>
                  ))}
                </ul>
                <Link to={type.to} className={`rounded-xl w-full py-2 text-xs font-bold text-center transition-all ${type.bg} ${type.ic} hover:opacity-80`}>
                  {type.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────── */}
      <section ref={s5.ref} className="bg-[#3678F1] py-14 sm:py-18 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/5 rounded-full pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-72 h-72 bg-[#F4C430]/10 rounded-full pointer-events-none" />

        <div className={`max-w-lg mx-auto px-5 text-center relative z-10 transition-all duration-700 ${s5.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 leading-snug">
            Ready to transform your <br /> production workflow?
          </h2>
          <p className="text-sm text-blue-100 mb-7 leading-relaxed">
            Join CrewCall and replace scattered hiring with a structured platform built for film and advertising.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/register" className="inline-flex justify-center items-center rounded-xl bg-[#F4C430] text-white px-7 py-3 text-sm font-bold hover:bg-[#e6b820] transition-all hover:-translate-y-0.5">
              Create Free Account
            </Link>
            <Link to="/login" className="inline-flex justify-center items-center rounded-xl border-2 border-white/30 text-white px-7 py-3 text-sm font-bold hover:bg-white/10 transition-all">
              Sign In
            </Link>
          </div>
        </div>
      </section>

      <AppFooter variant="inverted" />
    </div>
  );
}
