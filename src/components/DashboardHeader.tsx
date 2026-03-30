import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaBell, FaChevronDown, FaRightFromBracket, FaCircle, FaUser, FaCalendarDays, FaFileInvoice, FaCircleQuestion } from 'react-icons/fa6';
import Avatar from './Avatar';
import { useAuth } from '../contexts/AuthContext';
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

export default function DashboardHeader({ userName: propUserName, userAvatar: propUserAvatar }: DashboardHeaderProps) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen]   = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef  = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();

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

  return (
    <header className="h-[64px] bg-white/80 backdrop-blur-xl shrink-0 flex items-stretch overflow-visible z-30 relative shadow-sm border-b border-neutral-100">
      {/* Desktop logo area aligned with sidebar */}
      <Link
        to="/dashboard"
        className="hidden lg:flex items-center justify-center gap-2 w-56 xl:w-60 shrink-0 px-4 border-r border-neutral-100/80 hover:bg-[#F8FAFC] transition-colors duration-150 self-stretch min-h-0"
      >
        <img src="/claapo-logo.svg" alt="Claapo" className="max-h-7 w-auto max-w-[140px] object-contain object-center" />
      </Link>

      {/* Mobile logo */}
      <Link to="/dashboard" className="lg:hidden flex items-center px-4 shrink-0 self-stretch">
        <img src="/claapo-logo.svg" alt="Claapo" className="max-h-7 w-auto max-w-[128px] object-contain" />
      </Link>

      <div className="flex-1 flex items-center justify-end gap-1.5 sm:gap-2.5 px-4 sm:px-6 lg:px-5 min-w-0">

        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <button
            type="button"
            onClick={() => { setNotifOpen((v) => !v); setUserOpen(false); }}
            className="relative w-9 h-9 rounded-lg flex items-center justify-center text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 transition-all duration-150"
            aria-label="Notifications"
          >
            <FaBell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-[#F40F02] ring-2 ring-white" />
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-[calc(100%+8px)] w-[340px] bg-white rounded-xl border border-neutral-200/80 shadow-lg shadow-neutral-900/[0.08] overflow-hidden z-50">
              <div className="flex items-center justify-between px-4 py-3.5 border-b border-neutral-100">
                <div className="flex items-center gap-2.5">
                  <span className="text-[13px] font-semibold text-neutral-900">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 bg-[#F40F02] text-white rounded-full leading-none">{unreadCount}</span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button type="button" onClick={markAllRead} className="text-[11px] text-[#3B5BDB] hover:text-[#2B4BC9] font-medium transition-colors">
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-neutral-100/80">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-xs text-neutral-400">No notifications yet</div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`flex gap-3 px-4 py-3.5 transition-all duration-150 cursor-default hover:bg-neutral-50 ${!n.readAt ? 'bg-[#F8FAFF]' : 'bg-white'}`}
                    >
                      <div className="shrink-0 mt-1">
                        {!n.readAt ? <FaCircle className="text-[#3B5BDB] text-[7px]" /> : <FaCircle className="text-neutral-200 text-[7px]" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`text-[12px] font-semibold truncate leading-snug ${!n.readAt ? 'text-neutral-900' : 'text-neutral-600'}`}>{n.title}</p>
                        <p className="text-[11px] text-neutral-500 leading-relaxed mt-0.5 line-clamp-2">{n.body}</p>
                        <p className="text-[10px] text-neutral-400 mt-1.5 font-medium">{timeAgo(n.createdAt)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="px-4 py-2.5 border-t border-neutral-100 text-center bg-neutral-50/50">
                <button type="button" className="text-xs text-neutral-500 font-medium hover:text-neutral-700 transition-colors" onClick={() => setNotifOpen(false)}>
                  Close
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Separator */}
        <div className="hidden sm:block w-px h-6 bg-neutral-200/70 mx-0.5" />

        {/* User menu */}
        <div ref={userRef} className="relative">
          <button
            type="button"
            onClick={() => { setUserOpen((v) => !v); setNotifOpen(false); }}
            className={`flex items-center gap-2 pl-2 pr-2.5 py-1.5 rounded-lg transition-all duration-150 min-w-0 ${
              userOpen ? 'bg-neutral-100 shadow-sm' : 'hover:bg-neutral-100'
            }`}
          >
            <Avatar src={userAvatar} name={displayName} size="sm" />
            <span className="text-[13px] font-medium text-neutral-700 hidden md:inline truncate max-w-[140px] lg:max-w-[180px]">
              {displayName}
            </span>
            {!isMainUser && (
              <span className="hidden sm:inline text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200/60 shrink-0">Sub-User</span>
            )}
            <FaChevronDown className={`w-2.5 h-2.5 text-neutral-400 hidden md:inline shrink-0 transition-transform duration-200 ${userOpen ? 'rotate-180' : ''}`} />
          </button>

          {userOpen && (
            <div className="absolute right-0 top-[calc(100%+8px)] w-56 bg-white rounded-xl border border-neutral-200/80 shadow-lg shadow-neutral-900/[0.08] overflow-hidden z-50">
              <div className="px-4 py-3.5 border-b border-neutral-100 bg-neutral-50/50">
                <p className="text-[13px] font-semibold text-neutral-900 truncate">{displayName}</p>
                <p className="text-[11px] text-neutral-400 truncate mt-0.5">{user?.email ?? ''}</p>
              </div>
              <div className="p-1.5 space-y-0.5">
                <Link
                  to={profilePath}
                  onClick={() => setUserOpen(false)}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] text-neutral-700 hover:bg-neutral-100 transition-all duration-150 font-medium"
                >
                  <FaUser className="w-3.5 h-3.5 text-neutral-400" />
                  My profile
                </Link>
                <Link
                  to={schedulePath}
                  onClick={() => setUserOpen(false)}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] text-neutral-700 hover:bg-neutral-100 transition-all duration-150 font-medium"
                >
                  <FaCalendarDays className="w-3.5 h-3.5 text-neutral-400" />
                  Schedule
                </Link>
                {user?.role !== 'admin' && (
                  <Link
                    to="/dashboard/invoices"
                    onClick={() => setUserOpen(false)}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] text-neutral-700 hover:bg-neutral-100 transition-all duration-150 font-medium"
                  >
                    <FaFileInvoice className="w-3.5 h-3.5 text-neutral-400" />
                    Invoices
                  </Link>
                )}
                <Link
                  to="/about"
                  onClick={() => setUserOpen(false)}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] text-neutral-700 hover:bg-neutral-100 transition-all duration-150 font-medium"
                >
                  <FaCircleQuestion className="w-3.5 h-3.5 text-neutral-400" />
                  Help
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] text-red-600 hover:bg-red-50 transition-all duration-150 font-medium"
                >
                  <FaRightFromBracket className="w-3.5 h-3.5" />
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
