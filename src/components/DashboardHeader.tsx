import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaVideo, FaBell, FaChevronDown, FaRightFromBracket, FaCircle } from 'react-icons/fa6';
import Avatar from './Avatar';

type DashboardHeaderProps = {
  userName?: string;
  userAvatar?: string;
};

const sampleNotifications = [
  { id: 1, title: 'Booking Request',       body: 'Rajesh Kumar sent a booking request for Commercial Shoot.',   time: '2m ago',  unread: true },
  { id: 2, title: 'Project Update',        body: 'Documentary project status changed to Planning.',              time: '18m ago', unread: true },
  { id: 3, title: 'Invoice Paid',          body: 'INV-C002 for Product Launch has been paid — ₹11.2L.',         time: '1h ago',  unread: true },
  { id: 4, title: 'New Crew Application',  body: 'Priya Sharma applied for Sound Engineer role.',               time: '3h ago',  unread: false },
  { id: 5, title: 'Vendor Confirmed',      body: 'CineGear Rentals confirmed equipment for Music Video.',       time: 'Yesterday', unread: false },
];

export default function DashboardHeader({ userName = 'Production Studios Inc.', userAvatar }: DashboardHeaderProps) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen]   = useState(false);
  const [notifications, setNotifications] = useState(sampleNotifications);
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef  = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const unreadCount = notifications.filter((n) => n.unread).length;

  // Close dropdowns on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (userRef.current  && !userRef.current.contains(e.target as Node))  setUserOpen(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  const markAllRead = () => setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));

  const handleLogout = () => {
    setUserOpen(false);
    navigate('/login');
  };

  return (
    <header className="h-[64px] border-b border-neutral-200 bg-white shrink-0 flex items-center overflow-visible z-30 relative">
      {/* Logo column — fixed width matching sidebar */}
      <Link
        to="/"
        className="hidden lg:flex items-center gap-2.5 w-56 xl:w-60 shrink-0 px-5 h-full border-r border-neutral-100 hover:bg-[#F8FAFF] transition-colors"
      >
        <div className="w-8 h-8 rounded-xl bg-[#3678F1] flex items-center justify-center shrink-0 shadow-sm shadow-[#3678F1]/30">
          <FaVideo className="text-white text-sm" />
        </div>
        <span className="text-[15px] font-bold text-neutral-900 tracking-tight">Claapo</span>
      </Link>

      {/* Mobile logo */}
      <Link to="/" className="lg:hidden flex items-center gap-2.5 px-4 shrink-0">
        <div className="w-8 h-8 rounded-xl bg-[#3678F1] flex items-center justify-center shrink-0">
          <FaVideo className="text-white text-sm" />
        </div>
        <span className="text-[15px] font-bold text-neutral-900">Claapo</span>
      </Link>

      {/* Right section */}
      <div className="flex-1 flex items-center justify-end gap-1 sm:gap-2 px-4 sm:px-6 lg:px-5 min-w-0">

        {/* ── Notification bell ── */}
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
                <button
                  type="button"
                  onClick={markAllRead}
                  className="text-[11px] text-[#3678F1] hover:underline font-medium"
                >
                  Mark all read
                </button>
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-neutral-100">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`flex gap-3 px-4 py-3 transition-colors cursor-pointer hover:bg-[#F8FAFF] ${n.unread ? 'bg-[#F0F6FF]' : 'bg-white'}`}
                    onClick={() => setNotifications((prev) => prev.map((x) => x.id === n.id ? { ...x, unread: false } : x))}
                  >
                    <div className="shrink-0 mt-0.5">
                      {n.unread
                        ? <FaCircle className="text-[#3678F1] text-[8px] mt-1" />
                        : <FaCircle className="text-neutral-200 text-[8px] mt-1" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-xs font-semibold truncate ${n.unread ? 'text-neutral-900' : 'text-neutral-600'}`}>{n.title}</p>
                      <p className="text-[11px] text-neutral-500 leading-snug mt-0.5 line-clamp-2">{n.body}</p>
                      <p className="text-[10px] text-neutral-400 mt-1">{n.time}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="px-4 py-2.5 border-t border-neutral-100 text-center">
                <button
                  type="button"
                  className="text-xs text-[#3678F1] font-semibold hover:underline"
                  onClick={() => setNotifOpen(false)}
                >
                  View all notifications
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── User pill / dropdown ── */}
        <div ref={userRef} className="relative">
          <button
            type="button"
            onClick={() => { setUserOpen((v) => !v); setNotifOpen(false); }}
            className={`flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl transition-colors border min-w-0 ${
              userOpen ? 'bg-[#F3F4F6] border-neutral-200' : 'border-transparent hover:bg-[#F3F4F6] hover:border-neutral-200'
            }`}
          >
            <Avatar src={userAvatar} alt="Profile" name={userName} size="sm" />
            <span className="text-sm font-medium text-neutral-800 hidden md:inline truncate max-w-[140px] lg:max-w-[180px]">
              {userName}
            </span>
            <FaChevronDown className={`w-2.5 h-2.5 text-neutral-400 hidden md:inline shrink-0 transition-transform duration-200 ${userOpen ? 'rotate-180' : ''}`} />
          </button>

          {userOpen && (
            <div className="absolute right-0 top-[calc(100%+8px)] w-52 bg-white rounded-2xl border border-neutral-200 shadow-xl overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-neutral-100">
                <p className="text-xs font-bold text-neutral-900 truncate">{userName}</p>
                <p className="text-[11px] text-neutral-400 truncate">Production Company</p>
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
