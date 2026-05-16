/** Aligns with mobile + backend availability payloads. */

export type SlotStatus = 'available' | 'booked' | 'blocked' | 'past_work';

export type BookingStatus =
  | 'pending'
  | 'accepted'
  | 'declined'
  | 'locked'
  | 'cancel_requested'
  | 'cancelled'
  | 'expired'
  | 'completed';

export interface BookingWithDetails {
  id: string;
  projectTitle: string;
  projectId: string;
  companyUserId: string;
  companyName: string;
  targetUserId: string;
  targetDisplayName: string;
  roleName?: string | null;
  /** Vendor bookings only — the specific equipment item being hired. */
  equipmentName?: string | null;
  vendorEquipmentId?: string | null;
  rateOffered?: number | null;
  status: BookingStatus;
  shootDates: string[];
  shootLocations: string[];
  shootDateLocations?: Array<{ date: string; location: string }> | null;
  message?: string | null;
  invoiceId?: string | null;
  invoiceStatus?: string | null;
  conversationId?: string | null;
  /** Set when the booking target self-marks their end complete. */
  completedByTargetAt?: string | null;
}

export interface ParsedAvailabilityMonth {
  slots: Record<
    string,
    {
      date: string;
      status: SlotStatus;
      notes?: string | null;
    }
  >;
  bookingDetails: Record<string, BookingWithDetails>;
}
