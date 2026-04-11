/**
 * ChatUnreadContext — provides total unread message count for the Chat nav badge,
 * plus a per-project breakdown so calendar cells can highlight projects with new messages.
 *
 * Polls every 20s while the user is signed in so the calendar pulse and the nav badge
 * stay reasonably fresh without WebSockets.
 */

import { createContext, useContext, useCallback, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { api } from '../services/api';

interface ConversationItem {
  id: string;
  projectId?: string;
  unreadCount?: number;
  lastMessageAt?: string | null;
}

interface ConversationsResponse {
  items: ConversationItem[];
}

interface ChatUnreadContextValue {
  totalUnread: number;
  /** Map of projectId → total unread count across that project's conversations. */
  unreadByProject: Record<string, number>;
  /**
   * Map of projectId → the local-date (YYYY-MM-DD) of the most recent unread
   * message. Used by the calendar to give a strong "focus" pulse to the exact
   * date a message arrived, with subtler pulses on the project's other shoot dates.
   */
  unreadDateByProject: Record<string, string>;
  refetch: () => void;
  markAllConversationsAsRead: (conversations: ConversationItem[]) => Promise<void>;
}

function toLocalDateKey(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const POLL_INTERVAL_MS = 20_000;

const ChatUnreadContext = createContext<ChatUnreadContextValue | null>(null);

export function ChatUnreadProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [totalUnread, setTotalUnread] = useState(0);
  const [unreadByProject, setUnreadByProject] = useState<Record<string, number>>({});
  const [unreadDateByProject, setUnreadDateByProject] = useState<Record<string, string>>({});
  const [tick, setTick] = useState(0);

  const refetch = useCallback(async () => {
    if (!user) {
      setTotalUnread(0);
      setUnreadByProject({});
      setUnreadDateByProject({});
      return;
    }
    try {
      const res = await api.get<ConversationsResponse>('/conversations?limit=100');
      const items = res?.items ?? [];
      let total = 0;
      const byProject: Record<string, number> = {};
      const dateByProject: Record<string, string> = {};
      // Track the most recent timestamp per project so we can resolve ties.
      const latestTsByProject: Record<string, number> = {};
      for (const c of items) {
        const n = c.unreadCount ?? 0;
        if (n <= 0) continue;
        total += n;
        if (!c.projectId) continue;
        byProject[c.projectId] = (byProject[c.projectId] ?? 0) + n;
        if (c.lastMessageAt) {
          const ts = new Date(c.lastMessageAt).getTime();
          if (!Number.isNaN(ts) && ts > (latestTsByProject[c.projectId] ?? 0)) {
            latestTsByProject[c.projectId] = ts;
            dateByProject[c.projectId] = toLocalDateKey(c.lastMessageAt);
          }
        }
      }
      setTotalUnread(total);
      setUnreadByProject(byProject);
      setUnreadDateByProject(dateByProject);
    } catch {
      setTotalUnread(0);
      setUnreadByProject({});
      setUnreadDateByProject({});
    }
  }, [user]);

  useEffect(() => {
    refetch();
  }, [refetch, tick]);

  // Light polling so the calendar pulse and chat badge stay fresh.
  useEffect(() => {
    if (!user) return;
    const id = setInterval(() => setTick((n) => n + 1), POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [user]);

  const markAllConversationsAsRead = useCallback(async (conversations: ConversationItem[]) => {
    const withUnread = conversations.filter((c) => (c.unreadCount ?? 0) > 0);
    await Promise.all(withUnread.map((c) => api.patch(`/conversations/${c.id}/read`, {})));
    setTick((n) => n + 1);
  }, []);

  const value: ChatUnreadContextValue = {
    totalUnread,
    unreadByProject,
    unreadDateByProject,
    refetch,
    markAllConversationsAsRead,
  };

  return (
    <ChatUnreadContext.Provider value={value}>
      {children}
    </ChatUnreadContext.Provider>
  );
}

export function useChatUnread(): ChatUnreadContextValue {
  const ctx = useContext(ChatUnreadContext);
  if (!ctx) {
    return {
      totalUnread: 0,
      unreadByProject: {},
      unreadDateByProject: {},
      refetch: () => {},
      markAllConversationsAsRead: async () => {},
    };
  }
  return ctx;
}
