import { Link } from 'react-router-dom';

const footerLinks = [
  { title: 'Help Center', href: '#' },
  { title: 'Privacy Policy', href: '#' },
  { title: 'Terms of Service', href: '#' },
];

export default function AppFooter() {
  return (
    <footer className="border-t border-neutral-200 bg-white py-6 sm:py-8 shrink-0 overflow-hidden">
      <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 md:px-8 lg:px-16 min-w-0 max-w-full">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left flex-wrap sm:flex-nowrap min-w-0">
          <p className="text-neutral-600 text-xs sm:text-sm order-2 sm:order-1">© 2025 CrewCall. All rights reserved.</p>
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-4 sm:gap-6 md:gap-8 order-1 sm:order-2">
            {footerLinks.map((link) => (
              <Link
                key={link.title}
                to={link.href}
                className="text-neutral-600 hover:text-neutral-900 text-sm"
              >
                {link.title}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
