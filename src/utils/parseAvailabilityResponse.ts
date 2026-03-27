import type { BookingWithDetails, ParsedAvailabilityMonth, SlotStatus } from '../types/availability';

function normalizeDateKey(input: string): string {
  const direct = /^(\d{4}-\d{2}-\d{2})/.exec(input);
  if (direct?.[1]) return direct[1];
  const dt = new Date(input);
  if (!isNaN(dt.getTime())) {
    const y = dt.getUTCFullYear();
    const m = String(dt.getUTCMonth() + 1).padStart(2, '0');
    const d = String(dt.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return input;
}

/**
 * Normalizes `/availability/me` and `/availability/:userId` month responses
 * (object map, array, or legacy) into slots + bookingDetails like the mobile app.
 */
export function parseAvailabilityMonthResponse(res: unknown): ParsedAvailabilityMonth {
  const empty: ParsedAvailabilityMonth = { slots: {}, bookingDetails: {} };
  if (!res || typeof res !== 'object') return empty;

  const r = res as Record<string, unknown>;

  const bookingDetailsRaw = (r.bookingDetails ?? {}) as Record<string, BookingWithDetails>;
  const bookingDetails: Record<string, BookingWithDetails> = {};
  for (const [k, v] of Object.entries(bookingDetailsRaw)) {
    if (v && typeof v === 'object' && 'id' in v) {
      bookingDetails[normalizeDateKey(k)] = v as BookingWithDetails;
    }
  }

  // Array of slot objects
  if (Array.isArray(r)) {
    const slots: ParsedAvailabilityMonth['slots'] = {};
    for (const item of r) {
      if (!item || typeof item !== 'object') continue;
      const s = item as { date?: string; status?: string; notes?: string | null };
      if (!s.date || !s.status) continue;
      const key = normalizeDateKey(s.date);
      slots[key] = {
        date: key,
        status: s.status as SlotStatus,
        notes: s.notes ?? null,
      };
    }
    return { slots, bookingDetails };
  }

  if (Array.isArray(r.slots)) {
    const slots: ParsedAvailabilityMonth['slots'] = {};
    for (const item of r.slots as unknown[]) {
      if (!item || typeof item !== 'object') continue;
      const s = item as { date?: string; status?: string; notes?: string | null };
      if (!s.date || !s.status) continue;
      const key = normalizeDateKey(s.date);
      slots[key] = {
        date: key,
        status: s.status as SlotStatus,
        notes: s.notes ?? null,
      };
    }
    return { slots, bookingDetails };
  }

  // Primary shape: { slots: Record<date, status>, slotNotes?: Record }
  if (r.slots && typeof r.slots === 'object' && !Array.isArray(r.slots)) {
    const slotMap = r.slots as Record<string, string>;
    const notesMap = (r.slotNotes ?? {}) as Record<string, string | null>;
    const slots: ParsedAvailabilityMonth['slots'] = {};
    for (const [dateStr, status] of Object.entries(slotMap)) {
      const key = normalizeDateKey(dateStr);
      slots[key] = {
        date: key,
        status: status as SlotStatus,
        notes: notesMap[key] ?? notesMap[dateStr] ?? null,
      };
    }
    return { slots, bookingDetails };
  }

  return { slots: {}, bookingDetails };
}

export { normalizeDateKey };
