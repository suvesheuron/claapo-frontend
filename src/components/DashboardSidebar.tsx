import { Link, useLocation } from 'react-router-dom';
import type { ComponentType, SVGProps } from 'react';
import { useChatUnread } from '../contexts/ChatUnreadContext';

export interface NavItem {
  icon: ComponentType<SVGProps<SVGSVGElement> & { className?: string }>;
  label: string;
  to: string;
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

  return (
    <aside className="hidden lg:flex lg:flex-col w-56 xl:w-60 shrink-0 bg-white border-r border-neutral-200 overflow-hidden">
      <nav className="flex-1 overflow-y-auto p-3 pt-4 space-y-0.5">
        {links.map((item) => {
          const active = isActive(item.to);
          const showChatBadge = item.to === CHAT_PATH && totalUnread > 0;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                active
                  ? 'bg-[#EEF4FF] text-[#3678F1]'
                  : 'text-neutral-600 hover:bg-[#F3F4F6] hover:text-neutral-900'
              }`}
            >
              <item.icon
                className={`w-4 h-4 shrink-0 transition-colors ${
                  active ? 'text-[#3678F1]' : 'text-neutral-400'
                }`}
              />
              <span className="flex-1">{item.label}</span>
              {showChatBadge && (
                <span className="min-w-[18px] h-[18px] rounded-full bg-[#F40F02] text-white text-[10px] font-bold flex items-center justify-center px-1.5">
                  {totalUnread > 99 ? '99+' : totalUnread}
                </span>
              )}
              {active && !showChatBadge && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#3678F1] shrink-0" />
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
