import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaMessage, FaTriangleExclamation } from 'react-icons/fa6';
import DashboardHeader from '../components/DashboardHeader';
import DashboardSidebar from '../components/DashboardSidebar';
import AppFooter from '../components/AppFooter';
import Avatar from '../components/Avatar';
import { useApiQuery } from '../hooks/useApiQuery';
import { useRole } from '../contexts/RoleContext';
import { individualNavLinks, vendorNavLinks } from '../navigation/dashboardNav';

interface Participant { id: string; displayName?: string; companyName?: string; email?: string }
interface Conversation {
  id: string;
  // Backend returns otherParticipant; support both shapes for safety
  otherParticipant?: Participant;
  otherUser?: Participant;
  lastMessage?: { content: string; createdAt: string; senderId: string } | null;
  lastMessageAt?: string | null;
  unreadCount?: number;
  project?: { id: string; title: string } | null;
}
interface ConversationsResponse { items: Conversation[] }

// Company uses its own navigation structure on other pages and keeps a slim version here.
const companyNavLinks = [
  { icon: FaMessage, label: 'Chat', to: '/dashboard/conversations' },
];

function timeSince(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function Conversations() {
  useEffect(() => { document.title = 'Messages – Claapo'; }, []);
  const { currentRole } = useRole();

  const { data, loading, error } = useApiQuery<ConversationsResponse>('/conversations');
  const conversations = data?.items ?? [];

  const navLinks =
    currentRole === 'Company'
      ? companyNavLinks
      : currentRole === 'Vendor'
        ? vendorNavLinks
        : individualNavLinks;

  const getName = (u: Participant) => u.displayName ?? u.companyName ?? u.email ?? 'Unknown';

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#F3F4F6] w-full">
      <DashboardHeader />
      <div className="flex-1 flex min-h-0 overflow-hidden">
        <DashboardSidebar links={navLinks} />
        <main className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
          <div className="flex-1 min-h-0 overflow-auto">
            <div className="max-w-[700px] mx-auto px-4 sm:px-6 py-5">

              <div className="mb-5">
                <h1 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
                  <FaMessage className="text-[#3678F1]" /> Messages
                </h1>
                <p className="text-sm text-neutral-500 mt-0.5">Your conversations with crew, vendors, and clients</p>
              </div>

              {error && (
                <div className="flex items-center gap-3 rounded-2xl bg-red-50 border border-red-200 p-4 mb-4">
                  <FaTriangleExclamation className="text-red-500 shrink-0" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {loading ? (
                <div className="space-y-3">
                  {[1,2,3,4,5].map(i => (
                    <div key={i} className="rounded-2xl bg-white border border-neutral-200 p-4 animate-pulse flex gap-3">
                      <div className="w-12 h-12 rounded-xl bg-neutral-200 shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-neutral-200 rounded w-1/3" />
                        <div className="h-3 bg-neutral-100 rounded w-2/3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : conversations.length === 0 ? (
                <div className="rounded-2xl bg-white border border-neutral-200 p-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-[#EEF4FF] flex items-center justify-center mx-auto mb-4">
                    <FaMessage className="text-[#3678F1] text-2xl" />
                  </div>
                  <p className="text-base font-semibold text-neutral-700 mb-2">No conversations yet</p>
                  <p className="text-sm text-neutral-400">Start a conversation from any user's profile or search results</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {conversations.map(conv => {
                    // Backend returns otherParticipant; fall back to otherUser for safety
                    const other = conv.otherParticipant ?? conv.otherUser;
                    if (!other?.id) return null;
                    const lastMsgTime = conv.lastMessage?.createdAt ?? conv.lastMessageAt ?? null;
                    const lastMsgText = conv.lastMessage?.content ?? null;
                    return (
                      <Link key={conv.id} to={`/dashboard/chat/${other.id}`}
                        className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-neutral-200 hover:border-[#3678F1] hover:shadow-sm transition-all group">
                        <Avatar name={getName(other)} size="md" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-0.5">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-neutral-900 truncate group-hover:text-[#3678F1] transition-colors">{getName(other)}</p>
                              {conv.project && (
                                <p className="text-[10px] text-neutral-400 truncate">{conv.project.title}</p>
                              )}
                            </div>
                            {lastMsgTime && (
                              <span className="text-[11px] text-neutral-400 shrink-0">{timeSince(lastMsgTime)}</span>
                            )}
                          </div>
                          {lastMsgText ? (
                            <p className="text-xs text-neutral-500 truncate">{lastMsgText}</p>
                          ) : (
                            <p className="text-xs text-neutral-400 italic">No messages yet</p>
                          )}
                        </div>
                        {(conv.unreadCount ?? 0) > 0 && (
                          <span className="w-5 h-5 rounded-full bg-[#3678F1] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                            {conv.unreadCount}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          <AppFooter />
        </main>
      </div>
    </div>
  );
}
