import { Link } from 'react-router-dom';
import { FaLinkedin, FaInstagram, FaXTwitter, FaYoutube, FaLocationDot, FaEnvelope, FaPhone } from 'react-icons/fa6';

interface AppFooterProps {
  variant?: 'light' | 'inverted' | 'dark';
}

const currentYear = new Date().getFullYear();

export default function AppFooter({ variant = 'light' }: AppFooterProps) {

  /* ── Dark multi-column footer (landing page) ── */
  if (variant === 'dark') {
    return (
      <footer className="bg-[#0f172a] text-white pt-16 pb-8">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-10 pb-12 border-b border-white/10">

            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <img src="/claapo-logo-white.svg" alt="Claapo" className="h-12 w-auto" />
              </div>
              <p className="text-sm text-slate-400 leading-relaxed mb-6 max-w-xs">
                The centralized operating system for the film &amp; advertising production industry. Hire crew, book vendors, manage projects &mdash; all in one place.
              </p>
              <div className="flex items-center gap-3">
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                  <FaLinkedin className="text-slate-300 text-sm" />
                </a>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                  <FaInstagram className="text-slate-300 text-sm" />
                </a>
                <a href="https://x.com" target="_blank" rel="noopener noreferrer" aria-label="X / Twitter" className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                  <FaXTwitter className="text-slate-300 text-sm" />
                </a>
                <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                  <FaYoutube className="text-slate-300 text-sm" />
                </a>
              </div>
            </div>

            {/* Platform */}
            <div>
              <h4 className="text-sm font-semibold mb-5">Platform</h4>
              <ul className="space-y-3">
                <li><Link to="/register/individual" className="text-sm text-slate-400 hover:text-white transition-colors">For Freelancers</Link></li>
                <li><Link to="/register/company" className="text-sm text-slate-400 hover:text-white transition-colors">For Agencies</Link></li>
                <li><Link to="/register/vendor" className="text-sm text-slate-400 hover:text-white transition-colors">For Vendors</Link></li>
                <li><a href="/#features" className="text-sm text-slate-400 hover:text-white transition-colors">Features</a></li>
                <li><a href="/#how-it-works" className="text-sm text-slate-400 hover:text-white transition-colors">How It Works</a></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-sm font-semibold mb-5">Company</h4>
              <ul className="space-y-3">
                <li><Link to="/about" className="text-sm text-slate-400 hover:text-white transition-colors">About Us</Link></li>
                <li><Link to="/contact" className="text-sm text-slate-400 hover:text-white transition-colors">Contact</Link></li>
                <li><Link to="/privacy" className="text-sm text-slate-400 hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms" className="text-sm text-slate-400 hover:text-white transition-colors">Terms of Service</Link></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-sm font-semibold mb-5">Get in Touch</h4>
              <ul className="space-y-3">
                <li className="flex items-center gap-2.5 text-sm text-slate-400">
                  <FaLocationDot className="text-slate-500 shrink-0" />
                  Mumbai, India
                </li>
                <li className="flex items-center gap-2.5 text-sm text-slate-400">
                  <FaEnvelope className="text-slate-500 shrink-0" />
                  <a href="mailto:hello@crewcall.in" className="hover:text-white transition-colors">hello@crewcall.in</a>
                </li>
                <li className="flex items-center gap-2.5 text-sm text-slate-400">
                  <FaPhone className="text-slate-500 shrink-0" />
                  <a href="tel:+919876543210" className="hover:text-white transition-colors">+91 98765 43210</a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-sm text-slate-500">&copy; {currentYear} Claapo. All rights reserved.</p>
            <div className="flex gap-5">
              <Link to="/privacy" className="text-sm text-slate-500 hover:text-white transition-colors">Privacy</Link>
              <Link to="/terms" className="text-sm text-slate-500 hover:text-white transition-colors">Terms</Link>
              <Link to="/contact" className="text-sm text-slate-500 hover:text-white transition-colors">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    );
  }

  /* ── Light / Inverted (used on inner pages) ── */
  const inverted = variant === 'inverted';

  return (
    <footer className={`py-3 shrink-0 ${inverted ? 'bg-[#3B5BDB]' : 'border-t border-neutral-200 bg-white'}`}>
      <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 min-w-0">
        <p className={`${inverted ? 'text-white' : 'text-neutral-400'} text-xs`}>
          &copy; {currentYear} Claapo. All rights reserved.
        </p>
        <div className="flex items-center gap-5">
          {[
            { title: 'Help Center', to: '/contact' },
            { title: 'Privacy Policy', to: '/privacy' },
            { title: 'Terms', to: '/terms' },
          ].map(link => (
            <Link
              key={link.title}
              to={link.to}
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
