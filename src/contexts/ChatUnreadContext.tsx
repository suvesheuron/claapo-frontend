/**
 * ChatUnreadContext — provides total unread message count for the Chat nav badge,
 * plus a per-project breakdown so calendar cells can highlight projects with new messages.
 *
 * Driven by WebSocket push (`unread_updated` event) — the server tells us when
 * unread counts change, so we only fetch then. A manual `refetch()` is still
 * available for callers that need to force a refresh (e.g. after marking read).
 */

import { createContext, useContext, useCallback, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { api } from '../services/api';
import { ensureChatSocket, onUnreadUpdated } from '../services/chatSocket';

interface ConversationItem {
  id: string;
  projectId?: string;
  unreadCount?: number;
  lastMessageAt?: string | null;
  project?: {
    id: string;
    title?: string;
    shootDates?: string[];
  } | null;
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
  /** Map of projectId -> shoot dates for calendar-level unread highlighting. */
  unreadShootDatesByProject: Record<string, string[]>;
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

const ChatUnreadContext = createContext<ChatUnreadContextValue | null>(null);

export function ChatUnreadProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [totalUnread, setTotalUnread] = useState(0);
  const [unreadByProject, setUnreadByProject] = useState<Record<string, number>>({});
  const [unreadDateByProject, setUnreadDateByProject] = useState<Record<string, string>>({});
  const [unreadShootDatesByProject, setUnreadShootDatesByProject] = useState<Record<string, string[]>>({});

  const refetch = useCallback(async () => {
    if (!user) {
      setTotalUnread(0);
      setUnreadByProject({});
      setUnreadDateByProject({});
      setUnreadShootDatesByProject({});
      return;
    }
    try {
      const res = await api.get<ConversationsResponse>('/conversations?limit=100');
      const items = res?.items ?? [];
      let total = 0;
      const byProject: Record<string, number> = {};
      const dateByProject: Record<string, string> = {};
      const shootDatesByProject: Record<string, Set<string>> = {};
      // Track the most recent timestamp per project so we can resolve ties.
      const latestTsByProject: Record<string, number> = {};
      for (const c of items) {
        const n = c.unreadCount ?? 0;
        if (n <= 0) continue;
        total += n;
        if (!c.projectId) continue;
        byProject[c.projectId] = (byProject[c.projectId] ?? 0) + n;
        if (Array.isArray(c.project?.shootDates) && c.project.shootDates.length > 0) {
          shootDatesByProject[c.projectId] ??= new Set<string>();
          for (const d of c.project.shootDates) {
            const key = toLocalDateKey(d);
            if (key) shootDatesByProject[c.projectId].add(key);
          }
        }
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
      setUnreadShootDatesByProject(
        Object.fromEntries(
          Object.entries(shootDatesByProject).map(([pid, dates]) => [pid, Array.from(dates)]),
        ),
      );
    } catch {
      setTotalUnread(0);
      setUnreadByProject({});
      setUnreadDateByProject({});
      setUnreadShootDatesByProject({});
    }
  }, [user]);

  // Initial fetch on mount, then WebSocket push keeps it fresh.
  useEffect(() => {
    refetch();
  }, [refetch]);

  // Listen for server push — triggers a refetch to get the full per-project breakdown.
  useEffect(() => {
    if (!user) return;
    ensureChatSocket();
    const cleanup = onUnreadUpdated(() => {
      refetch();
    });
    return cleanup;
  }, [user, refetch]);

  const markAllConversationsAsRead = useCallback(async (conversations: ConversationItem[]) => {
    const withUnread = conversations.filter((c) => (c.unreadCount ?? 0) > 0);
    await Promise.all(withUnread.map((c) => api.patch(`/conversations/${c.id}/read`, {})));
    refetch();
  }, [refetch]);

  const value: ChatUnreadContextValue = {
    totalUnread,
    unreadByProject,
    unreadDateByProject,
    unreadShootDatesByProject,
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
      unreadShootDatesByProject: {},
      refetch: () => {},
      markAllConversationsAsRead: async () => {},
    };
  }
  return ctx;
}
