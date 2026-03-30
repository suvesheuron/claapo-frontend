import { Link, useLocation } from 'react-router-dom';
import type { ComponentType, SVGProps } from 'react';
import { useChatUnread } from '../contexts/ChatUnreadContext';

export interface NavItem {
  icon: ComponentType<SVGProps<SVGSVGElement> & { className?: string }>;
  label: string;
  to: string;
  section?: string;
}

interface Props {
  links: NavItem[];
}

const CHAT_PATH = '/dashboard/conversations';

export default function DashboardSidebar({ links }: Props) {
  const { pathname } = useLocation();
  const { totalUnread } = useChatUnread();

  const isActive = (to: string) => {
    if (to === '/dashboard') return pathname === '/dashboard';
    return pathname === to || pathname.startsWith(to + '/');
  };

  // Group links by section, preserving order
  const sections: { label: string | null; items: NavItem[] }[] = [];
  let currentSection: string | null | undefined = undefined;

  for (const item of links) {
    const sec = item.section ?? null;
    if (sec !== currentSection) {
      sections.push({ label: sec, items: [item] });
      currentSection = sec;
    } else {
      sections[sections.length - 1].items.push(item);
    }
  }

  return (
    <aside className="hidden lg:flex lg:flex-col w-56 xl:w-60 shrink-0 bg-white/60 backdrop-blur-xl border-r border-neutral-100/80 overflow-hidden relative z-20">
      <nav className="flex-1 overflow-y-auto px-4 pt-6 pb-6 scrollbar-hide">
        {sections.map((section, sIdx) => (
          <div key={sIdx} className={sIdx > 0 ? 'mt-8' : ''}>
            {section.label && (
              <div className="px-3 mb-2.5 text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400 select-none">
                {section.label}
              </div>
            )}
            <div className="space-y-1">
              {section.items.map((item) => {
                const active = isActive(item.to);
                const showChatBadge = item.to === CHAT_PATH && totalUnread > 0;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`group relative flex items-center gap-3.5 px-3.5 py-2.5 rounded-2xl text-[13px] font-bold transition-all duration-300 ${
                      active
                        ? 'bg-gradient-to-r from-[#EEF4FF] border border-[#3B5BDB]/10 to-transparent text-[#3B5BDB]'
                        : 'text-neutral-500 hover:bg-neutral-50 border border-transparent hover:text-neutral-900'
                    }`}
                  >
                    {/* Left accent bar for active state */}
                    {active && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-[#3B5BDB]" />
                    )}
                    <item.icon
                      className={`w-[15px] h-[15px] shrink-0 transition-colors duration-150 ${
                        active ? 'text-[#3B5BDB]' : 'text-neutral-400 group-hover:text-neutral-500'
                      }`}
                    />
                    <span className="flex-1 truncate">{item.label}</span>
                    {showChatBadge && (
                      <span className="min-w-[18px] h-[18px] rounded-full bg-[#F40F02] text-white text-[10px] font-bold flex items-center justify-center px-1.5">
                        {totalUnread > 99 ? '99+' : totalUnread}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom subtle area */}
      <div className="px-4 py-3 border-t border-neutral-200/50">
        <p className="text-[10px] text-neutral-400 tracking-wide">v1.0 &middot; Claapo</p>
      </div>
    </aside>
  );
}
