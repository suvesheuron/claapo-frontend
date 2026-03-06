/**
 * AuthContext — manages the full authentication lifecycle:
 *
 *  • login()          POST /auth/login → store tokens → decode user from JWT
 *  • logout()         POST /auth/logout (revokes refresh token on server) → clear state
 *  • refreshTokens()  POST /auth/refresh → rotate refresh token → update access token
 *  • session restore  On mount, reads refresh token from localStorage and re-hydrates
 *
 * Token storage strategy (aligned with mobile app approach):
 *  - accessToken  → React state only (memory). Never written to localStorage.
 *                   Cleared on page refresh; restored via the refresh token.
 *  - refreshToken → localStorage under STORAGE_KEY.
 *                   Rotated on every use (backend enforces one-time use).
 *
 * The backend role names are lowercase ('individual' | 'company' | 'vendor' | 'admin').
 * The existing RoleContext uses title-case ('Individual' | 'Company' | 'Vendor').
 * AuthRoleSyncBridge (in App.tsx) bridges the two without changing RoleContext.
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';
import { api, setAccessToken, setRefreshFunction, ApiException } from '../services/api';

// ─── Types ────────────────────────────────────────────────────────────────────

export type BackendRole = 'individual' | 'company' | 'vendor' | 'admin';

export interface AuthUser {
  id: string;
  email: string;
  role: BackendRole;
}

interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

interface JwtPayload {
  sub: string;
  email: string;
  role: BackendRole;
  exp: number;
  iat: number;
}

export interface AuthContextValue {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  /** True while the initial session-restore is in progress. */
  isLoading: boolean;
  /** Last auth error message — cleared on next login attempt. */
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  /**
   * Directly hydrate an auth session from an already-obtained token pair.
   * Used by the OTP verify flow which receives tokens from /auth/otp/verify
   * rather than /auth/login.  Immediately propagates the access token into
   * the api module so subsequent api.patch / api.get calls work at once.
   */
  setSession: (newAccessToken: string, newRefreshToken: string) => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'crewcall_rt';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Decode a JWT without verifying the signature.
 * The server still verifies it — this is just for reading the payload on the client.
 */
function decodeJwt(token: string): JwtPayload | null {
  try {
    const [, payload] = token.split('.');
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

function userFromJwt(token: string): AuthUser | null {
  const payload = decodeJwt(token);
  if (!payload) return null;
  return { id: payload.sub, email: payload.email, role: payload.role };
}

// ─── Context ─────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Keep module-level token in sync with React state.
  // The ref + effect pattern is for general state sync; critical paths
  // (login, setSession, refreshTokens) call setAccessToken directly so the
  // api module has the token immediately — before the next render cycle.
  const accessTokenRef = useRef<string | null>(null);
  useEffect(() => {
    accessTokenRef.current = accessToken;
    setAccessToken(accessToken);
  }, [accessToken]);

  // ── token refresh ──────────────────────────────────────────────────────────

  const refreshTokens = useCallback(async (): Promise<string | null> => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    try {
      const res = await api.post<TokenResponse>('/auth/refresh', { refreshToken: stored });
      localStorage.setItem(STORAGE_KEY, res.refreshToken);
      const decoded = userFromJwt(res.accessToken);
      // Propagate immediately so api calls right after this work correctly
      setAccessToken(res.accessToken);
      setAccessTokenState(res.accessToken);
      if (decoded) setUser(decoded);
      return res.accessToken;
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      setAccessTokenState(null);
      setUser(null);
      return null;
    }
  }, []);

  // Register the refresh function with the api module once on mount
  useEffect(() => {
    setRefreshFunction(refreshTokens);
  }, [refreshTokens]);

  // ── session restore on mount ───────────────────────────────────────────────

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      setIsLoading(false);
      return;
    }

    refreshTokens().finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── login ──────────────────────────────────────────────────────────────────

  const login = useCallback(async (email: string, password: string): Promise<void> => {
    setError(null);
    try {
      const res = await api.post<TokenResponse>('/auth/login', { email, password });
      localStorage.setItem(STORAGE_KEY, res.refreshToken);
      // Propagate immediately before any chained api calls
      setAccessToken(res.accessToken);
      setAccessTokenState(res.accessToken);
      const decoded = userFromJwt(res.accessToken);
      setUser(decoded);
    } catch (err) {
      const message =
        err instanceof ApiException
          ? err.payload.message
          : 'Login failed. Please try again.';
      setError(message);
      throw err;
    }
  }, []);

  // ── logout ─────────────────────────────────────────────────────────────────

  const logout = useCallback(async (): Promise<void> => {
    const stored = localStorage.getItem(STORAGE_KEY);
    try {
      // Tell the server to revoke this refresh token (and optionally all tokens).
      // Fire-and-forget — we clear local state regardless of server response.
      if (stored && accessTokenRef.current) {
        await api.post('/auth/logout', { refreshToken: stored });
      }
    } catch {
      // Ignore server-side logout errors
    } finally {
      localStorage.removeItem(STORAGE_KEY);
      setAccessTokenState(null);
      setAccessToken(null);
      setUser(null);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const setSession = useCallback((newAccessToken: string, newRefreshToken: string): void => {
    localStorage.setItem(STORAGE_KEY, newRefreshToken);
    // Immediately update the api module-level variable so any api.* call
    // made synchronously after setSession() uses the correct token.
    setAccessToken(newAccessToken);
    setAccessTokenState(newAccessToken);
    const decoded = userFromJwt(newAccessToken);
    setUser(decoded);
  }, []);

  const value: AuthContextValue = {
    user,
    accessToken,
    isAuthenticated: !!user && !!accessToken,
    isLoading,
    error,
    login,
    logout,
    clearError,
    setSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
