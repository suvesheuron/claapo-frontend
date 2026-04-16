import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaLocationDot, FaUpRightFromSquare, FaCalendarDays, FaTriangleExclamation, FaVideo, FaLink, FaChevronLeft, FaChevronRight, FaBan, FaCircleCheck, FaCalendarCheck, FaGlobe, FaInstagram, FaYoutube, FaVimeoV, FaImdb, FaLinkedinIn, FaXTwitter } from 'react-icons/fa6';
import toast from 'react-hot-toast';
import DashboardHeader from '../components/DashboardHeader';
import DashboardSidebar from '../components/DashboardSidebar';
import AppFooter from '../components/AppFooter';
import Avatar from '../components/Avatar';
import ReviewsList from '../components/ReviewsList';
import LeaveReviewSection from '../components/LeaveReviewSection';
import AvailabilityDateDetailModal from '../components/AvailabilityDateDetailModal';
import BookingRequestModal from '../components/BookingRequestModal';
import InquiryRequestModal from '../components/InquiryRequestModal';
import { api, ApiException } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { companyNavLinks } from '../navigation/dashboardNav';
import type { BookingWithDetails, SlotStatus } from '../types/availability';
import { parseAvailabilityMonthResponse } from '../utils/parseAvailabilityResponse';
import { formatPaise } from '../utils/currency';

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
    genres?: string[];
    locationCity?: string;
    locationState?: string;
    dailyBudget?: number;
    vendorType?: string;
    gstNumber?: string;
    website?: string;
    imdbUrl?: string;
    instagramUrl?: string;
    youtubeUrl?: string;
    vimeoUrl?: string;
    isAvailable?: boolean;
    equipment?: VendorEquipment[];
  } | null;
}

function formatRate(paise?: number | null): string {
  if (paise != null) return `₹${(paise / 100).toLocaleString()}/day`;
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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } }
} satisfies Record<string, any>;

export default function OtherUserProfile() {
  const { userId } = useParams<{ userId: string }>();
  const { user: viewer } = useAuth();
  const [profile, setProfile] = useState<PublicProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewsRefreshKey, setReviewsRefreshKey] = useState(0);

  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calLoading, setCalLoading] = useState(false);
  const [calError, setCalError] = useState<string | null>(null);
  const [profileSlotMap, setProfileSlotMap] = useState<Record<string, { date: string; status: SlotStatus; notes?: string | null }>>({});
  const [profileBookingDetails, setProfileBookingDetails] = useState<Record<string, BookingWithDetails>>({});
  const [detailDate, setDetailDate] = useState<string | null>(null);
  
  // Modal states for booking and chat
  const navigate = useNavigate();
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedChatDate, setSelectedChatDate] = useState<string | null>(null);

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

  useEffect(() => {
    const n = new Date();
    setCalYear(n.getFullYear());
    setCalMonth(n.getMonth());
  }, [userId]);

  const rows = buildCalendarCells(calYear, calMonth, profileSlotMap, profileBookingDetails);

  // Month stats computed from the fetched slot map (only for days in this month)
  const calStats = (() => {
    const acc = { available: 0, booked: 0, blocked: 0 };
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const monthStr = String(calMonth + 1).padStart(2, '0');
    for (let d = 1; d <= daysInMonth; d++) {
      const key = `${calYear}-${monthStr}-${String(d).padStart(2, '0')}`;
      const s = profileSlotMap[key]?.status;
      if (s === 'blocked') acc.blocked += 1;
      else if (s === 'booked' || s === 'past_work') acc.booked += 1;
      else acc.available += 1;
    }
    return acc;
  })();

  const goPrevMonth = () => {
    const m = calMonth - 1;
    if (m < 0) {
      setCalMonth(11);
      setCalYear((y) => y - 1);
    } else {
      setCalMonth(m);
    }
  };
  const goNextMonth = () => {
    const m = calMonth + 1;
    if (m > 11) {
      setCalMonth(0);
      setCalYear((y) => y + 1);
    } else {
      setCalMonth(m);
    }
  };
  const goToday = () => {
    const n = new Date();
    setCalYear(n.getFullYear());
    setCalMonth(n.getMonth());
  };
  const isCurrentMonth = (() => {
    const n = new Date();
    return n.getFullYear() === calYear && n.getMonth() === calMonth;
  })();

  const profileShareUrl =
    typeof window !== 'undefined' && userId
      ? `${window.location.origin}/profile/${userId}`
      : '';

  // Helper to check if a date has an existing confirmed booking
  const getDateBookingStatus = (dateKey: string): 'none' | 'pending' | 'accepted' | 'locked' | 'completed' => {
    const booking = profileBookingDetails[dateKey];
    if (!booking) return 'none';
    return booking.status as 'pending' | 'accepted' | 'locked' | 'completed';
  };

  // Handle Chat button click on a date
  const handleDateChatClick = (dateKey: string) => {
    const status = getDateBookingStatus(dateKey);
    // If there's already an accepted/locked booking, go directly to chat
    if (status === 'accepted' || status === 'locked' || status === 'completed') {
      const booking = profileBookingDetails[dateKey];
      if (booking?.conversationId) {
        navigate(`/chat/${userId}?conversationId=${booking.conversationId}`);
      } else {
        // Fallback: navigate without conversationId, chat page will find or create it
        navigate(`/chat/${userId}?projectId=${booking?.projectId || ''}`);
      }
    } else {
      // No confirmed booking - open inquiry modal with pre-selected date
      setDetailDate(null);
      setSelectedChatDate(dateKey);
    }
  };

  // Handle starting inquiry chat after project selection
  const handleStartInquiryChat = async (projectId: string) => {
    if (!selectedChatDate || !userId || !profile) return;
    
    try {
      // First, create or get conversation
      const conv = await api.post<{ id: string; participantA: string; participantB: string; projectId: string }>(
        `/conversations`,
        { projectId, otherUserId: userId }
      );
      
      // Format the inquiry message
      const shootDate = parseIso(selectedChatDate).toLocaleDateString('en-IN', { 
        day: 'numeric', 
        month: 'long' 
      });
      const projectName = activeProjects?.find((p: any) => p.id === projectId)?.title || 'a project';
      
      const inquiryMessage = `Hi, hope you're doing well :)

We're working on ${projectName}. The shoot is planned for ${shootDate}. Just wanted to check if you'd be interested in being a part of it?`;

      // Send the inquiry message
      await api.post(`/conversations/${conv.id}/messages`, {
        type: 'text',
        content: inquiryMessage,
      });

      toast.success('Inquiry sent!');
      setSelectedChatDate(null);
      
      // Navigate to the chat
      navigate(`/chat/${userId}?projectId=${projectId}`);
    } catch (err) {
      const msg = err instanceof ApiException ? err.payload.message : 'Failed to send inquiry.';
      toast.error(msg);
    }
  };

  // Helper to parse ISO date string
  const parseIso = (iso: string) => new Date(iso + 'T12:00:00');

  // Get active projects for inquiry (lazy load when needed)
  const [activeProjects, setActiveProjects] = useState<any[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);

  useEffect(() => {
    if (selectedChatDate && activeProjects.length === 0 && !projectsLoading) {
      setProjectsLoading(true);
      api.get<any>('/projects?limit=50')
        .then((res) => {
          const items = res?.items || res?.data || [];
          setActiveProjects(items.filter((p: any) => p.status === 'active' || p.status === 'open' || p.status === 'draft'));
        })
        .catch(() => {})
        .finally(() => setProjectsLoading(false));
    }
  }, [selectedChatDate]);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-neutral-50 min-w-0 w-full">
      <DashboardHeader />
      <div className="flex-1 flex min-h-0 overflow-hidden">
        <DashboardSidebar links={companyNavLinks} />
        <main className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden relative">
          {/* Subtle background mesh */}
          <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-br from-[#3678F1]/5 via-[#DBEAFE]/30 to-transparent pointer-events-none" />
          <div className="flex-1 min-h-0 overflow-auto z-10">
            <div className="max-w-[1100px] mx-auto px-4 sm:px-6 md:px-8 lg:px-6 xl:px-8 py-4 sm:py-6">
              <div className="mb-4 flex items-center gap-3">
                <Link
                  to="/search"
                  className="inline-flex items-center gap-1.5 text-xs text-neutral-600 hover:text-neutral-900"
                >
                  <FaArrowLeft className="w-3 h-3" />
                  Back to search
                </Link>
              </div>

              {loading ? (
                <div className="space-y-4">
                  <div className="skeleton h-40 rounded-2xl" />
                  <div className="skeleton h-64 rounded-2xl" />
                </div>
              ) : error ? (
                <div className="flex items-center gap-3 rounded-2xl bg-[#FEEBEA] border border-[#F40F02]/30 p-4">
                  <FaTriangleExclamation className="text-[#F40F02] shrink-0" />
                  <p className="text-sm text-[#991B1B]">{error}</p>
                </div>
              ) : profile && p ? (
                <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
                  {/* Hero Card */}
                  <motion.div variants={itemVariants} className="rounded-3xl bg-white shadow-soft border border-neutral-100 hover:border-[#3678F1] transition-colors duration-200 overflow-hidden relative">
                    <div className="h-32 bg-gradient-to-r from-[#3678F1]/10 via-[#7c96ff]/10 to-transparent w-full absolute top-0 left-0 pointer-events-none" />
                    <div className="p-6 sm:p-8 flex flex-col sm:flex-row gap-6 sm:gap-8 relative z-10 mt-6 sm:mt-10">
                      <div className="flex-shrink-0">
                        <div className="ring-4 ring-white rounded-full bg-white shadow-sm inline-block">
                          <Avatar name={title} size="lg" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0 pt-2">
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 mb-1">{title}</h1>
                        {!isIndividual && (
                          <p className="text-xs uppercase tracking-[0.15em] font-semibold text-[#3678F1] mb-3">
                            {profile.role.replace(/_/g, ' ')}
                          </p>
                        )}
                        {isIndividual && (p.genres?.length || p.genre) && (
                          <p className="text-sm text-neutral-600 mb-3">
                            {(p.genres?.length ? p.genres : [p.genre!]).filter(Boolean).join(', ')}
                          </p>
                        )}
                        {(p.locationCity || p.locationState) && (
                          <p className="text-sm text-neutral-600 flex items-center gap-1.5 mb-2">
                            <FaLocationDot className="w-3.5 h-3.5 text-neutral-400" />
                            {[p.locationCity, p.locationState].filter(Boolean).join(', ')}
                          </p>
                        )}
                        {isIndividual && p.dailyBudget != null && (
                          <div className="inline-block mt-2 mb-3 bg-[#E8F0FE] border border-[#3678F1]/20 text-[#3678F1] px-3 py-1.5 rounded-lg">
                            <p className="text-sm font-bold">
                              {formatRate(p.dailyBudget)}
                            </p>
                          </div>
                        )}
                        {isIndividual && p.skills?.length ? (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {p.skills.map((s) => (
                              <span key={s} className="px-2.5 py-1 bg-neutral-100 text-neutral-700 text-xs font-medium rounded-md border border-neutral-200">
                                {s}
                              </span>
                            ))}
                          </div>
                        ) : null}
                        {worklink && (
                          <div className="mt-4 pt-4 border-t border-neutral-100">
                            <a
                              href={worklink}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 text-sm font-medium text-[#3678F1] hover:text-[#2563EB] transition-colors"
                            >
                              View Portfolio
                              <FaUpRightFromSquare className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>

                  {(p.bio || p.aboutMe || p.aboutUs) && (
                    <motion.div variants={itemVariants} className="rounded-3xl bg-white shadow-soft border border-neutral-100 hover:border-[#3678F1] transition-colors duration-200 p-6 sm:p-8">
                      <h2 className="text-base font-bold text-neutral-900 mb-4 flex items-center gap-2">
                        <span className="w-1 h-5 rounded-full bg-[#3678F1]" /> About
                      </h2>
                      <p className="text-sm text-neutral-600 leading-relaxed whitespace-pre-wrap">
                        {p.aboutMe || p.aboutUs || p.bio}
                      </p>
                    </motion.div>
                  )}

                  {(isIndividual || isVendor) && (() => {
                    const platforms: Array<{ key: string; label: string; url: string | undefined; Icon: typeof FaGlobe; color: string; bg: string; border: string }> = [
                      { key: 'website',   label: 'Website',     url: p.website,      Icon: FaGlobe,      color: 'text-[#3678F1]', bg: 'bg-[#3678F1]/10', border: 'border-[#3678F1]/20' },
                      { key: 'instagram', label: 'Instagram',   url: p.instagramUrl, Icon: FaInstagram,  color: 'text-[#E4405F]', bg: 'bg-[#E4405F]/10', border: 'border-[#E4405F]/20' },
                      { key: 'youtube',   label: 'YouTube',     url: p.youtubeUrl,   Icon: FaYoutube,    color: 'text-[#FF0000]', bg: 'bg-[#FF0000]/10', border: 'border-[#FF0000]/20' },
                      { key: 'vimeo',     label: 'Vimeo',       url: p.vimeoUrl,     Icon: FaVimeoV,     color: 'text-[#1AB7EA]', bg: 'bg-[#1AB7EA]/10', border: 'border-[#1AB7EA]/20' },
                      { key: 'imdb',      label: 'IMDb',        url: p.imdbUrl,      Icon: FaImdb,       color: 'text-[#B58A00]', bg: 'bg-[#F5C518]/15', border: 'border-[#F5C518]/30' },
                      { key: 'linkedin',  label: 'LinkedIn',    url: (p as { linkedinUrl?: string }).linkedinUrl, Icon: FaLinkedinIn, color: 'text-[#0A66C2]', bg: 'bg-[#0A66C2]/10', border: 'border-[#0A66C2]/20' },
                      { key: 'twitter',   label: 'X (Twitter)', url: (p as { twitterUrl?: string }).twitterUrl,   Icon: FaXTwitter,   color: 'text-neutral-900', bg: 'bg-neutral-100', border: 'border-neutral-200' },
                    ];
                    const visible = platforms.filter((pl) => !!pl.url);
                    if (visible.length === 0) return null;
                    const handleOpen = (url: string) => window.open(url, '_blank', 'noopener,noreferrer');
                    const handleCopy = async (e: React.MouseEvent, url: string, label: string) => {
                      e.preventDefault();
                      try {
                        await navigator.clipboard.writeText(url);
                        toast.success(`${label} link copied`);
                      } catch {
                        toast.error('Could not copy link');
                      }
                    };
                    return (
                      <motion.div variants={itemVariants} className="rounded-3xl bg-white shadow-soft border border-neutral-100 hover:border-[#3678F1] transition-colors duration-200 p-6 sm:p-8">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
                          <div>
                            <h2 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                              <span className="w-1 h-5 rounded-full bg-[#3678F1]" /> Social & Links
                            </h2>
                            <p className="text-[11px] text-neutral-400 mt-1.5 ml-3">Left-click to open · Right-click to copy</p>
                          </div>
                          {profileShareUrl && (
                            <button
                              type="button"
                              onClick={() => {
                                void navigator.clipboard.writeText(profileShareUrl);
                                toast.success('Profile link copied');
                              }}
                              className="inline-flex items-center justify-center gap-2 text-xs font-semibold text-[#3678F1] border border-[#3678F1]/30 rounded-xl px-3 py-2 hover:bg-[#E8F0FE] transition-colors"
                            >
                              <FaLink className="w-3.5 h-3.5" />
                              Copy profile link
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                          {visible.map(({ key, label, url, Icon, color, bg, border }) => (
                            <button
                              key={key}
                              type="button"
                              onClick={() => handleOpen(url!)}
                              onContextMenu={(e) => handleCopy(e, url!, label)}
                              title={`Left-click to open ${label} · Right-click to copy link`}
                              className={`group relative flex items-center gap-3 px-3.5 py-3 rounded-2xl border ${border} ${bg} hover:border-[#3678F1] transition-colors duration-200 text-left`}
                            >
                              <div className="w-9 h-9 rounded-xl bg-white border border-neutral-200/60 flex items-center justify-center shrink-0 shadow-sm">
                                <Icon className={`w-4 h-4 ${color}`} />
                              </div>
                              <div className="min-w-0">
                                <p className="text-[11px] uppercase tracking-wider text-neutral-400 font-semibold leading-none">Visit</p>
                                <p className={`text-sm font-bold ${color} truncate leading-tight mt-1`}>{label}</p>
                              </div>
                              <FaUpRightFromSquare className={`w-3 h-3 ${color} opacity-0 group-hover:opacity-60 absolute top-2 right-2 transition-opacity`} />
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    );
                  })()}

                  {isVendor && (
                    <motion.div variants={itemVariants} className="rounded-3xl bg-white shadow-soft border border-neutral-100 hover:border-[#3678F1] transition-colors duration-200 p-6 sm:p-8">
                      <h2 className="text-base font-bold text-neutral-900 mb-5 flex items-center gap-2">
                        <span className="w-1 h-5 rounded-full bg-[#3678F1]" /> Vendor details
                      </h2>
                      <dl className="space-y-2 text-sm text-neutral-700">
                        <div>
                          <dt className="text-xs text-neutral-500 mb-0.5">Type</dt>
                          <dd>{p.vendorType ?? '—'}</dd>
                        </div>
                        <div>
                          <dt className="text-xs text-neutral-500 mb-0.5">GST Number</dt>
                          <dd>{p.gstNumber ?? '—'}</dd>
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
                    </motion.div>
                  )}

                  {(isIndividual || isVendor) && (
                  <>
                  <motion.div variants={itemVariants} className="rounded-3xl bg-white shadow-soft border border-neutral-100 hover:border-[#3678F1] transition-colors duration-200 p-5 sm:p-6">
                    {/* Header: title + month navigation */}
                    <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#E8F0FE] to-[#DBEAFE] border border-[#3678F1]/10 flex items-center justify-center shrink-0">
                          <FaCalendarDays className="w-4 h-4 text-[#3678F1]" />
                        </div>
                        <div>
                          <h2 className="text-sm font-bold text-neutral-900 leading-tight">Schedule &amp; Availability</h2>
                          <p className="text-[11px] text-neutral-500 mt-0.5">Browse past and upcoming months</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={goPrevMonth}
                          aria-label="Previous month"
                          className="w-9 h-9 rounded-xl border border-neutral-200 bg-white text-neutral-600 hover:bg-[#E8F0FE] hover:border-[#3678F1]/30 hover:text-[#3678F1] flex items-center justify-center transition-all"
                        >
                          <FaChevronLeft className="w-3 h-3" />
                        </button>
                        <div className="min-w-[140px] text-center px-2">
                          <p className="text-sm font-extrabold text-neutral-900 leading-tight tabular-nums">
                            {MONTHS[calMonth]} {calYear}
                          </p>
                          {!isCurrentMonth && (
                            <button
                              type="button"
                              onClick={goToday}
                              className="text-[10px] text-[#3678F1] font-bold hover:underline"
                            >
                              Jump to today
                            </button>
                          )}
                          {isCurrentMonth && (
                            <span className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider">Current month</span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={goNextMonth}
                          aria-label="Next month"
                          className="w-9 h-9 rounded-xl border border-neutral-200 bg-white text-neutral-600 hover:bg-[#E8F0FE] hover:border-[#3678F1]/30 hover:text-[#3678F1] flex items-center justify-center transition-all"
                        >
                          <FaChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Quick stats for the visible month */}
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-white border border-[#86EFAC] px-2.5 py-1 text-[11px] font-bold text-[#15803D] shadow-sm">
                        <FaCircleCheck className="w-2.5 h-2.5" /> {calStats.available} free
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-white border border-[#93C5FD] px-2.5 py-1 text-[11px] font-bold text-[#1D4ED8] shadow-sm">
                        <FaCalendarCheck className="w-2.5 h-2.5" /> {calStats.booked} booked
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FCA5A5] border border-[#DC2626] px-2.5 py-1 text-[11px] font-extrabold text-[#7F1D1D] shadow-sm">
                        <FaBan className="w-2.5 h-2.5" /> {calStats.blocked} unavailable
                      </span>
                      {calLoading && (
                        <span className="text-[11px] text-neutral-400 font-medium inline-flex items-center gap-1.5">
                          <span className="w-6 h-6 border-[2.5px] border-[#3678F1]/15 border-t-[#3678F1] border-r-[#3678F1] rounded-full animate-spin" />
                          Loading…
                        </span>
                      )}
                    </div>
                    {calError ? (
                      <div className="flex items-center gap-2 rounded-xl bg-[#FEEBEA] border border-[#F40F02]/30 px-3 py-2 mb-3">
                        <FaTriangleExclamation className="text-[#F40F02] text-xs" />
                        <p className="text-xs text-[#991B1B]">{calError}</p>
                      </div>
                    ) : (
                      <>
                        <div className={`border border-neutral-200 rounded-xl p-3 transition-opacity ${calLoading ? 'opacity-60' : 'opacity-100'}`}>
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
                                  const isBlocked = status === 'blocked';
                                  const base =
                                    'relative h-9 rounded-md text-[11px] font-semibold flex items-center justify-center border transition-all overflow-hidden';
                                  const interactivity = isBlocked
                                    ? 'cursor-not-allowed'
                                    : 'cursor-pointer hover:ring-2 hover:ring-[#3678F1]/25';
                                  let bg = 'bg-neutral-50 text-neutral-700 border-neutral-100';
                                  if (status === 'available')      bg = 'bg-[#DCFCE7] text-[#15803D] border-[#86EFAC] hover:bg-[#BBF7D0]';
                                  else if (status === 'booked')    bg = 'bg-[#FCD34D] text-[#78350F] border-[#D97706] hover:bg-[#FBBF24]';
                                  else if (status === 'past_work') bg = 'bg-[#60A5FA] text-[#0F1F4D] border-[#1D4ED8] hover:bg-[#3B82F6]';
                                  else if (isBlocked)              bg = 'bg-[#FCA5A5] text-[#7F1D1D] border-[#DC2626]';
                                  const todayRing = isToday ? 'ring-2 ring-[#3678F1]/50 ring-offset-1' : '';
                                  return (
                                    <button
                                      key={key}
                                      type="button"
                                      title={isBlocked ? 'Unavailable' : undefined}
                                      aria-label={isBlocked ? `${dateKey} — unavailable` : dateKey}
                                      aria-disabled={isBlocked || undefined}
                                      tabIndex={isBlocked ? -1 : 0}
                                      className={`${base} ${interactivity} ${bg} ${todayRing}`}
                                      onClick={() => {
                                        if (isBlocked) return;
                                        setDetailDate(dateKey);
                                      }}
                                    >
                                      {isBlocked && (
                                        <span
                                          aria-hidden
                                          className="absolute inset-0 pointer-events-none opacity-30"
                                          style={{
                                            backgroundImage:
                                              'repeating-linear-gradient(45deg, rgba(127,29,29,0.30) 0 3px, transparent 3px 6px)',
                                          }}
                                        />
                                      )}
                                      <span className="relative flex flex-col items-center gap-0.5">
                                        <span className={isBlocked ? 'line-through decoration-[1.5px] decoration-[#7F1D1D]/70' : ''}>{day}</span>
                                        {hasBooking ? (
                                          <span className="w-1 h-1 rounded-full bg-[#3678F1]" />
                                        ) : null}
                                      </span>
                                      {isBlocked && (
                                        <span className="absolute top-0 right-0 w-2.5 h-2.5 rounded-bl-md rounded-tr-md bg-[#DC2626] text-white flex items-center justify-center">
                                          <span className="block w-0.5 h-0.5 rounded-full bg-white" />
                                        </span>
                                      )}
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
                            <span className="w-3 h-3 rounded-sm bg-[#FCD34D] border border-[#D97706]" />
                            Ongoing
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="w-3 h-3 rounded-sm bg-[#60A5FA] border border-[#1D4ED8]" />
                            Completed
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="w-3 h-3 rounded-sm bg-[#FCA5A5] border border-[#DC2626]" />
                            Unavailable
                          </div>
                        </div>
                      </>
                    )}
                  </motion.div>

                  <AvailabilityDateDetailModal
                    open={!!detailDate}
                    onClose={() => setDetailDate(null)}
                    selectedDate={detailDate}
                    slot={detailDate ? profileSlotMap[detailDate] : undefined}
                    booking={detailDate ? profileBookingDetails[detailDate] : undefined}
                    mode="company_readonly"
                    targetUserId={userId}
                    targetUserName={title}
                    onChatClick={() => handleDateChatClick(detailDate!)}
                    onBookCrewClick={() => {
                      // Pre-select the date and open booking modal
                      setDetailDate(null);
                      // We'll need to handle this with a booking modal that can pre-select dates
                      // For now, navigate to booking from profile with date hint
                      // This will be handled by the BookingRequestModal
                      setIsBookingModalOpen(true);
                    }}
                  />
                  </>
                  )}
                </motion.div>
              ) : null}

              {/* Reviews section */}
              {profile && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-8 space-y-4">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="w-1 h-5 rounded-full bg-[#3678F1]" />
                    <h2 className="text-base font-bold text-neutral-900">Ratings & Reviews</h2>
                  </div>
                  {viewer?.role === 'company' && (isIndividual || isVendor) && (
                    <LeaveReviewSection
                      targetUserId={profile.id}
                      targetName={title}
                      onSubmitted={() => setReviewsRefreshKey((k) => k + 1)}
                    />
                  )}
                  <ReviewsList userId={profile.id} refreshKey={reviewsRefreshKey} />
                </motion.div>
              )}
            </div>
          </div>
          <AppFooter />
        </main>
      </div>

      {/* Booking Request Modal */}
      {profile && (
        <BookingRequestModal
          isOpen={isBookingModalOpen}
          onClose={() => setIsBookingModalOpen(false)}
          userName={title}
          userRole={isIndividual ? (p?.skills?.[0] ?? 'Individual') : (p?.vendorType ?? 'Vendor')}
          userRate={isIndividual && p?.dailyBudget ? formatPaise(p.dailyBudget) + ' /day' : '—'}
          targetUserId={profile.id}
          isVendor={isVendor}
          onSuccess={() => setIsBookingModalOpen(false)}
        />
      )}

      {/* Inquiry Request Modal (for chat before booking) */}
      {selectedChatDate && activeProjects.length > 0 && (
        <InquiryRequestModal
          isOpen={!!selectedChatDate}
          onClose={() => setSelectedChatDate(null)}
          targetUserId={userId!}
          targetName={title}
          selectedDate={selectedChatDate}
          projects={activeProjects}
          projectsLoading={projectsLoading}
          onSendInquiry={handleStartInquiryChat}
        />
      )}
    </div>
  );
}

