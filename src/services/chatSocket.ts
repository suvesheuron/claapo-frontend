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
 *                     messages_read
 */

import { io, type Socket } from 'socket.io-client';
import { getAccessToken, getApiOrigin } from './api';

let socket: Socket | null = null;

export function ensureChatSocket(): Socket | null {
  if (socket && socket.connected) return socket;
  if (socket) return socket; // connecting / reconnecting

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
  return socket;
}

export function getChatSocket(): Socket | null {
  return socket;
}

export function disconnectChatSocket(): void {
  if (!socket) return;
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
