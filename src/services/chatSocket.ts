/**
 * Chat WebSocket client (Socket.IO).
 *
 * Connects to the backend's `/chat` namespace. The connection is lazy and
 * shared across the app — multiple Chat tabs would reuse it. If sockets fail
 * for any reason, the page continues to work via REST polling, so this layer
 * is purely additive.
 *
 * Event contract (matches chat.gateway.ts):
 *   client → server : join_conversation, leave_conversation, typing_start,
 *                     typing_stop, read_ack, send_message
 *   server → client : new_message, user_typing, user_stopped_typing,
 *                     messages_read, notification_created,
 *                     badge_updated, unread_updated, invoice_updated
 */

import { io, type Socket } from 'socket.io-client';
import { getAccessToken, getApiOrigin } from './api';

let socket: Socket | null = null;

type UnreadListener = (totalUnread: number) => void;
type BadgeListener = (incomingPending: number) => void;
export interface InvoiceUpdatedPayload {
  invoiceId: string;
  status: string;
  // Rich payload (added when the optimistic-patch path was introduced).
  // Older backends won't send these; clients should treat them as optional
  // and fall back to a plain refetch when they're absent.
  projectId?: string | null;
  isIncoming?: boolean;
}
type InvoiceUpdatedListener = (data: InvoiceUpdatedPayload) => void;

const unreadListeners = new Set<UnreadListener>();
const badgeListeners = new Set<BadgeListener>();
const invoiceUpdatedListeners = new Set<InvoiceUpdatedListener>();

export function onUnreadUpdated(fn: UnreadListener): () => void {
  unreadListeners.add(fn);
  return () => unreadListeners.delete(fn);
}

export function onBadgeUpdated(fn: BadgeListener): () => void {
  badgeListeners.add(fn);
  return () => badgeListeners.delete(fn);
}

export function onInvoiceUpdated(fn: InvoiceUpdatedListener): () => void {
  invoiceUpdatedListeners.add(fn);
  return () => invoiceUpdatedListeners.delete(fn);
}

export function ensureChatSocket(): Socket | null {
  // If we have a singleton but it's currently disconnected (browser tab was
  // backgrounded long enough, network blip, sleep/wake), kick off a reconnect
  // attempt immediately instead of waiting for socket.io's internal backoff
  // timer to notice. Without this, returning a dead socket means push events
  // (badge_updated / invoice_updated / notification_created) silently stop
  // arriving until the next backoff tick — which can be 1–10s.
  if (socket) {
    if (!socket.connected) {
      try { socket.connect(); } catch { /* socket.io throws if already connecting; ignore */ }
    }
    return socket;
  }

  const token = getAccessToken();
  if (!token) return null;

  socket = io(`${getApiOrigin()}/chat`, {
    transports: ['websocket', 'polling'],
    autoConnect: true,
    auth: { token },
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
  });

  socket.on('unread_updated', (data: { totalUnread?: number }) => {
    const totalUnread = data?.totalUnread;
    if (typeof totalUnread === 'number') {
      unreadListeners.forEach((fn) => fn(totalUnread));
    }
  });

  socket.on('badge_updated', (data: { incomingPending?: number }) => {
    const incomingPending = data?.incomingPending;
    if (typeof incomingPending === 'number') {
      badgeListeners.forEach((fn) => fn(incomingPending));
    }
  });

  socket.on('invoice_updated', (data: Partial<InvoiceUpdatedPayload> | null | undefined) => {
    const invoiceId = data?.invoiceId;
    const status = data?.status;
    if (typeof invoiceId !== 'string' || typeof status !== 'string') return;
    const payload: InvoiceUpdatedPayload = {
      invoiceId,
      status,
      // Defensively pass through optional rich-payload fields; default
      // projectId to null and isIncoming to false when missing so consumers
      // always see well-typed values.
      projectId: typeof data?.projectId === 'string' ? data.projectId : null,
      isIncoming: data?.isIncoming === true,
    };
    invoiceUpdatedListeners.forEach((fn) => fn(payload));
  });

  return socket;
}

export function getChatSocket(): Socket | null {
  return socket;
}

export function disconnectChatSocket(): void {
  if (!socket) return;
  socket.off('unread_updated');
  socket.off('badge_updated');
  socket.off('invoice_updated');
  socket.disconnect();
  socket = null;
}

export function joinConversationRoom(conversationId: string): void {
  const s = ensureChatSocket();
  if (!s) return;
  s.emit('join_conversation', conversationId);
}

export function leaveConversationRoom(conversationId: string): void {
  if (!socket) return;
  socket.emit('leave_conversation', conversationId);
}

export function emitTypingStart(conversationId: string): void {
  const s = ensureChatSocket();
  if (!s) return;
  s.emit('typing_start', conversationId);
}

export function emitTypingStop(conversationId: string): void {
  if (!socket) return;
  socket.emit('typing_stop', conversationId);
}

export function emitReadAck(conversationId: string, messageIds?: string[]): void {
  const s = ensureChatSocket();
  if (!s) return;
  s.emit('read_ack', { conversationId, messageIds });
}
