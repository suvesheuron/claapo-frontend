/**
 * ChatPage — WhatsApp-style split layout with conversation list (left) and chat view (right).
 * Route: /chat or /chat/:userId
 */

import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaArrowLeft, FaMagnifyingGlass, FaMessage,
  FaPaperPlane, FaTriangleExclamation, FaPaperclip, FaImage,
  FaFile, FaXmark, FaEllipsisVertical, FaReply, FaShareFromSquare,
  FaThumbtack, FaTrash, FaCopy, FaFaceSmile, FaMicrophone,
  FaChevronDown, FaBell, FaCheck, FaComments, FaFolder,
} from 'react-icons/fa6';
import DashboardHeader from '../components/DashboardHeader';
import DashboardSidebar from '../components/DashboardSidebar';
import Avatar from '../components/Avatar';
import { useApiQuery, readApiQueryCache, writeApiQueryCache } from '../hooks/useApiQuery';
import { api, ApiException, getMediaUrl } from '../services/api';
import { readChatSnapshot, writeChatSnapshot, updateChatSnapshotMessages } from '../services/chatCache';
import { ensureChatSocket, joinConversationRoom, leaveConversationRoom, emitReadAck } from '../services/chatSocket';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { useRole } from '../contexts/RoleContext';
import { useChatUnread } from '../contexts/ChatUnreadContext';
import { linkifyText } from '../utils/linkify';
import MediaLightbox, { type LightboxMedia } from '../components/MediaLightbox';
import { individualNavLinks, vendorNavLinks, companyNavLinks, castNavLinks, locationNavLinks } from '../navigation/dashboardNav';

// ── Types ──────────────────────────────────────────────────────────────

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
  lastMessageAt?: string | null;
  conversationCount: number;
  invoiceCount: number;
  bookingCount: number;
}
interface ProjectsWithStatsResponse { items: Project[]; meta: { total: number } }

interface ChatMessage {
  id: string;
  senderId: string;
  senderDisplayName?: string;
  isSameAccount?: boolean;
  content: string | null;
  type?: 'text' | 'image' | 'file';
  mediaKey?: string | null;
  mediaUrl?: string | null;
  createdAt: string;
  readAt?: string | null;
  isRead?: boolean;
  isPinned?: boolean;
  deletedAt?: string | null;
  forwardedFromId?: string | null;
  replyToId?: string | null;
  replyTo?: { id: string; content: string | null; senderId: string; senderDisplayName?: string } | null;
}

interface OtherUser {
  id?: string;
  role?: string;
  displayName?: string;
  companyName?: string;
  profile?: { displayName?: string; companyName?: string; avatarUrl?: string; logoUrl?: string };
  isOnline?: boolean;
}

type Filter = 'all' | 'unread';

const POLL_INTERVAL_MS = 8000;

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

function formatDateLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

function shouldShowDateLabel(msgs: ChatMessage[], idx: number): boolean {
  if (idx === 0) return true;
  const prev = new Date(msgs[idx - 1].createdAt).toDateString();
  const curr = new Date(msgs[idx].createdAt).toDateString();
  return prev !== curr;
}

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

function isBookingSystemNotification(content: string | null | undefined): boolean {
  if (!content) return false;
  const text = content.trim().toLowerCase();
  return (
    text.startsWith('booking request has been accepted') ||
    text.startsWith('booking request has been declined') ||
    text.startsWith('cancellation request has been accepted by ') ||
    text.startsWith('cancellation request has been declined by ')
  );
}

export default function ChatPage() {
  const { userId: targetUserId } = useParams<{ userId: string }>();
  const [searchParams] = useSearchParams();
  const projectIdFromUrl = searchParams.get('projectId');
  const { user } = useAuth();
  const { currentRole } = useRole();
  const { unreadByProject } = useChatUnread();

  // ── Left Panel State ────────────────────────────────────────────────

  const { data: projectsData } = useApiQuery<ProjectsWithStatsResponse>(
    '/projects/my/with-stats?limit=100',
    { swr: true },
  );
  const projects = projectsData?.items ?? [];

  const conversationsUrl = '/conversations?limit=100';
  const { data, loading: convLoading, refetch: refetchConversations } = useApiQuery<ConversationsResponse>(
    conversationsUrl,
    { swr: true },
  );
  const conversations = data?.items ?? [];

  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  // Initialize from the URL so deep-links like /chat/:userId?projectId=XYZ
  // land directly in the conversations view (not the projects view).
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    () => projectIdFromUrl,
  );

  // Keep selectedProjectId in sync with the URL across navigation events. A
  // user landing on /chat/:userId?projectId=XYZ from another page must end up
  // in the project's conversation view; clearing the query param (e.g. from
  // Conversations link) must return to the project picker.
  useEffect(() => {
    if (projectIdFromUrl) {
      setSelectedProjectId(projectIdFromUrl);
    }
  }, [projectIdFromUrl]);

  const navLinks =
    currentRole === 'Company'
      ? companyNavLinks
      : currentRole === 'Vendor'
        ? vendorNavLinks
        : currentRole === 'Location'
          ? locationNavLinks
          : currentRole === 'Cast'
            ? castNavLinks
            : individualNavLinks;

  const getName = (u: Participant) => u.displayName ?? u.companyName ?? u.email ?? 'Unknown';

  const filtered = useMemo(() => {
    const result = conversations.filter((conv) => {
      if (selectedProjectId && conv.project?.id !== selectedProjectId) return false;
      if (filter === 'unread' && !(conv.unreadCount && conv.unreadCount > 0)) return false;
      if (!search.trim()) return true;
      const other = conv.otherParticipant ?? conv.otherUser;
      const name = other ? getName(other).toLowerCase() : '';
      const proj = conv.project?.title?.toLowerCase() ?? '';
      const q = search.toLowerCase();
      return name.includes(q) || proj.includes(q);
    });
    return [...result].sort((a, b) => {
      const aTime = new Date(a.lastMessage?.createdAt ?? a.lastMessageAt ?? 0).getTime();
      const bTime = new Date(b.lastMessage?.createdAt ?? b.lastMessageAt ?? 0).getTime();
      return bTime - aTime;
    });
  }, [conversations, filter, search, getName, selectedProjectId]);

  // ── Right Panel State ──────────────────────────────────────────────

  const initialSnapshot = readChatSnapshot<ChatMessage>(
    targetUserId ?? '',
    projectIdFromUrl,
  );

  const [messages, setMessages] = useState<ChatMessage[]>(
    () => initialSnapshot?.messages ?? [],
  );
  const [otherUser, setOtherUser] = useState<OtherUser | null>(null);
  const [noConversation, setNoConversation] = useState(
    () => initialSnapshot?.noConversation ?? false,
  );
  const [scopedConversationId, setScopedConversationId] = useState<string | null>(
    () => initialSnapshot?.scopedConversationId ?? null,
  );
  const [activeConversationId, setActiveConversationId] = useState<string | null>(
    () => initialSnapshot?.activeConversationId ?? null,
  );
  const [scopedProjectTitle, setScopedProjectTitle] = useState<string | null>(
    () => initialSnapshot?.scopedProjectTitle ?? null,
  );
  const [scopedConversationLoading, setScopedConversationLoading] = useState(
    () => !!projectIdFromUrl && !initialSnapshot?.scopedConversationId,
  );
  const [input, setInput] = useState('');
  const [loadingInit, setLoadingInit] = useState(() => !initialSnapshot);
  const [sending, setSending] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ msgId: string; x: number; y: number } | null>(null);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [showScrollDown, setShowScrollDown] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const [forwardMsg, setForwardMsg] = useState<ChatMessage | null>(null);
  const [lightbox, setLightbox] = useState<LightboxMedia | null>(null);
  const [conversationsForForward, setConversationsForForward] = useState<Conversation[]>([]);
  const [forwardSearch, setForwardSearch] = useState('');

  const bottomRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastMsgTime = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const prevTargetUserIdRef = useRef(targetUserId);

  // Derive other user info from the conversation list (available synchronously)
  // instead of waiting for fetchOtherUser API call
  const otherFromList = useMemo(() => {
    if (!targetUserId) return null;
    const conv = conversations.find((c) => {
      const other = c.otherParticipant ?? c.otherUser;
      return other?.id === targetUserId;
    });
    const p = conv?.otherParticipant ?? conv?.otherUser;
    return p
      ? { displayName: p.displayName, companyName: p.companyName, avatarUrl: p.avatarUrl, id: p.id }
      : null;
  }, [targetUserId, conversations]);

  // After sending a message, bump the conversation to the top of the list
  // immediately instead of waiting for the next SWR background refresh.
  const bumpConversationToTop = useCallback((content: string) => {
    const cached = readApiQueryCache<ConversationsResponse>(conversationsUrl);
    if (!cached?.items) return;
    const idx = cached.items.findIndex((c) => {
      const other = c.otherParticipant ?? c.otherUser;
      return other?.id === targetUserId;
    });
    if (idx === -1) return;
    const items = [...cached.items];
    const conv = { ...items[idx] };
    conv.lastMessageAt = new Date().toISOString();
    conv.lastMessage = {
      content,
      senderId: user?.id ?? '',
      createdAt: new Date().toISOString(),
    };
    items.splice(idx, 1);
    items.unshift(conv);
    writeApiQueryCache(conversationsUrl, { ...cached, items });
    refetchConversations();
  }, [conversationsUrl, targetUserId, user?.id, refetchConversations]);

  // Prioritize: API profile > cached profile > conversation list > raw ID
  // Validate otherUser.id matches current targetUserId to avoid stale data
  const displayOtherUser =
    (otherUser?.id === targetUserId ? otherUser : null)
    ?? initialSnapshot?.otherUser
    ?? otherFromList;

  const otherName =
    displayOtherUser?.displayName ??
    displayOtherUser?.companyName ??
    otherFromList?.displayName ??
    otherFromList?.companyName ??
    targetUserId ??
    'User';
  const otherRole = (displayOtherUser as any)?.role ?? '';
  const otherAvatar =
    (displayOtherUser as any)?.profile?.avatarUrl
    ?? (displayOtherUser as any)?.avatarUrl
    ?? otherFromList?.avatarUrl
    ?? (displayOtherUser as any)?.profile?.logoUrl
    ?? '';

  // ─ API Calls ───────────────────────────────────────────────────────

  const mapApiMessageToChat = useCallback(
    (m: {
      id: string;
      senderId: string;
      senderDisplayName?: string;
      isSameAccount?: boolean;
      content: string | null;
      type?: string;
      mediaKey?: string | null;
      createdAt: string;
      readAt?: string | null;
      isRead?: boolean;
      isPinned?: boolean;
      deletedAt?: string | null;
      forwardedFromId?: string | null;
      replyToId?: string | null;
      replyTo?: ChatMessage['replyTo'];
      sender?: { id: string; displayName?: string };
    }): ChatMessage => ({
      id: m.id,
      senderId: m.senderId,
      senderDisplayName: m.senderDisplayName ?? m.sender?.displayName,
      isSameAccount: m.isSameAccount ?? m.senderId === user?.id,
      content: m.content,
      type: (m.type as ChatMessage['type']) ?? 'text',
      mediaKey: m.mediaKey,
      createdAt: m.createdAt,
      readAt: m.readAt,
      isRead: m.isRead,
      isPinned: m.isPinned,
      deletedAt: m.deletedAt,
      forwardedFromId: m.forwardedFromId,
      replyToId: m.replyToId,
      replyTo: m.replyTo,
    }),
    [user?.id],
  );

  const fetchMessages = useCallback(
    async (isPolling = false) => {
      if (!targetUserId) return;
      if (projectIdFromUrl) {
        if (scopedConversationLoading) return;
        if (!scopedConversationId) {
          if (!scopedConversationLoading && !isPolling) {
            setMessages([]);
            setLoadingInit(false);
          }
          return;
        }
        try {
          if (!isPolling) setLoadError(null);
          const res = await api.get<{
            items: Array<{
              id: string;
              senderId: string;
              content: string | null;
              type?: string;
              mediaKey?: string | null;
              createdAt: string;
              readAt?: string | null;
              isRead?: boolean;
              isPinned?: boolean;
              deletedAt?: string | null;
              forwardedFromId?: string | null;
              replyToId?: string | null;
              replyTo?: ChatMessage['replyTo'];
              sender?: { id: string; displayName?: string };
            }>;
          }>(`/conversations/${scopedConversationId}/messages?limit=50`);
          const raw = res?.items ?? [];
          const data = [...raw].reverse().map(mapApiMessageToChat);
          if (!isPolling) {
            setMessages(data);
            setNoConversation(false);
          } else if (data.length) {
            const newest = data[data.length - 1]?.createdAt;
            if (newest !== lastMsgTime.current) setMessages(data);
            lastMsgTime.current = newest ?? null;
          }
          if (!isPolling && data.length) lastMsgTime.current = data[data.length - 1]?.createdAt ?? null;
          else if (!isPolling && !data.length) lastMsgTime.current = null;
          if (targetUserId) {
            writeChatSnapshot<ChatMessage>(targetUserId, projectIdFromUrl, {
              messages: data,
              activeConversationId: scopedConversationId,
              scopedConversationId,
              noConversation: false,
              scopedProjectTitle,
            });
          }
        } catch (err) {
          if (!isPolling) {
            setLoadError(err instanceof ApiException ? err.payload.message : 'Failed to load messages.');
          }
        } finally {
          if (!isPolling) setLoadingInit(false);
        }
        return;
      }

      try {
        const res = await api.get<{
          conversationId: string | null;
          project?: { id: string; title: string } | null;
          items: ChatMessage[];
        }>(
          `/conversations/with/${targetUserId}?limit=50`,
        );
        const data = res?.items ?? [];
        if (!isPolling) {
          setNoConversation(res?.conversationId === null);
          setActiveConversationId(res?.conversationId ?? null);
          setScopedProjectTitle(res?.project?.title ?? null);
          setMessages(data);
        }
        if (targetUserId) {
          writeChatSnapshot<ChatMessage>(targetUserId, projectIdFromUrl, {
            messages: data,
            activeConversationId: res?.conversationId ?? null,
            scopedConversationId: null,
            noConversation: res?.conversationId === null,
            scopedProjectTitle: res?.project?.title ?? null,
          });
        }
        if (!data.length) return;
        const newest = data[data.length - 1]?.createdAt;
        if (isPolling && newest !== lastMsgTime.current) {
          setMessages(data);
        }
        lastMsgTime.current = newest ?? null;
      } catch (err) {
        if (!isPolling) {
          setLoadError(err instanceof ApiException ? err.payload.message : 'Failed to load messages.');
        }
      } finally {
        if (!isPolling) setLoadingInit(false);
      }
    },
    [
      targetUserId,
      projectIdFromUrl,
      scopedConversationId,
      scopedConversationLoading,
      mapApiMessageToChat,
    ],
  );

  const fetchOtherUser = useCallback(async () => {
    if (!targetUserId) return;
    try {
      const profile = await api.get<OtherUser>(`/profile/${targetUserId}`);
      setOtherUser(profile);
      // Cache the user profile alongside messages for instant display on re-visit
      const prev = readChatSnapshot<ChatMessage>(targetUserId, projectIdFromUrl);
      if (prev) {
        writeChatSnapshot<ChatMessage>(targetUserId, projectIdFromUrl, {
          ...prev,
          otherUser: {
            id: profile.id,
            displayName: profile.displayName,
            companyName: profile.companyName,
            avatarUrl: profile.profile?.avatarUrl ?? profile.profile?.logoUrl,
            role: profile.role,
          },
        });
      }
    } catch {
      // Non-fatal
    }
  }, [targetUserId, projectIdFromUrl]);

  // ── Project-scoped conversation resolution ──────────────────────────

  useEffect(() => {
    if (!projectIdFromUrl || !targetUserId) {
      setScopedConversationId(null);
      setActiveConversationId(null);
      setScopedProjectTitle(null);
      setScopedConversationLoading(false);
      return;
    }
    const cached = readChatSnapshot<ChatMessage>(targetUserId, projectIdFromUrl);
    const hasCachedConversation = !!cached?.scopedConversationId;
    let alive = true;
    if (hasCachedConversation) {
      setScopedConversationLoading(false);
    } else {
      setScopedConversationLoading(true);
      setScopedConversationId(null);
      setActiveConversationId(null);
      setScopedProjectTitle(null);
    }
    void (async () => {
      try {
        const res = await api.post<{ id: string; project?: { title: string } | null }>('/conversations', {
          projectId: projectIdFromUrl,
          otherUserId: targetUserId,
        });
        if (!alive) return;
        setScopedConversationId(res.id);
        setActiveConversationId(res.id);
        setScopedProjectTitle(res.project?.title ?? null);
        setNoConversation(false);
        if (targetUserId) {
          const prev = readChatSnapshot<ChatMessage>(targetUserId, projectIdFromUrl);
          writeChatSnapshot<ChatMessage>(targetUserId, projectIdFromUrl, {
            messages: prev?.messages ?? [],
            activeConversationId: res.id,
            scopedConversationId: res.id,
            noConversation: false,
            scopedProjectTitle: res.project?.title ?? null,
          });
        }
      } catch {
        if (!alive) return;
        if (!hasCachedConversation) {
          setScopedConversationId(null);
          setActiveConversationId(null);
          setNoConversation(true);
          toast.error('Could not open chat for this project.', {
            id: 'project-chat-resolve-failed',
          });
        }
      } finally {
        if (alive) setScopedConversationLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [projectIdFromUrl, targetUserId]);

  // ── Effects ────────────────────────────────────────────────────────

  useEffect(() => {
    document.title = 'Chat – Claapo';
  }, []);

  // Sync project selector with URL projectId param
  useEffect(() => {
    if (projectIdFromUrl) {
      setSelectedProjectId(projectIdFromUrl);
    }
  }, [projectIdFromUrl]);

  useEffect(() => {
    // Detect if targetUserId just changed — used to skip stale fetchMessages
    const justSwitched = prevTargetUserIdRef.current !== targetUserId;
    prevTargetUserIdRef.current = targetUserId;

    if (projectIdFromUrl && scopedConversationLoading) {
      setLoadingInit(true);
      return;
    }
    if (!targetUserId) {
      setScopedConversationId(null);
      setActiveConversationId(null);
      setScopedProjectTitle(null);
      setScopedConversationLoading(false);
      setMessages([]);
      setOtherUser(null);
      setNoConversation(false);
      setLoadError(null);
      setLoadingInit(false);
      return;
    }

    // SWR-like behavior: read from cache first, display immediately
    const cached = readChatSnapshot<ChatMessage>(targetUserId, projectIdFromUrl);
    if (cached?.messages && cached.messages.length > 0) {
      // Display cached messages immediately — no loading skeleton
      setMessages(cached.messages);
      setActiveConversationId(cached.activeConversationId ?? null);
      setScopedConversationId(cached.scopedConversationId ?? null);
      setScopedProjectTitle(cached.scopedProjectTitle ?? null);
      setNoConversation(cached.noConversation ?? false);
      setLoadError(null);
      setLoadingInit(false);
    } else {
      // No cache — show loading skeleton
      setMessages([]);
      setOtherUser(null);
      setNoConversation(false);
      setLoadError(null);
      setLoadingInit(true);
    }

    // Reset UI state for new conversation
    setInput('');
    setReplyTo(null);
    setShowSearch(false);
    setSearchQuery('');
    setShowEmojiPicker(false);
    setShowAttachMenu(false);
    setContextMenu(null);
    setShowMoreMenu(false);
    setForwardMsg(null);

    // Background fetch — updates cache and state when done
    // Skip on first render after project-scoped switch: the closure may have
    // a stale scopedConversationId from the previous conversation, which would
    // fetch the wrong user's messages and corrupt the cache.
    if (!projectIdFromUrl || !justSwitched) {
      void fetchMessages(false);
    }
    void fetchOtherUser();
  }, [fetchMessages, fetchOtherUser, projectIdFromUrl, scopedConversationLoading, scopedConversationId, targetUserId]);

  useEffect(() => {
    pollRef.current = setInterval(() => fetchMessages(true), POLL_INTERVAL_MS);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchMessages]);

  useEffect(() => {
    if (!activeConversationId) return;
    const socket = ensureChatSocket();
    if (!socket) return;

    joinConversationRoom(activeConversationId);
    emitReadAck(activeConversationId);

    const onNewMessage = (raw: Parameters<typeof mapApiMessageToChat>[0] & { conversationId?: string }) => {
      if (raw?.conversationId && raw.conversationId !== activeConversationId) return;
      const incoming = mapApiMessageToChat(raw);
      const upsert = (prev: ChatMessage[]): ChatMessage[] => {
        const idx = prev.findIndex((m) => m.id === incoming.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = { ...next[idx], ...incoming };
          return next;
        }
        return [...prev, incoming];
      };
      setMessages(upsert);
      if (targetUserId) {
        updateChatSnapshotMessages<ChatMessage>(
          targetUserId,
          projectIdFromUrl,
          upsert,
        );
      }
      lastMsgTime.current = incoming.createdAt;
    };

    const onMessagesRead = (payload: { conversationId?: string }) => {
      if (payload?.conversationId && payload.conversationId !== activeConversationId) return;
      void fetchMessages(true);
    };

    socket.on('new_message', onNewMessage);
    socket.on('messages_read', onMessagesRead);

    return () => {
      socket.off('new_message', onNewMessage);
      socket.off('messages_read', onMessagesRead);
      leaveConversationRoom(activeConversationId);
    };
  }, [activeConversationId, mapApiMessageToChat, fetchMessages, targetUserId, projectIdFromUrl]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleScroll = () => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    setShowScrollDown(scrollHeight - scrollTop - clientHeight > 200);
  };

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // ── Send Message ────────────────────────────────────────────────────

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = input.trim();
    if (!content || sending) return;
    if (projectIdFromUrl && !scopedConversationId) {
      toast.error('Chat is still opening — try again.', {
        id: 'chat-still-opening',
      });
      return;
    }
    setSending(true);
    try {
      const body: Record<string, unknown> = { content };
      if (replyTo) body.replyToId = replyTo.id;
      if (scopedConversationId) {
        await api.post(`/conversations/${scopedConversationId}/messages`, body);
      } else {
        await api.post(`/conversations/with/${targetUserId}/messages`, body);
      }
      setInput('');
      setReplyTo(null);
      setShowEmojiPicker(false);
      bumpConversationToTop(content);
      void fetchMessages(false);
    } catch (err) {
      toast.error(err instanceof ApiException ? err.payload.message : 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  const handleFileUpload = async (file: File, type: 'image' | 'file') => {
    if (!targetUserId) return;
    if (projectIdFromUrl && !scopedConversationId) {
      toast.error('Chat is still opening — try again.', {
        id: 'chat-still-opening',
      });
      return;
    }
    setShowAttachMenu(false);
    const toastId = toast.loading(`Sending ${type}...`);
    try {
      let conversationId = scopedConversationId;
      if (!conversationId) {
        const res = await api.get<{ conversationId: string | null }>(
          `/conversations/with/${targetUserId}?limit=1`,
        );
        conversationId = res?.conversationId ?? null;
      }
      if (!conversationId) {
        toast.error('Open a project chat first to send attachments.', { id: toastId });
        return;
      }

      const contentType = file.type || 'application/octet-stream';
      const media = await api.post<{ uploadUrl: string; key: string }>(
        `/conversations/${conversationId}/media`,
        { contentType },
      );
      const putResp = await fetch(media.uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': contentType },
      });
      if (!putResp.ok) throw new Error(`Upload failed (${putResp.status})`);

      await api.post(`/conversations/${conversationId}/messages`, {
        type,
        mediaKey: media.key,
        content: file.name,
      });

      const label = type === 'image' ? '📷 Image' : '📎 File';
      bumpConversationToTop(label);

      void fetchMessages(false);
      toast.success(`${type === 'image' ? 'Image' : 'File'} sent!`, { id: toastId });
    } catch (err) {
      toast.error(err instanceof ApiException ? err.payload.message : `Failed to send ${type}.`, { id: toastId });
    }
  };

  const handleCopy = (msg: ChatMessage) => {
    navigator.clipboard.writeText(msg.content ?? '');
    toast.success('Copied to clipboard');
    setContextMenu(null);
  };

  const handleDelete = async (msgId: string) => {
    setContextMenu(null);
    try {
      await api.delete(`/conversations/messages/${msgId}`);
      toast.success('Message deleted');
      await fetchMessages(false);
    } catch (err) {
      toast.error(err instanceof ApiException ? err.payload.message : 'Failed to delete message.');
    }
  };

  const handlePin = async (msgId: string) => {
    setContextMenu(null);
    try {
      await api.patch(`/conversations/messages/${msgId}/pin`, {});
      toast.success('Message pin toggled');
      await fetchMessages(false);
    } catch (err) {
      toast.error(err instanceof ApiException ? err.payload.message : 'Pin feature coming soon.');
    }
  };

  const handleForward = async (msg: ChatMessage) => {
    setContextMenu(null);
    setForwardMsg(msg);
    try {
      const res = await api.get<{ items: Conversation[] }>('/conversations?limit=100');
      setConversationsForForward(res?.items ?? []);
    } catch {
      toast.error('Failed to load conversations');
    }
  };

  const doForward = async (targetConvId: string) => {
    if (!forwardMsg) return;
    try {
      await api.post(`/conversations/messages/${forwardMsg.id}/forward`, {
        targetConversationId: targetConvId,
      });
      toast.success('Message forwarded');
      setForwardMsg(null);
    } catch (err) {
      toast.error(err instanceof ApiException ? err.payload.message : 'Failed to forward message.');
    }
  };

  const handleReply = (msg: ChatMessage) => {
    setReplyTo(msg);
    setContextMenu(null);
  };

  const insertEmoji = (emoji: string) => {
    setInput((prev) => prev + emoji);
  };

  useEffect(() => {
    const handler = () => {
      setContextMenu(null);
      setShowAttachMenu(false);
      setShowMoreMenu(false);
    };
    if (contextMenu || showAttachMenu || showMoreMenu) {
      document.addEventListener('click', handler);
      return () => document.removeEventListener('click', handler);
    }
  }, [contextMenu, showAttachMenu, showMoreMenu]);

  // Read from cache at render time — prevents flash of previous conversation's messages
  const displayMessages = initialSnapshot?.messages?.length
    ? initialSnapshot.messages
    : messages;

  const filteredMessages = searchQuery.trim()
    ? displayMessages.filter((m) => m.content?.toLowerCase().includes(searchQuery.toLowerCase()))
    : displayMessages;

  const pinnedMessages = displayMessages.filter((m) => m.isPinned);
  const emojiList = ['😀','😂','😍','🤔','👍','👎','❤️','🔥','🎉','👏','😢','😮','🙏','','✅','⭐','🎬','','📸','🎵'];

  // ── Render Left Panel ───────────────────────────────────────────────

  // All roles get a project picker view first when no project is selected.
  // Picking a project transitions the left panel to that project's
  // conversations; the "← Back to Projects" link returns to the picker.
  const showProjectPickerView = !selectedProjectId && !targetUserId;
  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  // Projects with unread messages float to the top so the user immediately
  // sees where the new activity is. Within each tier (unread / read) we sort
  // by latest message timestamp so the freshest threads come first.
  const projectsForPicker = useMemo(() => {
    const recency = (p: Project) =>
      new Date(p.lastMessageAt ?? p.createdAt ?? 0).getTime();
    return [...projects].sort((a, b) => {
      const aHasUnread = (unreadByProject[a.id] ?? 0) > 0;
      const bHasUnread = (unreadByProject[b.id] ?? 0) > 0;
      if (aHasUnread !== bHasUnread) return aHasUnread ? -1 : 1;
      return recency(b) - recency(a);
    });
  }, [projects, unreadByProject]);

  const projectsWithUnread = useMemo(
    () => projectsForPicker.reduce((sum, p) => sum + ((unreadByProject[p.id] ?? 0) > 0 ? 1 : 0), 0),
    [projectsForPicker, unreadByProject],
  );

  const renderProjectPicker = () => (
    <div className="flex flex-col h-full bg-white border-r border-neutral-200 dark:border-app-border">
      {/* Header */}
      <div className="px-4 py-3 border-b border-neutral-200 dark:border-app-border shrink-0">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-bold text-neutral-900">Messages</h2>
          <span className="text-xs text-neutral-500">
            {projectsForPicker.length} {projectsForPicker.length === 1 ? 'project' : 'projects'}
          </span>
        </div>
        <p className="text-xs text-neutral-500">
          {projectsForPicker.length === 0
            ? 'No projects yet'
            : projectsWithUnread > 0
              ? (
                <>
                  <span className="text-[#F40F02] font-semibold">{projectsWithUnread}</span>
                  {' '}with new messages
                </>
              )
              : 'Select a project to view conversations'}
        </p>
      </div>

      {/* Project list */}
      <div className="flex-1 overflow-y-auto">
        {projectsForPicker.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6 py-12">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#E8F0FE] to-[#DBEAFE] flex items-center justify-center mb-4 border border-[#3678F1]/10">
              <FaFolder className="text-[#3678F1] text-xl" />
            </div>
            <p className="text-sm font-semibold text-neutral-900 mb-1">No projects yet</p>
            <p className="text-xs text-neutral-500">
              Create a project or accept a booking to start chatting.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-neutral-100 dark:divide-app-border">
            {projectsForPicker.map((project) => {
              const unreadForProject = unreadByProject[project.id] ?? 0;
              const hasUnread = unreadForProject > 0;
              return (
                <li key={project.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedProjectId(project.id)}
                    className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-colors ${
                      hasUnread
                        ? 'bg-white hover:bg-[#F3F4F6] dark:hover:bg-surface-2'
                        : 'bg-white hover:bg-[#F3F4F6] dark:hover:bg-surface-2'
                    }`}
                  >
                    <div className="relative shrink-0">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#E8F0FE] to-[#DBEAFE] flex items-center justify-center border border-[#3678F1]/10">
                        <FaComments className="text-[#3678F1] text-base" />
                      </div>
                      {hasUnread && (
                        <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center">
                          <span className="absolute inline-flex w-3 h-3 rounded-full bg-[#F40F02] opacity-60 animate-ping" />
                          <span className="relative inline-flex w-3 h-3 rounded-full bg-[#F40F02] border-2 border-white" />
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm truncate leading-snug ${hasUnread ? 'font-bold text-neutral-900' : 'font-semibold text-neutral-800'}`}>
                          {project.title}
                        </p>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize shrink-0 ${
                          project.status === 'active' ? 'bg-[#DCFCE7] text-[#15803D]' :
                          project.status === 'completed' ? 'bg-[#DBEAFE] text-[#1E3A8A]' :
                          'bg-neutral-100 text-neutral-500'
                        }`}>
                          {project.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {project.conversationCount > 0 && (
                          <span className="text-[11px] text-neutral-500">
                            {project.conversationCount} {project.conversationCount === 1 ? 'chat' : 'chats'}
                          </span>
                        )}
                        {hasUnread && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-[#F40F02] text-white text-[10px] font-bold">
                            {unreadForProject > 99 ? '99+' : unreadForProject} new
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );

  const renderConversationsPanel = () => (
    <div className="flex flex-col h-full bg-white border-r border-neutral-200 dark:border-app-border">
      {/* Header */}
      <div className="px-4 py-3 border-b border-neutral-200 dark:border-app-border shrink-0">
        {selectedProjectId ? (
          <>
            <Link
              to="/chat"
              onClick={() => setSelectedProjectId(null)}
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#3678F1] hover:underline mb-2"
            >
              <FaArrowLeft className="w-3 h-3" />
              Back to Projects
            </Link>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-neutral-900 truncate">
                {selectedProject?.title ?? 'Project'}
              </h2>
              <span className="text-xs text-neutral-500 shrink-0">{filtered.length} chats</span>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-neutral-900">Messages</h2>
            <span className="text-xs text-neutral-500">{filtered.length} chats</span>
          </div>
        )}

        <div className="relative">
          <FaMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations..."
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-[#F3F4F6] dark:bg-surface-2 text-neutral-900 dark:text-slate-200 placeholder-neutral-400 border border-transparent focus:outline-none focus:ring-2 focus:ring-[#3678F1]/15 focus:border-[#3678F1]/30 transition-all"
          />
        </div>
        <div className="flex items-center gap-1 mt-2">
          {(['all', 'unread'] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md capitalize transition-all ${
                filter === f
                  ? 'bg-[#E8F0FE] text-[#3678F1]'
                  : 'text-neutral-600 hover:bg-neutral-100 dark:hover:bg-surface-2'
              }`}
            >
              {f === 'unread' && conversations.some((c) => (c.unreadCount ?? 0) > 0)
                ? `${f} (${conversations.reduce((s, c) => s + (c.unreadCount ?? 0), 0)})`
                : f}
            </button>
          ))}
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        {convLoading ? (
          <div className="space-y-2 p-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="rounded-xl bg-[#F3F4F6] dark:bg-surface-2 px-4 py-3 flex gap-3">
                <div className="skeleton w-12 h-12 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-4 w-2/5" />
                  <div className="skeleton h-3 w-3/5" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6 py-12">
            <div className="w-16 h-16 rounded-full bg-[#E8F0FE] flex items-center justify-center mb-4">
              <FaMessage className="text-[#3678F1] text-xl" />
            </div>
            <p className="text-sm font-semibold text-neutral-900 mb-1">No conversations</p>
            <p className="text-xs text-neutral-500">
              {filter === 'unread' ? "You're all caught up!" : 'Start a new chat or wait for messages.'}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-neutral-100 dark:divide-app-border">
            {filtered.map((conv) => {
              const other = conv.otherParticipant ?? conv.otherUser;
              if (!other?.id) return null;
              const hasUnread = (conv.unreadCount ?? 0) > 0;
              const isSelected = targetUserId === other.id;
              const lastMsgTime = conv.lastMessage?.createdAt ?? conv.lastMessageAt ?? null;
              const lastMsgText = conv.lastMessage?.content ?? null;
              const chatHref = `/chat/${other.id}${conv.project?.id ? `?projectId=${conv.project.id}` : ''}`;

              return (
                <li key={conv.id}>
                  <Link
                    to={chatHref}
                    className={`block px-4 py-3 flex items-start gap-3 transition-colors ${
                      isSelected
                        ? 'bg-[#E8F0FE] dark:bg-surface-2'
                        : 'hover:bg-[#F3F4F6] dark:hover:bg-surface-2'
                    }`}
                  >
                    <div className="relative shrink-0">
                      <Avatar src={other.avatarUrl} name={getName(other)} size="md" />
                      {hasUnread && (
                        <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center">
                          <span className="absolute inline-flex w-3 h-3 rounded-full bg-[#F40F02] opacity-60 animate-ping" />
                          <span className="relative inline-flex w-3 h-3 rounded-full bg-[#F40F02] border-2 border-white" />
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm truncate leading-snug ${hasUnread ? 'font-bold text-neutral-900' : 'font-medium text-neutral-800'}`}>
                          {getName(other)}
                        </p>
                        {lastMsgTime && (
                          <span className={`text-[10px] tabular-nums shrink-0 ${hasUnread ? 'text-[#3678F1] font-bold' : 'text-neutral-400'}`}>
                            {timeSince(lastMsgTime)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {!hasUnread && lastMsgText && (
                          <FaCheck className="w-3 h-3 text-[#3678F1] shrink-0 opacity-70" />
                        )}
                        <p className={`text-xs truncate leading-snug ${hasUnread ? 'text-neutral-800 font-medium' : 'text-neutral-500'}`}>
                          {lastMsgText ?? 'Tap to start chatting'}
                        </p>
                      </div>
                      {conv.project && (
                        <p className="text-[10px] text-neutral-400 mt-0.5 truncate">
                          {conv.project.title}
                        </p>
                      )}
                    </div>
                    {hasUnread && (
                      <span className="min-w-[20px] h-[20px] px-1.5 rounded-full bg-[#3678F1] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                        {(conv.unreadCount ?? 0) > 99 ? '99+' : conv.unreadCount}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );

  // ── Render Right Panel (Empty State) ────────────────────────────────

  const renderRightPanelEmpty = () => (
    <div className="flex flex-col items-center justify-center h-full bg-[#F3F4F6] dark:bg-bg text-center px-6">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-24 h-24 rounded-full bg-gradient-to-br from-[#E8F0FE] to-[#DBEAFE] flex items-center justify-center mb-6 shadow-sm"
      >
        <FaMessage className="text-[#3678F1] text-3xl" />
      </motion.div>
      <h3 className="text-xl font-bold text-neutral-900 mb-2">Welcome to Chat</h3>
      <p className="text-sm text-neutral-500 max-w-sm">
        {showProjectPickerView
          ? 'Pick a project on the left to see its conversations.'
          : 'Select a conversation from the left to start messaging, or create a new chat to connect with crew and vendors.'}
      </p>
    </div>
  );

  // ── Render Right Panel (Active Chat) ────────────────────────────────

  const renderRightPanelChat = () => (
    <div className="flex flex-col h-full relative">
      {/* Chat Header */}
      <div className="px-4 py-3 flex items-center gap-3 shrink-0 border-b border-neutral-200 dark:border-app-border bg-white dark:bg-surface-1">
        <Link
          to={projectIdFromUrl ? `/conversations/${projectIdFromUrl}` : '/chat'}
          className="p-2 hover:bg-neutral-100 dark:hover:bg-surface-2 rounded-xl transition-colors shrink-0 md:hidden"
          aria-label={projectIdFromUrl ? 'Back to project chats' : 'Back to conversations'}
        >
          <FaArrowLeft className="w-4 h-4 text-neutral-600" />
        </Link>
        <div className="relative shrink-0">
          <Avatar src={otherAvatar} name={otherName} size="md" />
          {otherUser?.isOnline && (
            <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#22C55E] ring-2 ring-white" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          {targetUserId && (user?.role === 'company' || user?.role === 'admin') ? (
            <Link
              to={`/profile/${targetUserId}`}
              className="block text-left hover:underline decoration-[#3678F1]/80 underline-offset-2"
            >
              <h2 className="text-base font-bold text-neutral-900 truncate">{otherName}</h2>
            </Link>
          ) : (
            <h2 className="text-base font-bold text-neutral-900 truncate">{otherName}</h2>
          )}
          <p className="text-xs text-neutral-500 truncate">
            {scopedProjectTitle
              ? scopedProjectTitle
              : otherUser?.isOnline
                ? 'Online now'
                : otherRole
                  ? otherRole.replace(/_/g, ' ')
                  : 'View profile'}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => { setShowSearch(!showSearch); setSearchQuery(''); }}
            className="p-2 hover:bg-neutral-100 dark:hover:bg-surface-2 rounded-xl transition-colors"
          >
            <FaMagnifyingGlass className="w-4 h-4 text-neutral-500" />
          </button>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className="p-2 hover:bg-neutral-100 dark:hover:bg-surface-2 rounded-xl transition-colors"
            >
              <FaEllipsisVertical className="w-4 h-4 text-neutral-500" />
            </button>
            {showMoreMenu && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-surface-1 rounded-lg shadow-xl border border-neutral-200 dark:border-app-border py-1 z-50" onClick={(e) => e.stopPropagation()}>
                <button className="w-full text-left px-4 py-2.5 text-sm text-neutral-700 dark:text-slate-200 hover:bg-neutral-100 dark:hover:bg-surface-2" onClick={() => { setShowMoreMenu(false); setShowSearch(true); }}>
                  Search
                </button>
                {pinnedMessages.length > 0 && (
                  <button className="w-full text-left px-4 py-2.5 text-sm text-neutral-700 dark:text-slate-200 hover:bg-neutral-100 dark:hover:bg-surface-2" onClick={() => { setShowMoreMenu(false); toast(`${pinnedMessages.length} pinned message(s)`, { icon: '📌' }); }}>
                    Pinned messages ({pinnedMessages.length})
                  </button>
                )}
                <button className="w-full text-left px-4 py-2.5 text-sm text-neutral-700 dark:text-slate-200 hover:bg-neutral-100 dark:hover:bg-surface-2" onClick={() => setShowMoreMenu(false)}>
                  Mute notifications
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search Bar */}
      {showSearch && (
        <div className="px-3 py-2 bg-white dark:bg-surface-1 border-b border-neutral-200 dark:border-app-border flex items-center gap-2">
          <FaMagnifyingGlass className="w-3.5 h-3.5 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search messages..."
            autoFocus
            className="flex-1 text-sm text-neutral-700 dark:text-slate-200 outline-none bg-transparent placeholder-neutral-400"
          />
          <button onClick={() => { setShowSearch(false); setSearchQuery(''); }} className="p-1 text-neutral-500 hover:text-neutral-700">
            <FaXmark className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Messages Area */}
      <div
        ref={chatContainerRef}
        onScroll={handleScroll}
        className="chat-wallpaper flex-1 min-h-0 overflow-y-auto px-3 sm:px-4 py-3 pb-24 relative"
      >
        {loadingInit && (
          <div className="space-y-3 py-4 max-w-3xl mx-auto">
            {[
              { side: 'left', width: 'w-3/5' },
              { side: 'right', width: 'w-2/5' },
              { side: 'left', width: 'w-2/5' },
              { side: 'right', width: 'w-1/2' },
              { side: 'left', width: 'w-3/5' },
            ].map((row, i) => (
              <div key={i} className={`flex ${row.side === 'right' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`skeleton rounded-2xl ${row.width} h-10`}
                  style={{ animationDelay: `${i * 80}ms` }}
                />
              </div>
            ))}
          </div>
        )}

        {loadError && (
          <div className="flex items-center gap-3 rounded-lg bg-[#FEEBEA] border border-[#F40F02]/30 p-3 mx-auto max-w-md">
            <FaTriangleExclamation className="text-[#F40F02] shrink-0" />
            <p className="text-sm text-[#991B1B]">{loadError}</p>
          </div>
        )}

        {!loadingInit && !loadError && displayMessages.length === 0 && (
          <div className="flex justify-center py-8">
            <div className="bg-[#E8F0FE] rounded-lg px-4 py-2 shadow-sm max-w-sm text-center">
              {noConversation ? (
                <p className="text-xs text-neutral-600">
                  You can only chat with crew or vendors you have a shared project with. Send a booking request to start a conversation.
                </p>
              ) : (
                <p className="text-xs text-neutral-600">
                  Messages are end-to-end visible only to you and <strong>{otherName}</strong>. Say hello!
                </p>
              )}
            </div>
          </div>
        )}

        <AnimatePresence initial={false}>
          {filteredMessages.map((msg, idx) => {
            const isMe = msg.isSameAccount ?? msg.senderId === user?.id;
            const isDeleted = !!msg.deletedAt;
            const showDate = shouldShowDateLabel(filteredMessages, idx);
            const isSystemNotification = !isDeleted && msg.type === 'text' && isBookingSystemNotification(msg.content);
            const showSenderLabel = !isDeleted && msg.senderId !== user?.id;
            const senderLabel = msg.senderDisplayName || '—';

            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              >
                {showDate && (
                  <div className="flex justify-center my-4">
                    <span className="bg-white/80 dark:bg-surface-2/80 backdrop-blur-md text-[11px] text-neutral-500 font-medium px-4 py-1.5 rounded-full shadow-sm border border-white/50 dark:border-app-border">
                      {formatDateLabel(msg.createdAt)}
                    </span>
                  </div>
                )}

                {isSystemNotification ? (
                  <div className="flex justify-center mb-2">
                    <div className="max-w-[88%] rounded-full border border-[#3678F1]/20 bg-[#E8F0FE] text-[#1D4ED8] px-4 py-2 inline-flex items-center gap-2 shadow-sm">
                      <FaBell className="w-3 h-3 shrink-0" />
                      <p className="text-[12px] leading-relaxed font-medium whitespace-pre-wrap break-words">
                        {msg.content ?? ''}
                      </p>
                      <span className="text-[10px] text-[#1D4ED8]/70 shrink-0">{formatTime(msg.createdAt)}</span>
                    </div>
                  </div>
                ) : (
                  <div
                    className={`flex mb-1 ${isMe ? 'justify-end' : 'justify-start'}`}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      if (!isDeleted) setContextMenu({ msgId: msg.id, x: e.clientX, y: e.clientY });
                    }}
                  >
                    <div className="flex flex-col max-w-[80%] sm:max-w-[70%]">
                      {showSenderLabel && (
                        <span className={`text-[10px] font-semibold mb-0.5 ${isMe ? 'text-right text-[#3678F1]' : 'text-neutral-500'}`}>
                          {senderLabel}
                        </span>
                      )}
                      <div
                        className={`relative px-3.5 py-2.5 rounded-2xl shadow-sm group ${
                          isDeleted
                            ? 'bg-neutral-100 italic text-neutral-600'
                            : isMe
                              ? 'bg-gradient-to-br from-[#3678F1] to-[#2563EB] text-white rounded-br-sm'
                              : 'bg-white border border-neutral-200/70 text-neutral-800 rounded-bl-sm'
                        }`}
                      >
                        {msg.forwardedFromId && !isDeleted && (
                          <p className="text-[10px] text-neutral-500 italic mb-0.5 flex items-center gap-1">
                            <FaShareFromSquare className="w-2.5 h-2.5" /> Forwarded
                          </p>
                        )}

                        {msg.replyTo && !isDeleted && (
                          <div className="mb-1 px-2 py-1 bg-[#3678F1]/5 border-l-2 border-[#3678F1] rounded-r text-[11px]">
                            <p className="font-semibold text-[#3678F1] text-[10px]">
                              {msg.replyTo.senderId === user?.id ? 'You' : otherName}
                            </p>
                            <p className="text-neutral-600 truncate">{msg.replyTo.content}</p>
                          </div>
                        )}

                        {msg.isPinned && !isDeleted && (
                          <FaThumbtack className="absolute -top-1.5 -right-1.5 w-3 h-3 text-[#3678F1] rotate-45 drop-shadow-sm" />
                        )}

                        {isDeleted ? (
                          <p className="text-[13px] opacity-70 italic">This message was deleted</p>
                        ) : (
                          <>
                            {msg.type === 'image' && msg.mediaKey ? (
                              (() => {
                                const url = getMediaUrl(msg.mediaKey);
                                return url ? (
                                  <button
                                    type="button"
                                    onClick={() => setLightbox({ url, type: 'image', title: msg.content ?? 'Shared image' })}
                                    className="block mb-2"
                                  >
                                    <img
                                      src={url}
                                      alt={msg.content ?? 'Shared image'}
                                      className="rounded-xl max-w-full max-h-60 object-cover shadow-sm border border-black/5 cursor-zoom-in"
                                    />
                                  </button>
                                ) : null;
                              })()
                            ) : null}
                            {msg.type === 'file' && msg.mediaKey ? (
                              (() => {
                                const url = getMediaUrl(msg.mediaKey);
                                const fileName = msg.content?.replace(/^Requirement file:\s*/i, '') || 'Attachment';
                                return url ? (
                                  <a
                                    href={url}
                                    target="_blank"
                                    rel="noreferrer"
                                    download={fileName}
                                    className={`mb-2 flex items-center gap-2.5 rounded-xl px-3 py-2 transition-colors max-w-full ${
                                      isMe
                                        ? 'bg-white/15 hover:bg-white/25 text-white'
                                        : 'bg-[#E8F0FE] hover:bg-[#DBEAFE] text-[#1D4ED8]'
                                    }`}
                                  >
                                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isMe ? 'bg-white/20' : 'bg-[#3678F1] text-white'}`}>
                                      <FaFile className="w-3.5 h-3.5" />
                                    </span>
                                    <span className="min-w-0 flex-1">
                                      <span className="block truncate text-[13px] font-semibold">{fileName}</span>
                                      <span className={`block text-[11px] ${isMe ? 'text-white/80' : 'text-[#1D4ED8]/70'}`}>
                                        Tap to download
                                      </span>
                                    </span>
                                  </a>
                                ) : null;
                              })()
                            ) : null}
                            {msg.type !== 'file' || !msg.mediaKey ? (
                              <p className={`text-[14px] leading-relaxed break-words whitespace-pre-wrap ${isMe ? 'text-white' : 'text-[#111B21] dark:text-slate-200'}`}>
                                {linkifyText(msg.content ?? '', isMe ? 'underline break-all hover:opacity-80 text-white font-semibold' : 'underline break-all hover:opacity-80 text-[#1D4ED8] dark:text-[#A8C6F7] font-semibold')}
                                <span className="invisible text-[11px] pl-4">
                                  {formatTime(msg.createdAt)}
                                  {isMe && '  ✓✓'}
                                </span>
                              </p>
                            ) : (
                              <span className="invisible block text-[11px] pl-4">
                                {formatTime(msg.createdAt)}
                                {isMe && '  ✓✓'}
                              </span>
                            )}
                          </>
                        )}

                        <span className={`absolute bottom-1 right-2 flex items-center gap-0.5 text-[10px] ${isMe ? 'text-white/80' : 'text-neutral-400'}`}>
                          {formatTime(msg.createdAt)}
                          {isMe && !isDeleted && (
                            <span className={`ml-0.5 ${msg.readAt || msg.isRead ? 'text-[#A8C6F7]' : 'opacity-70'}`}>
                              {msg.readAt || msg.isRead ? '✓✓' : '✓✓'}
                            </span>
                          )}
                        </span>

                        {!isDeleted && (
                          <button
                            type="button"
                            className="absolute top-1 -right-8 opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-full sm:hover:bg-black/5"
                            onClick={(e) => {
                              e.stopPropagation();
                              const rect = (e.target as HTMLElement).getBoundingClientRect();
                              setContextMenu({ msgId: msg.id, x: rect.right, y: rect.bottom });
                            }}
                          >
                            <FaChevronDown className="w-3.5 h-3.5 text-neutral-400" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* Context Menu */}
      {contextMenu && (() => {
        const msg = messages.find((m) => m.id === contextMenu.msgId);
        if (!msg) return null;
        const isMe = msg.isSameAccount ?? msg.senderId === user?.id;
        return (
          <div
            className="fixed z-50 bg-white dark:bg-surface-1 rounded-xl shadow-2xl border border-neutral-200 dark:border-app-border py-2 min-w-[180px]"
            style={{ left: Math.min(contextMenu.x, window.innerWidth - 200), top: Math.min(contextMenu.y, window.innerHeight - 300) }}
            onClick={(e) => e.stopPropagation()}
          >
            <button className="w-full text-left px-4 py-2.5 text-sm text-neutral-700 dark:text-slate-200 hover:bg-[#E8F0FE] dark:hover:bg-surface-2 flex items-center gap-3" onClick={() => handleReply(msg)}>
              <FaReply className="w-4 h-4 text-neutral-500" /> Reply
            </button>
            <button className="w-full text-left px-4 py-2.5 text-sm text-neutral-700 dark:text-slate-200 hover:bg-[#E8F0FE] dark:hover:bg-surface-2 flex items-center gap-3" onClick={() => handleForward(msg)}>
              <FaShareFromSquare className="w-4 h-4 text-neutral-500" /> Forward
            </button>
            <button className="w-full text-left px-4 py-2.5 text-sm text-neutral-700 dark:text-slate-200 hover:bg-[#E8F0FE] dark:hover:bg-surface-2 flex items-center gap-3" onClick={() => handleCopy(msg)}>
              <FaCopy className="w-4 h-4 text-neutral-500" /> Copy
            </button>
            <button className="w-full text-left px-4 py-2.5 text-sm text-neutral-700 dark:text-slate-200 hover:bg-[#E8F0FE] dark:hover:bg-surface-2 flex items-center gap-3" onClick={() => handlePin(msg.id)}>
              <FaThumbtack className="w-4 h-4 text-neutral-500" /> {msg.isPinned ? 'Unpin' : 'Pin'}
            </button>
            {isMe && (
              <>
                <hr className="my-1 border-neutral-200 dark:border-app-border" />
                <button className="w-full text-left px-4 py-2.5 text-sm text-[#F40F02] hover:bg-[#FEEBEA] dark:hover:bg-surface-2 flex items-center gap-3" onClick={() => handleDelete(msg.id)}>
                  <FaTrash className="w-4 h-4" /> Delete
                </button>
              </>
            )}
          </div>
        );
      })()}

      {/* Forward Modal */}
      <MediaLightbox media={lightbox} onClose={() => setLightbox(null)} />

      {forwardMsg && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center" onClick={() => setForwardMsg(null)}>
          <div className="bg-white dark:bg-surface-1 rounded-xl shadow-2xl w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 dark:border-app-border">
              <h3 className="text-base font-semibold text-neutral-800 dark:text-slate-200">Forward message</h3>
              <button onClick={() => setForwardMsg(null)} className="p-1 hover:bg-neutral-100 dark:hover:bg-surface-2 rounded-full">
                <FaXmark className="w-4 h-4 text-neutral-500" />
              </button>
            </div>
            <div className="px-4 py-2 border-b border-neutral-100 dark:border-app-border">
              <input
                type="text"
                value={forwardSearch}
                onChange={(e) => setForwardSearch(e.target.value)}
                placeholder="Search conversations..."
                className="w-full px-3 py-2 text-sm rounded-lg bg-neutral-50 dark:bg-surface-2 text-neutral-900 dark:text-slate-200 border border-neutral-200 dark:border-app-border focus:outline-none focus:ring-1 focus:ring-[#3678F1]"
              />
            </div>
            <div className="max-h-64 overflow-auto">
              {conversationsForForward
                .filter((c) => {
                  if (!forwardSearch.trim()) return true;
                  const name = c.otherParticipant?.displayName?.toLowerCase() ?? '';
                  return name.includes(forwardSearch.toLowerCase());
                })
                .map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => doForward(conv.id)}
                    className="w-full text-left px-4 py-3 hover:bg-[#E8F0FE] dark:hover:bg-surface-2 flex items-center gap-3 border-b border-neutral-50 dark:border-app-border"
                  >
                    <Avatar name={conv.otherParticipant?.displayName ?? 'User'} size="sm" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-neutral-800 dark:text-slate-200 truncate">{conv.otherParticipant?.displayName ?? 'User'}</p>
                      {conv.project && <p className="text-xs text-neutral-500 truncate">{conv.project.title}</p>}
                    </div>
                  </button>
                ))}
              {conversationsForForward.length === 0 && (
                <p className="text-sm text-neutral-500 text-center py-8">No conversations found</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Scroll to Bottom Button */}
      {showScrollDown && (
        <button
          type="button"
          onClick={scrollToBottom}
          className="absolute bottom-20 right-6 w-10 h-10 rounded-full bg-white dark:bg-surface-1 shadow-lg flex items-center justify-center hover:bg-neutral-50 dark:hover:bg-surface-2 transition-colors z-30"
        >
          <FaChevronDown className="w-4 h-4 text-neutral-500" />
        </button>
      )}

      {/* Reply Preview Bar */}
      {replyTo && (
        <div className="bg-[#F0F2F5] dark:bg-surface-2 border-t border-neutral-200 dark:border-app-border px-4 py-2 flex items-center gap-3">
          <div className="flex-1 min-w-0 border-l-4 border-[#3678F1] pl-3">
            <p className="text-xs font-semibold text-[#3678F1]">
              {replyTo.senderId === user?.id ? 'You' : otherName}
            </p>
            <p className="text-xs text-neutral-500 truncate">{replyTo.content}</p>
          </div>
          <button onClick={() => setReplyTo(null)} className="p-1 text-neutral-500 hover:text-neutral-900">
            <FaXmark className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Emoji Picker */}
      <AnimatePresence>
        {showEmojiPicker && (
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="absolute bottom-20 left-0 right-0 z-30 bg-white/95 dark:bg-surface-1/95 backdrop-blur-md border-t border-neutral-200 dark:border-app-border px-4 py-3 shadow-lg">
            <div className="flex flex-wrap gap-2 max-w-2xl mx-auto">
              {emojiList.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => insertEmoji(emoji)}
                  className="w-10 h-10 flex items-center justify-center text-2xl hover:bg-[#E8F0FE] dark:hover:bg-surface-2 rounded-xl transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Message Input */}
      <div className="px-3 sm:px-6 pb-4 pt-1 bg-transparent absolute bottom-0 left-0 w-full z-20 pointer-events-none">
        <form onSubmit={handleSend} className="glass-input flex items-end gap-2 p-2 rounded-3xl shadow-float max-w-4xl mx-auto pointer-events-auto transition-all">
          <div className="flex items-center gap-1 mb-1 bg-neutral-100/50 rounded-full p-1 ml-1">
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className={`p-2 transition-colors rounded-full hover:bg-white hover:shadow-sm ${showEmojiPicker ? 'text-[#3678F1]' : 'text-neutral-500 hover:text-[#3678F1]'}`}
            >
              <FaFaceSmile className="w-5 h-5" />
            </button>
            <div className="relative">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setShowAttachMenu(!showAttachMenu); }}
                className="p-2 text-neutral-500 hover:text-[#3678F1] transition-colors rounded-full hover:bg-white hover:shadow-sm"
              >
                <FaPaperclip className="w-5 h-5" />
              </button>
              <AnimatePresence>
                {showAttachMenu && (
                  <motion.div initial={{ opacity: 0, y: 10, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.9 }} className="absolute bottom-full left-0 mb-4 flex flex-col gap-3 z-50 pointer-events-auto" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => imageInputRef.current?.click()}
                      className="w-12 h-12 rounded-full bg-gradient-to-br from-[#3678F1] to-[#2563EB] text-white flex items-center justify-center shadow-brand transition-colors"
                      title="Photos"
                    >
                      <FaImage className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-12 h-12 rounded-full bg-white border border-[#3678F1]/20 text-[#3678F1] flex items-center justify-center shadow-sm transition-colors hover:border-[#3678F1]"
                      title="Document"
                    >
                      <FaFile className="w-5 h-5" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="flex-1 min-w-0 flex items-center">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  if (input.trim() && !sending) {
                    void handleSend(e as unknown as React.FormEvent);
                  }
                }
              }}
              placeholder="Message..."
              disabled={sending}
              rows={1}
              className="w-full px-4 py-2.5 bg-transparent text-[15px] font-medium text-[#111B21] dark:text-slate-200 placeholder-neutral-400 focus:outline-none disabled:opacity-50 resize-none max-h-32 overflow-y-auto leading-relaxed"
            />
          </div>

          <div className="mb-0.5 mr-0.5">
            {input.trim() ? (
              <button
                type="submit"
                disabled={sending}
                className="w-11 h-11 rounded-full flex items-center justify-center transition-colors shadow-brand disabled:opacity-50 bg-gradient-to-br from-[#3678F1] to-[#2563EB] hover:from-[#2563EB] hover:to-[#1D4ED8] text-white"
              >
                {sending
                  ? <span className="w-6 h-6 border-[2.5px] border-white/30 border-t-white border-r-white rounded-full animate-spin" />
                  : <FaPaperPlane className="w-4 h-4 text-white ml-0.5" />
                }
              </button>
            ) : (
              <button
                type="button"
                className="w-11 h-11 rounded-full flex items-center justify-center transition-colors bg-white text-neutral-600 hover:text-[#3678F1] border border-neutral-200 hover:border-[#3678F1]"
              >
                <FaMicrophone className="w-4 h-4" />
              </button>
            )}
          </div>
        </form>
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFileUpload(f, 'image');
            e.target.value = '';
          }}
        />
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFileUpload(f, 'file');
            e.target.value = '';
          }}
        />
      </div>
    </div>
  );

  // ─ Main Render ─────────────────────────────────────────────────────

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#F3F4F6] dark:bg-bg w-full">
      <DashboardHeader />
      <div className="flex-1 flex min-h-0 overflow-hidden">
        <DashboardSidebar links={navLinks} />
        <main className="flex-1 flex min-h-0 min-w-0 overflow-hidden">
          <div className="flex w-full">
            {/* Left Panel - Conversation List (~40%) */}
            <div className="w-[40%] min-w-[280px] max-w-[400px] hidden md:block border-r border-neutral-200 dark:border-app-border">
              {showProjectPickerView ? renderProjectPicker() : renderConversationsPanel()}
            </div>

            {/* Mobile: Show left panel only when no chat is selected */}
            {!targetUserId && (
              <div className="md:hidden w-full">
                {showProjectPickerView ? renderProjectPicker() : renderConversationsPanel()}
              </div>
            )}

            {/* Right Panel - Chat View (~60%) or Empty State */}
            <div className="flex-1 min-w-0">
              {targetUserId ? (
                <motion.div
                  key={targetUserId}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.12 }}
                  className="flex flex-col h-full"
                >
                  {renderRightPanelChat()}
                </motion.div>
              ) : renderRightPanelEmpty()}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
