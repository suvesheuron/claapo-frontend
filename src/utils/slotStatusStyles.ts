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
  booked:    'bg-[#FCD34D] border-[#D97706] text-[#78350F] hover:bg-[#FBBF24]',
  completed: 'bg-[#60A5FA] border-[#1D4ED8] text-[#0F1F4D] hover:bg-[#3B82F6]',
  blocked:   'bg-[#FCA5A5] border-[#DC2626] text-[#7F1D1D] hover:bg-[#F87171]',
};

export const CELL_STYLE_COMPACT: Record<CellStatus, string> = {
  available: 'bg-[#DCFCE7] border-[#86EFAC] text-[#15803D]',
  booked:    'bg-[#FCD34D] border-[#D97706] text-[#78350F]',
  completed: 'bg-[#60A5FA] border-[#1D4ED8] text-[#0F1F4D]',
  blocked:   'bg-[#FCA5A5] border-[#DC2626] text-[#7F1D1D]',
};

export const SLOT_STATUS_BADGE: Record<SlotStatus, string> = {
  available: 'bg-[#DCFCE7] text-[#15803D]',
  booked:    'bg-[#FCD34D] text-[#78350F]',
  past_work: 'bg-[#60A5FA] text-[#0F1F4D]',
  blocked:   'bg-[#FCA5A5] text-[#7F1D1D]',
};

export const LEGEND_SWATCHES: Array<{ key: CellStatus; swatch: string; label: string }> = [
  { key: 'available', swatch: 'bg-[#DCFCE7] border border-[#86EFAC]', label: 'Available' },
  { key: 'booked',    swatch: 'bg-[#FCD34D] border border-[#D97706]', label: 'Ongoing' },
  { key: 'completed', swatch: 'bg-[#60A5FA] border border-[#1D4ED8]', label: 'Completed' },
  { key: 'blocked',   swatch: 'bg-[#FCA5A5] border border-[#DC2626]', label: 'Unavailable' },
];
