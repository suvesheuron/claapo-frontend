import type { SlotStatus } from '../types/availability';

export const SLOT_STATUS_LABEL: Record<SlotStatus, string> = {
  available: 'Available',
  booked: 'Ongoing',
  past_work: 'Completed',
  blocked: 'Unavailable',
};

export type CellStatus = 'available' | 'booked' | 'completed' | 'blocked';

export function toCellStatus(s: string | null | undefined): CellStatus {
  if (s === 'past_work') return 'completed';
  if (s === 'blocked') return 'blocked';
  if (s === 'booked') return 'booked';
  return 'available';
}

export const CELL_STATUS_LABEL: Record<CellStatus, string> = {
  available: 'Available',
  booked: 'Ongoing',
  completed: 'Completed',
  blocked: 'Unavailable',
};

export const CELL_STYLE: Record<CellStatus, string> = {
  available: 'bg-[#DCFCE7] border-[#86EFAC] text-[#15803D] hover:bg-[#BBF7D0]',
  booked:    'bg-[#DBEAFE] border-[#3678F1] text-[#1E3A8A] hover:bg-[#BFDBFE]',
  completed: 'bg-[#F3F4F6] border-[#A3A3A3] text-[#525252] hover:bg-[#E5E7EB]',
  blocked:   'bg-[#FEE2E2] border-[#F40F02] text-[#991B1B] hover:bg-[#FECACA]',
};

export const CELL_STYLE_COMPACT: Record<CellStatus, string> = {
  available: 'bg-[#DCFCE7] border-[#86EFAC] text-[#15803D]',
  booked:    'bg-[#DBEAFE] border-[#3678F1] text-[#1E3A8A]',
  completed: 'bg-[#F3F4F6] border-[#A3A3A3] text-[#525252]',
  blocked:   'bg-[#FEE2E2] border-[#F40F02] text-[#991B1B]',
};

export const SLOT_STATUS_BADGE: Record<SlotStatus, string> = {
  available: 'bg-[#DCFCE7] text-[#15803D]',
  booked:    'bg-[#DBEAFE] text-[#1E3A8A]',
  past_work: 'bg-[#F3F4F6] text-[#525252]',
  blocked:   'bg-[#FEE2E2] text-[#991B1B]',
};

export const LEGEND_SWATCHES: Array<{ key: CellStatus; swatch: string; label: string }> = [
  { key: 'available', swatch: 'bg-[#DCFCE7] border border-[#86EFAC]', label: 'Available' },
  { key: 'booked',    swatch: 'bg-[#DBEAFE] border border-[#3678F1]', label: 'Ongoing' },
  { key: 'completed', swatch: 'bg-[#F3F4F6] border border-[#A3A3A3]', label: 'Completed' },
  { key: 'blocked',   swatch: 'bg-[#FEE2E2] border border-[#F40F02]', label: 'Unavailable' },
];
