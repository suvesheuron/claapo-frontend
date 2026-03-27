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
  rateOffered?: number | null;
  status: BookingStatus;
  shootDates: string[];
  shootLocations: string[];
  message?: string | null;
  invoiceId?: string | null;
  invoiceStatus?: string | null;
  conversationId?: string | null;
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
