import { Link } from 'react-router-dom';
import { FaVideo, FaLinkedin, FaInstagram, FaLocationDot, FaEnvelope } from 'react-icons/fa6';

interface AppFooterProps {
  variant?: 'light' | 'inverted' | 'dark';
}

export default function AppFooter({ variant = 'light' }: AppFooterProps) {

  /* ── Dark multi-column footer (landing page) ── */
  if (variant === 'dark') {
    return (
      <footer className="bg-[#0f172a] text-white pt-16 pb-8">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10 pb-12 border-b border-white/10">

            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-xl bg-[#3B5BDB] flex items-center justify-center shrink-0">
                  <FaVideo className="text-white text-sm" />
                </div>
                <span className="text-base font-bold">CrewCall</span>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed mb-6">
                The centralized operating system for the advertising production industry.
              </p>
              <div className="flex items-center gap-3">
                <a href="#" aria-label="LinkedIn" className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                  <FaLinkedin className="text-slate-300 text-sm" />
                </a>
                <a href="#" aria-label="Instagram" className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                  <FaInstagram className="text-slate-300 text-sm" />
                </a>
              </div>
            </div>

            {/* Platform */}
            <div>
              <h4 className="text-sm font-semibold mb-5">Platform</h4>
              <ul className="space-y-3">
                {['Freelancers', 'Agencies', 'Vendors', 'Pricing'].map(item => (
                  <li key={item}>
                    <a href="#" className="text-sm text-slate-400 hover:text-white transition-colors">{item}</a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-sm font-semibold mb-5">Company</h4>
              <ul className="space-y-3">
                {['About Us', 'Careers', 'Blog', 'Contact'].map(item => (
                  <li key={item}>
                    <a href="#" className="text-sm text-slate-400 hover:text-white transition-colors">{item}</a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-sm font-semibold mb-5">Contact</h4>
              <ul className="space-y-3">
                <li className="flex items-center gap-2.5 text-sm text-slate-400">
                  <FaLocationDot className="text-slate-500 shrink-0" />
                  Mumbai, India
                </li>
                <li className="flex items-center gap-2.5 text-sm text-slate-400">
                  <FaEnvelope className="text-slate-500 shrink-0" />
                  hello@crewcall.in
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-sm text-slate-500">© 2024 CrewCall. All rights reserved.</p>
            <div className="flex gap-5">
              <a href="#" className="text-sm text-slate-500 hover:text-white transition-colors">Privacy</a>
              <a href="#" className="text-sm text-slate-500 hover:text-white transition-colors">Terms</a>
            </div>
          </div>
        </div>
      </footer>
    );
  }

  /* ── Light / Inverted (used on inner pages) ── */
  const inverted = variant === 'inverted';
  const footerLinks = [
    { title: 'Help Center', href: '#' },
    { title: 'Privacy Policy', href: '#' },
    { title: 'Terms', href: '#' },
  ];

  return (
    <footer className={`py-3 shrink-0 ${inverted ? 'bg-[#3678F1]' : 'border-t border-neutral-200 bg-white'}`}>
      <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 min-w-0">
        <p className={`${inverted ? 'text-white' : 'text-neutral-400'} text-xs`}>
          © 2026 CrewCall. All rights reserved.
        </p>
        <div className="flex items-center gap-5">
          {footerLinks.map(link => (
            <Link
              key={link.title}
              to={link.href}
              className={`${inverted ? 'text-white hover:text-white/80' : 'text-neutral-400 hover:text-neutral-600'} text-xs transition-colors`}
            >
              {link.title}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
