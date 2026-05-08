/**
 * Central HTTP client for the Claapo backend (NestJS, /v1 prefix).
 *
 * Design decisions:
 * - Uses native fetch — no extra dependency required.
 * - Access token is stored in a module-level variable (memory only, never
 *   written to localStorage so it can't be read by third-party scripts).
 * - Refresh token is kept in localStorage (see AuthContext) and rotated on
 *   every use by the backend.
 * - On 401 the client calls a registered refresh function once; if the
 *   refresh succeeds it retries the original request transparently.
 * - All backend errors arrive as  { error: { code, message, details[] } }.
 *   ApiException surfaces this so callers can display a meaningful message.
 */

/**
 * Production must use an absolute URL (https://…/v1). If VITE_API_URL is set to
 * `/something.up.railway.app/v1` or `something.up.railway.app/v1` (missing scheme),
 * the browser treats it as same-origin and requests hit Vercel → 405.
 */
function normalizeApiBase(raw: string | undefined): string {
  let v = (raw ?? '/v1').trim();
  if (!v) v = '/v1';
  if (v.startsWith('http://') || v.startsWith('https://')) {
    return v.replace(/\/$/, '');
  }
  if (v.includes('.up.railway.app')) {
    v = v.replace(/^\//, '');
    return `https://${v.replace(/\/$/, '')}`;
  }
  return v.replace(/\/$/, '');
}

const BASE_URL: string = normalizeApiBase(import.meta.env.VITE_API_URL as string | undefined);

// ─── Error types ────────────────────────────────────────────────────────────

export interface ApiErrorPayload {
  code: number;
  message: string;
  details?: string[];
}

export class ApiException extends Error {
  public readonly status: number;
  public readonly payload: ApiErrorPayload;

  constructor(status: number, payload: ApiErrorPayload) {
    super(payload.message);
    this.name = 'ApiException';
    this.status = status;
    this.payload = payload;
  }
}

// ─── Module-level token state (injected by AuthContext) ─────────────────────

let _accessToken: string | null = null;
let _refreshFn: (() => Promise<string | null>) | null = null;

/** Called by AuthContext whenever the access token changes. */
export function setAccessToken(token: string | null): void {
  _accessToken = token;
}

/** Read-only accessor for non-fetch callers (e.g. WebSocket auth). */
export function getAccessToken(): string | null {
  return _accessToken;
}

/** Backend origin (no /v1 suffix) — used by WebSocket clients which speak Socket.IO directly. */
export function getApiOrigin(): string {
  if (BASE_URL.startsWith('http://') || BASE_URL.startsWith('https://')) {
    return BASE_URL.replace(/\/v1\/?$/, '');
  }
  // Relative base (dev with Vite proxy) → use current page origin; backend at :3000 in dev.
  if (typeof window === 'undefined') return '';
  const { protocol, hostname } = window.location;
  return `${protocol}//${hostname}:3000`;
}

/**
 * Build a downloadable URL for a storage key. The backend exposes
 * `GET /v1/storage/files/{key}` which serves local files or 302-redirects to a
 * Supabase / S3 signed URL. Pass the `mediaKey` from a chat message, profile,
 * or invoice attachment.
 *
 * Returns `null` when the key is empty.
 */
export function getMediaUrl(key: string | null | undefined): string | null {
  if (!key) return null;
  const trimmed = key.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `${getApiOrigin()}/v1/storage/files/${trimmed.replace(/^\/+/, '')}`;
}

/**
 * Called by AuthContext once on mount.
 * The registered function must call POST /auth/refresh, persist the new
 * refresh token, update its own state, and return the new access token
 * (or null on failure).
 */
export function setRefreshFunction(fn: () => Promise<string | null>): void {
  _refreshFn = fn;
}

// ─── Internal helpers ────────────────────────────────────────────────────────

async function extractError(res: Response): Promise<ApiException> {
  try {
    const body = await res.json();
    const payload: ApiErrorPayload = body?.error ?? {
      code: res.status,
      message: res.statusText || 'An unexpected error occurred.',
    };
    return new ApiException(res.status, payload);
  } catch {
    return new ApiException(res.status, {
      code: res.status,
      message: res.statusText || 'An unexpected error occurred.',
    });
  }
}

/**
 * Parse the throttler's Retry-After header (RFC 7231 — seconds or HTTP-date).
 * Returns the wait in milliseconds, capped at 5 s. Returns null if the header
 * is missing/unparseable or the wait would exceed the cap (caller should
 * propagate the 429 instead of retrying for that long).
 */
function parseRetryAfterMs(res: Response): number | null {
  const raw = res.headers.get('Retry-After');
  if (!raw) return null;
  const seconds = Number(raw);
  let waitMs: number;
  if (Number.isFinite(seconds)) {
    waitMs = seconds * 1000;
  } else {
    const dateMs = Date.parse(raw);
    if (!Number.isFinite(dateMs)) return null;
    waitMs = dateMs - Date.now();
  }
  if (waitMs <= 0) return 0;
  if (waitMs > 5000) return null;
  return waitMs;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  retryFlags: { auth?: boolean; throttle?: boolean } = {},
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (_accessToken) {
    headers['Authorization'] = `Bearer ${_accessToken}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  // Transparent token refresh — attempt once on 401
  if (res.status === 401 && !retryFlags.auth && _refreshFn) {
    const newToken = await _refreshFn();
    if (newToken) {
      return request<T>(method, path, body, { ...retryFlags, auth: true });
    }
  }

  // Transparent throttle backoff — attempt once on 429 if Retry-After is short.
  // Adds 0–250 ms of jitter so a synchronized burst doesn't immediately rebound.
  if (res.status === 429 && !retryFlags.throttle) {
    const waitMs = parseRetryAfterMs(res);
    if (waitMs !== null) {
      await sleep(waitMs + Math.floor(Math.random() * 250));
      return request<T>(method, path, body, { ...retryFlags, throttle: true });
    }
  }

  if (!res.ok) {
    throw await extractError(res);
  }

  // 204 No Content (logout, mark-read, etc.) — return empty object
  const text = await res.text();
  return (text ? JSON.parse(text) : {}) as T;
}

// ─── Public API ──────────────────────────────────────────────────────────────

export const api = {
  get: <T>(path: string): Promise<T> => request<T>('GET', path),
  post: <T>(path: string, body?: unknown): Promise<T> => request<T>('POST', path, body),
  patch: <T>(path: string, body?: unknown): Promise<T> => request<T>('PATCH', path, body),
  put: <T>(path: string, body?: unknown): Promise<T> => request<T>('PUT', path, body),
  delete: <T>(path: string): Promise<T> => request<T>('DELETE', path),
};

