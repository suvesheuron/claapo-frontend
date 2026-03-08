/**
 * Chat page — direct messages between the authenticated user and one other user.
 * Route: /dashboard/chat/:targetUserId
 *
 * API calls:
 *   GET  /v1/conversations/with/:targetUserId?limit=50  — load history
 *   POST /v1/conversations/with/:targetUserId/messages  — send message (body: { content })
 *
 * Polls for new messages every 5 s while the tab is active.
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FaArrowLeft, FaPaperPlane, FaTriangleExclamation } from 'react-icons/fa6';
import DashboardHeader from '../components/DashboardHeader';
import AppFooter from '../components/AppFooter';
import Avatar from '../components/Avatar';
import { api, ApiException } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface ChatMessage {
  id: string;
  senderId: string;
  content: string | null;
  createdAt: string;
  readAt?: string | null;
  isRead?: boolean;
}

interface OtherUser {
  id?: string;
  role?: string;
  displayName?: string;
  companyName?: string;
  profile?: { displayName?: string; companyName?: string };
  isOnline?: boolean;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

const POLL_INTERVAL_MS = 5000;

export default function Chat() {
  const { userId: targetUserId } = useParams<{ userId: string }>();
  const { user } = useAuth();

  const [messages,      setMessages]     = useState<ChatMessage[]>([]);
  const [otherUser,     setOtherUser]    = useState<OtherUser | null>(null);
  const [input,         setInput]        = useState('');
  const [loadingInit,   setLoadingInit]  = useState(true);
  const [sending,       setSending]      = useState(false);
  const [loadError,     setLoadError]    = useState<string | null>(null);
  const [sendError,     setSendError]    = useState<string | null>(null);

  const bottomRef   = useRef<HTMLDivElement>(null);
  const pollRef     = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastMsgTime = useRef<string | null>(null);

  useEffect(() => {
    document.title = 'Chat – Claapo';
  }, []);

  // Load messages — used for initial fetch + polling
  const fetchMessages = useCallback(async (isPolling = false) => {
    if (!targetUserId) return;
    try {
      const res = await api.get<{ items: ChatMessage[] }>(
        `/conversations/with/${targetUserId}?limit=50`
      );
      const data = res?.items ?? [];
      if (!data.length) {
        if (!isPolling) setMessages([]);
        return;
      }
      const newest = data[data.length - 1]?.createdAt;
      if (isPolling && newest === lastMsgTime.current) return; // nothing new
      lastMsgTime.current = newest ?? null;
      setMessages(data);
    } catch (err) {
      if (!isPolling) {
        setLoadError(err instanceof ApiException ? err.payload.message : 'Failed to load messages.');
      }
    } finally {
      if (!isPolling) setLoadingInit(false);
    }
  }, [targetUserId]);

  // Load other user's public profile for the header
  const fetchOtherUser = useCallback(async () => {
    if (!targetUserId) return;
    try {
      const profile = await api.get<OtherUser>(`/profile/${targetUserId}`);
      setOtherUser(profile);
    } catch {
      // Non-fatal — header will just show the userId
    }
  }, [targetUserId]);

  // Initial load
  useEffect(() => {
    fetchMessages(false);
    fetchOtherUser();
  }, [fetchMessages, fetchOtherUser]);

  // Poll every 5 s
  useEffect(() => {
    pollRef.current = setInterval(() => fetchMessages(true), POLL_INTERVAL_MS);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchMessages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const otherName =
    otherUser?.displayName ??
    otherUser?.companyName ??
    otherUser?.profile?.displayName ??
    otherUser?.profile?.companyName ??
    targetUserId ??
    'User';
  const otherRole = otherUser?.role ?? '';

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = input.trim();
    if (!content || sending) return;
    setSendError(null);
    setSending(true);
    try {
      await api.post(`/conversations/with/${targetUserId}/messages`, { content });
      setInput('');
      // Immediately re-fetch to show the sent message
      await fetchMessages(false);
    } catch (err) {
      setSendError(err instanceof ApiException ? err.payload.message : 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-neutral-50 min-w-0 w-full">
      <DashboardHeader />

      <div className="flex-1 flex min-h-0 overflow-hidden">
        <main className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
          <div className="flex-1 flex flex-col min-h-0">

            {/* Chat Header */}
            <div className="bg-white border-b border-neutral-200 px-4 py-3 flex items-center gap-3 shrink-0">
              <Link to="/dashboard" className="p-2 hover:bg-neutral-100 rounded-xl transition-colors">
                <FaArrowLeft className="w-4 h-4 text-neutral-600" />
              </Link>
              <Avatar name={otherName} size="sm" />
              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-bold text-neutral-900 truncate">{otherName}</h2>
                {otherRole && <p className="text-xs text-neutral-500 capitalize">{otherRole.replace(/_/g, ' ')}</p>}
              </div>
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {loadingInit && (
                <div className="flex items-center justify-center py-12">
                  <span className="w-6 h-6 border-2 border-[#3678F1]/30 border-t-[#3678F1] rounded-full animate-spin" />
                </div>
              )}

              {loadError && (
                <div className="flex items-center gap-3 rounded-2xl bg-red-50 border border-red-200 p-4">
                  <FaTriangleExclamation className="text-red-500 shrink-0" />
                  <p className="text-sm text-red-700">{loadError}</p>
                </div>
              )}

              {!loadingInit && !loadError && messages.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-sm text-neutral-400">No messages yet. Say hello!</p>
                </div>
              )}

              {messages.map((msg) => {
                const isMe = msg.senderId === user?.id;
                return (
                  <div key={msg.id} className={`flex gap-2.5 ${isMe ? 'justify-end' : 'justify-start'}`}>
                    {!isMe && <Avatar name={otherName} size="sm" />}
                    <div className={`max-w-[70%] ${isMe ? 'order-2' : ''}`}>
                      <div className={`rounded-2xl px-4 py-2.5 ${
                        isMe
                          ? 'bg-[#3678F1] text-white rounded-br-md'
                          : 'bg-white border border-neutral-200 text-neutral-900 rounded-bl-md'
                      }`}>
                        <p className="text-sm leading-relaxed break-words">{msg.content ?? ''}</p>
                        <p className={`text-[10px] mt-1 ${isMe ? 'text-blue-200' : 'text-neutral-400'}`}>
                          {formatTime(msg.createdAt)}
                          {isMe && (msg.readAt || msg.isRead) && <span className="ml-1.5">✓✓</span>}
                        </p>
                      </div>
                    </div>
                    {isMe && <Avatar name={user?.email ?? 'Me'} size="sm" />}
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            {/* Send error */}
            {sendError && (
              <div className="px-4 py-2 bg-red-50 border-t border-red-200">
                <p className="text-xs text-red-700">{sendError}</p>
              </div>
            )}

            {/* Message input */}
            <form onSubmit={handleSend} className="bg-white border-t border-neutral-200 px-4 py-3 shrink-0">
              <div className="flex items-center gap-2 max-w-4xl mx-auto">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type a message…"
                  disabled={sending}
                  className="flex-1 px-4 py-2.5 border border-neutral-300 rounded-xl focus:outline-none focus:border-[#3678F1] text-sm transition-all disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || sending}
                  className="w-10 h-10 bg-[#3678F1] text-white rounded-xl hover:bg-[#2563d4] flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                >
                  {sending
                    ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    : <FaPaperPlane className="w-4 h-4" />
                  }
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>

      <AppFooter />
    </div>
  );
}
