/**
 * NavBadgesContext — provides role-scoped counts so the sidebar can show
 * live indicators on action-required nav items (Cancel Requests, Project
 * Requests, Invoice Alerts). Chat unread lives in ChatUnreadContext.
 *
 * Driven by WebSocket push:
 *   - `badge_updated`       → booking status changes (cancel requests, incoming pending)
 *   - `invoice_updated`     → invoice status flips (send / pay / decline / cancel)
 *   - `notification_created`→ redundant trigger for invoice-related notifications,
 *                              ensures the invoice-alert badge stays live even if
 *                              an `invoice_updated` event is missed (dead socket
 *                              window, etc.). The bell badge already proves this
 *                              event arrives reliably.
 * Any of these triggers a full refetch of all three counts. A manual
 * `refetch()` is still available for callers that need to force a refresh.
 */

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { api } from '../services/api';
import { ensureChatSocket, onBadgeUpdated, onInvoiceUpdated } from '../services/chatSocket';

// Notification types that should also bump the invoice-alert badge — invoice
// flows create these via NotificationsService.createForUser. Keep this list in
// sync with InvoicesService emit sites.
const INVOICE_NOTIFICATION_TYPES = new Set<string>([
  'invoice_sent',
  'invoice_declined',
  'invoice_paid',
]);

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
      if (
        user.role === 'individual' ||
        user.role === 'vendor' ||
        user.role === 'company' ||
        user.role === 'cast' ||
        user.role === 'location'
      ) {
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
      // Cast issuers also need an "invoice activity" badge so they see when
      // their newly-issued invoices flip status (declined / paid). Re-use
      // the company invoice-alert pipeline by including cast here. Crew and
      // vendor already had this gap historically — leaving them as-is to
      // avoid wider surface changes.
      if (user.role === 'company' || user.role === 'admin' || user.role === 'cast') {
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

  // Listen for server push — booking status changes, invoice status flips,
  // AND invoice-related notification_created events all trigger a refetch.
  // notification_created is the safety-net trigger: if invoice_updated is ever
  // missed (dead socket window, reconnect race), the bell badge still bumps
  // because notifications.createForUser fires notification_created — so we
  // ride on that to keep the invoice-alert count in lockstep with the bell.
  useEffect(() => {
    if (!isAuthenticated) return;
    const socket = ensureChatSocket();
    const cleanupBadge = onBadgeUpdated(() => { refetch(); });
    const cleanupInvoice = onInvoiceUpdated(() => { refetch(); });

    const onNotificationCreated = (payload: { type?: string } | null | undefined) => {
      if (payload && typeof payload.type === 'string' && INVOICE_NOTIFICATION_TYPES.has(payload.type)) {
        refetch();
      }
    };
    // Direct socket.on (not a listener-set) because DashboardHeader also
    // listens for notification_created with its own handler; socket.io
    // supports multiple handlers per event so the two coexist cleanly.
    socket?.on('notification_created', onNotificationCreated);

    return () => {
      cleanupBadge();
      cleanupInvoice();
      socket?.off('notification_created', onNotificationCreated);
    };
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
