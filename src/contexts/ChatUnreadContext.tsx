/**
 * ChatUnreadContext — provides total unread message count for the Chat nav badge.
 * When the user navigates to the Conversations page, mark all as read and refetch
 * so the badge disappears.
 */

import { createContext, useContext, useCallback, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { api } from '../services/api';

interface ConversationItem {
  id: string;
  unreadCount?: number;
}

interface ConversationsResponse {
  items: ConversationItem[];
}

interface ChatUnreadContextValue {
  totalUnread: number;
  refetch: () => void;
  markAllConversationsAsRead: (conversations: ConversationItem[]) => Promise<void>;
}

const ChatUnreadContext = createContext<ChatUnreadContextValue | null>(null);

export function ChatUnreadProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [totalUnread, setTotalUnread] = useState(0);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(async () => {
    if (!user) {
      setTotalUnread(0);
      return;
    }
    try {
      const res = await api.get<ConversationsResponse>('/conversations?limit=100');
      const items = res?.items ?? [];
      const total = items.reduce((sum, c) => sum + (c.unreadCount ?? 0), 0);
      setTotalUnread(total);
    } catch {
      setTotalUnread(0);
    }
  }, [user]);

  useEffect(() => {
    refetch();
  }, [refetch, tick]);

  const markAllConversationsAsRead = useCallback(async (conversations: ConversationItem[]) => {
    const withUnread = conversations.filter((c) => (c.unreadCount ?? 0) > 0);
    await Promise.all(withUnread.map((c) => api.patch(`/conversations/${c.id}/read`, {})));
    setTick((n) => n + 1);
  }, []);

  const value: ChatUnreadContextValue = {
    totalUnread,
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
      refetch: () => {},
      markAllConversationsAsRead: async () => {},
    };
  }
  return ctx;
}
