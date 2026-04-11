import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FaBell, FaChevronDown, FaRightFromBracket, FaCircle,
  FaUser, FaCalendarDays, FaFileInvoice, FaCircleQuestion,
  FaRegBell, FaBars,
} from 'react-icons/fa6';
import Avatar from './Avatar';
import { useAuth } from '../contexts/AuthContext';
import { useSidebar } from '../contexts/SidebarContext';
import { useApiQuery } from '../hooks/useApiQuery';
import { api } from '../services/api';

type DashboardHeaderProps = {
  userName?: string;
  userAvatar?: string;
};

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
  data?: Record<string, unknown>;
}

interface NotificationsResponse {
  items: NotificationItem[];
  meta: { unreadCount: number };
}

function timeAgo(iso: string): string {
  const sec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (sec < 60) return 'Just now';
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  if (sec < 604800) return `${Math.floor(sec / 86400)}d ago`;
  return 'Earlier';
}

const ROLE_LABELS: Record<string, { label: string; bg: string; text: string }> = {
  company:    { label: 'Company',    bg: 'bg-blue-50',    text: 'text-[#3B5BDB]'    },
  individual: { label: 'Individual', bg: 'bg-emerald-50', text: 'text-emerald-700'  },
  vendor:     { label: 'Vendor',     bg: 'bg-purple-50',  text: 'text-purple-700'   },
  admin:      { label: 'Admin',      bg: 'bg-amber-50',   text: 'text-amber-700'    },
};

export default function DashboardHeader({ userName: propUserName, userAvatar: propUserAvatar }: DashboardHeaderProps) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen]   = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef  = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const { open: sidebarOpen, toggleSidebar } = useSidebar();

  const profilePath =
    user?.role === 'company' ? '/dashboard/company-profile' : user?.role === 'vendor' ? '/dashboard/vendor-profile' : '/dashboard/profile';
  const schedulePath =
    user?.role === 'company'
      ? '/dashboard/company-availability'
      : user?.role === 'vendor'
        ? '/dashboard/vendor-availability'
        : '/dashboard/availability';

  const { data: notifData, refetch: refetchNotifs } = useApiQuery<NotificationsResponse>(isAuthenticated ? '/notifications?limit=20' : null);
  const notifications = notifData?.items ?? [];
  const unreadCount = notifData?.meta?.unreadCount ?? 0;

  interface MeResponse { profile?: { companyName?: string; displayName?: string; avatarUrl?: string | null } | null; isMainUser?: boolean }
  const { data: meData } = useApiQuery<MeResponse>(isAuthenticated ? '/profile/me' : null);
  const profile = meData?.profile;
  const isMainUser = meData?.isMainUser !== false;

  const displayName = propUserName ?? profile?.companyName ?? profile?.displayName ?? user?.email?.split('@')[0] ?? 'Account';
  const userAvatar = propUserAvatar ?? profile?.avatarUrl ?? undefined;
  const roleInfo = user?.role ? ROLE_LABELS[user.role] : undefined;

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (userRef.current  && !userRef.current.contains(e.target as Node))  setUserOpen(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      refetchNotifs();
    } catch {
      refetchNotifs();
    }
  };

  const handleLogout = async () => {
    setUserOpen(false);
    await logout();
    navigate('/login');
  };

  /* Shared classes for consistent 40x40 icon buttons */
  const iconBtn =
    'relative w-10 h-10 rounded-xl flex items-center justify-center text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800 active:scale-95 transition-all duration-150';

  return (
    <header className="h-16 bg-white/85 backdrop-blur-xl shrink-0 flex items-stretch overflow-visible z-30 relative border-b border-neutral-100 shadow-[0_1px_0_0_rgba(15,23,42,0.02)]">
      {/* ════════ LOGO (aligned with sidebar on desktop) ════════ */}
      <Link
        to="/dashboard"
        aria-label="Claapo — Dashboard"
        className="hidden lg:flex items-center w-56 xl:w-50 shrink-0 px-5 border-r border-neutral-100 self-stretch group"
      >
        <img
          src="/claapo-logo.svg"
          alt="Claapo"
          className="h-[18px] w-auto max-w-[90px] object-contain object-left select-none transition-transform duration-200 group-hover:-translate-x-0.5"
          draggable={false}
        />
      </Link>

      {/* ════════ MOBILE: HAMBURGER + LOGO ════════ */}
      <div className="lg:hidden flex items-center gap-2 pl-3 pr-2 shrink-0 self-stretch">
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label="Toggle navigation menu"
          aria-expanded={sidebarOpen}
          aria-controls="dashboard-sidebar"
          className={iconBtn}
        >
          <FaBars className="w-[18px] h-[18px]" />
        </button>
        <Link to="/dashboard" className="flex items-center self-stretch pl-1 pr-2">
          <img
            src="/claapo-logo.svg"
            alt="Claapo"
            className="h-[18px] w-auto max-w-[96px] object-contain object-left select-none"
            draggable={false}
          />
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-end gap-1 sm:gap-1.5 px-4 sm:px-5 min-w-0">

        {/* ════════ NOTIFICATIONS ════════ */}
        <div ref={notifRef} className="relative">
          <button
            type="button"
            onClick={() => { setNotifOpen((v) => !v); setUserOpen(false); }}
            className={`${iconBtn} ${notifOpen ? 'bg-neutral-100 text-neutral-800' : ''}`}
            aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
          >
            {notifOpen ? <FaBell className="w-[18px] h-[18px]" /> : <FaRegBell className="w-[18px] h-[18px]" />}
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#F40F02] text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white shadow-sm">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-[calc(100%+10px)] w-[360px] bg-white rounded-2xl border border-neutral-200/80 shadow-xl shadow-neutral-900/10 overflow-hidden z-50 animate-[fadeIn_150ms_ease-out]">
              <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
                <div className="flex items-center gap-2.5">
                  <span className="text-sm font-bold text-neutral-900">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 bg-[#F40F02] text-white rounded-full leading-none">{unreadCount} new</span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button type="button" onClick={markAllRead} className="text-[11px] text-[#3B5BDB] hover:text-[#2B4BC9] font-semibold transition-colors">
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-[360px] overflow-y-auto divide-y divide-neutral-100">
                {notifications.length === 0 ? (
                  <div className="px-6 py-12 text-center">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-neutral-100 flex items-center justify-center">
                      <FaRegBell className="text-neutral-400 text-lg" />
                    </div>
                    <p className="text-sm font-semibold text-neutral-600">You're all caught up</p>
                    <p className="text-xs text-neutral-400 mt-1">New notifications will appear here</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`flex gap-3 px-5 py-3.5 transition-all duration-150 cursor-default hover:bg-neutral-50 ${!n.readAt ? 'bg-[#F8FAFF]' : 'bg-white'}`}
                    >
                      <div className="shrink-0 mt-1.5">
                        {!n.readAt
                          ? <FaCircle className="text-[#3B5BDB] text-[8px]" />
                          : <FaCircle className="text-neutral-200 text-[8px]" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`text-[12.5px] font-semibold truncate leading-snug ${!n.readAt ? 'text-neutral-900' : 'text-neutral-600'}`}>{n.title}</p>
                        <p className="text-[11px] text-neutral-500 leading-relaxed mt-0.5 line-clamp-2">{n.body}</p>
                        <p className="text-[10px] text-neutral-400 mt-1.5 font-medium">{timeAgo(n.createdAt)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="px-5 py-3 border-t border-neutral-100 bg-neutral-50/70 text-center">
                <button
                  type="button"
                  className="text-xs font-semibold text-neutral-500 hover:text-neutral-800 transition-colors"
                  onClick={() => setNotifOpen(false)}
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Separator */}
        <div className="hidden sm:block w-px h-6 bg-neutral-200 mx-1" />

        {/* ════════ USER MENU ════════ */}
        <div ref={userRef} className="relative">
          <button
            type="button"
            onClick={() => { setUserOpen((v) => !v); setNotifOpen(false); }}
            aria-expanded={userOpen}
            aria-haspopup="menu"
            className={`flex items-center gap-2.5 h-10 pl-1.5 pr-3 rounded-xl border transition-all duration-150 min-w-0 ${
              userOpen
                ? 'bg-neutral-100 border-neutral-200 shadow-sm'
                : 'bg-transparent border-transparent hover:bg-neutral-100 hover:border-neutral-200/70'
            }`}
          >
            <div className="relative shrink-0">
              <Avatar src={userAvatar} name={displayName} size="sm" />
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
            </div>
            <div className="hidden md:flex flex-col items-start leading-tight min-w-0 max-w-[160px] lg:max-w-[200px]">
              <span className="text-[13px] font-semibold text-neutral-800 truncate max-w-full">{displayName}</span>
              {roleInfo && (
                <span className="text-[10px] font-medium text-neutral-400 truncate max-w-full">
                  {roleInfo.label}{!isMainUser ? ' · Sub-User' : ''}
                </span>
              )}
            </div>
            <FaChevronDown className={`w-3 h-3 text-neutral-400 hidden md:inline shrink-0 transition-transform duration-200 ${userOpen ? 'rotate-180' : ''}`} />
          </button>

          {userOpen && (
            <div className="absolute right-0 top-[calc(100%+10px)] w-64 bg-white rounded-2xl border border-neutral-200/80 shadow-xl shadow-neutral-900/10 overflow-hidden z-50 animate-[fadeIn_150ms_ease-out]">
              {/* Gradient header with avatar + role */}
              <div className="px-5 pt-5 pb-4 bg-gradient-to-br from-[#EEF4FF] via-[#F8FAFF] to-white border-b border-neutral-100">
                <div className="flex items-center gap-3">
                  <div className="relative shrink-0">
                    <Avatar src={userAvatar} name={displayName} size="md" />
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-bold text-neutral-900 truncate">{displayName}</p>
                    <p className="text-[11px] text-neutral-500 truncate">{user?.email ?? ''}</p>
                  </div>
                </div>
                {roleInfo && (
                  <div className="flex items-center gap-1.5 mt-3">
                    <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full ${roleInfo.bg} ${roleInfo.text}`}>
                      {roleInfo.label}
                    </span>
                    {!isMainUser && (
                      <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
                        Sub-User
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="p-1.5" role="menu">
                <Link
                  to={profilePath}
                  onClick={() => setUserOpen(false)}
                  role="menuitem"
                  className="w-full flex items-center gap-3 h-10 px-3 rounded-lg text-[13px] text-neutral-700 hover:bg-neutral-100 transition-all duration-150 font-medium"
                >
                  <span className="inline-flex items-center justify-center w-5 h-5 text-neutral-400">
                    <FaUser className="w-[15px] h-[15px]" />
                  </span>
                  My profile
                </Link>
                <Link
                  to={schedulePath}
                  onClick={() => setUserOpen(false)}
                  role="menuitem"
                  className="w-full flex items-center gap-3 h-10 px-3 rounded-lg text-[13px] text-neutral-700 hover:bg-neutral-100 transition-all duration-150 font-medium"
                >
                  <span className="inline-flex items-center justify-center w-5 h-5 text-neutral-400">
                    <FaCalendarDays className="w-[15px] h-[15px]" />
                  </span>
                  Schedule
                </Link>
                {user?.role !== 'admin' && (
                  <Link
                    to="/dashboard/invoices"
                    onClick={() => setUserOpen(false)}
                    role="menuitem"
                    className="w-full flex items-center gap-3 h-10 px-3 rounded-lg text-[13px] text-neutral-700 hover:bg-neutral-100 transition-all duration-150 font-medium"
                  >
                    <span className="inline-flex items-center justify-center w-5 h-5 text-neutral-400">
                      <FaFileInvoice className="w-[15px] h-[15px]" />
                    </span>
                    Invoices
                  </Link>
                )}
                <Link
                  to="/about"
                  onClick={() => setUserOpen(false)}
                  role="menuitem"
                  className="w-full flex items-center gap-3 h-10 px-3 rounded-lg text-[13px] text-neutral-700 hover:bg-neutral-100 transition-all duration-150 font-medium"
                >
                  <span className="inline-flex items-center justify-center w-5 h-5 text-neutral-400">
                    <FaCircleQuestion className="w-[15px] h-[15px]" />
                  </span>
                  Help &amp; support
                </Link>

                <div className="h-px bg-neutral-100 my-1.5 mx-1" />

                <button
                  type="button"
                  onClick={handleLogout}
                  role="menuitem"
                  className="w-full flex items-center gap-3 h-10 px-3 rounded-lg text-[13px] text-red-600 hover:bg-red-50 transition-all duration-150 font-medium"
                >
                  <span className="inline-flex items-center justify-center w-5 h-5">
                    <FaRightFromBracket className="w-[15px] h-[15px]" />
                  </span>
                  Log out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
