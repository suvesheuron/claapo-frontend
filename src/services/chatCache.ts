/**
 * In-memory cache for the web Chat page's conversation snapshot.
 *
 * Problem: every time the user opens a chat the page sets `loadingInit=true`
 * and waits for the full REST fetch before any message renders — even when
 * they just left this same chat seconds ago and nothing has changed. With
 * 50 messages over a slow network, the spinner is visible for 200-800ms,
 * which feels broken on repeat opens.
 *
 * Solution: keep the last successful snapshot per conversation in a bounded
 * Map. On open, `Chat.tsx` seeds its state from the cache synchronously via
 * lazy `useState` initializers, so messages render on the first paint. A
 * fresh fetch still runs in the background (stale-while-revalidate) and
 * replaces state if anything changed.
 *
 * Keyed by `targetUserId|projectId` so the same crew member across different
 * projects has separate snapshots (matches the backend's project-scoped
 * conversation model). Cleared on logout via `clearChatCache()`.
 *
 * Generic over the message type to avoid a circular type import from
 * `Chat.tsx`. The cache itself never inspects message fields — it just
 * stores and returns the array.
 */

export interface ChatSnapshot<TMessage = unknown> {
  messages: TMessage[];
  activeConversationId: string | null;
  scopedConversationId: string | null;
  noConversation: boolean;
  scopedProjectTitle: string | null;
}

type CacheKey = string;

const cache = new Map<CacheKey, ChatSnapshot<unknown>>();
const MAX_ENTRIES = 24;

function key(targetUserId: string, projectId?: string | null): CacheKey {
  return `${targetUserId}|${projectId ?? ''}`;
}

export function readChatSnapshot<TMessage = unknown>(
  targetUserId: string,
  projectId?: string | null,
): ChatSnapshot<TMessage> | undefined {
  const k = key(targetUserId, projectId);
  const entry = cache.get(k);
  if (!entry) return undefined;
  // Touch for LRU — move to the end by re-inserting.
  cache.delete(k);
  cache.set(k, entry);
  return entry as ChatSnapshot<TMessage>;
}

export function writeChatSnapshot<TMessage>(
  targetUserId: string,
  projectId: string | null | undefined,
  snapshot: ChatSnapshot<TMessage>,
): void {
  const k = key(targetUserId, projectId);
  if (cache.has(k)) cache.delete(k);
  cache.set(k, snapshot as ChatSnapshot<unknown>);
  // LRU eviction: drop oldest until size <= MAX_ENTRIES.
  while (cache.size > MAX_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (oldest == null) break;
    cache.delete(oldest);
  }
}

/**
 * Mutate the messages array of a cached snapshot without rewriting the rest.
 * No-op if the conversation isn't cached yet.
 */
export function updateChatSnapshotMessages<TMessage>(
  targetUserId: string,
  projectId: string | null | undefined,
  updater: (messages: TMessage[]) => TMessage[],
): void {
  const k = key(targetUserId, projectId);
  const entry = cache.get(k);
  if (!entry) return;
  const next = updater((entry.messages as TMessage[]) ?? []);
  cache.set(k, { ...entry, messages: next as unknown[] });
}

export function clearChatCache(): void {
  cache.clear();
}
