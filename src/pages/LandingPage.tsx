import { Link } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import {
  FaVideo, FaUsers, FaTruck, FaCircleCheck,
  FaArrowRight, FaMagnifyingGlass, FaCalendarCheck,
  FaCheck, FaPlay, FaLock, FaLayerGroup,
  FaComments, FaFileInvoiceDollar, FaBolt, FaShieldHalved,
  FaChartLine, FaCirclePlay, FaStar, FaGear,
  FaChevronDown, FaChevronUp,
} from 'react-icons/fa6';
import AppHeader from '../components/AppHeader';
import AppFooter from '../components/AppFooter';
import speakerImg from '../assets/speaker.png';

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

/* ── Animated counter hook ── */
function useCounter(end: number, visible: boolean, duration = 1600) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!visible) return;
    let frame: number;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [visible, end, duration]);
  return count;
}

/* ── Data ── */
const testimonials = [
  {
    quote: '"The 3D visualization of my schedule is a game changer. I can finally see my entire month\'s workload at a glance."',
    name: 'Priya Sharma', role: 'Executive Producer', initials: 'PS', color: 'bg-purple-500',
  },
  {
    quote: '"Claapo reduced our pre-production time by 40%. No more WhatsApp chaos."',
    name: 'Rahul Verma', role: 'Line Producer', initials: 'RV', color: 'bg-blue-500',
  },
  {
    quote: '"Finally, a platform that understands how equipment rentals actually work. The inventory tracking is superb."',
    name: 'Amit Patel', role: 'Rental House Owner', initials: 'AP', color: 'bg-emerald-500',
  },
  {
    quote: '"The invoicing feature alone saves me hours every week. No more chasing payments over email."',
    name: 'Sneha Kapoor', role: 'Freelance DOP', initials: 'SK', color: 'bg-amber-500',
  },
];

const avatarColors = ['bg-purple-500', 'bg-blue-500', 'bg-emerald-500'];
const avatarInitials = ['PS', 'RV', 'AP'];

const faqs = [
  { q: 'Is Claapo free for freelancers?', a: 'Yes! Freelancers can create a profile, manage their availability calendar, and respond to booking requests completely free of charge. Premium features like priority listing and advanced analytics are available with optional paid plans.' },
  { q: 'How does the booking workflow work?', a: 'Production companies search for crew or vendors, send booking requests with project details and rate offers. Crew members can accept or decline. Once accepted, the booking is locked to prevent double-booking. The entire flow is tracked with status updates and notifications.' },
  { q: 'Can I manage multiple projects at once?', a: 'Absolutely. The dashboard gives you a bird\'s-eye view of all your active projects, crew assignments, and timelines. You can manage schedules, bookings, and invoices across unlimited projects simultaneously.' },
  { q: 'How do payments and invoicing work?', a: 'Claapo includes built-in invoicing with line items, GST calculation, and payment tracking. Freelancers and vendors can generate professional invoices in one click. Payments are processed securely through integrated payment gateways.' },
  { q: 'Is my data secure on Claapo?', a: 'We take security seriously. All data is encrypted in transit and at rest. We use industry-standard authentication with JWT tokens, and sensitive information like bank details are handled with the highest level of care.' },
  { q: 'What types of vendors can join?', a: 'We welcome all production service vendors including equipment rental houses, lighting companies, transportation providers, catering services, and more. Each vendor type gets specialized features for managing their inventory and bookings.' },
];


export default function LandingPage() {
  useEffect(() => { document.title = 'Claapo \u2013 Run Film Productions Without the Chaos'; }, []);

  const hero      = useInView(0.05);
  const trusted   = useInView(0.1);
  const stats     = useInView(0.15);
  const ecosystem = useInView();
  const feat1     = useInView(0.1);
  const feat2     = useInView(0.1);
  const feat3     = useInView(0.1);
  const feat4     = useInView(0.1);
  const hiw       = useInView();
  const reviews   = useInView();
  const faqRef    = useInView();
  const ctaRef    = useInView();

  /* Stats counters */
  const statProjects   = useCounter(500, stats.visible);
  const statCrew       = useCounter(2000, stats.visible);
  const statBookings   = useCounter(10000, stats.visible);
  const statCities     = useCounter(15, stats.visible);

  /* FAQ state */
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="flex flex-col w-full" style={{ background: '#eef5fd' }}>
      <AppHeader variant="landing" />

      {/* ══════════════════════════════════════════════════════
          HERO
         ══════════════════════════════════════════════════════ */}
      <section
        ref={hero.ref}
        className="relative overflow-hidden py-20 lg:py-28"
        style={{ background: 'linear-gradient(145deg, #a8c8f0 0%, #c2dcf7 30%, #d8eaf9 60%, #eaf3fd 100%)' }}
      >
        <div className="absolute -top-24 -left-24 w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(168,200,240,0.5) 0%, transparent 70%)' }} />

        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <div className={`flex flex-col lg:flex-row lg:items-center lg:justify-between gap-10 transition-all duration-700 ${hero.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>

            {/* Left */}
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 bg-white/60 backdrop-blur rounded-full px-4 py-1.5 mb-6 border border-white/80">
                <FaBolt className="text-amber-500 text-xs" />
                <span className="text-xs font-semibold text-slate-700">India's #1 Film Production Platform</span>
              </div>
              <h1 className="text-5xl lg:text-[60px] font-extrabold text-[#0f172a] leading-[1.08] mb-6 tracking-tight">
                Run Film<br />
                Productions<br />
                <span className="text-[#3B5BDB]">Without</span><br />
                the Chaos.
              </h1>
              <p className="text-[15px] text-slate-500 leading-relaxed mb-9 max-w-[420px]">
                Hire verified crew, book vendors, manage schedules, and track projects &mdash;
                an all-in-one platform built for modern film &amp; advertising teams.
              </p>

              <div className="flex flex-wrap gap-3 mb-9">
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center rounded-xl bg-[#3B5BDB] text-white px-7 py-3.5 text-sm font-bold hover:bg-[#2f4ac2] transition-all shadow-xl shadow-[#3B5BDB]/30 hover:-translate-y-0.5"
                >
                  Start for Free <FaArrowRight className="ml-2 text-xs" />
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
                    <div key={i} className={`w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold text-white shadow-sm ${avatarColors[i]}`}>
                      {init}
                    </div>
                  ))}
                  <div className="w-8 h-8 rounded-full border-2 border-white bg-[#3B5BDB] flex items-center justify-center text-[9px] font-bold text-white shadow-sm">+2k</div>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-700">2,000+ Professionals</p>
                  <p className="text-xs text-slate-400">in Mumbai, Delhi &amp; Bangalore</p>
                </div>
              </div>
            </div>

            {/* Right */}
            <div className="hidden lg:flex flex-1 justify-end">
              <div className="relative w-full max-w-md">
                <div className="absolute inset-0 blur-3xl bg-gradient-to-tr from-[#3B5BDB]/20 via-sky-300/20 to-indigo-400/10 rounded-[40px] pointer-events-none" />
                <div className="relative rounded-[32px] overflow-hidden">
                  <img src={speakerImg} alt="Announce your productions without the chaos" className="w-full h-full object-cover" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          TRUSTED BY
         ══════════════════════════════════════════════════════ */}
      <section ref={trusted.ref} className="py-10 border-b border-slate-200/60" style={{ background: '#f0f6fd' }}>
        <div className={`max-w-5xl mx-auto px-6 transition-all duration-700 ${trusted.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <p className="text-center text-xs font-semibold text-slate-400 tracking-[0.15em] uppercase mb-8">Trusted by production teams across India</p>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4">
            {['Ad Agencies', 'Film Studios', 'OTT Platforms', 'Independent Producers', 'Music Video Teams'].map((name) => (
              <div key={name} className="flex items-center gap-2 text-slate-300">
                <FaStar className="text-xs" />
                <span className="text-sm font-semibold tracking-wide">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          STATS
         ══════════════════════════════════════════════════════ */}
      <section ref={stats.ref} className="py-16" style={{ background: 'linear-gradient(180deg, #f0f6fd 0%, #e5f0fc 100%)' }}>
        <div className={`max-w-5xl mx-auto px-6 transition-all duration-700 ${stats.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { value: `${statCrew.toLocaleString()}+`, label: 'Verified Professionals' },
              { value: `${statProjects}+`, label: 'Projects Managed' },
              { value: `${statBookings.toLocaleString()}+`, label: 'Bookings Completed' },
              { value: `${statCities}+`, label: 'Cities Covered' },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-2xl p-6 text-center shadow-sm border border-slate-100">
                <p className="text-3xl sm:text-4xl font-extrabold text-[#3B5BDB] mb-1">{s.value}</p>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          ECOSYSTEM
         ══════════════════════════════════════════════════════ */}
      <section id="ecosystem" ref={ecosystem.ref} className="py-20" style={{ background: 'linear-gradient(180deg, #e5f0fc 0%, #eef5fd 100%)' }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className={`text-center mb-14 transition-all duration-700 ${ecosystem.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
            <p className="text-xs font-bold tracking-[0.2em] text-[#3B5BDB] uppercase mb-3">The Ecosystem</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#0f172a] mb-4">Built for the entire crew.</h2>
            <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
              Whether you're behind the camera, running the production, or supplying the gear &mdash; Claapo connects every stakeholder.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Freelancers */}
            <div className={`bg-white rounded-2xl shadow-sm border border-slate-100 p-8 flex flex-col transition-all duration-700 ${ecosystem.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`} style={{ transitionDelay: '0ms' }}>
              <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center mb-6">
                <FaUsers className="text-[#3B5BDB] text-lg" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Freelancers</h3>
              <p className="text-sm text-slate-500 leading-relaxed mb-6">Get discovered by top agencies, manage your schedule, and get paid faster.</p>
              <ul className="space-y-2.5 mb-8 flex-1">
                {['Live Availability Calendar', 'Professional Profile & Showreel', 'One-click Invoicing with GST', 'Booking Notifications', 'Past Work Portfolio'].map(item => (
                  <li key={item} className="flex items-center gap-2.5">
                    <FaCheck className="text-[#3B5BDB] text-[11px] shrink-0" />
                    <span className="text-sm text-slate-600">{item}</span>
                  </li>
                ))}
              </ul>
              <Link to="/register/individual" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#3B5BDB] hover:underline mt-auto">
                Join as Freelancer <FaArrowRight className="text-xs" />
              </Link>
            </div>

            {/* Production Houses */}
            <div className={`bg-[#3B5BDB] rounded-2xl shadow-xl p-8 flex flex-col transition-all duration-700 ${ecosystem.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`} style={{ transitionDelay: '100ms' }}>
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center mb-6">
                <FaVideo className="text-white text-lg" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Production Houses</h3>
              <p className="text-sm text-blue-100 leading-relaxed mb-6">Centralize hiring, manage projects end-to-end, and collaborate with your team.</p>
              <ul className="space-y-2.5 mb-8 flex-1">
                {['Verified Crew Database', 'Project & Budget Management', 'Team Collaboration & Sub-users', 'Real-time Availability Checks', 'Integrated Payments'].map(item => (
                  <li key={item} className="flex items-center gap-2.5">
                    <FaCircleCheck className="text-white text-[11px] shrink-0" />
                    <span className="text-sm text-blue-100">{item}</span>
                  </li>
                ))}
              </ul>
              <Link to="/register/company" className="inline-flex items-center gap-1.5 text-sm font-semibold text-white hover:text-blue-100 transition-colors mt-auto">
                Get Company Access <FaArrowRight className="text-xs" />
              </Link>
            </div>

            {/* Vendors */}
            <div className={`bg-white rounded-2xl shadow-sm border border-slate-100 p-8 flex flex-col transition-all duration-700 ${ecosystem.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`} style={{ transitionDelay: '200ms' }}>
              <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center mb-6">
                <FaTruck className="text-[#3B5BDB] text-lg" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Vendors</h3>
              <p className="text-sm text-slate-500 leading-relaxed mb-6">List equipment, manage rental calendars, and receive direct booking requests.</p>
              <ul className="space-y-2.5 mb-8 flex-1">
                {['Equipment Inventory Management', 'Rental Calendar & Scheduling', 'Direct Quote Requests', 'GST Verified Badges', 'Multi-city Availability'].map(item => (
                  <li key={item} className="flex items-center gap-2.5">
                    <FaCheck className="text-[#3B5BDB] text-[11px] shrink-0" />
                    <span className="text-sm text-slate-600">{item}</span>
                  </li>
                ))}
              </ul>
              <Link to="/register/vendor" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#3B5BDB] hover:underline mt-auto">
                List Equipment <FaArrowRight className="text-xs" />
              </Link>
            </div>
          </div>

          {/* Mid-section CTA */}
          <div className={`mt-12 text-center transition-all duration-700 ${ecosystem.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{ transitionDelay: '300ms' }}>
            <Link to="/register" className="inline-flex items-center gap-2 rounded-xl bg-[#3B5BDB] text-white px-8 py-3.5 text-sm font-bold hover:bg-[#2f4ac2] transition-all shadow-lg shadow-[#3B5BDB]/20 hover:-translate-y-0.5">
              Get Started for Free <FaArrowRight className="text-xs" />
            </Link>
            <p className="text-xs text-slate-400 mt-3">No credit card required</p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          FEATURES
         ══════════════════════════════════════════════════════ */}
      <section id="features" className="py-24" style={{ background: 'linear-gradient(180deg, #eef5fd 0%, #e8f2fb 50%, #eef5fd 100%)' }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-20">
            <p className="text-xs font-bold tracking-[0.2em] text-[#3B5BDB] uppercase mb-3">Features</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#0f172a] mb-4">Everything you need to run productions</h2>
            <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
              From discovering talent to processing payments &mdash; every step of your production workflow, streamlined.
            </p>
          </div>

          <div className="space-y-28">

            {/* Feature 1 — Calendar */}
            <div ref={feat1.ref} className={`grid grid-cols-1 lg:grid-cols-2 gap-16 items-center transition-all duration-700 ${feat1.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
              <div className="flex justify-center">
                <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-7 w-full max-w-[320px]">
                  <div className="flex items-center justify-between mb-6">
                    <span className="font-bold text-slate-900">Availability</span>
                    <div className="flex gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-red-400 inline-block" />
                      <span className="w-3 h-3 rounded-full bg-yellow-400 inline-block" />
                      <span className="w-3 h-3 rounded-full bg-green-400 inline-block" />
                    </div>
                  </div>
                  <div className="flex gap-1 mb-6">
                    {[12,13,14,15,16,17,18].map(d => (
                      <div key={d} className={`flex flex-col items-center gap-1.5 flex-1 py-2 rounded-xl ${d === 14 ? 'bg-[#3B5BDB]' : ''}`}>
                        <span className={`text-xs font-medium ${d === 14 ? 'text-white' : 'text-slate-400'}`}>{d}</span>
                        {d === 14 && <span className="w-1.5 h-1.5 rounded-full bg-white inline-block" />}
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-4">
                    <div className="w-1 h-10 bg-[#3B5BDB] rounded-full shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Coca-Cola TVC</p>
                      <p className="text-xs text-slate-400 mt-0.5">09:00 AM - 06:00 PM &middot; Studio 4</p>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center mb-6">
                  <FaCalendarCheck className="text-[#3B5BDB] text-xl" />
                </div>
                <h3 className="text-3xl font-bold text-slate-900 mb-4 leading-snug">Real-time Centralized Calendar</h3>
                <p className="text-sm text-slate-500 leading-relaxed mb-7">
                  Stop playing phone tag. Our calendar-centric interface gives you instant visibility into who is free, who is on hold, and who is booked. Changes update instantly for everyone.
                </p>
                <ul className="space-y-4 mb-8">
                  {[
                    { title: 'Instant Availability Checks', desc: "See who's free without calling." },
                    { title: 'Hold vs. Lock', desc: 'Distinguish between tentative holds and confirmed bookings with clear status indicators.' },
                    { title: 'Color-coded Statuses', desc: 'Available, Booked, Blocked, and Past Work at a glance.' },
                  ].map(item => (
                    <li key={item.title} className="flex items-start gap-3">
                      <FaCheck className="text-[#3B5BDB] text-xs mt-1 shrink-0" />
                      <p className="text-sm text-slate-600 leading-relaxed"><span className="font-semibold text-slate-900">{item.title}:</span> {item.desc}</p>
                    </li>
                  ))}
                </ul>
                <Link to="/register" className="inline-flex items-center gap-2 text-sm font-semibold text-[#3B5BDB] hover:underline">
                  Try the Calendar <FaArrowRight className="text-xs" />
                </Link>
              </div>
            </div>

            {/* Feature 2 — Smart Search */}
            <div ref={feat2.ref} className={`grid grid-cols-1 lg:grid-cols-2 gap-16 items-center transition-all duration-700 ${feat2.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
              <div className="order-2 lg:order-1">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center mb-6">
                  <FaMagnifyingGlass className="text-emerald-600 text-xl" />
                </div>
                <h3 className="text-3xl font-bold text-slate-900 mb-4 leading-snug">Smart Search &amp; Discovery</h3>
                <p className="text-sm text-slate-500 leading-relaxed mb-7">
                  Find the perfect crew member or vendor in seconds. Filter by role, skill, location, availability, and daily rate. Every profile is verified and up-to-date.
                </p>
                <ul className="space-y-4 mb-8">
                  {[
                    { title: 'Role-based Filtering', desc: 'Search for DOPs, editors, gaffers, makeup artists, and 20+ other roles.' },
                    { title: 'City & Availability', desc: 'Only see professionals who are actually available in your location.' },
                    { title: 'Vendor Categories', desc: 'Equipment, Lighting, Transport, Catering &mdash; find any production service.' },
                  ].map(item => (
                    <li key={item.title} className="flex items-start gap-3">
                      <FaCheck className="text-emerald-600 text-xs mt-1 shrink-0" />
                      <p className="text-sm text-slate-600 leading-relaxed"><span className="font-semibold text-slate-900">{item.title}:</span> <span dangerouslySetInnerHTML={{ __html: item.desc }} /></p>
                    </li>
                  ))}
                </ul>
                <Link to="/register" className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-600 hover:underline">
                  Start Searching <FaArrowRight className="text-xs" />
                </Link>
              </div>
              <div className="flex justify-center order-1 lg:order-2">
                <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-6 w-full max-w-[320px]">
                  <div className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-3 mb-4">
                    <FaMagnifyingGlass className="text-slate-300 text-sm" />
                    <span className="text-sm text-slate-400">Search crew by role, city...</span>
                  </div>
                  {[
                    { name: 'Arjun Mehra', role: 'Director of Photography', city: 'Mumbai', rate: '25,000', available: true },
                    { name: 'Kavitha R.', role: 'Sound Engineer', city: 'Chennai', rate: '12,000', available: true },
                    { name: 'Raj Khanna', role: 'Gaffer', city: 'Delhi', rate: '8,000', available: false },
                  ].map((p) => (
                    <div key={p.name} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors mb-1">
                      <div className="w-9 h-9 rounded-full bg-[#3B5BDB]/10 flex items-center justify-center text-xs font-bold text-[#3B5BDB] shrink-0">
                        {p.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">{p.name}</p>
                        <p className="text-xs text-slate-400 truncate">{p.role} &middot; {p.city}</p>
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${p.available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                        {p.available ? 'Available' : 'Booked'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Feature 3 — Booking Workflow */}
            <div ref={feat3.ref} className={`grid grid-cols-1 lg:grid-cols-2 gap-16 items-center transition-all duration-700 ${feat3.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
              <div className="flex justify-center">
                <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-6 w-full max-w-[320px]">
                  {[
                    { n: 1, label: 'Send Request', desc: 'Booking sent to crew member', done: true },
                    { n: 2, label: 'Booking Confirmed', desc: 'Deal memo sent to 3 crew members.', active: true },
                    { n: 3, label: 'Locked & Scheduled', desc: 'Ready for production', done: false },
                  ].map(step => (
                    <div key={step.n} className={`flex items-center gap-4 p-4 rounded-xl mb-3 last:mb-0 ${step.active ? 'bg-blue-50 border border-blue-200' : 'bg-slate-50'}`}>
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${step.active ? 'bg-[#3B5BDB] text-white' : step.done ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                        {step.done ? <FaCheck className="text-[8px]" /> : step.n}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900">{step.label}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{step.desc}</p>
                      </div>
                      {step.active && (
                        <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center shrink-0">
                          <FaCheck className="text-white text-[8px]" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center mb-6">
                  <FaLayerGroup className="text-purple-600 text-xl" />
                </div>
                <h3 className="text-3xl font-bold text-slate-900 mb-4 leading-snug">Structured Booking Workflows</h3>
                <p className="text-sm text-slate-500 leading-relaxed mb-7">
                  Move from "Available?" to "Locked" in record time. Send booking requests, negotiate rates, and lock confirmations &mdash; all tracked with status updates.
                </p>
                <ul className="space-y-4 mb-8">
                  {[
                    { title: 'One-click Booking Requests', desc: 'Send requests with project details and rate offers instantly.' },
                    { title: 'Accept, Decline, or Negotiate', desc: 'Crew members respond directly from their dashboard.' },
                    { title: 'Lock & Prevent Double-booking', desc: 'Once accepted, dates are locked across the platform.' },
                  ].map(item => (
                    <li key={item.title} className="flex items-start gap-3">
                      <FaCheck className="text-purple-600 text-xs mt-1 shrink-0" />
                      <p className="text-sm text-slate-600 leading-relaxed"><span className="font-semibold text-slate-900">{item.title}:</span> {item.desc}</p>
                    </li>
                  ))}
                </ul>
                <Link to="/register" className="inline-flex items-center gap-2 text-sm font-semibold text-purple-600 hover:underline">
                  Start Booking <FaArrowRight className="text-xs" />
                </Link>
              </div>
            </div>

            {/* Feature 4 — Chat & Invoicing */}
            <div ref={feat4.ref} className={`grid grid-cols-1 lg:grid-cols-2 gap-16 items-center transition-all duration-700 ${feat4.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
              <div className="order-2 lg:order-1">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center mb-6">
                  <FaFileInvoiceDollar className="text-amber-600 text-xl" />
                </div>
                <h3 className="text-3xl font-bold text-slate-900 mb-4 leading-snug">Chat, Invoicing &amp; Payments</h3>
                <p className="text-sm text-slate-500 leading-relaxed mb-7">
                  Communicate in real-time with project-based messaging. Generate GST-compliant invoices and track payments &mdash; all without leaving the platform.
                </p>
                <ul className="space-y-4 mb-8">
                  {[
                    { title: 'Project-based Messaging', desc: 'Direct chat with crew and vendors on shared projects.' },
                    { title: 'Professional Invoicing', desc: 'Line items, GST calculation, PAN & bank details built in.' },
                    { title: 'Integrated Payments', desc: 'UPI, card payments, and payment tracking via Razorpay.' },
                    { title: 'Document Attachments', desc: 'Attach contracts, receipts, and supporting documents to invoices.' },
                  ].map(item => (
                    <li key={item.title} className="flex items-start gap-3">
                      <FaCheck className="text-amber-600 text-xs mt-1 shrink-0" />
                      <p className="text-sm text-slate-600 leading-relaxed"><span className="font-semibold text-slate-900">{item.title}:</span> {item.desc}</p>
                    </li>
                  ))}
                </ul>
                <Link to="/register" className="inline-flex items-center gap-2 text-sm font-semibold text-amber-600 hover:underline">
                  Explore Invoicing <FaArrowRight className="text-xs" />
                </Link>
              </div>
              <div className="flex justify-center order-1 lg:order-2">
                <div className="space-y-4 w-full max-w-[320px]">
                  {/* Chat mockup */}
                  <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <FaComments className="text-[#3B5BDB] text-sm" />
                      <span className="text-sm font-bold text-slate-900">Project Chat</span>
                    </div>
                    <div className="space-y-2">
                      <div className="bg-slate-50 rounded-xl rounded-tl-sm px-3 py-2 max-w-[85%]">
                        <p className="text-xs text-slate-600">Hey, are you available for the 15th?</p>
                      </div>
                      <div className="bg-[#3B5BDB] rounded-xl rounded-tr-sm px-3 py-2 max-w-[85%] ml-auto">
                        <p className="text-xs text-white">Yes! I just marked those dates open.</p>
                      </div>
                      <div className="bg-slate-50 rounded-xl rounded-tl-sm px-3 py-2 max-w-[85%]">
                        <p className="text-xs text-slate-600">Great, sending the booking now.</p>
                      </div>
                    </div>
                  </div>
                  {/* Invoice mockup */}
                  <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-bold text-slate-900">Invoice #CC-1042</span>
                      <span className="text-[10px] font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Paid</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-400 mb-2">
                      <span>DOP Services (3 days)</span>
                      <span className="text-slate-700 font-medium">&#8377;75,000</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>GST (18%)</span>
                      <span className="text-slate-700 font-medium">&#8377;13,500</span>
                    </div>
                    <div className="border-t border-slate-100 mt-2 pt-2 flex justify-between text-sm font-bold text-slate-900">
                      <span>Total</span>
                      <span>&#8377;88,500</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          MORE FEATURES GRID
         ══════════════════════════════════════════════════════ */}
      <section className="py-20" style={{ background: 'linear-gradient(180deg, #e8f2fb 0%, #e5f0fc 100%)' }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0f172a] mb-3">And so much more...</h2>
            <p className="text-sm text-slate-500">Features designed for every aspect of production management.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { Icon: FaGear, title: 'Team Management', desc: 'Create sub-users, assign team members to projects, and collaborate seamlessly.', color: 'bg-indigo-100', iconColor: 'text-indigo-600' },
              { Icon: FaShieldHalved, title: 'GST Verification', desc: 'Verified badges build trust. Companies and vendors can showcase GST compliance.', color: 'bg-green-100', iconColor: 'text-green-600' },
              { Icon: FaChartLine, title: 'Admin Analytics', desc: 'Dashboard analytics for user activity, revenue tracking, and platform health.', color: 'bg-blue-100', iconColor: 'text-blue-600' },
              { Icon: FaCirclePlay, title: 'IMDB & Social Links', desc: 'Connect your IMDB, Instagram, and website to your Claapo profile.', color: 'bg-pink-100', iconColor: 'text-pink-600' },
              { Icon: FaTruck, title: 'Equipment Inventory', desc: 'Vendors can list cameras, lights, and gear with daily rates and availability.', color: 'bg-amber-100', iconColor: 'text-amber-600' },
              { Icon: FaLock, title: 'Secure & Reliable', desc: 'JWT authentication, encrypted data, and role-based access control.', color: 'bg-slate-100', iconColor: 'text-slate-600' },
            ].map(f => (
              <div key={f.title} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-7 hover:shadow-md transition-shadow">
                <div className={`w-11 h-11 rounded-xl ${f.color} flex items-center justify-center mb-4`}>
                  <f.Icon className={`${f.iconColor} text-base`} />
                </div>
                <h4 className="text-base font-bold text-slate-900 mb-2">{f.title}</h4>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
          {/* CTA */}
          <div className="mt-12 text-center">
            <Link to="/register" className="inline-flex items-center gap-2 rounded-xl bg-[#3B5BDB] text-white px-8 py-3.5 text-sm font-bold hover:bg-[#2f4ac2] transition-all shadow-lg shadow-[#3B5BDB]/20 hover:-translate-y-0.5">
              Get Started &mdash; It's Free <FaArrowRight className="text-xs" />
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          HOW IT WORKS
         ══════════════════════════════════════════════════════ */}
      <section id="how-it-works" ref={hiw.ref} className="py-24" style={{ background: 'linear-gradient(180deg, #e5f0fc 0%, #eef5fd 100%)' }}>
        <div className="max-w-5xl mx-auto px-6">
          <div className={`text-center mb-16 transition-all duration-700 ${hiw.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
            <p className="text-xs font-bold tracking-[0.2em] text-[#3B5BDB] uppercase mb-3">How It Works</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3">Three simple steps to your next production</h2>
            <p className="text-sm text-slate-500 max-w-md mx-auto">Get from brief to booked in minutes, not days.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { num: '1', Icon: FaMagnifyingGlass, title: 'Search', desc: 'Filter by role, location, equipment, and dates to find the perfect match.', color: 'bg-emerald-50', iconColor: 'text-emerald-600' },
              { num: '2', Icon: FaCalendarCheck,   title: 'Book',   desc: 'Send booking requests directly. Negotiate rates and lock dates instantly.', color: 'bg-blue-50', iconColor: 'text-[#3B5BDB]' },
              { num: '3', Icon: FaLock,            title: 'Manage', desc: 'Track projects, chat with crew, generate invoices, and handle payments.', color: 'bg-purple-50', iconColor: 'text-purple-600' },
            ].map((step, idx) => (
              <div key={step.title} className={`flex flex-col items-center text-center transition-all duration-700 ${hiw.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`} style={{ transitionDelay: `${idx * 120}ms` }}>
                <div className={`w-16 h-16 rounded-full ${step.color} shadow-md flex items-center justify-center mb-5`}>
                  <step.Icon className={`${step.iconColor} text-xl`} />
                </div>
                <p className="text-base font-bold text-slate-900 mb-2">{step.num}. {step.title}</p>
                <p className="text-sm text-slate-500 leading-relaxed max-w-[240px]">{step.desc}</p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-14 text-center">
            <Link to="/register" className="inline-flex items-center gap-2 rounded-xl border-2 border-[#3B5BDB] text-[#3B5BDB] px-8 py-3.5 text-sm font-bold hover:bg-[#3B5BDB] hover:text-white transition-all">
              Try It Now <FaArrowRight className="text-xs" />
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          TESTIMONIALS
         ══════════════════════════════════════════════════════ */}
      <section ref={reviews.ref} className="py-24" style={{ background: 'linear-gradient(180deg, #e8f2fb 0%, #eef5fd 100%)' }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className={`text-center mb-14 transition-all duration-700 ${reviews.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
            <p className="text-xs font-bold tracking-[0.2em] text-[#3B5BDB] uppercase mb-3">Testimonials</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">Trusted by the best in the business</h2>
            <p className="text-sm text-slate-500">Here's what production professionals are saying.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {testimonials.map((t, idx) => (
              <div key={t.name} className={`relative pt-5 pl-5 transition-all duration-700 ${reviews.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`} style={{ transitionDelay: `${idx * 100}ms` }}>
                <div className="absolute top-0 left-0 z-10 w-10 h-10 rounded-full bg-[#3B5BDB] flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-xl leading-none" style={{ marginTop: '-1px' }}>&ldquo;</span>
                </div>
                <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-7 flex flex-col h-full">
                  <p className="text-sm text-slate-600 leading-relaxed mb-7 flex-1 mt-1 italic">{t.quote}</p>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full ${t.color} flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm`}>{t.initials}</div>
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

      {/* ══════════════════════════════════════════════════════
          FAQ
         ══════════════════════════════════════════════════════ */}
      <section ref={faqRef.ref} className="py-24" style={{ background: 'linear-gradient(180deg, #eef5fd 0%, #e8f2fb 100%)' }}>
        <div className="max-w-3xl mx-auto px-6">
          <div className={`text-center mb-14 transition-all duration-700 ${faqRef.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
            <p className="text-xs font-bold tracking-[0.2em] text-[#3B5BDB] uppercase mb-3">FAQ</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">Frequently asked questions</h2>
            <p className="text-sm text-slate-500">Everything you need to know about Claapo.</p>
          </div>

          <div className={`space-y-3 transition-all duration-700 ${faqRef.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
            {faqs.map((faq, idx) => (
              <div key={idx} className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between gap-4 px-6 py-4 text-left hover:bg-slate-50 transition-colors"
                >
                  <span className="text-sm font-semibold text-slate-900">{faq.q}</span>
                  {openFaq === idx ? <FaChevronUp className="text-xs text-slate-400 shrink-0" /> : <FaChevronDown className="text-xs text-slate-400 shrink-0" />}
                </button>
                {openFaq === idx && (
                  <div className="px-6 pb-4">
                    <p className="text-sm text-slate-500 leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <p className="text-sm text-slate-500 mb-3">Still have questions?</p>
            <Link to="/contact" className="text-sm font-semibold text-[#3B5BDB] hover:underline">
              Contact our team <FaArrowRight className="inline text-xs ml-1" />
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          FINAL CTA
         ══════════════════════════════════════════════════════ */}
      <section ref={ctaRef.ref} className="py-6 pb-24" style={{ background: 'linear-gradient(180deg, #e8f2fb 0%, #eef5fd 100%)' }}>
        <div className="max-w-3xl mx-auto px-6">
          <div className={`rounded-3xl p-14 text-center transition-all duration-700 ${ctaRef.visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`} style={{ background: 'linear-gradient(135deg, #3B5BDB 0%, #4B6CF7 100%)' }}>
            <h2 className="text-3xl font-bold text-white mb-4 leading-snug">
              Ready to streamline<br />your production?
            </h2>
            <p className="text-sm text-blue-100 mb-9 leading-relaxed">
              Join thousands of professionals who are hiring smarter, not harder.<br />
              Start your free account today.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-5">
              <Link to="/register" className="inline-flex justify-center items-center rounded-xl bg-white text-[#3B5BDB] px-8 py-3.5 text-sm font-bold hover:bg-blue-50 transition-all hover:-translate-y-0.5 shadow-md">
                Get Started for Free
              </Link>
              <Link to="/contact" className="inline-flex justify-center items-center rounded-xl border-2 border-white/40 text-white px-8 py-3.5 text-sm font-bold hover:bg-white/10 transition-all">
                Talk to Sales
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
