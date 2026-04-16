import { useEffect, useState, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FaTriangleExclamation, FaMagnifyingGlass, FaMessage, FaCheck, FaFolder, FaArrowLeft, FaComments, FaCalendar } from 'react-icons/fa6';
import DashboardHeader from '../components/DashboardHeader';
import DashboardSidebar from '../components/DashboardSidebar';
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

interface Project {
  id: string;
  title: string;
  status: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  conversationCount: number;
  invoiceCount: number;
  bookingCount: number;
}
interface ProjectsWithStatsResponse { items: Project[]; meta: { total: number } }

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

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' });
}

export default function Conversations() {
  useEffect(() => { document.title = 'Messages – Claapo'; }, []);
  const { currentRole } = useRole();
  const isCompanyView = currentRole === 'Company';
  const { markAllConversationsAsRead } = useChatUnread();
  const markedReadOnMount = useRef(false);
  const { projectId: selectedProjectId } = useParams<{ projectId: string }>();

  // Fetch projects list
  const { data: projectsData, loading: projectsLoading } = useApiQuery<ProjectsWithStatsResponse>('/projects/my/with-stats?limit=100');
  const projects = projectsData?.items ?? [];

  // Fetch conversations for selected project or all conversations
  const conversationsUrl = selectedProjectId 
    ? `/conversations?projectId=${selectedProjectId}&limit=100` 
    : '/conversations?limit=100';
  const { data, loading, error } = useApiQuery<ConversationsResponse>(conversationsUrl);
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
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const navLinks =
    currentRole === 'Company'
      ? companyNavLinks
      : currentRole === 'Vendor'
        ? vendorNavLinks
        : individualNavLinks;

  const getName = (u: Participant) => u.displayName ?? u.companyName ?? u.email ?? 'Unknown';

  const filtered = conversations.filter((conv) => {
    if (filter === 'unread' && !(conv.unreadCount && conv.unreadCount > 0)) return false;
    if (dateFrom || dateTo) {
      const ts = conv.lastMessage?.createdAt ?? conv.lastMessageAt;
      if (!ts) return false;
      const convDate = new Date(ts).setHours(0, 0, 0, 0);
      const from = dateFrom ? new Date(dateFrom + 'T00:00:00').getTime() : 0;
      const to = dateTo ? new Date(dateTo + 'T23:59:59').getTime() : Infinity;
      if (convDate < from || convDate > to) return false;
    }
    if (!search.trim()) return true;
    const other = conv.otherParticipant ?? conv.otherUser;
    const name = other ? getName(other).toLowerCase() : '';
    const proj = conv.project?.title?.toLowerCase() ?? '';
    const q = search.toLowerCase();
    return name.includes(q) || proj.includes(q);
  });

  const totalUnread = conversations.reduce((sum, c) => sum + (c.unreadCount ?? 0), 0);

  // Find selected project details
  const selectedProject = projects.find(p => p.id === selectedProjectId);

  // Project List View
  const renderProjectList = () => {
    if (projectsLoading) {
      return (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="rounded-2xl bg-white border border-neutral-200/80 px-6 py-5 animate-pulse"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-neutral-100 shrink-0" />
                <div className="flex-1 space-y-3">
                  <div className="h-5 bg-neutral-100 rounded-lg w-2/5" />
                  <div className="h-3 bg-neutral-50 rounded-lg w-1/3" />
                  <div className="h-3 bg-neutral-50 rounded-lg w-1/4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (projects.length === 0) {
      return (
        <div className="rounded-3xl bg-white border border-neutral-200/80 py-20 text-center px-6 flex flex-col items-center justify-center mt-4">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#EEF4FF] to-[#DBEAFE] flex items-center justify-center mx-auto mb-5 border border-[#3B5BDB]/10 shadow-sm">
            <FaFolder className="text-[#3B5BDB] text-2xl" />
          </div>
          <p className="text-lg font-bold text-neutral-900 mb-1.5">No projects yet</p>
          <p className="text-sm text-neutral-500 max-w-md mx-auto leading-relaxed">
            Create a project or accept a booking to start chatting with crew and vendors.
          </p>
        </div>
      );
    }

    return (
      <ul className="space-y-2">
        {projects.map((project) => {
          const hasConversations = project.conversationCount > 0;
          return (
            <li key={project.id}>
              <Link
                to={`/dashboard/conversations/${project.id}`}
                className={`relative flex items-start gap-4 px-6 py-5 rounded-2xl border transition-all group overflow-hidden ${
                  hasConversations
                    ? 'bg-white border-neutral-200/80 hover:border-[#3B5BDB]/30 hover:shadow-sm'
                    : 'bg-white border-neutral-200/80 opacity-60 cursor-not-allowed'
                }`}
                onClick={(e) => {
                  if (!hasConversations) {
                    e.preventDefault();
                  }
                }}
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#EEF4FF] to-[#DBEAFE] flex items-center justify-center shrink-0 border border-[#3B5BDB]/10">
                  <FaComments className="text-[#3B5BDB] text-lg" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0">
                      <p className={`text-base font-semibold truncate ${hasConversations ? 'text-neutral-900 group-hover:text-[#3B5BDB]' : 'text-neutral-600'}`}>
                        {project.title}
                      </p>
                      <p className="text-xs text-neutral-500 mt-1">
                        {formatDate(project.startDate)} — {formatDate(project.endDate)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full capitalize ${
                        project.status === 'active' ? 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200' :
                        project.status === 'completed' ? 'bg-blue-50 text-blue-600 ring-1 ring-blue-200' :
                        project.status === 'draft' ? 'bg-neutral-50 text-neutral-500 ring-1 ring-neutral-200' :
                        'bg-neutral-50 text-neutral-500 ring-1 ring-neutral-200'
                      }`}>
                        {project.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#EEF4FF] border border-[#3B5BDB]/10">
                      <FaComments className="text-[#3B5BDB] text-xs" />
                      <span className="text-xs font-semibold text-[#3B5BDB]">{project.conversationCount} {project.conversationCount === 1 ? 'chat' : 'chats'}</span>
                    </div>
                    {project.conversationCount === 0 && (
                      <p className="text-xs text-neutral-400">No conversations yet</p>
                    )}
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    );
  };

  // Conversations View (project scoped for company, global for others)
  const renderConversations = () => (
    <>
      {/* Header with back button and project title */}
      <header className="shrink-0 bg-white border-b border-neutral-200/80">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 pt-7 pb-5">
          {isCompanyView && selectedProjectId && (
            <Link
              to="/dashboard/conversations"
              className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-[#3B5BDB] font-semibold mb-4 transition-colors"
            >
              <FaArrowLeft className="w-3.5 h-3.5" />
              Back to Projects
            </Link>
          )}
          <div className="flex items-end justify-between gap-4 mb-5 flex-wrap">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 tracking-tight">
                {isCompanyView && selectedProjectId ? (selectedProject?.title ?? 'Project Messages') : 'Messages'}
              </h1>
              <p className="text-sm text-neutral-500 mt-1">
                {loading
                  ? 'Loading conversations…'
                  : conversations.length === 0
                    ? (isCompanyView && selectedProjectId ? 'No conversations in this project yet.' : 'No conversations yet.')
                    : (
                      <>
                        {conversations.length} {conversations.length === 1 ? 'conversation' : 'conversations'}
                        {totalUnread > 0 && (
                          <>
                            {' · '}
                            <span className="text-[#F40F02] font-semibold">{totalUnread} unread</span>
                          </>
                        )}
                      </>
                    )}
              </p>
            </div>
            {totalUnread > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F40F02]/10 text-[#F40F02] text-xs font-bold border border-[#F40F02]/20">
                <span className="w-1.5 h-1.5 rounded-full bg-[#F40F02] animate-pulse" />
                {totalUnread > 99 ? '99+' : totalUnread} new
              </span>
            )}
          </div>

          {/* Search + filters row */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[240px]">
              <FaMagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name…"
                className="w-full rounded-xl pl-11 pr-4 py-3 text-sm bg-neutral-100/80 text-neutral-900 placeholder-neutral-400 border border-transparent focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#3B5BDB]/20 focus:border-[#3B5BDB]/30 transition-all"
              />
            </div>
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-neutral-100/80 border border-neutral-200/60">
              {(['all', 'unread'] as Filter[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 text-xs font-semibold rounded-lg capitalize transition-all ${
                    filter === f
                      ? 'bg-white text-[#3B5BDB] shadow-sm'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  {f === 'unread' && totalUnread > 0 ? `${f} (${totalUnread})` : f}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 p-2 rounded-xl bg-white border border-neutral-200/70">
              <FaCalendar className="w-3.5 h-3.5 text-neutral-400" />
              <label className="text-[11px] text-neutral-500 font-medium">From</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="text-xs border border-neutral-200 rounded-lg px-2 py-1.5"
              />
              <label className="text-[11px] text-neutral-500 font-medium">To</label>
              <input
                type="date"
                min={dateFrom || undefined}
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="text-xs border border-neutral-200 rounded-lg px-2 py-1.5"
              />
              {(dateFrom || dateTo) && (
                <button
                  type="button"
                  onClick={() => {
                    setDateFrom('');
                    setDateTo('');
                  }}
                  className="text-xs text-[#3B5BDB] font-semibold hover:underline"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Error */}
      {error && (
        <div className="shrink-0 bg-red-50 border-b border-red-100">
          <div className="max-w-5xl mx-auto px-5 sm:px-8 py-3 flex items-center gap-3">
            <FaTriangleExclamation className="text-red-500 shrink-0 w-4 h-4" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Scrollable conversation list */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 py-4">
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="rounded-2xl bg-white border border-neutral-200/80 px-5 py-4 flex gap-4 animate-pulse"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div className="w-14 h-14 rounded-full bg-neutral-100 shrink-0" />
                  <div className="flex-1 space-y-2.5 py-1">
                    <div className="h-4 bg-neutral-100 rounded-lg w-1/3" />
                    <div className="h-3 bg-neutral-50 rounded-lg w-3/5" />
                    <div className="h-3 bg-neutral-50 rounded-lg w-4/5" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-3xl bg-white border border-neutral-200/80 py-20 text-center px-6 flex flex-col items-center justify-center mt-4">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#EEF4FF] to-[#DBEAFE] flex items-center justify-center mx-auto mb-5 border border-[#3B5BDB]/10 shadow-sm">
                <FaMessage className="text-[#3B5BDB] text-2xl" />
              </div>
              <p className="text-lg font-bold text-neutral-900 mb-1.5">
                {filter === 'unread' ? "You're all caught up" : search.trim() ? 'No matches found' : 'No conversations yet'}
              </p>
              <p className="text-sm text-neutral-500 max-w-md mx-auto leading-relaxed">
                {filter === 'unread'
                  ? 'Every message has been read. Nothing new on your plate right now.'
                  : search.trim()
                    ? 'Try a different name.'
                    : 'Inquiry and booking chats will appear here.'}
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {filtered.map((conv) => {
                const other = conv.otherParticipant ?? conv.otherUser;
                if (!other?.id) return null;
                const lastMsgTime = conv.lastMessage?.createdAt ?? conv.lastMessageAt ?? null;
                const lastMsgText = conv.lastMessage?.content ?? null;
                const hasUnread = (conv.unreadCount ?? 0) > 0;
                const chatHref = `/dashboard/chat/${other.id}${selectedProjectId ? `?projectId=${selectedProjectId}` : ''}`;
                return (
                  <li key={conv.id}>
                    <Link
                      to={chatHref}
                      className={`relative flex items-start gap-4 px-5 py-4 rounded-2xl border transition-all group overflow-hidden ${
                        hasUnread
                          ? 'bg-white border-[#3B5BDB]/25 shadow-sm shadow-[#3B5BDB]/10 hover:shadow-md hover:border-[#3B5BDB]/40'
                          : 'bg-white border-neutral-200/80 hover:border-[#3B5BDB]/30 hover:shadow-sm'
                      }`}
                    >
                      {hasUnread && (
                        <span className="absolute left-0 top-0 bottom-0 w-1 bg-[#3B5BDB]" aria-hidden />
                      )}
                      <div className="relative shrink-0">
                        <Avatar src={other.avatarUrl} name={getName(other)} size="lg" />
                        {hasUnread && (
                          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center">
                            <span className="absolute inline-flex w-3.5 h-3.5 rounded-full bg-[#F40F02] opacity-60 animate-ping" />
                            <span className="relative inline-flex w-3.5 h-3.5 rounded-full bg-[#F40F02] border-2 border-white" />
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 mb-1">
                          <div className="min-w-0">
                            <p className={`text-base truncate leading-snug ${hasUnread ? 'font-bold text-neutral-900' : 'font-semibold text-neutral-800 group-hover:text-[#3B5BDB]'}`}>
                              {getName(other)}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-1.5 shrink-0">
                            {lastMsgTime && (
                              <span className={`text-[11px] tabular-nums ${hasUnread ? 'text-[#3B5BDB] font-bold' : 'text-neutral-400 font-medium'}`}>
                                {timeSince(lastMsgTime)}
                              </span>
                            )}
                            {hasUnread && (
                              <span className="min-w-[22px] h-[22px] px-2 rounded-full bg-[#3B5BDB] text-white text-[11px] font-bold flex items-center justify-center shadow-sm shadow-[#3B5BDB]/30">
                                {(conv.unreadCount ?? 0) > 99 ? '99+' : conv.unreadCount}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 min-w-0 mt-1.5">
                          {!hasUnread && lastMsgText && (
                            <FaCheck className="w-3 h-3 text-[#3B5BDB] shrink-0 opacity-70" />
                          )}
                          <p className={`text-sm truncate leading-snug ${hasUnread ? 'text-neutral-800 font-medium' : 'text-neutral-500'}`}>
                            {lastMsgText ?? 'Tap to start the conversation'}
                          </p>
                        </div>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </>
  );

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#F8F9FB] w-full">
      <DashboardHeader />
      <div className="flex-1 flex min-h-0 overflow-hidden">
        <DashboardSidebar links={navLinks} />
        <main className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
          <div className="flex-1 flex flex-col min-h-0 min-w-0">
            {(isCompanyView && !selectedProjectId) ? (
              <>
                {/* Projects List Header */}
                <header className="shrink-0 bg-white border-b border-neutral-200/80">
                  <div className="max-w-5xl mx-auto px-5 sm:px-8 pt-7 pb-5">
                    <div className="flex items-end justify-between gap-4 mb-2 flex-wrap">
                      <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 tracking-tight">Messages</h1>
                        <p className="text-sm text-neutral-500 mt-1">
                          {projectsLoading
                            ? 'Loading your projects…'
                            : projects.length === 0
                              ? 'No projects yet'
                              : `Select a project to view conversations`}
                        </p>
                      </div>
                    </div>
                  </div>
                </header>

                {/* Error */}
                {error && (
                  <div className="shrink-0 bg-red-50 border-b border-red-100">
                    <div className="max-w-5xl mx-auto px-5 sm:px-8 py-3 flex items-center gap-3">
                      <FaTriangleExclamation className="text-red-500 shrink-0 w-4 h-4" />
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                )}

                {/* Scrollable project list */}
                <div className="flex-1 min-h-0 overflow-y-auto">
                  <div className="max-w-5xl mx-auto px-5 sm:px-8 py-4">
                    {renderProjectList()}
                  </div>
                </div>
              </>
            ) : renderConversations()}
          </div>
        </main>
      </div>
    </div>
  );
}
