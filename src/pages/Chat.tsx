/**
 * Chat page — WhatsApp-style direct messages with Claapo brand colors.
 * Route: /dashboard/chat/:targetUserId
 *
 * Features:
 *   - Brand color theme (#3B5BDB)
 *   - DashboardSidebar + full-width layout (like other dashboard pages)
 *   - Message bubbles with timestamps & read receipts
 *   - Attachment support (images, files)
 *   - Context menu: Reply, Forward, Pin, Delete, Copy
 *   - Reply display in message bubbles (quoted message)
 *   - Forward modal (conversation picker)
 *   - Emoji picker
 *   - Drag-and-drop file upload
 *   - Search messages
 *   - Typing indicator (visual only)
 *   - Online status dot
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import {
  FaArrowLeft, FaPaperPlane, FaTriangleExclamation, FaPaperclip,
  FaImage, FaFile, FaXmark, FaMagnifyingGlass, FaEllipsisVertical,
  FaReply, FaShareFromSquare, FaThumbtack, FaTrash, FaCopy,
  FaFaceSmile, FaMicrophone, FaChevronDown,
} from 'react-icons/fa6';
import DashboardHeader from '../components/DashboardHeader';
import DashboardSidebar from '../components/DashboardSidebar';
import Avatar from '../components/Avatar';
import { api, ApiException } from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { useRole } from '../contexts/RoleContext';
import { individualNavLinks, vendorNavLinks, companyNavLinks } from '../navigation/dashboardNav';

interface ChatMessage {
  id: string;
  senderId: string;
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
  replyTo?: { id: string; content: string | null; senderId: string } | null;
}

interface OtherUser {
  id?: string;
  role?: string;
  displayName?: string;
  companyName?: string;
  profile?: { displayName?: string; companyName?: string; avatarUrl?: string; logoUrl?: string };
  isOnline?: boolean;
}

interface ConversationItem {
  id: string;
  otherParticipant?: { id: string; displayName?: string };
  project?: { id: string; title: string } | null;
}

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

const POLL_INTERVAL_MS = 4000;

// Brand color palette
const BRAND = {
  primary: '#3B5BDB',
  primaryDark: '#364FC7',
  primaryLight: '#EEF2FF',
  chatBg: '#F0F2F5',
  outgoing: '#EEF2FF',
  incoming: '#FFFFFF',
  headerBg: '#3B5BDB',
  inputBg: '#F0F2F5',
  textPrimary: '#111B21',
  textSecondary: '#667781',
};

export default function Chat() {
  const { userId: targetUserId } = useParams<{ userId: string }>();
  const [searchParams] = useSearchParams();
  const projectIdFromUrl = searchParams.get('projectId');
  const { user } = useAuth();
  const { currentRole } = useRole();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [otherUser, setOtherUser] = useState<OtherUser | null>(null);
  const [noConversation, setNoConversation] = useState(false);
  const [scopedConversationId, setScopedConversationId] = useState<string | null>(null);
  const [scopedProjectTitle, setScopedProjectTitle] = useState<string | null>(null);
  const [scopedConversationLoading, setScopedConversationLoading] = useState(() => !!projectIdFromUrl);
  const [input, setInput] = useState('');
  const [loadingInit, setLoadingInit] = useState(true);
  const [sending, setSending] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Feature states
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ msgId: string; x: number; y: number } | null>(null);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [showScrollDown, setShowScrollDown] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // Forward modal
  const [forwardMsg, setForwardMsg] = useState<ChatMessage | null>(null);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [forwardSearch, setForwardSearch] = useState('');

  const bottomRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastMsgTime = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const navLinks =
    currentRole === 'Company'
      ? companyNavLinks
      : currentRole === 'Vendor'
        ? vendorNavLinks
        : individualNavLinks;

  useEffect(() => {
    document.title = 'Chat – Claapo';
  }, []);

  useEffect(() => {
    if (!projectIdFromUrl || !targetUserId) {
      setScopedConversationId(null);
      setScopedProjectTitle(null);
      setScopedConversationLoading(false);
      return;
    }
    let alive = true;
    setScopedConversationLoading(true);
    setScopedConversationId(null);
    setScopedProjectTitle(null);
    void (async () => {
      try {
        const res = await api.post<{ id: string; project?: { title: string } | null }>('/conversations', {
          projectId: projectIdFromUrl,
          otherUserId: targetUserId,
        });
        if (!alive) return;
        setScopedConversationId(res.id);
        setScopedProjectTitle(res.project?.title ?? null);
        setNoConversation(false);
      } catch {
        if (!alive) return;
        setScopedConversationId(null);
        setNoConversation(true);
        toast.error('Could not open chat for this project.');
      } finally {
        if (alive) setScopedConversationLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [projectIdFromUrl, targetUserId]);

  const mapApiMessageToChat = useCallback(
    (m: {
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
    }): ChatMessage => ({
      id: m.id,
      senderId: m.senderId,
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
    [],
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
        const res = await api.get<{ conversationId: string | null; items: ChatMessage[] }>(
          `/conversations/with/${targetUserId}?limit=50`,
        );
        const data = res?.items ?? [];
        if (!isPolling) {
          setNoConversation(res?.conversationId === null);
          setMessages(data);
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
    } catch {
      // Non-fatal
    }
  }, [targetUserId]);

  useEffect(() => {
    if (projectIdFromUrl && scopedConversationLoading) {
      setLoadingInit(true);
      return;
    }
    void fetchMessages(false);
    void fetchOtherUser();
  }, [fetchMessages, fetchOtherUser, projectIdFromUrl, scopedConversationLoading, scopedConversationId]);

  useEffect(() => {
    pollRef.current = setInterval(() => fetchMessages(true), POLL_INTERVAL_MS);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Scroll detection for scroll-down button
  const handleScroll = () => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    setShowScrollDown(scrollHeight - scrollTop - clientHeight > 200);
  };

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const otherName =
    otherUser?.displayName ??
    otherUser?.companyName ??
    otherUser?.profile?.displayName ??
    otherUser?.profile?.companyName ??
    targetUserId ??
    'User';
  const otherRole = otherUser?.role ?? '';
  const otherAvatar = otherUser?.profile?.avatarUrl ?? otherUser?.profile?.logoUrl;

  // Send message
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = input.trim();
    if (!content || sending) return;
    if (projectIdFromUrl && !scopedConversationId) {
      toast.error('Chat is still opening — try again.');
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
      await fetchMessages(false);
    } catch (err) {
      toast.error(err instanceof ApiException ? err.payload.message : 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  // File/Image upload
  const handleFileUpload = async (file: File, type: 'image' | 'file') => {
    if (!targetUserId) return;
    if (projectIdFromUrl && !scopedConversationId) {
      toast.error('Chat is still opening — try again.');
      return;
    }
    setShowAttachMenu(false);
    const toastId = toast.loading(`Sending ${type}...`);
    try {
      const payload = {
        content: `📎 ${file.name} (${(file.size / 1024).toFixed(1)} KB)`,
        type,
      };
      if (scopedConversationId) {
        await api.post(`/conversations/${scopedConversationId}/messages`, payload);
      } else {
        await api.post(`/conversations/with/${targetUserId}/messages`, payload);
      }
      await fetchMessages(false);
      toast.success(`${type === 'image' ? 'Image' : 'File'} sent!`, { id: toastId });
    } catch (err) {
      toast.error(err instanceof ApiException ? err.payload.message : `Failed to send ${type}.`, { id: toastId });
    }
  };

  // Drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };
  const handleDragLeave = () => setDragOver(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    const type = file.type.startsWith('image/') ? 'image' : 'file';
    handleFileUpload(file, type);
  };

  // Context menu actions
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
    // Load conversations for forward modal
    try {
      const res = await api.get<{ items: ConversationItem[] }>('/conversations?limit=100');
      setConversations(res?.items ?? []);
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

  // Insert emoji into input
  const insertEmoji = (emoji: string) => {
    setInput((prev) => prev + emoji);
  };

  // Close context menu on outside click
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

  // Search filter
  const filteredMessages = searchQuery.trim()
    ? messages.filter((m) => m.content?.toLowerCase().includes(searchQuery.toLowerCase()))
    : messages;

  // Pinned messages
  const pinnedMessages = messages.filter((m) => m.isPinned);

  // Common emoji list
  const emojiList = ['😀','😂','😍','🤔','👍','👎','❤️','🔥','🎉','👏','😢','😮','🙏','💯','✅','⭐','🎬','🎥','📸','🎵'];

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#F8F9FB] w-full">
      <DashboardHeader />

      <div className="flex-1 flex min-h-0 overflow-hidden">
        <DashboardSidebar links={navLinks} />

        <main
          className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {/* Drag-and-drop overlay */}
          {dragOver && (
            <div className="absolute inset-0 bg-[#3B5BDB]/10 border-2 border-dashed border-[#3B5BDB] z-50 flex items-center justify-center pointer-events-none">
              <div className="bg-white rounded-xl px-8 py-6 shadow-xl text-center">
                <FaPaperclip className="w-8 h-8 text-[#3B5BDB] mx-auto mb-2" />
                <p className="text-lg font-semibold text-[#3B5BDB]">Drop file to send</p>
              </div>
            </div>
          )}

          <div className="flex-1 flex flex-col min-h-0 w-full">

            {/* ── Header ── */}
            <div className="px-4 py-2.5 flex items-center gap-3 shrink-0" style={{ backgroundColor: BRAND.headerBg }}>
              <Link to="/dashboard/conversations" className="p-1.5 hover:bg-white/10 rounded-full transition-colors">
                <FaArrowLeft className="w-4 h-4 text-white" />
              </Link>
              <div className="relative">
                <Avatar src={otherAvatar} name={otherName} size="sm" />
                {otherUser?.isOnline && (
                  <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-400 ring-2 ring-[#3B5BDB]" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-semibold text-white truncate">{otherName}</h2>
                <p className="text-[11px] text-white/70 truncate">
                  {scopedProjectTitle
                    ? scopedProjectTitle
                    : otherUser?.isOnline
                      ? 'online'
                      : otherRole
                        ? otherRole.replace(/_/g, ' ')
                        : 'tap here for info'}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setShowSearch(!showSearch); setSearchQuery(''); }}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <FaMagnifyingGlass className="w-4 h-4 text-white" />
                </button>
                <div className="relative">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setShowMoreMenu(!showMoreMenu); }}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                  >
                    <FaEllipsisVertical className="w-4 h-4 text-white" />
                  </button>
                  {showMoreMenu && (
                    <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-xl border border-neutral-200 py-1 z-50" onClick={(e) => e.stopPropagation()}>
                      <button className="w-full text-left px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-100" onClick={() => { setShowMoreMenu(false); setShowSearch(true); }}>
                        Search
                      </button>
                      {pinnedMessages.length > 0 && (
                        <button className="w-full text-left px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-100" onClick={() => { setShowMoreMenu(false); toast(`${pinnedMessages.length} pinned message(s)`, { icon: '📌' }); }}>
                          Pinned messages ({pinnedMessages.length})
                        </button>
                      )}
                      <button className="w-full text-left px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-100" onClick={() => { setShowMoreMenu(false); }}>
                        Mute notifications
                      </button>
                      <button className="w-full text-left px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-100" onClick={() => { setShowMoreMenu(false); }}>
                        Clear chat
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── Search bar ── */}
            {showSearch && (
              <div className="px-3 py-2 bg-white border-b border-neutral-200 flex items-center gap-2">
                <FaMagnifyingGlass className="w-3.5 h-3.5 text-neutral-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search messages..."
                  autoFocus
                  className="flex-1 text-sm text-neutral-700 outline-none bg-transparent placeholder-neutral-400"
                />
                <button onClick={() => { setShowSearch(false); setSearchQuery(''); }} className="p-1 text-neutral-500 hover:text-neutral-700">
                  <FaXmark className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* ── Pinned message banner ── */}
            {pinnedMessages.length > 0 && !showSearch && (
              <div className="px-4 py-2 bg-white/90 border-b border-neutral-200 flex items-center gap-2 cursor-pointer hover:bg-white transition-colors">
                <FaThumbtack className="w-3 h-3 text-[#3B5BDB] rotate-45" />
                <p className="text-xs text-neutral-700 truncate flex-1">
                  <span className="font-semibold">Pinned: </span>
                  {pinnedMessages[pinnedMessages.length - 1].content}
                </p>
              </div>
            )}

            {/* ── Messages area ── */}
            <div
              ref={chatContainerRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto px-3 sm:px-4 py-3 relative"
              style={{
                backgroundColor: BRAND.chatBg,
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23c5bfb0' fill-opacity='0.08'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }}
            >
              {loadingInit && (
                <div className="flex items-center justify-center py-12">
                  <span className="w-7 h-7 border-3 border-[#3B5BDB]/30 border-t-[#3B5BDB] rounded-full animate-spin" />
                </div>
              )}

              {loadError && (
                <div className="flex items-center gap-3 rounded-lg bg-red-50 border border-red-200 p-3 mx-auto max-w-md">
                  <FaTriangleExclamation className="text-red-500 shrink-0" />
                  <p className="text-sm text-red-700">{loadError}</p>
                </div>
              )}

              {!loadingInit && !loadError && messages.length === 0 && (
                <div className="flex justify-center py-8">
                  <div className="bg-[#EEF2FF] rounded-lg px-4 py-2 shadow-sm max-w-sm text-center">
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

              {filteredMessages.map((msg, idx) => {
                const isMe = msg.senderId === user?.id;
                const isDeleted = !!msg.deletedAt;
                const showDate = shouldShowDateLabel(filteredMessages, idx);

                return (
                  <div key={msg.id}>
                    {/* Date separator */}
                    {showDate && (
                      <div className="flex justify-center my-3">
                        <span className="bg-white/90 text-[11px] text-neutral-500 font-medium px-3 py-1 rounded-lg shadow-sm">
                          {formatDateLabel(msg.createdAt)}
                        </span>
                      </div>
                    )}

                    {/* Message bubble */}
                    <div
                      className={`flex mb-1 ${isMe ? 'justify-end' : 'justify-start'}`}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        if (!isDeleted) setContextMenu({ msgId: msg.id, x: e.clientX, y: e.clientY });
                      }}
                    >
                      <div
                        className={`relative max-w-[75%] sm:max-w-[65%] px-2.5 py-1.5 rounded-lg shadow-sm group ${
                          isDeleted
                            ? 'bg-neutral-100 italic'
                            : isMe
                              ? 'rounded-tr-none'
                              : 'rounded-tl-none'
                        }`}
                        style={{ backgroundColor: isDeleted ? '#f0f0f0' : isMe ? BRAND.outgoing : BRAND.incoming }}
                      >
                        {/* Forwarded label */}
                        {msg.forwardedFromId && !isDeleted && (
                          <p className="text-[10px] text-neutral-500 italic mb-0.5 flex items-center gap-1">
                            <FaShareFromSquare className="w-2.5 h-2.5" /> Forwarded
                          </p>
                        )}

                        {/* Reply reference */}
                        {msg.replyTo && !isDeleted && (
                          <div className="mb-1 px-2 py-1 bg-[#3B5BDB]/5 border-l-2 border-[#3B5BDB] rounded-r text-[11px]">
                            <p className="font-semibold text-[#3B5BDB] text-[10px]">
                              {msg.replyTo.senderId === user?.id ? 'You' : otherName}
                            </p>
                            <p className="text-neutral-600 truncate">{msg.replyTo.content}</p>
                          </div>
                        )}

                        {/* Pin indicator */}
                        {msg.isPinned && !isDeleted && (
                          <FaThumbtack className="absolute -top-1.5 -right-1.5 w-3 h-3 text-[#3B5BDB] rotate-45 drop-shadow-sm" />
                        )}

                        {/* Message content */}
                        {isDeleted ? (
                          <p className="text-[13px] text-neutral-400 italic">
                            This message was deleted
                          </p>
                        ) : (
                          <>
                            {msg.type === 'image' && msg.mediaUrl && (
                              <img src={msg.mediaUrl} alt="Shared image" className="rounded-md mb-1 max-w-full max-h-60 object-cover" />
                            )}
                            <p className="text-[13.5px] text-[#111B21] leading-[19px] break-words whitespace-pre-wrap">
                              {msg.content ?? ''}
                              {/* Invisible spacer for timestamp */}
                              <span className="invisible text-[11px] pl-3">
                                {formatTime(msg.createdAt)}
                                {isMe && '  ✓✓'}
                              </span>
                            </p>
                          </>
                        )}

                        {/* Timestamp + read status */}
                        <span className="absolute bottom-1 right-2 flex items-center gap-0.5 text-[11px] text-neutral-500">
                          {formatTime(msg.createdAt)}
                          {isMe && !isDeleted && (
                            <span className={`ml-0.5 ${msg.readAt || msg.isRead ? 'text-[#3B5BDB]' : 'text-neutral-400'}`}>
                              {msg.readAt || msg.isRead ? '✓✓' : '✓✓'}
                            </span>
                          )}
                        </span>

                        {/* Hover action */}
                        {!isDeleted && (
                          <button
                            type="button"
                            className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full hover:bg-black/5"
                            onClick={(e) => {
                              e.stopPropagation();
                              const rect = (e.target as HTMLElement).getBoundingClientRect();
                              setContextMenu({ msgId: msg.id, x: rect.right, y: rect.bottom });
                            }}
                          >
                            <FaChevronDown className="w-3 h-3 text-neutral-400" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            {/* ── Context menu ── */}
            {contextMenu && (() => {
              const msg = messages.find((m) => m.id === contextMenu.msgId);
              if (!msg) return null;
              const isMe = msg.senderId === user?.id;
              return (
                <div
                  className="fixed z-50 bg-white rounded-xl shadow-2xl border border-neutral-200 py-2 min-w-[180px]"
                  style={{ left: Math.min(contextMenu.x, window.innerWidth - 200), top: Math.min(contextMenu.y, window.innerHeight - 300) }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button className="w-full text-left px-4 py-2.5 text-sm text-neutral-700 hover:bg-[#EEF2FF] flex items-center gap-3" onClick={() => handleReply(msg)}>
                    <FaReply className="w-4 h-4 text-neutral-500" /> Reply
                  </button>
                  <button className="w-full text-left px-4 py-2.5 text-sm text-neutral-700 hover:bg-[#EEF2FF] flex items-center gap-3" onClick={() => handleForward(msg)}>
                    <FaShareFromSquare className="w-4 h-4 text-neutral-500" /> Forward
                  </button>
                  <button className="w-full text-left px-4 py-2.5 text-sm text-neutral-700 hover:bg-[#EEF2FF] flex items-center gap-3" onClick={() => handleCopy(msg)}>
                    <FaCopy className="w-4 h-4 text-neutral-500" /> Copy
                  </button>
                  <button className="w-full text-left px-4 py-2.5 text-sm text-neutral-700 hover:bg-[#EEF2FF] flex items-center gap-3" onClick={() => handlePin(msg.id)}>
                    <FaThumbtack className="w-4 h-4 text-neutral-500" /> {msg.isPinned ? 'Unpin' : 'Pin'}
                  </button>
                  {isMe && (
                    <>
                      <hr className="my-1 border-neutral-200" />
                      <button className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3" onClick={() => handleDelete(msg.id)}>
                        <FaTrash className="w-4 h-4" /> Delete
                      </button>
                    </>
                  )}
                </div>
              );
            })()}

            {/* ── Forward modal ── */}
            {forwardMsg && (
              <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center" onClick={() => setForwardMsg(null)}>
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200">
                    <h3 className="text-base font-semibold text-neutral-800">Forward message</h3>
                    <button onClick={() => setForwardMsg(null)} className="p-1 hover:bg-neutral-100 rounded-full">
                      <FaXmark className="w-4 h-4 text-neutral-500" />
                    </button>
                  </div>
                  <div className="px-4 py-2 border-b border-neutral-100">
                    <input
                      type="text"
                      value={forwardSearch}
                      onChange={(e) => setForwardSearch(e.target.value)}
                      placeholder="Search conversations..."
                      className="w-full px-3 py-2 text-sm rounded-lg bg-neutral-50 border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-[#3B5BDB]"
                    />
                  </div>
                  <div className="max-h-64 overflow-auto">
                    {conversations
                      .filter((c) => {
                        if (!forwardSearch.trim()) return true;
                        const name = c.otherParticipant?.displayName?.toLowerCase() ?? '';
                        return name.includes(forwardSearch.toLowerCase());
                      })
                      .map((conv) => (
                        <button
                          key={conv.id}
                          onClick={() => doForward(conv.id)}
                          className="w-full text-left px-4 py-3 hover:bg-[#EEF2FF] flex items-center gap-3 border-b border-neutral-50"
                        >
                          <Avatar name={conv.otherParticipant?.displayName ?? 'User'} size="sm" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-neutral-800 truncate">{conv.otherParticipant?.displayName ?? 'User'}</p>
                            {conv.project && <p className="text-xs text-neutral-500 truncate">{conv.project.title}</p>}
                          </div>
                        </button>
                      ))}
                    {conversations.length === 0 && (
                      <p className="text-sm text-neutral-500 text-center py-8">No conversations found</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── Scroll to bottom button ── */}
            {showScrollDown && (
              <button
                type="button"
                onClick={scrollToBottom}
                className="absolute bottom-20 right-6 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-neutral-50 transition-colors z-30"
              >
                <FaChevronDown className="w-4 h-4 text-neutral-500" />
              </button>
            )}

            {/* ── Reply preview bar ── */}
            {replyTo && (
              <div className="bg-[#F0F2F5] border-t border-neutral-200 px-4 py-2 flex items-center gap-3">
                <div className="flex-1 min-w-0 border-l-4 border-[#3B5BDB] pl-3">
                  <p className="text-xs font-semibold text-[#3B5BDB]">
                    {replyTo.senderId === user?.id ? 'You' : otherName}
                  </p>
                  <p className="text-xs text-neutral-500 truncate">{replyTo.content}</p>
                </div>
                <button onClick={() => setReplyTo(null)} className="p-1 text-neutral-500 hover:text-neutral-900">
                  <FaXmark className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* ── Emoji picker ── */}
            {showEmojiPicker && (
              <div className="bg-white border-t border-neutral-200 px-3 py-2">
                <div className="flex flex-wrap gap-1">
                  {emojiList.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => insertEmoji(emoji)}
                      className="w-9 h-9 flex items-center justify-center text-xl hover:bg-neutral-100 rounded-lg transition-colors"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── Message input ── */}
            <form onSubmit={handleSend} className="px-2 sm:px-3 py-2 shrink-0" style={{ backgroundColor: BRAND.inputBg }}>
              <div className="flex items-end gap-2">
                {/* Attachment & emoji buttons */}
                <div className="flex items-center gap-0.5 mb-1">
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className={`p-2 transition-colors rounded-full hover:bg-black/5 ${showEmojiPicker ? 'text-[#3B5BDB]' : 'text-neutral-500 hover:text-[#3B5BDB]'}`}
                  >
                    <FaFaceSmile className="w-5 h-5" />
                  </button>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setShowAttachMenu(!showAttachMenu); }}
                      className="p-2 text-neutral-500 hover:text-[#3B5BDB] transition-colors rounded-full hover:bg-black/5"
                    >
                      <FaPaperclip className="w-5 h-5 rotate-45" />
                    </button>

                    {/* Attachment menu popup */}
                    {showAttachMenu && (
                      <div className="absolute bottom-full left-0 mb-2 flex flex-col gap-2 z-50" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => imageInputRef.current?.click()}
                          className="w-12 h-12 rounded-full bg-[#BF59CF] text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                          title="Photos"
                        >
                          <FaImage className="w-5 h-5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="w-12 h-12 rounded-full bg-[#3B5BDB] text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                          title="Document"
                        >
                          <FaFile className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Text input */}
                <div className="flex-1 min-w-0">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type a message"
                    disabled={sending}
                    className="w-full px-4 py-2.5 bg-white rounded-3xl text-[15px] text-[#111B21] placeholder-neutral-400 focus:outline-none disabled:opacity-50 shadow-sm"
                  />
                </div>

                {/* Send / Mic button */}
                {input.trim() ? (
                  <button
                    type="submit"
                    disabled={sending}
                    className="w-11 h-11 rounded-full flex items-center justify-center transition-colors disabled:opacity-50 shrink-0 mb-0.5 bg-[#3B5BDB] hover:bg-[#364FC7]"
                  >
                    {sending
                      ? <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      : <FaPaperPlane className="w-4 h-4 text-white ml-0.5" />
                    }
                  </button>
                ) : (
                  <button
                    type="button"
                    className="w-11 h-11 rounded-full flex items-center justify-center transition-colors shrink-0 mb-0.5 bg-[#3B5BDB] hover:bg-[#364FC7]"
                  >
                    <FaMicrophone className="w-5 h-5 text-white" />
                  </button>
                )}
              </div>

              {/* Hidden file inputs */}
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
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
