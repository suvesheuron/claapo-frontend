import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FaArrowLeft, FaLocationDot, FaUpRightFromSquare, FaCalendarDays, FaTriangleExclamation, FaVideo } from 'react-icons/fa6';
import DashboardHeader from '../components/DashboardHeader';
import DashboardSidebar from '../components/DashboardSidebar';
import AppFooter from '../components/AppFooter';
import Avatar from '../components/Avatar';
import ReviewsList from '../components/ReviewsList';
import AvailabilityDateDetailModal from '../components/AvailabilityDateDetailModal';
import { api, ApiException } from '../services/api';
import { companyNavLinks } from '../navigation/dashboardNav';
import type { BookingWithDetails, SlotStatus } from '../types/availability';
import { parseAvailabilityMonthResponse } from '../utils/parseAvailabilityResponse';

type UserRole = 'individual' | 'company' | 'vendor' | 'admin';

interface VendorEquipment {
  id: string;
  name: string;
  currentCity?: string | null;
  availabilities?: Array<{ locationCity?: string | null }>;
}

interface PublicProfileResponse {
  id: string;
  role: UserRole;
  profile: {
    displayName?: string;
    companyName?: string;
    bio?: string;
    aboutMe?: string;
    aboutUs?: string;
    skills?: string[];
    genre?: string;
    locationCity?: string;
    locationState?: string;
    dailyRateMin?: number;
    dailyRateMax?: number;
    vendorType?: string;
    gstNumber?: string;
    website?: string;
    imdbUrl?: string;
    instagramUrl?: string;
    isAvailable?: boolean;
    equipment?: VendorEquipment[];
  } | null;
}

function formatRate(min?: number | null, max?: number | null): string {
  if (min != null && max != null) return `₹${min.toLocaleString()}–₹${max.toLocaleString()}/day`;
  if (min != null) return `₹${min.toLocaleString()}/day`;
  return '—';
}

const MONTHS = 'January February March April May June July August September October November December'.split(' ');
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function buildCalendarCells(
  year: number,
  month: number,
  slotMap: Record<string, { status: SlotStatus }>,
  bookingDetails: Record<string, BookingWithDetails>,
) {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startBlank = first.getDay();
  const days = last.getDate();
  const cells: (null | { day: number; dateKey: string; status: SlotStatus | null; hasBooking: boolean; isToday: boolean })[] = [];
  for (let i = 0; i < startBlank; i++) cells.push(null);
  const today = new Date();
  const monthStr = String(month + 1).padStart(2, '0');
  for (let d = 1; d <= days; d++) {
    const dayStr = String(d).padStart(2, '0');
    const dateKey = `${year}-${monthStr}-${dayStr}`;
    const st = slotMap[dateKey]?.status ?? null;
    const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === d;
    const hasBooking = !!bookingDetails[dateKey];
    cells.push({ day: d, dateKey, status: st, hasBooking, isToday });
  }
  const rows: typeof cells[] = [];
  for (let i = 0; i < cells.length; i += 7) {
    const row = cells.slice(i, i + 7);
    while (row.length < 7) row.push(null);
    rows.push(row);
  }
  return rows;
}

export default function OtherUserProfile() {
  const { userId } = useParams<{ userId: string }>();
  const [profile, setProfile] = useState<PublicProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calLoading, setCalLoading] = useState(false);
  const [calError, setCalError] = useState<string | null>(null);
  const [profileSlotMap, setProfileSlotMap] = useState<Record<string, { date: string; status: SlotStatus; notes?: string | null }>>({});
  const [profileBookingDetails, setProfileBookingDetails] = useState<Record<string, BookingWithDetails>>({});
  const [detailDate, setDetailDate] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    api
      .get<PublicProfileResponse>(`/profile/${userId}`)
      .then((res) => setProfile(res))
      .catch((e) => {
        const msg = e instanceof ApiException ? e.payload.message : 'Failed to load profile.';
        setError(msg);
      })
      .finally(() => setLoading(false));
  }, [userId]);

  useEffect(() => {
    if (!userId || !profile) return;
    const role = profile.role;
    if (role !== 'individual' && role !== 'vendor') {
      setProfileSlotMap({});
      setProfileBookingDetails({});
      return;
    }
    setCalLoading(true);
    setCalError(null);
    api
      .get<unknown>(`/availability/${userId}?year=${calYear}&month=${calMonth + 1}`)
      .then((res) => {
        const parsed = parseAvailabilityMonthResponse(res);
        setProfileSlotMap(parsed.slots);
        setProfileBookingDetails(parsed.bookingDetails);
      })
      .catch((e) => {
        const msg = e instanceof ApiException ? e.payload.message : 'Failed to load calendar.';
        setCalError(msg);
        setProfileSlotMap({});
        setProfileBookingDetails({});
      })
      .finally(() => setCalLoading(false));
  }, [userId, calYear, calMonth, profile?.role, profile?.id]);

  useEffect(() => {
    document.title = 'Profile – Claapo';
  }, []);

  const p = profile?.profile;
  const isIndividual = profile?.role === 'individual';
  const isVendor = profile?.role === 'vendor';
  const title = p?.displayName ?? p?.companyName ?? 'Profile';
  const worklink = (p as any)?.imdbUrl as string | undefined;

  const prevMonth = () => {
    if (calMonth === 0) {
      setCalYear((y) => y - 1);
      setCalMonth(11);
    } else setCalMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (calMonth === 11) {
      setCalYear((y) => y + 1);
      setCalMonth(0);
    } else setCalMonth((m) => m + 1);
  };

  const rows = buildCalendarCells(calYear, calMonth, profileSlotMap, profileBookingDetails);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-neutral-50 min-w-0 w-full">
      <DashboardHeader />
      <div className="flex-1 flex min-h-0 overflow-hidden">
        <DashboardSidebar links={companyNavLinks} />
        <main className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
          <div className="flex-1 min-h-0 overflow-auto">
            <div className="max-w-[1100px] mx-auto px-4 sm:px-6 md:px-8 lg:px-6 xl:px-8 py-4 sm:py-5">
              <div className="mb-4 flex items-center gap-3">
                <Link
                  to="/dashboard/search"
                  className="inline-flex items-center gap-1.5 text-xs text-neutral-600 hover:text-neutral-900"
                >
                  <FaArrowLeft className="w-3 h-3" />
                  Back to search
                </Link>
              </div>

              {loading ? (
                <div className="animate-pulse space-y-4">
                  <div className="h-40 bg-neutral-200 rounded-2xl" />
                  <div className="h-64 bg-neutral-200 rounded-2xl" />
                </div>
              ) : error ? (
                <div className="flex items-center gap-3 rounded-2xl bg-red-50 border border-red-200 p-4">
                  <FaTriangleExclamation className="text-red-500 shrink-0" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              ) : profile && p ? (
                <div className="space-y-5">
                  <div className="rounded-2xl bg-white border border-neutral-200 p-6 flex flex-col sm:flex-row gap-5">
                    <div className="flex-shrink-0">
                      <Avatar name={title} size="lg" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 mb-1">{title}</h1>
                      <p className="text-xs uppercase tracking-[0.12em] text-neutral-500 mb-2">
                        {profile.role}
                      </p>
                      {(p.locationCity || p.locationState) && (
                        <p className="text-sm text-neutral-600 flex items-center gap-1 mb-1">
                          <FaLocationDot className="w-3 h-3 text-neutral-400" />
                          {[p.locationCity, p.locationState].filter(Boolean).join(', ')}
                        </p>
                      )}
                      {isIndividual && (p.dailyRateMin != null || p.dailyRateMax != null) && (
                        <p className="text-sm font-semibold text-neutral-900 mb-1">
                          Rate: {formatRate(p.dailyRateMin ?? null, p.dailyRateMax ?? null)}
                        </p>
                      )}
                      {isIndividual && p.skills?.length ? (
                        <p className="text-xs text-neutral-600 mb-1">
                          Skills: <span className="font-medium text-neutral-800">{p.skills.join(', ')}</span>
                        </p>
                      ) : null}
                      {worklink && (
                        <p className="text-xs text-neutral-600 mt-2">
                          Worklink:{' '}
                          <a
                            href={worklink}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[#3B5BDB] hover:underline"
                          >
                            {worklink}
                            <FaUpRightFromSquare className="w-3 h-3" />
                          </a>
                        </p>
                      )}
                    </div>
                  </div>

                  {(p.bio || p.aboutMe || p.aboutUs) && (
                    <div className="rounded-2xl bg-white border border-neutral-200 p-5">
                      <h2 className="text-sm font-bold text-neutral-900 mb-3">About</h2>
                      <p className="text-sm text-neutral-700 whitespace-pre-wrap">
                        {p.aboutMe || p.aboutUs || p.bio}
                      </p>
                    </div>
                  )}

                  {isVendor && (
                    <div className="rounded-2xl bg-white border border-neutral-200 p-5">
                      <h2 className="text-sm font-bold text-neutral-900 mb-3">Vendor details</h2>
                      <dl className="space-y-2 text-sm text-neutral-700">
                        <div>
                          <dt className="text-xs text-neutral-500 mb-0.5">Type</dt>
                          <dd>{p.vendorType ?? '—'}</dd>
                        </div>
                        <div>
                          <dt className="text-xs text-neutral-500 mb-0.5">GST Number</dt>
                          <dd>{p.gstNumber ?? '—'}</dd>
                        </div>
                        <div>
                          <dt className="text-xs text-neutral-500 mb-0.5">Website</dt>
                          <dd>
                            {p.website ? (
                              <a
                                href={p.website}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[#3B5BDB] hover:underline"
                              >
                                {p.website}
                              </a>
                            ) : (
                              '—'
                            )}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs text-neutral-500 mb-0.5">Instagram</dt>
                          <dd>
                            {p.instagramUrl ? (
                              <a
                                href={p.instagramUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[#3B5BDB] hover:underline"
                              >
                                {p.instagramUrl}
                              </a>
                            ) : (
                              '—'
                            )}
                          </dd>
                        </div>
                        {p.equipment && p.equipment.length > 0 && (
                          <div className="pt-2 border-t border-neutral-200 mt-2">
                            <dt className="text-xs text-neutral-500 mb-1.5 flex items-center gap-1">
                              <FaVideo className="w-3 h-3" />
                              Equipment ({p.equipment.length})
                            </dt>
                            <div className="space-y-2">
                              {p.equipment.slice(0, 5).map((eq) => (
                                <div key={eq.id} className="text-sm">
                                  <div className="font-medium text-neutral-800">{eq.name}</div>
                                  {(eq.currentCity || (eq.availabilities && eq.availabilities.length > 0)) && (
                                    <div className="text-xs text-neutral-500 flex items-center gap-1 mt-0.5">
                                      <FaLocationDot className="w-3 h-3" />
                                      {eq.currentCity || eq.availabilities?.[0]?.locationCity || '—'}
                                    </div>
                                  )}
                                </div>
                              ))}
                              {p.equipment.length > 5 && (
                                <div className="text-xs text-neutral-500 mt-1">
                                  +{p.equipment.length - 5} more equipment
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </dl>
                    </div>
                  )}

                  {(isIndividual || isVendor) && (
                  <>
                  <div className="rounded-2xl bg-white border border-neutral-200 p-5">
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                        <FaCalendarDays className="w-4 h-4 text-neutral-500" />
                        Schedule – availability
                      </h2>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={prevMonth}
                          className="w-7 h-7 rounded-lg border border-neutral-200 flex items-center justify-center text-neutral-600 hover:bg-neutral-100"
                        >
                          ‹
                        </button>
                        <span className="text-xs text-neutral-700 font-medium">
                          {MONTHS[calMonth]} {calYear}
                        </span>
                        <button
                          type="button"
                          onClick={nextMonth}
                          className="w-7 h-7 rounded-lg border border-neutral-200 flex items-center justify-center text-neutral-600 hover:bg-neutral-100"
                        >
                          ›
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-neutral-500 mb-3">
                      Green: available · Blue: booked or completed work · Red: blocked. Tap any day for details (including your active bookings with this person).
                    </p>
                    {calLoading ? (
                      <div className="py-8 flex items-center justify-center">
                        <span className="w-6 h-6 border-2 border-[#3B5BDB]/30 border-t-[#3B5BDB] rounded-full animate-spin" />
                      </div>
                    ) : calError ? (
                      <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-3 py-2">
                        <FaTriangleExclamation className="text-red-500 text-xs" />
                        <p className="text-xs text-red-700">{calError}</p>
                      </div>
                    ) : (
                      <>
                        <div className="border border-neutral-200 rounded-xl p-3">
                          <div className="grid grid-cols-7 gap-1 mb-1">
                            {WEEKDAYS.map((d) => (
                              <div
                                key={d}
                                className="text-[10px] text-neutral-500 font-semibold text-center py-1"
                              >
                                {d}
                              </div>
                            ))}
                          </div>
                          <div className="space-y-1">
                            {rows.map((row, rowIndex) => (
                              <div key={rowIndex} className="grid grid-cols-7 gap-1">
                                {row.map((cell, colIndex) => {
                                  const key = `${rowIndex}-${colIndex}`;
                                  if (!cell) {
                                    return <div key={key} className="h-9" />;
                                  }
                                  const { day, dateKey, status, hasBooking, isToday } = cell;
                                  const base =
                                    'h-9 rounded-md text-[11px] font-medium flex items-center justify-center cursor-pointer border border-transparent hover:ring-2 hover:ring-[#3B5BDB]/25 transition-shadow';
                                  let bg = 'bg-neutral-50 text-neutral-700 border-neutral-100';
                                  if (status === 'available') bg = 'bg-[#DCFCE7] text-[#15803D] border-[#86EFAC]';
                                  else if (status === 'booked' || status === 'past_work') bg = 'bg-[#DBEAFE] text-[#1D4ED8] border-[#93C5FD]';
                                  else if (status === 'blocked') bg = 'bg-[#FEE2E2] text-[#B91C1C] border-[#FECACA]';
                                  const todayRing = isToday ? 'ring-2 ring-[#3B5BDB]/50 ring-offset-1' : '';
                                  return (
                                    <button
                                      key={key}
                                      type="button"
                                      className={`${base} ${bg} ${todayRing}`}
                                      onClick={() => setDetailDate(dateKey)}
                                    >
                                      <span className="relative flex flex-col items-center gap-0.5">
                                        {day}
                                        {hasBooking ? (
                                          <span className="w-1 h-1 rounded-full bg-[#3B5BDB]" />
                                        ) : null}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 mt-3 text-[11px] text-neutral-600">
                          <div className="flex items-center gap-1">
                            <span className="w-3 h-3 rounded-sm bg-[#DCFCE7] border border-[#86EFAC]" />
                            Available
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="w-3 h-3 rounded-sm bg-[#DBEAFE] border border-[#93C5FD]" />
                            Booked / completed
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="w-3 h-3 rounded-sm bg-[#FEE2E2] border border-[#FECACA]" />
                            Blocked
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  <AvailabilityDateDetailModal
                    open={!!detailDate}
                    onClose={() => setDetailDate(null)}
                    selectedDate={detailDate}
                    slot={detailDate ? profileSlotMap[detailDate] : undefined}
                    booking={detailDate ? profileBookingDetails[detailDate] : undefined}
                    mode="company_readonly"
                  />
                  </>
                  )}
                </div>
              ) : null}

              {/* Reviews section */}
              {profile && (
                <div className="mt-6">
                  <ReviewsList userId={profile.id} />
                </div>
              )}
            </div>
          </div>
          <AppFooter />
        </main>
      </div>
    </div>
  );
}

