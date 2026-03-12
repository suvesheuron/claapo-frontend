import { Link } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import {
  FaVideo, FaUsers, FaTruck, FaCircleCheck,
  FaArrowRight, FaMagnifyingGlass, FaCalendarCheck,
  FaCheck, FaPlay, FaLock, FaLayerGroup,
  // FaLocationDot kept for potential future use
} from 'react-icons/fa6';
import AppHeader from '../components/AppHeader';
import AppFooter from '../components/AppFooter';
import speakerImg from '../assets/speaker.png';

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

const testimonials = [
  {
    quote: '"The 3D visualization of my schedule is a game changer. I can finally see my entire month\'s workload at a glance."',
    name: 'Priya Sharma', role: 'Executive Producer', initials: 'PS', color: 'bg-purple-500',
  },
  {
    quote: '"CrewCall reduced our pre-production time by 40%. No more WhatsApp chaos."',
    name: 'Rahul Verma', role: 'Line Producer', initials: 'RV', color: 'bg-blue-500',
  },
  {
    quote: '"Finally, a platform that understands how equipment rentals actually work. The inventory tracking is superb."',
    name: 'Amit Patel', role: 'Rental House Owner', initials: 'AP', color: 'bg-emerald-500',
  },
];

const avatarColors = ['bg-purple-500', 'bg-blue-500', 'bg-emerald-500'];
const avatarInitials = ['PS', 'RV', 'AP'];


export default function LandingPage() {
  useEffect(() => { document.title = 'CrewCall – Run Film Productions Without the Chaos'; }, []);

  const hero     = useInView(0.05);
  const ecosystem = useInView();
  const feat     = useInView();
  const hiw      = useInView();
  const reviews  = useInView();
  const ctaRef   = useInView();

  return (
    <div className="flex flex-col w-full" style={{ background: '#eef5fd' }}>
      <AppHeader variant="landing" />

      {/* ── HERO ──────────────────────────────────────── */}
      <section
        ref={hero.ref}
        className="relative overflow-hidden py-20 lg:py-28"
        style={{ background: 'linear-gradient(145deg, #a8c8f0 0%, #c2dcf7 30%, #d8eaf9 60%, #eaf3fd 100%)' }}
      >
        {/* Soft radial glow top-left */}
        <div className="absolute -top-24 -left-24 w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(168,200,240,0.5) 0%, transparent 70%)' }} />

        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <div
            className={`flex flex-col lg:flex-row lg:items-center lg:justify-between gap-10 transition-all duration-700 ${
              hero.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
          >

            {/* Left – Text */}
            <div className="max-w-xl">
              <h1 className="text-5xl lg:text-[60px] font-extrabold text-[#0f172a] leading-[1.08] mb-6 tracking-tight">
                Run Film<br />
                Productions<br />
                <span className="text-[#3B5BDB]">Without</span><br />
                the Chaos.
              </h1>
              <p className="text-[15px] text-slate-500 leading-relaxed mb-9 max-w-[400px]">
                Hire verified crew, book vendors, manage schedules, and track projects,
                an all in one vibrant platform built for modern film &amp; advertising teams.
              </p>

              <div className="flex flex-wrap gap-3 mb-9">
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center rounded-xl bg-[#3B5BDB] text-white px-7 py-3.5 text-sm font-bold hover:bg-[#2f4ac2] transition-all shadow-xl shadow-[#3B5BDB]/30 hover:-translate-y-0.5"
                >
                  Start for Free
                </Link>
                <Link
                  to="/dashboard"
                  className="inline-flex items-center justify-center gap-2.5 rounded-xl bg-white/70 backdrop-blur border border-white text-[#3B5BDB] px-7 py-3.5 text-sm font-bold hover:bg-white transition-all shadow-sm"
                >
                  <div className="w-5 h-5 rounded-full bg-[#3B5BDB] flex items-center justify-center shrink-0">
                    <FaPlay className="text-white text-[8px] ml-[1px]" />
                  </div>
                  Watch Demo
                </Link>
              </div>

              {/* Social proof */}
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {avatarInitials.map((init, i) => (
                    <div
                      key={i}
                      className={`w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold text-white shadow-sm ${avatarColors[i]}`}
                    >
                      {init}
                    </div>
                  ))}
                  <div className="w-8 h-8 rounded-full border-2 border-white bg-[#3B5BDB] flex items-center justify-center text-[9px] font-bold text-white shadow-sm">
                    +2k
                  </div>
                </div>
                <p className="text-sm text-slate-500">Join 2,000+ Pros in Mumbai &amp; Delhi</p>
              </div>
            </div>

            {/* Right – Speaker visual */}
            <div className="hidden lg:flex flex-1 justify-end">
              <div className="relative w-full max-w-md">
                <div className="absolute inset-0 blur-3xl bg-gradient-to-tr from-[#3B5BDB]/20 via-sky-300/20 to-indigo-400/10 rounded-[40px] pointer-events-none" />
                <div className="relative rounded-[32px] overflow-hidden border border-white/40 shadow-2xl shadow-[#3B5BDB]/30 bg-slate-950">
                  <img
                    src={speakerImg}
                    alt="Announce your productions without the chaos"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── ECOSYSTEM ─────────────────────────────────── */}
      <section
        id="ecosystem"
        ref={ecosystem.ref}
        className="py-20"
        style={{ background: 'linear-gradient(180deg, #e5f0fc 0%, #eef5fd 100%)' }}
      >
        <div className="max-w-6xl mx-auto px-6">
          <div className={`text-center mb-14 transition-all duration-700 ${ecosystem.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
            <p className="text-xs font-bold tracking-[0.2em] text-[#3B5BDB] uppercase mb-3">The Ecosystem</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#0f172a] mb-4">Built for the entire crew.</h2>
            <p className="text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
              Whether you're behind the camera, running the production, or supplying the gear, CrewCall connects the dots.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Freelancers */}
            <div
              className={`bg-white rounded-2xl shadow-sm border border-slate-100 p-8 flex flex-col transition-all duration-700 ${ecosystem.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
              style={{ transitionDelay: '0ms' }}
            >
              <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center mb-6">
                <FaUsers className="text-[#3B5BDB] text-lg" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Freelancers</h3>
              <p className="text-sm text-slate-500 leading-relaxed mb-6">
                Manage your availability, showcase your portfolio to top agencies, and get paid faster.
              </p>
              <ul className="space-y-2.5 mb-8 flex-1">
                {['Live Calendar', 'Digital Showreel', 'One-click Invoicing'].map(item => (
                  <li key={item} className="flex items-center gap-2.5">
                    <FaCheck className="text-[#3B5BDB] text-[11px] shrink-0" />
                    <span className="text-sm text-slate-600">{item}</span>
                  </li>
                ))}
              </ul>
              <Link
                to="/register/individual"
                className="text-sm font-semibold text-[#3B5BDB] hover:underline inline-flex items-center gap-1.5"
              >
                Join as Freelancer <FaArrowRight className="text-xs" />
              </Link>
            </div>

            {/* Production Houses – highlighted */}
            <div
              className={`bg-[#3B5BDB] rounded-2xl shadow-xl p-8 flex flex-col transition-all duration-700 ${ecosystem.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
              style={{ transitionDelay: '100ms' }}
            >
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center mb-6">
                <FaVideo className="text-white text-lg" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Production Houses</h3>
              <p className="text-sm text-blue-100 leading-relaxed mb-6">
                Centralize your hiring. Search verified crew, check real-time availability, and lock bookings instantly.
              </p>
              <ul className="space-y-2.5 mb-8 flex-1">
                {['Verified Database', 'Project Management', 'Team Collaboration'].map(item => (
                  <li key={item} className="flex items-center gap-2.5">
                    <FaCircleCheck className="text-white text-[11px] shrink-0" />
                    <span className="text-sm text-blue-100">{item}</span>
                  </li>
                ))}
              </ul>
              <Link
                to="/register/company"
                className="text-sm font-semibold text-white hover:text-blue-100 inline-flex items-center gap-1.5 transition-colors"
              >
                Get Company Access <FaArrowRight className="text-xs" />
              </Link>
            </div>

            {/* Vendors */}
            <div
              className={`bg-white rounded-2xl shadow-sm border border-slate-100 p-8 flex flex-col transition-all duration-700 ${ecosystem.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
              style={{ transitionDelay: '200ms' }}
            >
              <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center mb-6">
                <FaTruck className="text-[#3B5BDB] text-lg" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Vendors</h3>
              <p className="text-sm text-slate-500 leading-relaxed mb-6">
                List your equipment inventory, manage rental calendars, and receive direct quote requests.
              </p>
              <ul className="space-y-2.5 mb-8 flex-1">
                {['Inventory Tracking', 'Rental Calendar', 'Direct Bookings'].map(item => (
                  <li key={item} className="flex items-center gap-2.5">
                    <FaCheck className="text-[#3B5BDB] text-[11px] shrink-0" />
                    <span className="text-sm text-slate-600">{item}</span>
                  </li>
                ))}
              </ul>
              <Link
                to="/register/vendor"
                className="text-sm font-semibold text-[#3B5BDB] hover:underline inline-flex items-center gap-1.5"
              >
                List Equipment <FaArrowRight className="text-xs" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ──────────────────────────────────── */}
      <section
        id="features"
        ref={feat.ref}
        className="py-24"
        style={{ background: 'linear-gradient(180deg, #eef5fd 0%, #e8f2fb 50%, #eef5fd 100%)' }}
      >
        <div className="max-w-6xl mx-auto px-6 space-y-28">

          {/* Feature 1 – Calendar */}
          <div className={`grid grid-cols-1 lg:grid-cols-2 gap-16 items-center transition-all duration-700 ${feat.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            {/* Calendar mockup */}
            <div className="flex justify-center">
              <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-7 w-full max-w-[320px]">
                <div className="flex items-center justify-between mb-6">
                  <span className="font-bold text-slate-900">Availability</span>
                  <div className="flex gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-red-400 inline-block"></span>
                    <span className="w-3 h-3 rounded-full bg-yellow-400 inline-block"></span>
                    <span className="w-3 h-3 rounded-full bg-green-400 inline-block"></span>
                  </div>
                </div>
                <div className="flex gap-1 mb-6">
                  {[12,13,14,15,16,17,18].map(d => (
                    <div
                      key={d}
                      className={`flex flex-col items-center gap-1.5 flex-1 py-2 rounded-xl ${d === 14 ? 'bg-[#3B5BDB]' : ''}`}
                    >
                      <span className={`text-xs font-medium ${d === 14 ? 'text-white' : 'text-slate-400'}`}>{d}</span>
                      {d === 14 && <span className="w-1.5 h-1.5 rounded-full bg-white inline-block"></span>}
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-4">
                  <div className="w-1 h-10 bg-[#3B5BDB] rounded-full shrink-0"></div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Coca-Cola TVC</p>
                    <p className="text-xs text-slate-400 mt-0.5">09:00 AM - 06:00 PM · Studio 4</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Text */}
            <div>
              <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center mb-6">
                <FaCalendarCheck className="text-[#3B5BDB] text-xl" />
              </div>
              <h3 className="text-3xl font-bold text-slate-900 mb-4 leading-snug">Real-time Centralized Calendar</h3>
              <p className="text-sm text-slate-500 leading-relaxed mb-7">
                Stop playing phone tag. Our calendar-centric interface gives you instant visibility into who is free, who is on hold, and who is booked. Changes update instantly for everyone.
              </p>
              <ul className="space-y-4">
                {[
                  { title: 'Instant Availability Checks', desc: "See who's free without calling." },
                  { title: 'Hold vs. Lock', desc: 'Distinguish between tentative holds and confirmed bookings with clear status indicators.' },
                ].map(item => (
                  <li key={item.title} className="flex items-start gap-3">
                    <FaCheck className="text-[#3B5BDB] text-xs mt-1 shrink-0" />
                    <p className="text-sm text-slate-600 leading-relaxed">
                      <span className="font-semibold text-slate-900">{item.title}:</span> {item.desc}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Feature 2 – Hiring Workflow */}
          <div
            className={`grid grid-cols-1 lg:grid-cols-2 gap-16 items-center transition-all duration-700 ${feat.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
            style={{ transitionDelay: '150ms' }}
          >
            {/* Text */}
            <div>
              <div className="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center mb-6">
                <FaLayerGroup className="text-purple-600 text-xl" />
              </div>
              <h3 className="text-3xl font-bold text-slate-900 mb-4 leading-snug">Structured Hiring Workflows</h3>
              <p className="text-sm text-slate-500 leading-relaxed mb-7">
                Move from "Available?" to "Booked" in record time. Our workflow tools handle the negotiation, confirmation, and call sheet distribution automatically.
              </p>
              <ul className="space-y-4">
                {[
                  { title: 'Bulk Requests', desc: 'Send availability checks to multiple pros at once.' },
                  { title: 'Automated Contracts', desc: 'Generate deal memos with one click.' },
                ].map(item => (
                  <li key={item.title} className="flex items-start gap-3">
                    <FaCheck className="text-purple-600 text-xs mt-1 shrink-0" />
                    <p className="text-sm text-slate-600 leading-relaxed">
                      <span className="font-semibold text-slate-900">{item.title}:</span> {item.desc}
                    </p>
                  </li>
                ))}
              </ul>
            </div>

            {/* Workflow mockup */}
            <div className="flex justify-center">
              <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-6 w-full max-w-[320px]">
                {[1, 2, 3].map(n => (
                  <div
                    key={n}
                    className={`flex items-center gap-4 p-4 rounded-xl mb-3 last:mb-0 ${n === 2 ? 'bg-blue-50 border border-blue-200' : 'bg-slate-50'}`}
                  >
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${n === 2 ? 'bg-[#3B5BDB] text-white' : 'bg-slate-200 text-slate-400'}`}
                    >
                      {n}
                    </div>
                    {n === 2 ? (
                      <>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-900">Booking Confirmed</p>
                          <p className="text-xs text-slate-400 mt-0.5">Deal memo sent to 3 crew members.</p>
                        </div>
                        <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center shrink-0">
                          <FaCheck className="text-white text-[8px]" />
                        </div>
                      </>
                    ) : (
                      <div className="flex-1 h-2 bg-slate-200 rounded-full" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────── */}
      <section
        id="how-it-works"
        ref={hiw.ref}
        className="py-24"
        style={{ background: 'linear-gradient(180deg, #e8f2fb 0%, #eef5fd 100%)' }}
      >
        <div className="max-w-5xl mx-auto px-6">
          <div className={`text-center mb-16 transition-all duration-700 ${hiw.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3">How CrewCall Works</h2>
            <p className="text-sm text-slate-500">Three simple steps to your next production.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { num: '1', Icon: FaMagnifyingGlass, title: 'Search', desc: 'Filter by role, location, equipment, and dates to find the perfect match.' },
              { num: '2', Icon: FaCalendarCheck,   title: 'Book',   desc: 'Send booking requests directly. Negotiate rates and lock dates instantly.' },
              { num: '3', Icon: FaLock,            title: 'Manage', desc: 'Distribute call sheets, track hours, and handle payments in one dashboard.' },
            ].map((step, idx) => (
              <div
                key={step.title}
                className={`flex flex-col items-center text-center transition-all duration-700 ${hiw.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}
                style={{ transitionDelay: `${idx * 120}ms` }}
              >
                <div className="w-16 h-16 rounded-full bg-white shadow-md flex items-center justify-center mb-5">
                  <step.Icon className="text-[#3B5BDB] text-xl" />
                </div>
                <p className="text-base font-bold text-slate-900 mb-2">{step.num}. {step.title}</p>
                <p className="text-sm text-slate-500 leading-relaxed max-w-[200px]">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ──────────────────────────────── */}
      <section
        ref={reviews.ref}
        className="py-24"
        style={{ background: 'linear-gradient(180deg, #e8f2fb 0%, #eef5fd 100%)' }}
      >
        <div className="max-w-6xl mx-auto px-6">
          <div className={`text-center mb-14 transition-all duration-700 ${reviews.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Trusted by the best in the business</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {testimonials.map((t, idx) => (
              /* Outer wrapper has padding so the overflowing bubble has room */
              <div
                key={t.name}
                className={`relative pt-5 pl-5 transition-all duration-700 ${reviews.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}
                style={{ transitionDelay: `${idx * 100}ms` }}
              >
                {/* Quote bubble — floats outside the card at top-left corner */}
                <div className="absolute top-0 left-0 z-10 w-10 h-10 rounded-full bg-[#3B5BDB] flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-xl leading-none" style={{ marginTop: '-1px' }}>"</span>
                </div>

                <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-7 flex flex-col h-full">
                  <p className="text-sm text-slate-600 leading-relaxed mb-7 flex-1 mt-1 italic">{t.quote}</p>
                  {/* Person */}
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full ${t.color} flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm`}>
                      {t.initials}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{t.name}</p>
                      <p className="text-xs text-slate-400">{t.role}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────── */}
      <section
        ref={ctaRef.ref}
        className="py-6 pb-24"
        style={{ background: 'linear-gradient(180deg, #eef5fd 0%, #e8f2fb 100%)' }}
      >
        <div className="max-w-3xl mx-auto px-6">
          <div
            className={`rounded-3xl p-14 text-center transition-all duration-700 ${ctaRef.visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
            style={{ background: 'linear-gradient(135deg, #3B5BDB 0%, #4B6CF7 100%)' }}
          >
            <h2 className="text-3xl font-bold text-white mb-4 leading-snug">
              Ready to streamline<br />your production?
            </h2>
            <p className="text-sm text-blue-100 mb-9 leading-relaxed">
              Join thousands of professionals who are hiring smarter, not harder.<br />
              Start your free trial today.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-5">
              <Link
                to="/register"
                className="inline-flex justify-center items-center rounded-xl bg-white text-[#3B5BDB] px-8 py-3.5 text-sm font-bold hover:bg-blue-50 transition-all hover:-translate-y-0.5 shadow-md"
              >
                Get Started for Free
              </Link>
              <Link
                to="#pricing"
                className="inline-flex justify-center items-center rounded-xl border-2 border-white/40 text-white px-8 py-3.5 text-sm font-bold hover:bg-white/10 transition-all"
              >
                View Pricing Plans
              </Link>
            </div>
            <p className="text-xs text-blue-200">No credit card required for freelancers.</p>
          </div>
        </div>
      </section>

      <AppFooter variant="dark" />
    </div>
  );
}
