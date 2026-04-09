import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FaTriangleExclamation, FaMagnifyingGlass, FaMessage, FaEllipsisVertical, FaCheck } from 'react-icons/fa6';
import DashboardHeader from '../components/DashboardHeader';
import DashboardSidebar from '../components/DashboardSidebar';
import AppFooter from '../components/AppFooter';
import Avatar from '../components/Avatar';
import { useApiQuery } from '../hooks/useApiQuery';
import { useRole } from '../contexts/RoleContext';
import { useChatUnread } from '../contexts/ChatUnreadContext';
import { individualNavLinks, vendorNavLinks, companyNavLinks } from '../navigation/dashboardNav';

interface Participant { id: string; displayName?: string; companyName?: string; email?: string; avatarUrl?: string }
interface Conversation {
  id: string;
  otherParticipant?: Participant;
  otherUser?: Participant;
  lastMessage?: { content: string; createdAt: string; senderId: string } | null;
  lastMessageAt?: string | null;
  unreadCount?: number;
  project?: { id: string; title: string } | null;
}
interface ConversationsResponse { items: Conversation[] }

type Filter = 'all' | 'unread';

function timeSince(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

export default function Conversations() {
  useEffect(() => { document.title = 'Messages – Claapo'; }, []);
  const { currentRole } = useRole();
  const { markAllConversationsAsRead } = useChatUnread();
  const markedReadOnMount = useRef(false);

  const { data, loading, error } = useApiQuery<ConversationsResponse>('/conversations');
  const conversations = data?.items ?? [];

  useEffect(() => {
    if (markedReadOnMount.current || loading || conversations.length === 0) return;
    const hasUnread = conversations.some((c) => (c.unreadCount ?? 0) > 0);
    if (!hasUnread) return;
    markedReadOnMount.current = true;
    markAllConversationsAsRead(conversations);
  }, [loading, conversations, markAllConversationsAsRead]);

  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');

  const navLinks =
    currentRole === 'Company'
      ? companyNavLinks
      : currentRole === 'Vendor'
        ? vendorNavLinks
        : individualNavLinks;

  const getName = (u: Participant) => u.displayName ?? u.companyName ?? u.email ?? 'Unknown';

  const filtered = conversations.filter((conv) => {
    if (filter === 'unread' && !(conv.unreadCount && conv.unreadCount > 0)) return false;
    if (!search.trim()) return true;
    const other = conv.otherParticipant ?? conv.otherUser;
    const name = other ? getName(other).toLowerCase() : '';
    const proj = conv.project?.title?.toLowerCase() ?? '';
    const q = search.toLowerCase();
    return name.includes(q) || proj.includes(q);
  });

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gradient-to-br from-[#EEF2FF]/80 via-[#F8F9FB] to-[#F0F4FA] w-full">
      <DashboardHeader />
      <div className="flex-1 flex min-h-0 overflow-hidden">
        <DashboardSidebar links={navLinks} />
        <main className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
          <div className="flex-1 min-h-0 overflow-auto">
            <div className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">

              {/* Main chat shell — larger card, stronger depth */}
              <div className="rounded-2xl sm:rounded-3xl overflow-hidden shadow-[0_25px_50px_-12px_rgba(59,91,219,0.18)] border border-neutral-200/80 bg-white min-h-[min(72vh,calc(100vh-10rem))] flex flex-col">
                <div className="px-5 sm:px-8 py-5 sm:py-6 flex items-center justify-between bg-gradient-to-r from-[#2f4ac2] via-[#3B5BDB] to-[#4f6ee8] relative overflow-hidden">
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_120%_at_100%_-20%,rgba(255,255,255,0.12),transparent)] pointer-events-none" />
                  <div className="relative">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-white/70 mb-0.5">Messages</p>
                    <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Chats</h1>
                  </div>
                  <div className="relative flex items-center gap-1">
                    <button type="button" className="p-2.5 hover:bg-white/15 rounded-xl transition-colors" aria-label="More options">
                      <FaEllipsisVertical className="w-5 h-5 text-white" />
                    </button>
                  </div>
                </div>

                {/* Search bar */}
                <div className="px-4 sm:px-8 py-4 bg-white/90 border-b border-neutral-100">
                  <div className="relative max-w-3xl">
                    <FaMagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search conversations or project name…"
                      className="w-full rounded-xl pl-11 pr-4 py-3.5 text-[15px] bg-neutral-100/90 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#3B5BDB]/25 focus:border border-transparent border transition-all"
                    />
                  </div>
                </div>

                {/* Filter pills */}
                <div className="px-4 sm:px-8 py-3 bg-white border-b border-neutral-100 flex items-center gap-2 flex-wrap">
                  {(['all', 'unread'] as Filter[]).map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setFilter(f)}
                      className={`px-4 py-2 text-sm font-semibold rounded-full capitalize transition-all ${
                        filter === f
                          ? 'bg-[#3B5BDB] text-white shadow-md shadow-[#3B5BDB]/25'
                          : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200/80'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>

                {/* Error */}
                {error && (
                  <div className="flex items-center gap-3 bg-red-50 border-b border-red-100 px-4 sm:px-8 py-4">
                    <FaTriangleExclamation className="text-red-500 shrink-0 w-5 h-5" />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                {/* Conversation list */}
                <div className="bg-white flex-1 flex flex-col min-h-0">
                  {loading ? (
                    <div className="divide-y divide-neutral-100">
                      {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="px-4 sm:px-8 py-5 flex gap-4 animate-pulse">
                          <div className="w-14 h-14 rounded-2xl bg-neutral-100 shrink-0" />
                          <div className="flex-1 space-y-3 py-1">
                            <div className="h-4 bg-neutral-100 rounded-lg w-2/5" />
                            <div className="h-3 bg-neutral-50 rounded-lg w-4/5" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : filtered.length === 0 ? (
                    <div className="py-20 sm:py-24 text-center px-6 flex-1 flex flex-col items-center justify-center">
                      <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[#EEF2FF] to-[#DBEAFE] flex items-center justify-center mx-auto mb-6 shadow-inner border border-white/80">
                        <FaMessage className="text-[#3B5BDB] text-3xl" />
                      </div>
                      <p className="text-lg font-bold text-neutral-900 mb-2">
                        {filter === 'unread' ? 'No unread chats' : 'No conversations yet'}
                      </p>
                      <p className="text-sm text-neutral-500 max-w-md mx-auto leading-relaxed">
                        {filter === 'unread'
                          ? "You're all caught up."
                          : 'Open a project or booking to start chatting with companies, crew, or vendors.'}
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-neutral-100 flex-1 overflow-auto">
                      {filtered.map((conv) => {
                        const other = conv.otherParticipant ?? conv.otherUser;
                        if (!other?.id) return null;
                        const lastMsgTime = conv.lastMessage?.createdAt ?? conv.lastMessageAt ?? null;
                        const lastMsgText = conv.lastMessage?.content ?? null;
                        const hasUnread = (conv.unreadCount ?? 0) > 0;
                        const chatHref = conv.project?.id
                          ? `/dashboard/chat/${other.id}?projectId=${encodeURIComponent(conv.project.id)}`
                          : `/dashboard/chat/${other.id}`;
                        return (
                          <Link
                            key={conv.id}
                            to={chatHref}
                            className="flex items-start gap-4 px-4 sm:px-8 py-4 sm:py-5 hover:bg-[#F8FAFC] active:bg-[#F1F5F9] transition-colors group"
                          >
                            <div className="relative shrink-0 pt-0.5">
                              <Avatar src={other.avatarUrl} name={getName(other)} size="lg" />
                            </div>

                            <div className="flex-1 min-w-0 py-0.5">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p
                                    className={`text-base sm:text-[17px] truncate leading-snug ${
                                      hasUnread ? 'font-bold text-neutral-900' : 'font-semibold text-neutral-800 group-hover:text-[#3B5BDB]'
                                    }`}
                                  >
                                    {getName(other)}
                                  </p>
                                  {conv.project?.title && (
                                    <p className="text-xs text-neutral-400 truncate mt-0.5 font-medium">{conv.project.title}</p>
                                  )}
                                </div>
                                {lastMsgTime && (
                                  <span
                                    className={`text-xs shrink-0 tabular-nums mt-0.5 ${
                                      hasUnread ? 'text-[#3B5BDB] font-bold' : 'text-neutral-400'
                                    }`}
                                  >
                                    {timeSince(lastMsgTime)}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center justify-between gap-3 mt-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  {!hasUnread && lastMsgText && (
                                    <FaCheck className="w-3.5 h-3.5 text-[#3B5BDB] shrink-0 opacity-80" />
                                  )}
                                  <p
                                    className={`text-sm sm:text-[15px] truncate leading-snug ${
                                      hasUnread ? 'text-neutral-900 font-medium' : 'text-neutral-500'
                                    }`}
                                  >
                                    {lastMsgText ?? (conv.project ? `Project: ${conv.project.title}` : 'No messages yet')}
                                  </p>
                                </div>
                                {hasUnread && (
                                  <span className="min-w-[1.5rem] h-6 px-1.5 rounded-full bg-[#3B5BDB] text-white text-xs font-bold flex items-center justify-center shrink-0">
                                    {conv.unreadCount}
                                  </span>
                                )}
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <AppFooter />
        </main>
      </div>
    </div>
  );
}
