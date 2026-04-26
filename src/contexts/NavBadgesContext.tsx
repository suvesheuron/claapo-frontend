/**
 * NavBadgesContext — polls small, role-scoped endpoints so the sidebar can
 * show live counts on action-required nav items (Cancel Requests, Project
 * Requests, etc.). Chat unread lives in ChatUnreadContext.
 *
 * Polling cadence matches ChatUnreadContext (20s) for consistency.
 */

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { api } from '../services/api';

interface CancelRequestsResponse { items: unknown[] }

interface IncomingBookingsResponse {
  items: Array<{ status?: string; project?: { status?: string } }>;
}

interface NotificationsResponse {
  items: Array<{ type?: string; readAt?: string | null; data?: Record<string, unknown> }>;
}

interface InvoiceListResponse {
  items: Array<{ id: string; status: string }>;
}

interface NavBadgesValue {
  /** Company: pending cancel-requests waiting for approval. */
  cancelRequestsCount: number;
  /** Individual / Vendor: pending incoming bookings needing a response. */
  projectRequestsCount: number;
  /** Company: unread invoice alerts (new invoices received). */
  invoiceAlertsCount: number;
  refetch: () => void;
}

const POLL_INTERVAL_MS = 20_000;

const NavBadgesContext = createContext<NavBadgesValue | null>(null);

export function NavBadgesProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [cancelRequestsCount, setCancelRequestsCount] = useState(0);
  const [projectRequestsCount, setProjectRequestsCount] = useState(0);
  const [invoiceAlertsCount, setInvoiceAlertsCount] = useState(0);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setCancelRequestsCount(0);
      setProjectRequestsCount(0);
      setInvoiceAlertsCount(0);
      return;
    }

    try {
      if (user.role === 'company' || user.role === 'admin') {
        const res = await api.get<CancelRequestsResponse>('/bookings/cancel-requests');
        setCancelRequestsCount(res?.items?.length ?? 0);
      } else {
        setCancelRequestsCount(0);
      }
    } catch {
      setCancelRequestsCount(0);
    }

    try {
      if (user.role === 'individual' || user.role === 'vendor') {
        const res = await api.get<IncomingBookingsResponse>('/bookings/incoming');
        const pending = (res?.items ?? []).filter(
          (b) => b.status === 'pending' && b.project?.status !== 'cancelled',
        ).length;
        setProjectRequestsCount(pending);
      } else {
        setProjectRequestsCount(0);
      }
    } catch {
      setProjectRequestsCount(0);
    }

    try {
      if (user.role === 'company' || user.role === 'admin') {
        const [notifRes, invoiceRes] = await Promise.all([
          api.get<NotificationsResponse>('/notifications?limit=100'),
          api.get<InvoiceListResponse>('/invoices?limit=100'),
        ]);
        const invoiceStatusById = new Map(
          (invoiceRes?.items ?? []).map((inv) => [inv.id, inv.status]),
        );
        const count = (notifRes?.items ?? []).filter((n) => {
          if (n.readAt || n.type !== 'invoice_sent') return false;
          const invoiceId = n.data?.invoiceId;
          if (typeof invoiceId !== 'string') return false;
          return invoiceStatusById.get(invoiceId) === 'sent';
        }).length;
        setInvoiceAlertsCount(count);
      } else {
        setInvoiceAlertsCount(0);
      }
    } catch {
      setInvoiceAlertsCount(0);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    refetch();
  }, [refetch, tick]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const id = setInterval(() => setTick((n) => n + 1), POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [isAuthenticated]);

  const value: NavBadgesValue = {
    cancelRequestsCount,
    projectRequestsCount,
    invoiceAlertsCount,
    refetch,
  };

  return <NavBadgesContext.Provider value={value}>{children}</NavBadgesContext.Provider>;
}

export function useNavBadges(): NavBadgesValue {
  const ctx = useContext(NavBadgesContext);
  if (!ctx) {
    return { cancelRequestsCount: 0, projectRequestsCount: 0, invoiceAlertsCount: 0, refetch: () => {} };
  }
  return ctx;
}
