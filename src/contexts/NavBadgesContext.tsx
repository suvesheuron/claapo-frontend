/**
 * NavBadgesContext — provides role-scoped counts so the sidebar can show
 * live indicators on action-required nav items (Cancel Requests, Project
 * Requests, Invoice Alerts). Chat unread lives in ChatUnreadContext.
 *
 * Driven by WebSocket push (`badge_updated` event) — the server tells us when
 * booking status changes, so we only fetch then. A manual `refetch()` is still
 * available for callers that need to force a refresh.
 */

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { api } from '../services/api';
import { ensureChatSocket, onBadgeUpdated } from '../services/chatSocket';

interface CancelRequestsResponse { items: unknown[] }

interface IncomingBookingsResponse {
  items: Array<{
    status?: string;
    cancelRequestedBySide?: 'company' | 'crew_or_vendor' | null;
    project?: { status?: string };
  }>;
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
  /** Individual / Vendor / Company: pending incoming bookings needing a response. */
  projectRequestsCount: number;
  /** Company: unread invoice alerts (new invoices received). */
  invoiceAlertsCount: number;
  refetch: () => void;
}

const NavBadgesContext = createContext<NavBadgesValue | null>(null);

export function NavBadgesProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [cancelRequestsCount, setCancelRequestsCount] = useState(0);
  const [projectRequestsCount, setProjectRequestsCount] = useState(0);
  const [invoiceAlertsCount, setInvoiceAlertsCount] = useState(0);

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
      // Companies can also be booking targets (company→company bookings), so
      // they should get the same badge as crew/vendor. The /incoming endpoint
      // returns only rows where the caller is the target, so a company that's
      // never been booked simply sees a count of 0 — no extra branch needed.
      if (user.role === 'individual' || user.role === 'vendor' || user.role === 'company') {
        const res = await api.get<IncomingBookingsResponse>('/bookings/incoming');
        const actionable = (res?.items ?? []).filter(
          (b) =>
            b.project?.status !== 'cancelled' &&
            (
              b.status === 'pending' ||
              (b.status === 'cancel_requested' && b.cancelRequestedBySide === 'company')
            ),
        ).length;
        setProjectRequestsCount(actionable);
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

  // Initial fetch on mount, then WebSocket push keeps it fresh.
  useEffect(() => {
    refetch();
  }, [refetch]);

  // Listen for server push — booking status changes trigger a refetch of all badges.
  useEffect(() => {
    if (!isAuthenticated) return;
    ensureChatSocket();
    const cleanup = onBadgeUpdated(() => {
      refetch();
    });
    return cleanup;
  }, [isAuthenticated, refetch]);

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
