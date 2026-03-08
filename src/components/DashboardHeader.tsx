import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaVideo, FaBell, FaChevronDown, FaRightFromBracket, FaCircle } from 'react-icons/fa6';
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

  const { data: notifData, refetch: refetchNotifs } = useApiQuery<NotificationsResponse>(isAuthenticated ? '/notifications?limit=20' : null);
  const notifications = notifData?.items ?? [];
  const unreadCount = notifData?.meta?.unreadCount ?? 0;

  interface MeResponse { profile?: { companyName?: string; displayName?: string; avatarUrl?: string | null } | null }
  const { data: meData } = useApiQuery<MeResponse>(isAuthenticated ? '/profile/me' : null);
  const profile = meData?.profile;

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
    <header className="h-[64px] border-b border-neutral-200 bg-white shrink-0 flex items-center overflow-visible z-30 relative">
      <Link
        to="/"
        className="hidden lg:flex items-center gap-2.5 w-56 xl:w-60 shrink-0 px-5 h-full border-r border-neutral-100 hover:bg-[#F8FAFF] transition-colors"
      >
        <div className="w-8 h-8 rounded-xl bg-[#3678F1] flex items-center justify-center shrink-0 shadow-sm shadow-[#3678F1]/30">
          <FaVideo className="text-white text-sm" />
        </div>
        <span className="text-[15px] font-bold text-neutral-900 tracking-tight">Claapo</span>
      </Link>

      <Link to="/" className="lg:hidden flex items-center gap-2.5 px-4 shrink-0">
        <div className="w-8 h-8 rounded-xl bg-[#3678F1] flex items-center justify-center shrink-0">
          <FaVideo className="text-white text-sm" />
        </div>
        <span className="text-[15px] font-bold text-neutral-900">Claapo</span>
      </Link>

      <div className="flex-1 flex items-center justify-end gap-1 sm:gap-2 px-4 sm:px-6 lg:px-5 min-w-0">

        <div ref={notifRef} className="relative">
          <button
            type="button"
            onClick={() => { setNotifOpen((v) => !v); setUserOpen(false); }}
            className="relative w-9 h-9 rounded-xl flex items-center justify-center text-neutral-400 hover:bg-[#F3F4F6] hover:text-neutral-600 transition-colors"
            aria-label="Notifications"
          >
            <FaBell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#F40F02] ring-2 ring-white" />
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-[calc(100%+8px)] w-80 bg-white rounded-2xl border border-neutral-200 shadow-xl overflow-hidden z-50">
              <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-neutral-900">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 bg-[#F40F02] text-white rounded-full">{unreadCount}</span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button type="button" onClick={markAllRead} className="text-[11px] text-[#3678F1] hover:underline font-medium">
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-neutral-100">
                {notifications.length === 0 ? (
                  <div className="px-4 py-6 text-center text-xs text-neutral-400">No notifications</div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`flex gap-3 px-4 py-3 transition-colors cursor-default hover:bg-[#F8FAFF] ${!n.readAt ? 'bg-[#F0F6FF]' : 'bg-white'}`}
                    >
                      <div className="shrink-0 mt-0.5">
                        {!n.readAt ? <FaCircle className="text-[#3678F1] text-[8px] mt-1" /> : <FaCircle className="text-neutral-200 text-[8px] mt-1" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`text-xs font-semibold truncate ${!n.readAt ? 'text-neutral-900' : 'text-neutral-600'}`}>{n.title}</p>
                        <p className="text-[11px] text-neutral-500 leading-snug mt-0.5 line-clamp-2">{n.body}</p>
                        <p className="text-[10px] text-neutral-400 mt-1">{timeAgo(n.createdAt)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="px-4 py-2.5 border-t border-neutral-100 text-center">
                <button type="button" className="text-xs text-[#3678F1] font-semibold hover:underline" onClick={() => setNotifOpen(false)}>
                  Close
                </button>
              </div>
            </div>
          )}
        </div>

        <div ref={userRef} className="relative">
          <button
            type="button"
            onClick={() => { setUserOpen((v) => !v); setNotifOpen(false); }}
            className={`flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl transition-colors border min-w-0 ${
              userOpen ? 'bg-[#F3F4F6] border-neutral-200' : 'border-transparent hover:bg-[#F3F4F6] hover:border-neutral-200'
            }`}
          >
            <Avatar src={userAvatar} name={displayName} size="sm" />
            <span className="text-sm font-medium text-neutral-800 hidden md:inline truncate max-w-[140px] lg:max-w-[180px]">
              {displayName}
            </span>
            <FaChevronDown className={`w-2.5 h-2.5 text-neutral-400 hidden md:inline shrink-0 transition-transform duration-200 ${userOpen ? 'rotate-180' : ''}`} />
          </button>

          {userOpen && (
            <div className="absolute right-0 top-[calc(100%+8px)] w-52 bg-white rounded-2xl border border-neutral-200 shadow-xl overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-neutral-100">
                <p className="text-xs font-bold text-neutral-900 truncate">{displayName}</p>
                <p className="text-[11px] text-neutral-400 truncate">{user?.email ?? ''}</p>
              </div>
              <div className="p-1.5">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-[#F40F02] hover:bg-[#FFF1F0] transition-colors font-semibold"
                >
                  <FaRightFromBracket className="w-3.5 h-3.5" />
                  Log Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
