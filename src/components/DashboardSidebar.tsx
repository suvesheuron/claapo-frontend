import { Link, useLocation } from 'react-router-dom';
import { useMemo, type ComponentType, type SVGProps } from 'react';
import { FaXmark } from 'react-icons/fa6';
import { useChatUnread } from '../contexts/ChatUnreadContext';
import { useNavBadges } from '../contexts/NavBadgesContext';
import { useSidebar } from '../contexts/SidebarContext';

/** Declarative badge source for a nav item. The sidebar resolves the
 *  actual count at render time from the matching context. */
export type NavBadgeKey = 'chat' | 'cancelRequests' | 'projectRequests' | 'invoices';

export interface NavItem {
  icon: ComponentType<SVGProps<SVGSVGElement> & { className?: string }>;
  label: string;
  to: string;
  section?: string;
  badgeKey?: NavBadgeKey;
}

interface Props {
  links: NavItem[];
}

/**
 * Longest-prefix-match active selection.
 *
 * Rules:
 *  • `/dashboard` only highlights on an exact match — otherwise every
 *    subpage would also light it up.
 *  • Any other link matches when the current pathname equals `to` or
 *    starts with `to + '/'`.
 *  • If multiple links match, the longest (most specific) wins — so
 *    `/projects/42` highlights "Projects", not "Dashboard".
 */
function useActiveNav(links: NavItem[], pathname: string): string | null {
  return useMemo(() => {
    let bestTo: string | null = null;
    let bestLen = -1;
    for (const item of links) {
      const to = item.to;
      let len = -1;
      if (to === '/dashboard') {
        if (pathname === '/dashboard') len = to.length;
      } else if (pathname === to || pathname.startsWith(to + '/')) {
        len = to.length;
      }
      if (len > bestLen) {
        bestLen = len;
        bestTo = to;
      }
    }
    return bestTo;
  }, [links, pathname]);
}

export default function DashboardSidebar({ links }: Props) {
  const { pathname } = useLocation();
  const { totalUnread } = useChatUnread();
  const { cancelRequestsCount, projectRequestsCount, invoiceAlertsCount } = useNavBadges();
  const { open: drawerOpen, closeSidebar } = useSidebar();
  const activeTo = useActiveNav(links, pathname);

  /** Map a NavItem's badge key to its live count. Returns 0 when no key is set. */
  const resolveBadge = (key?: NavBadgeKey): number => {
    switch (key) {
      case 'chat':            return totalUnread;
      case 'cancelRequests':  return cancelRequestsCount;
      case 'projectRequests': return projectRequestsCount;
      case 'invoices':        return invoiceAlertsCount;
      default:                return 0;
    }
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

  /* Shared nav body used by both desktop (static) and mobile (drawer). */
  const navBody = (
    <>
      <nav className="flex-1 overflow-y-auto px-3 pt-5 pb-6 scrollbar-hide">
        {sections.map((section, sIdx) => (
          <div key={sIdx} className={sIdx > 0 ? 'mt-6' : ''}>
            {section.label && (
              <div className="flex items-center gap-2 px-3 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-400 dark:text-neutral-500 select-none">
                  {section.label}
                </span>
                <div className="flex-1 h-px bg-neutral-100 dark:bg-[#1F2940]" />
              </div>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const active = activeTo === item.to;
                const badgeCount = resolveBadge(item.badgeKey);
                const showBadge = badgeCount > 0;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    aria-current={active ? 'page' : undefined}
                    onClick={closeSidebar}
                    className={`group relative flex items-center gap-3 h-10 px-3 rounded-xl text-[13px] font-semibold transition-all duration-200 ${
                      active
                        ? 'bg-[#E8F0FE] dark:bg-[#15264A] text-[#2563EB] dark:text-[#60A5FA] shadow-sm shadow-[#3678F1]/10'
                        : 'text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-[#1E2640] hover:text-neutral-900 dark:hover:text-neutral-100'
                    }`}
                  >
                    {/* Left accent bar — only on active */}
                    <span
                      aria-hidden
                      className={`absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full transition-all duration-200 ${
                        active ? 'h-5 bg-[#3678F1] dark:bg-[#60A5FA]' : 'h-0 bg-transparent'
                      }`}
                    />
                    <span
                      className={`inline-flex items-center justify-center w-5 h-5 shrink-0 transition-colors duration-150 ${
                        active ? 'text-[#3678F1] dark:text-[#60A5FA]' : 'text-neutral-400 dark:text-neutral-500 group-hover:text-neutral-700 dark:group-hover:text-neutral-200'
                      }`}
                    >
                      <item.icon className="w-[16px] h-[16px]" />
                    </span>
                    <span className="flex-1 truncate">{item.label}</span>
                    {showBadge && (
                      <span
                        aria-label={`${badgeCount} pending`}
                        className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-[#F40F02] text-white text-[10px] font-bold tabular-nums shadow-sm shadow-[#F40F02]/30"
                      >
                        {badgeCount > 99 ? '99+' : badgeCount}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-neutral-100 dark:border-[#1F2940] flex items-center justify-between">
        <p className="text-[10px] font-semibold text-neutral-400 dark:text-neutral-500 tracking-wide">v1.0 &middot; Claapo</p>
        <span className="inline-flex items-center gap-1 text-[10px] text-neutral-400 dark:text-neutral-500">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Online
        </span>
      </div>
    </>
  );

  return (
    <>
      {/* ════════ DESKTOP: static aside, part of the flex row ════════ */}
      <aside
        className="hidden lg:flex lg:flex-col w-56 xl:w-60 shrink-0 bg-white/70 dark:bg-[#05070D]/90 backdrop-blur-xl border-r border-neutral-100 dark:border-[#1F2940] overflow-hidden relative z-20"
      >
        {navBody}
      </aside>

      {/* ════════ MOBILE: slide-in drawer + backdrop ════════ */}
      {/* Backdrop */}
      <div
        onClick={closeSidebar}
        aria-hidden={!drawerOpen}
        className={`lg:hidden fixed inset-0 z-40 bg-neutral-900/50 dark:bg-black/70 backdrop-blur-sm transition-opacity duration-300 ${
          drawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />
      {/* Drawer */}
      <aside
        id="dashboard-sidebar"
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        className={`lg:hidden fixed top-0 left-0 bottom-0 z-50 w-[280px] max-w-[82vw] bg-white dark:bg-[#05070D] border-r border-neutral-100 dark:border-[#1F2940] shadow-2xl shadow-neutral-900/20 dark:shadow-black/60 flex flex-col transform transition-transform duration-300 ease-out ${
          drawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Drawer header: logo + close */}
        <div className="h-16 shrink-0 flex items-center justify-between px-5 border-b border-neutral-100 dark:border-[#1F2940]">
          <Link to="/dashboard" onClick={closeSidebar} className="flex items-center">
            <img
              src="/claapo-logo.svg"
              alt="Claapo"
              className="h-[18px] w-auto max-w-[104px] object-contain object-left select-none dark:brightness-0 dark:invert"
              draggable={false}
            />
          </Link>
          <button
            type="button"
            onClick={closeSidebar}
            aria-label="Close menu"
            className="w-9 h-9 rounded-lg flex items-center justify-center text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-[#1E2640] hover:text-neutral-800 dark:hover:text-neutral-100 active:scale-95 transition-all duration-150"
          >
            <FaXmark className="w-[18px] h-[18px]" />
          </button>
        </div>

        {navBody}
      </aside>
    </>
  );
}
