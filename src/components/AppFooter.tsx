import { Link } from 'react-router-dom';

const footerLinks = [
  { title: 'Help Center', href: '#' },
  { title: 'Privacy Policy', href: '#' },
  { title: 'Terms of Service', href: '#' },
];

export default function AppFooter() {
  return (
    <footer className="border-t border-neutral-200 bg-white py-8">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-8 lg:px-16">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-neutral-600 text-sm">© 2025 CrewCall. All rights reserved.</p>
          <div className="flex items-center gap-6 sm:gap-8">
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
