import { Link } from 'react-router-dom';

const footerLinks = [
  { title: 'Help Center', href: '#' },
  { title: 'Privacy Policy', href: '#' },
  { title: 'Terms', href: '#' },
];

export default function AppFooter() {
  return (
    <footer className="border-t border-neutral-200 bg-white py-3 shrink-0">
      <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 min-w-0">
        <p className="text-neutral-400 text-xs">© 2026 CrewCall. All rights reserved.</p>
        <div className="flex items-center gap-5">
          {footerLinks.map((link) => (
            <Link
              key={link.title}
              to={link.href}
              className="text-neutral-400 hover:text-neutral-600 text-xs transition-colors"
            >
              {link.title}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
