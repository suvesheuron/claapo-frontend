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
    <div className="h-screen flex flex-col overflow-hidden bg-[#F8F9FB] w-full">
      <DashboardHeader />
      <div className="flex-1 flex min-h-0 overflow-hidden">
        <DashboardSidebar links={navLinks} />
        <main className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
          <div className="flex-1 min-h-0 overflow-auto">
            <div className="max-w-[700px] mx-auto px-0 sm:px-4 py-0 sm:py-4">

              {/* Header */}
              <div className="rounded-t-none sm:rounded-t-xl overflow-hidden shadow-sm border border-neutral-200/60">
                <div className="px-4 py-3 flex items-center justify-between bg-[#3B5BDB]">
                  <h1 className="text-lg font-bold text-white">Chats</h1>
                  <div className="flex items-center gap-2">
                    <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
                      <FaEllipsisVertical className="w-4 h-4 text-white" />
                    </button>
                  </div>
                </div>

                {/* Search bar */}
                <div className="px-3 py-2 bg-white border-b border-neutral-200/80">
                  <div className="relative">
                    <FaMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search or start new chat"
                      className="w-full rounded-lg pl-9 pr-3 py-2 text-sm bg-[#F0F2F5] text-[#111B21] placeholder-neutral-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#3B5BDB] transition-all"
                    />
                  </div>
                </div>

                {/* Filter pills */}
                <div className="px-3 py-2 bg-white border-b border-neutral-200/80 flex items-center gap-2">
                  {(['all', 'unread'] as Filter[]).map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setFilter(f)}
                      className={`px-3 py-1 text-xs font-semibold rounded-full capitalize transition-all ${
                        filter === f
                          ? 'bg-[#EEF2FF] text-[#3B5BDB]'
                          : 'bg-[#F0F2F5] text-neutral-500 hover:bg-neutral-200'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>

                {/* Error */}
                {error && (
                  <div className="flex items-center gap-3 bg-red-50 border-b border-red-100 p-3">
                    <FaTriangleExclamation className="text-red-500 shrink-0" />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                {/* Conversation list */}
                <div className="bg-white">
                  {loading ? (
                    <div className="divide-y divide-neutral-100">
                      {[1,2,3,4,5].map(i => (
                        <div key={i} className="px-3 py-3 flex gap-3 animate-pulse">
                          <div className="w-12 h-12 rounded-full bg-neutral-100 shrink-0" />
                          <div className="flex-1 space-y-2.5 py-1">
                            <div className="h-4 bg-neutral-100 rounded w-1/3" />
                            <div className="h-3 bg-neutral-50 rounded w-2/3" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : filtered.length === 0 ? (
                    <div className="py-16 text-center">
                      <div className="w-20 h-20 rounded-full bg-[#EEF2FF] flex items-center justify-center mx-auto mb-4">
                        <FaMessage className="text-[#3B5BDB] text-2xl" />
                      </div>
                      <p className="text-base font-semibold text-neutral-800 mb-1">
                        {filter === 'unread' ? 'No unread chats' : 'No conversations yet'}
                      </p>
                      <p className="text-sm text-neutral-500 max-w-xs mx-auto">
                        {filter === 'unread' ? 'You\'re all caught up!' : 'Start a conversation from a booking or search.'}
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-neutral-100/80">
                      {filtered.map(conv => {
                        const other = conv.otherParticipant ?? conv.otherUser;
                        if (!other?.id) return null;
                        const lastMsgTime = conv.lastMessage?.createdAt ?? conv.lastMessageAt ?? null;
                        const lastMsgText = conv.lastMessage?.content ?? null;
                        const hasUnread = (conv.unreadCount ?? 0) > 0;
                        return (
                          <Link
                            key={conv.id}
                            to={`/dashboard/chat/${other.id}`}
                            className="flex items-center gap-3 px-3 py-3 hover:bg-[#F5F6F6] transition-colors"
                          >
                            <div className="relative shrink-0">
                              <Avatar src={other.avatarUrl} name={getName(other)} size="md" />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <p className={`text-[15px] truncate ${hasUnread ? 'font-bold text-neutral-900' : 'font-normal text-neutral-800'}`}>
                                  {getName(other)}
                                </p>
                                {lastMsgTime && (
                                  <span className={`text-xs shrink-0 ${hasUnread ? 'text-[#3B5BDB] font-semibold' : 'text-neutral-500'}`}>
                                    {timeSince(lastMsgTime)}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center justify-between gap-2 mt-0.5">
                                <div className="flex items-center gap-1 min-w-0">
                                  {!hasUnread && lastMsgText && (
                                    <FaCheck className="w-3 h-3 text-[#3B5BDB] shrink-0" />
                                  )}
                                  <p className={`text-sm truncate ${hasUnread ? 'text-neutral-800 font-medium' : 'text-neutral-500'}`}>
                                    {lastMsgText ?? (conv.project ? conv.project.title : 'No messages yet')}
                                  </p>
                                </div>
                                {hasUnread && (
                                  <span className="w-5 h-5 rounded-full bg-[#3B5BDB] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
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
