import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaLocationDot, FaCalendarDays, FaTriangleExclamation, FaVideo, FaChevronLeft, FaChevronRight, FaBan, FaCircleCheck, FaCalendarCheck, FaGlobe, FaInstagram, FaYoutube, FaVimeoV, FaImdb, FaLinkedinIn, FaXTwitter, FaPhone, FaMessage, FaEnvelope, FaCircleInfo, FaFilm, FaImages, FaFilePdf, FaXmark } from 'react-icons/fa6';
import toast from 'react-hot-toast';
import DashboardHeader from '../components/DashboardHeader';
import DashboardSidebar from '../components/DashboardSidebar';
import AppFooter from '../components/AppFooter';
import Avatar from '../components/Avatar';
import ImagePreviewModal from '../components/ImagePreviewModal';
import ReviewsList from '../components/ReviewsList';
import LeaveReviewSection from '../components/LeaveReviewSection';
import AvailabilityDateDetailModal from '../components/AvailabilityDateDetailModal';
import BookingRequestModal from '../components/BookingRequestModal';
import InquiryRequestModal from '../components/InquiryRequestModal';
import { api, ApiException } from '../services/api';
import { useApiQuery } from '../hooks/useApiQuery';
import { useAuth } from '../contexts/AuthContext';
import { companyNavLinks, individualNavLinks, vendorNavLinks, castNavLinks, locationNavLinks } from '../navigation/dashboardNav';
import { LOCATION_TYPE_LABELS } from '../constants/locationCategories';
import type { BookingWithDetails, SlotStatus } from '../types/availability';
import { parseAvailabilityMonthResponse } from '../utils/parseAvailabilityResponse';
import { formatPaise } from '../utils/currency';
import StarRating from '../components/StarRating';
import WorkShowcase, { type ShowcaseItem } from '../components/profile/WorkShowcase';
import CoverMedia, { type CoverType } from '../components/profile/CoverMedia';
import MediaLightbox, { type LightboxMedia } from '../components/MediaLightbox';

type UserRole = 'individual' | 'company' | 'vendor' | 'admin' | 'cast' | 'location';

interface VendorEquipment {
  id: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  currentCity?: string | null;
  dailyBudget?: number | null; // paise
  quantityTotal?: number | null;
  availabilities?: Array<{ locationCity?: string | null }>;
}

interface LocationProperty {
  id: string;
  name: string;
  description?: string | null;
  subTypes?: string[];
  city?: string | null;
  address?: string | null;
  addressLat?: number | null;
  addressLng?: number | null;
  dailyBudget?: number | null; // paise
  photoUrls?: string[];
  pdfUrl?: string | null;
  pdfName?: string | null;
}

interface PublicProfileResponse {
  id: string;
  role: UserRole;
  email?: string;
  phone?: string;
  profile: {
    displayName?: string;
    companyName?: string;
    bio?: string;
    aboutMe?: string;
    aboutUs?: string;
    coverPhotoUrl?: string;
    coverImageUrl?: string;
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
    // Location-specific
    propertyName?: string;
    locationType?: string;
    subTypes?: string[];
    address?: string;
    addressLat?: number | null;
    addressLng?: number | null;
    mapLink?: string | null;
    detailPdfUrl?: string | null;
    detailPdfName?: string | null;
    properties?: LocationProperty[];
  } | null;
}

interface ReviewItem {
  rating: number;
}

interface ReviewsResponse {
  items: ReviewItem[];
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
    // Keep consistency with self availability calendars:
    // if no explicit slot exists for the day, treat it as available.
    const st = slotMap[dateKey]?.status ?? 'available';
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
  const [avatarPreviewOpen, setAvatarPreviewOpen] = useState(false);
  const [coverPreviewOpen, setCoverPreviewOpen] = useState(false);
  // Per-property "Location Images" gallery — set to a property's photo URLs to
  // open the in-app grid; null = closed.
  const [galleryImages, setGalleryImages] = useState<{ title: string; urls: string[] } | null>(null);
  // In-app media viewer — images/PDFs open here instead of navigating the
  // browser to the raw signed storage URL.
  const [lightbox, setLightbox] = useState<LightboxMedia | null>(null);

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
  // Date-less inquiry mode — set when a company viewer clicks Chat on another
  // company's profile. Reuses InquiryRequestModal but skips date selection.
  const [inquiryWithoutDateOpen, setInquiryWithoutDateOpen] = useState(false);

  // Facebook-style profile tabs. Sits where the old "Reach out to..." card
  // used to live and toggles the content panel below. The third tab is role-
  // specific: 'showreel' for cast (Work Showcase) or individual (video) and
  // 'equipment' for vendors (their inventory is the main offering). Defaults
  // to About so the bio/details are visible on landing.
  type ProfileTab = 'schedule' | 'about' | 'showreel' | 'equipment' | 'properties';
  const [activeTab, setActiveTab] = useState<ProfileTab>('about');

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

  const { data: reviewsData } = useApiQuery<ReviewsResponse>(userId ? `/reviews/user/${userId}` : null);
  const reviewItems = reviewsData?.items ?? [];
  const avgRating = reviewItems.length
    ? Math.round((reviewItems.reduce((sum, review) => sum + review.rating, 0) / reviewItems.length) * 10) / 10
    : 0;

  useEffect(() => {
    if (!userId || !profile) return;
    const role = profile.role;
    if (role !== 'individual' && role !== 'vendor' && role !== 'location') {
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
  const isCompany = profile?.role === 'company';
  const isCast = profile?.role === 'cast';
  const isLocation = profile?.role === 'location';

  // Viewer-side context — controls which sections render.
  //
  // Spec 7.3 / 7.4: when a non-company user lands on a profile via the
  // simple Discover search they should only see basic info (name, location,
  // ratings, social links, showreel). No calendar, no rates, no booking
  // affordances. Spec 8 adds Chat + Book for company-viewing-company.
  // Cast targets are treated like Individuals — companies (especially Casting
  // Directors) see the calendar and booking affordances.
  const viewerIsCompany = viewer?.role === 'company' || viewer?.role === 'admin';
  // Location targets intentionally have NO calendar/Schedule tab for company
  // viewers — they only see About (+Reviews) and the Properties list.
  const showCalendarSection = viewerIsCompany && (isIndividual || isVendor || isCast);
  const showBookActions = viewerIsCompany; // booking available against any role

  // Default the open tab to Schedule when a calendar is shown (company viewing
  // a bookable target); otherwise fall back to About. Runs once per profile so
  // the user's manual tab switches aren't overridden. `didInitTab` resets when
  // the viewed profile changes.
  const didInitTab = useRef(false);
  useEffect(() => { didInitTab.current = false; }, [userId]);
  useEffect(() => {
    if (!profile || didInitTab.current) return;
    didInitTab.current = true;
    setActiveTab(showCalendarSection ? 'schedule' : 'about');
  }, [profile, showCalendarSection]);

  // Hero layout (all categories): social links pinned to the top-right, and the
  // Chat/Book actions moved to the BOTTOM of the hero card.
  const heroActionsAtBottom = true;
  const bookableTarget = isCompany || isCast || isVendor || isIndividual || isLocation;
  const navLinks = useMemo(() => {
    if (viewer?.role === 'vendor') return vendorNavLinks;
    if (viewer?.role === 'individual') return individualNavLinks;
    if (viewer?.role === 'cast') return castNavLinks;
    if (viewer?.role === 'location') return locationNavLinks;
    return companyNavLinks;
  }, [viewer?.role]);
  // Where the "Back" link should go — companies have the rich /search filter,
  // everyone else came from /discover.
  const backTo = viewer?.role === 'company' || viewer?.role === 'admin' ? '/search' : '/discover';
  const backLabel = backTo === '/search' ? 'Back to search' : 'Back to discover';

  const title = p?.displayName ?? p?.companyName ?? p?.propertyName ?? 'Profile';
  const castRoleType = isCast ? (p as { roleType?: string } | null)?.roleType ?? null : null;
  const primaryRole = isIndividual
    ? (p?.skills?.[0] ?? 'Individual')
    : isCast
      ? (castRoleType ? castRoleType.charAt(0).toUpperCase() + castRoleType.slice(1) : 'Cast')
      : isLocation
        ? (p?.locationType ? (LOCATION_TYPE_LABELS[p.locationType] ?? 'Location') : 'Location')
        : profile?.role
          ? profile.role.replace(/_/g, ' ')
          : '—';
  const genreLine = isIndividual
    ? (p?.genres?.length ? p.genres.join(', ') : p?.genre ?? '')
    : '';
  const coverPhotoUrl = (p as { coverPhotoUrl?: string; coverImageUrl?: string } | null)?.coverPhotoUrl
    ?? (p as { coverUrl?: string } | null)?.coverUrl
    ?? (p as { coverPhotoUrl?: string; coverImageUrl?: string } | null)?.coverImageUrl;
  const coverType: CoverType = (p as { coverType?: CoverType } | null)?.coverType ?? 'image';
  // A motion-banner (video) cover isn't opened in the image lightbox.
  const coverClickable = !!coverPhotoUrl && coverType !== 'video';
  // Resolve avatar URL across the various shapes the API may return
  // (individual = avatarUrl, company/vendor = logoUrl).
  const avatarUrl = (p as { avatarUrl?: string; logoUrl?: string } | null)?.avatarUrl
    ?? (p as { logoUrl?: string } | null)?.logoUrl;

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

  const socialPlatforms: Array<{ key: string; label: string; url: string | undefined; Icon: typeof FaGlobe; color: string; bg: string; border: string }> = [
    { key: 'website',   label: 'Website',     url: p?.website,      Icon: FaGlobe,      color: 'text-[#3678F1]', bg: 'bg-[#3678F1]/10', border: 'border-[#3678F1]/20' },
    { key: 'instagram', label: 'Instagram',   url: p?.instagramUrl, Icon: FaInstagram,  color: 'text-[#E4405F]', bg: 'bg-[#E4405F]/10', border: 'border-[#E4405F]/20' },
    { key: 'youtube',   label: 'YouTube',     url: p?.youtubeUrl,   Icon: FaYoutube,    color: 'text-[#FF0000]', bg: 'bg-[#FF0000]/10', border: 'border-[#FF0000]/20' },
    { key: 'vimeo',     label: 'Vimeo',       url: p?.vimeoUrl,     Icon: FaVimeoV,     color: 'text-[#1AB7EA]', bg: 'bg-[#1AB7EA]/10', border: 'border-[#1AB7EA]/20' },
    { key: 'imdb',      label: 'IMDb',        url: p?.imdbUrl,      Icon: FaImdb,       color: 'text-[#B58A00]', bg: 'bg-[#F5C518]/15', border: 'border-[#F5C518]/30' },
    { key: 'linkedin',  label: 'LinkedIn',    url: (p as { linkedinUrl?: string } | null)?.linkedinUrl, Icon: FaLinkedinIn, color: 'text-[#0A66C2]', bg: 'bg-[#0A66C2]/10', border: 'border-[#0A66C2]/20' },
    { key: 'twitter',   label: 'X (Twitter)', url: (p as { twitterUrl?: string } | null)?.twitterUrl,   Icon: FaXTwitter,   color: 'text-neutral-900', bg: 'bg-neutral-100', border: 'border-neutral-200' },
  ];
  // Show social links across all target roles (individual, vendor, cast, company)
  // — casting directors viewing cast and companies viewing companies were
  // previously missing this affordance. URL filtering handles missing entries.
  const visiblePlatforms = socialPlatforms.filter((pl) => !!pl.url);

  // Company-side mark-complete on a specific booking (today the visible
  // surface for the company→company hiring flow, but works for any booking
  // the viewing company is party to). Optimistically updates the date's
  // entry in profileBookingDetails so the modal reflects the new state
  // without waiting for the calendar refetch; on failure we roll the local
  // stamp back. On success we refetch the month so derived state stays in
  // sync with the server.
  const handleMarkBookingComplete = async (booking: BookingWithDetails) => {
    const stamped = new Date().toISOString();
    const matchKeys = Object.keys(profileBookingDetails).filter((k) => profileBookingDetails[k]?.id === booking.id);
    setProfileBookingDetails((prev) => {
      const next = { ...prev };
      for (const k of matchKeys) {
        if (next[k]) next[k] = { ...next[k], completedByRequesterAt: stamped };
      }
      return next;
    });
    try {
      await api.patch(`/bookings/${booking.id}/complete`, {});
      toast.success('Booking marked complete.');
    } catch (err) {
      setProfileBookingDetails((prev) => {
        const next = { ...prev };
        for (const k of matchKeys) {
          if (next[k]) next[k] = { ...next[k], completedByRequesterAt: null };
        }
        return next;
      });
      toast.error(err instanceof ApiException ? err.payload.message : 'Could not mark booking complete.');
      return;
    }
    if (userId && profile) {
      try {
        const res = await api.get<unknown>(`/availability/${userId}?year=${calYear}&month=${calMonth + 1}`);
        const parsed = parseAvailabilityMonthResponse(res);
        setProfileSlotMap(parsed.slots);
        setProfileBookingDetails(parsed.bookingDetails);
      } catch {
        // Non-fatal: optimistic state is already correct from the user's POV.
      }
    }
  };

  // Helper to check if a date has an existing confirmed booking
  const getDateBookingStatus = (dateKey: string): 'none' | 'pending' | 'accepted' | 'locked' | 'completed' => {
    const booking = profileBookingDetails[dateKey];
    if (!booking) return 'none';
    return booking.status as 'pending' | 'accepted' | 'locked' | 'completed';
  };

  // Handle Chat button click on a date
  const handleDateChatClick = (dateKey: string) => {
    const status = getDateBookingStatus(dateKey);
    // If there's already an accepted/locked booking, go directly to chat scoped to its project.
    // Always pass projectId — Chat.tsx uses it to upsert the project-scoped conversation.
    // Falling back to /chat/:userId alone resolves to the most-recent conversation across
    // projects (wrong thread when multiple projects exist between the same two users).
    if (status === 'accepted' || status === 'locked' || status === 'completed') {
      const booking = profileBookingDetails[dateKey];
      const projId = booking?.projectId;
      navigate(`/chat/${userId}${projId ? `?projectId=${encodeURIComponent(projId)}` : ''}`);
    } else {
      // No confirmed booking - open inquiry modal with pre-selected date
      setDetailDate(null);
      setSelectedChatDate(dateKey);
    }
  };

  // Handle starting inquiry chat after project selection
  const handleStartInquiryChat = async (projectId: string, location: string) => {
    if (!userId || !profile) return;
    if (!selectedChatDate && !inquiryWithoutDateOpen) return;

    try {
      // First, create or get conversation
      const conv = await api.post<{ id: string; participantA: string; participantB: string; projectId: string }>(
        `/conversations`,
        { projectId, otherUserId: userId }
      );

      // Format the inquiry message — include the shoot date sentence only
      // when a specific date was picked (crew/vendor flow). Company→company
      // inquiries skip the date since there's no calendar context.
      const projectName = activeProjects?.find((p: any) => p.id === projectId)?.title || 'a project';
      let inquiryMessage: string;
      if (selectedChatDate) {
        const shootDate = parseIso(selectedChatDate).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'long',
        });
        inquiryMessage = `Hi, hope you're doing well :)

We're working on ${projectName}. The shoot is planned for ${shootDate} at ${location}. Just wanted to check if you'd be interested in being a part of it?`;
      } else {
        inquiryMessage = `Hi, hope you're doing well :)

We're working on ${projectName}${location ? ` (${location})` : ''}. Just wanted to check if you'd be interested in collaborating with us on it?`;
      }

      // Send the inquiry message
      await api.post(`/conversations/${conv.id}/messages`, {
        type: 'text',
        content: inquiryMessage,
      });

      toast.success('Inquiry sent!');
      setSelectedChatDate(null);
      setInquiryWithoutDateOpen(false);

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
    const shouldLoad = selectedChatDate || inquiryWithoutDateOpen;
    if (shouldLoad && activeProjects.length === 0 && !projectsLoading) {
      setProjectsLoading(true);
      // Fetch BOTH owned projects and incoming-bookings projects so the
      // inquiry picker includes "projects I'm hired on" for casting
      // directors (and any other company that's a booking target). The web
      // BookingRequestModal merges these too — keep them in sync so an
      // inquiry and a booking offer the same set of projects.
      Promise.all([
        api.get<any>('/projects?limit=50').catch(() => null),
        api.get<any>('/bookings/incoming').catch(() => null),
      ])
        .then(([projectsRes, incomingRes]) => {
          const isActive = (p: any) => p.status === 'active' || p.status === 'open' || p.status === 'draft';
          const owned = (projectsRes?.items || projectsRes?.data || []).filter(isActive);
          const hired = (incomingRes?.items || [])
            .filter((b: any) => b.status === 'accepted' || b.status === 'locked')
            .map((b: any) => b.project)
            .filter((p: any) => p && isActive(p));
          // De-dupe by project id, owned first so user-created projects
          // appear at the top of the dropdown.
          const seen = new Set<string>();
          const merged: any[] = [];
          for (const p of [...owned, ...hired]) {
            if (!p?.id || seen.has(p.id)) continue;
            seen.add(p.id);
            merged.push(p);
          }
          setActiveProjects(merged);
        })
        .finally(() => setProjectsLoading(false));
    }
  }, [selectedChatDate, inquiryWithoutDateOpen]);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-neutral-50 dark:bg-bg min-w-0 w-full">
      <DashboardHeader />
      <div className="flex-1 flex min-h-0 overflow-hidden">
        <DashboardSidebar links={navLinks} />
        <main className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden relative">
          {/* Subtle background mesh — light mode only; dark mode stays clean */}
          <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-br from-[#3678F1]/5 via-[#DBEAFE]/30 to-transparent pointer-events-none dark:hidden" />
          <div className="flex-1 min-h-0 overflow-auto z-10">
            <div className="max-w-[1100px] mx-auto px-4 sm:px-6 md:px-8 lg:px-6 xl:px-8 py-4 sm:py-6">
              <div className="mb-4 flex items-center gap-3">
                <Link
                  to={backTo}
                  className="inline-flex items-center gap-1.5 text-xs text-neutral-600 hover:text-neutral-900"
                >
                  <FaArrowLeft className="w-3 h-3" />
                  {backLabel}
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
                  <motion.div variants={itemVariants} className="rounded-3xl bg-white shadow-soft border border-neutral-100 hover:border-[#3678F1] transition-colors duration-200 overflow-hidden">
                    <div
                      className={`relative h-56 sm:h-72 lg:h-80 border-b border-neutral-100 overflow-hidden bg-gradient-to-r from-[#3678F1]/15 via-[#7c96ff]/10 to-[#E8F0FE]/60 ${
                        coverClickable ? 'cursor-zoom-in group' : ''
                      }`}
                      onClick={() => coverClickable && setCoverPreviewOpen(true)}
                      role={coverClickable ? 'button' : undefined}
                      tabIndex={coverClickable ? 0 : undefined}
                      aria-label={coverClickable ? 'Open cover photo preview' : undefined}
                      onKeyDown={(e) => {
                        if (!coverClickable) return;
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setCoverPreviewOpen(true);
                        }
                      }}
                    >
                      {coverPhotoUrl ? <CoverMedia url={coverPhotoUrl} type={coverType} /> : null}
                      {/* Soft fade at the bottom of the cover so the transition
                          into the white content area is gradual and the
                          avatar's drop-shadow has something to land on. */}
                      <div
                        aria-hidden
                        className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-white/70 pointer-events-none"
                      />
                    </div>

                    <div className="p-5 sm:p-7 lg:p-8">
                      <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr_auto] gap-5 lg:gap-7 items-start">
                        {/* Avatar overlaps the cover (LinkedIn pattern). Negative
                            margin scales with the taller cover so roughly half
                            of the circle sits on the image and half over the
                            content — keeps a clear focal point regardless of
                            breakpoint. */}
                        <div
                          className={`flex-shrink-0 -mt-20 sm:-mt-24 ${
                            avatarUrl ? 'cursor-zoom-in' : ''
                          }`}
                          onClick={() => avatarUrl && setAvatarPreviewOpen(true)}
                          role={avatarUrl ? 'button' : undefined}
                          tabIndex={avatarUrl ? 0 : undefined}
                          aria-label={avatarUrl ? 'Open profile photo preview' : undefined}
                          onKeyDown={(e) => {
                            if (!avatarUrl) return;
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              setAvatarPreviewOpen(true);
                            }
                          }}
                        >
                          <div className="p-[3px] rounded-full bg-gradient-to-br from-[#3678F1] via-[#2563EB] to-[#1D4ED8] shadow-xl inline-block relative z-10">
                            <div className="p-[3px] rounded-full bg-white">
                              <Avatar src={avatarUrl} name={title} size="xl" />
                            </div>
                          </div>
                        </div>

                        <div className="min-w-0 lg:pt-1">
                          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900">{title}</h1>
                          <p className="text-xs uppercase tracking-[0.15em] font-semibold text-[#3678F1] mt-1">
                            {primaryRole}
                          </p>
                          {!!genreLine && (
                            <p className="text-sm text-neutral-600 mt-2.5">
                              {genreLine}
                            </p>
                          )}
                          {(p.locationCity || p.locationState) && (
                            <p className="text-sm text-neutral-600 flex items-center gap-1.5 mt-2">
                              <FaLocationDot className="w-3.5 h-3.5 text-neutral-400" />
                              {[p.locationCity, p.locationState].filter(Boolean).join(', ')}
                            </p>
                          )}
                          {/* Map pin — company & vendor pin link (location has
                              its own Map Pin row inside Location Details). */}
                          {(isCompany || isVendor) && p.mapLink && (
                            <p className="text-sm flex items-center gap-1.5 mt-2">
                              <FaLocationDot className="w-3.5 h-3.5 text-neutral-400" />
                              <a href={p.mapLink} target="_blank" rel="noreferrer" className="text-[#3678F1] hover:underline">
                                Open in Google Maps
                              </a>
                            </p>
                          )}
                          {isIndividual && p.dailyBudget != null && (
                            <div className="inline-block mt-3 bg-[#E8F0FE] border border-[#3678F1]/20 text-[#3678F1] px-3 py-1.5 rounded-lg">
                              <p className="text-sm font-bold">
                                {formatRate(p.dailyBudget)}
                              </p>
                            </div>
                          )}
                          {profile?.phone && (
                            <p className="text-sm text-neutral-600 flex items-center gap-1.5 mt-2">
                              <FaPhone className="w-3.5 h-3.5 text-neutral-400" />
                              {profile.phone}
                            </p>
                          )}
                          {profile?.email && (
                            <p className="text-sm text-neutral-600 flex items-center gap-1.5 mt-2 break-all">
                              <FaEnvelope className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                              <a
                                href={`mailto:${profile.email}`}
                                className="hover:text-[#3678F1] hover:underline"
                              >
                                {profile.email}
                              </a>
                            </p>
                          )}
                          {isIndividual && p.skills && p.skills.length > 1 ? (
                            <div className="flex flex-wrap gap-1.5 mt-3">
                              {p.skills.slice(1).map((s) => (
                                <span key={s} className="px-2.5 py-1 bg-neutral-100 text-neutral-700 text-xs font-medium rounded-md border border-neutral-200">
                                  {s}
                                </span>
                              ))}
                            </div>
                          ) : null}
                        </div>

                        {/* Third grid track — primary Chat + Book actions on top,
                            social links below. Floats top-right on lg+; wraps
                            inline with the meta block on smaller screens. The
                            Chat + Book pair previously lived in a standalone
                            "Reach out to…" card below the hero; moved here so
                            casting directors, companies, and crews hit the
                            primary actions immediately without scrolling.
                            Shown for every bookable target (company/cast/
                            vendor); individuals also get it so company viewers
                            can fire off a quick inquiry from the top. */}
                        {(visiblePlatforms.length > 0 || (showBookActions && bookableTarget)) && (
                          <div className="flex flex-col gap-3 lg:items-end lg:pt-1">
                            {/* Social links — pinned to the top of the track. For
                                cast & location the Chat/Book pair drops to the
                                bottom of the hero card, so social sits alone here. */}
                            {visiblePlatforms.length > 0 && (
                              <div className="flex items-center gap-2.5 flex-wrap lg:justify-end">
                                {visiblePlatforms.map(({ key, label, url, Icon, color, bg, border }) => (
                                  <a
                                    key={key}
                                    href={url}
                                    target="_blank"
                                    rel="noreferrer"
                                    aria-label={label}
                                    title={label}
                                    className={`w-9 h-9 rounded-full border ${border} ${bg} hover:border-[#3678F1] transition-colors flex items-center justify-center`}
                                  >
                                    <Icon className={`w-4 h-4 ${color}`} />
                                  </a>
                                ))}
                              </div>
                            )}
                            {/* Chat + Book — top-right for company/vendor/individual;
                                cast & location render these at the bottom instead. */}
                            {showBookActions && bookableTarget && !heroActionsAtBottom && (
                              <div className="flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() => { setSelectedChatDate(null); setInquiryWithoutDateOpen(true); }}
                                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-neutral-200 bg-white text-sm font-semibold text-neutral-800 hover:border-[#3678F1] hover:text-[#3678F1] transition-colors shadow-sm"
                                >
                                  <FaMessage className="w-3.5 h-3.5" /> Chat
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setIsBookingModalOpen(true)}
                                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#3678F1] text-sm font-semibold text-white hover:bg-[#2563EB] transition-colors shadow-sm"
                                >
                                  <FaCalendarCheck className="w-3.5 h-3.5" /> Book
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Bottom action bar — Chat + Book for cast & location. */}
                      {showBookActions && bookableTarget && heroActionsAtBottom && (
                        <div className="mt-5 pt-4 border-t border-neutral-100 flex flex-wrap gap-2 sm:justify-end">
                          <button
                            type="button"
                            onClick={() => { setSelectedChatDate(null); setInquiryWithoutDateOpen(true); }}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-neutral-200 bg-white text-sm font-semibold text-neutral-800 hover:border-[#3678F1] hover:text-[#3678F1] transition-colors shadow-sm"
                          >
                            <FaMessage className="w-3.5 h-3.5" /> Chat
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsBookingModalOpen(true)}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#3678F1] text-sm font-semibold text-white hover:bg-[#2563EB] transition-colors shadow-sm"
                          >
                            <FaCalendarCheck className="w-3.5 h-3.5" /> Book
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>

                  {/* Profile tabs (Schedule / About / Showreel) — Facebook-style
                      strip that swaps the content panel below. The available
                      tabs depend on target role: Schedule only renders when a
                      calendar exists (cast/individual/vendor) and the viewer
                      is a company/admin; Showreel renders for cast (Work
                      Showcase) or individuals with an uploaded showreel.
                      Falls back to inline About when fewer than two tabs would
                      be visible (company-target). */}
                  {(() => {
                    const showreelUrl = (p as { showreelUrl?: string | null } | null)?.showreelUrl ?? null;
                    const hasShowcase = (p as { showcaseItems?: ShowcaseItem[] } | null)?.showcaseItems?.length ?? 0;
                    const equipmentCount = p?.equipment?.length ?? 0;
                    const propertyCount = p?.properties?.length ?? 0;
                    const tabs: { key: ProfileTab; label: string; Icon: typeof FaCalendarDays }[] = [];
                    if (showCalendarSection) tabs.push({ key: 'schedule', label: 'Schedule', Icon: FaCalendarDays });
                    tabs.push({ key: 'about', label: 'About', Icon: FaCircleInfo });
                    // The role-specific tabs (showreel / equipment / properties)
                    // and detail sections are COMPANY-ONLY. Other viewers who
                    // reach a profile via name search see just About + Reviews
                    // plus location & social links.
                    if (viewerIsCompany && ((isCast && hasShowcase > 0) || (isIndividual && showreelUrl))) {
                      tabs.push({ key: 'showreel', label: 'Showreel', Icon: FaFilm });
                    }
                    if (viewerIsCompany && isVendor) tabs.push({ key: 'equipment', label: `Equipment${equipmentCount ? ` (${equipmentCount})` : ''}`, Icon: FaVideo });
                    if (viewerIsCompany && isLocation) tabs.push({ key: 'properties', label: `Properties${propertyCount ? ` (${propertyCount})` : ''}`, Icon: FaLocationDot });
                    if (tabs.length < 2) return null;
                    // If the current tab isn't in the available set, fall back to About.
                    const safeActive = tabs.some((t) => t.key === activeTab) ? activeTab : 'about';
                    return (
                      <motion.div variants={itemVariants} className="rounded-2xl bg-white shadow-soft border border-neutral-100 px-2 sm:px-3 py-1.5">
                        <div className="flex items-center gap-1 overflow-x-auto">
                          {tabs.map(({ key, label, Icon }) => {
                            const active = safeActive === key;
                            return (
                              <button
                                key={key}
                                type="button"
                                onClick={() => setActiveTab(key)}
                                aria-pressed={active}
                                className={`relative inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl transition-colors whitespace-nowrap ${
                                  active
                                    ? 'text-[#3678F1]'
                                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
                                }`}
                              >
                                <Icon className="w-3.5 h-3.5" />
                                {label}
                                {active && (
                                  <span className="absolute left-3 right-3 -bottom-1 h-0.5 rounded-full bg-[#3678F1]" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>
                    );
                  })()}

                  {activeTab === 'about' && ((isIndividual && (p.bio || p.aboutMe)) || (isCompany && (p.bio || p.aboutUs)) || (isVendor && p.aboutUs) || (isCast && ((p as { aboutMe?: string | null }).aboutMe || p.bio)) || (isLocation && (p.aboutUs || p.bio))) && (
                    <motion.div variants={itemVariants} className="rounded-3xl bg-white shadow-soft border border-neutral-100 hover:border-[#3678F1] transition-colors duration-200 p-6 sm:p-8">
                      <h2 className="text-base font-bold text-neutral-900 mb-4 flex items-center gap-2">
                        <span className="w-1 h-5 rounded-full bg-[#3678F1]" /> About
                      </h2>
                      <p className="text-sm text-neutral-600 leading-relaxed whitespace-pre-wrap">
                        {isIndividual
                          ? (p.aboutMe || p.bio)
                          : isVendor
                            ? (p.aboutUs || '—')
                            : isCast
                              ? ((p as { aboutMe?: string | null }).aboutMe || p.bio || '—')
                              : (p.aboutUs || p.bio)}
                      </p>
                    </motion.div>
                  )}

                  {/* Location Details — type, sub-types, Google map pin, and the
                      profile-level detailed PDF. Always shown in the About tab
                      for location targets. */}
                  {viewerIsCompany && activeTab === 'about' && isLocation && (
                    <motion.div variants={itemVariants} className="rounded-3xl bg-white shadow-soft border border-neutral-100 hover:border-[#3678F1] transition-colors duration-200 p-6 sm:p-8">
                      <h2 className="text-base font-bold text-neutral-900 mb-4 flex items-center gap-2">
                        <span className="w-1 h-5 rounded-full bg-[#0F766E]" /> Location Details
                      </h2>
                      <dl className="space-y-3 text-sm">
                        <div>
                          <dt className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-1">Location Type</dt>
                          <dd className="text-neutral-800">{p.locationType ? (LOCATION_TYPE_LABELS[p.locationType] ?? p.locationType) : '—'}</dd>
                        </div>
                        <div>
                          <dt className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-1.5">Sub-Types</dt>
                          {(p.subTypes?.length ?? 0) > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {p.subTypes!.map((s) => (
                                <span key={s} className="px-2.5 py-1 bg-[#E0F2F1] text-[#0F766E] text-xs font-semibold rounded-md border border-[#0F766E]/20">{s}</span>
                              ))}
                            </div>
                          ) : <dd className="text-neutral-800">—</dd>}
                        </div>
                        {p.address && (
                          <div>
                            <dt className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-1">Address</dt>
                            <dd className="text-neutral-800">{p.address}</dd>
                          </div>
                        )}
                        {(p.mapLink || (p.addressLat != null && p.addressLng != null)) && (
                          <div>
                            <dt className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-1">Map Pin</dt>
                            <dd>
                              <a href={p.mapLink || `https://www.google.com/maps/search/?api=1&query=${p.addressLat},${p.addressLng}`} target="_blank" rel="noreferrer" className="text-[#0F766E] hover:underline inline-flex items-center gap-1.5">
                                <FaLocationDot className="w-3.5 h-3.5" /> Open in Google Maps
                              </a>
                            </dd>
                          </div>
                        )}
                        {p.detailPdfUrl && (
                          <div>
                            <dt className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-1">Detailed PDF</dt>
                            <dd>
                              <button type="button" onClick={() => setLightbox({ url: p.detailPdfUrl!, type: 'document', title: p.detailPdfName || 'Detailed PDF' })} className="text-[#0F766E] hover:underline inline-flex items-center gap-1.5">
                                <FaFilePdf className="w-3.5 h-3.5 text-[#DC2626]" /> {p.detailPdfName || 'View PDF'}
                              </button>
                            </dd>
                          </div>
                        )}
                      </dl>
                    </motion.div>
                  )}

                  {/* Cast-specific physical / look details — only renders for
                      cast profiles. Mirrors the Personal Details section of
                      the cast's own profile so casting directors see the same
                      filterable attributes when picking talent. */}
                  {viewerIsCompany && activeTab === 'about' && isCast && (
                    <motion.div variants={itemVariants} className="rounded-3xl bg-white shadow-soft border border-neutral-100 hover:border-[#3678F1] transition-colors duration-200 p-6 sm:p-8">
                      <h2 className="text-base font-bold text-neutral-900 mb-4 flex items-center gap-2">
                        <span className="w-1 h-5 rounded-full bg-[#9333EA]" /> Cast Details
                      </h2>
                      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                        {(() => {
                          const cp = p as unknown as {
                            age?: number | null; gender?: string | null; heightCm?: number | null;
                            bodyType?: string | null; skinTone?: string | null; eyeColor?: string | null;
                            lookType?: string | null; hairType?: string | null; languages?: string[] | null;
                            extraSkills?: string[] | null; dailyBudget?: number | null;
                          };
                          const rows: Array<[string, React.ReactNode]> = [
                            ['Age', cp?.age ?? '—'],
                            ['Gender', cp?.gender ?? '—'],
                            ['Height', cp?.heightCm != null ? `${Math.floor((cp.heightCm / 2.54) / 12)}'${Math.round((cp.heightCm / 2.54) % 12)}" (${cp.heightCm} cm)` : '—'],
                            ['Body Type', cp?.bodyType ?? '—'],
                            ['Skin Tone', cp?.skinTone ?? '—'],
                            ['Eye Color', cp?.eyeColor ?? '—'],
                            ['Look Type', cp?.lookType ?? '—'],
                            ['Hair Type', cp?.hairType ?? '—'],
                            ['Languages', cp?.languages?.length ? cp.languages.join(', ') : '—'],
                            ['Extra Skills', cp?.extraSkills?.length ? cp.extraSkills.join(', ') : '—'],
                            ['Daily Rate', cp?.dailyBudget != null ? formatPaise(cp.dailyBudget) + ' /day' : '—'],
                          ];
                          return rows.map(([label, value]) => (
                            <div key={label} className="flex items-start gap-3 py-1.5">
                              <dt className="text-xs font-semibold text-neutral-400 uppercase tracking-wide w-28 shrink-0">{label}</dt>
                              <dd className="text-sm text-neutral-800 break-words">{value}</dd>
                            </div>
                          ));
                        })()}
                      </dl>
                    </motion.div>
                  )}

                  {/* Cast Work Showcase — photos / videos / documents the cast
                      member uploaded. Lives in the Showreel tab. */}
                  {viewerIsCompany && activeTab === 'showreel' && isCast && ((p as { showcaseItems?: ShowcaseItem[] }).showcaseItems?.length ?? 0) > 0 && (
                    <motion.div variants={itemVariants} className="rounded-3xl bg-white shadow-soft border border-neutral-100 hover:border-[#3678F1] transition-colors duration-200 p-6 sm:p-8">
                      <h2 className="text-base font-bold text-neutral-900 mb-4 flex items-center gap-2">
                        <span className="w-1 h-5 rounded-full bg-[#9333EA]" /> Work Showcase
                      </h2>
                      <WorkShowcase items={(p as { showcaseItems?: ShowcaseItem[] }).showcaseItems ?? []} />
                    </motion.div>
                  )}

                  {/* Individual showreel — a single uploaded video. Rendered in
                      the Showreel tab; vendors and companies have no showreel
                      so this is gated to isIndividual. */}
                  {viewerIsCompany && activeTab === 'showreel' && isIndividual && (p as { showreelUrl?: string | null } | null)?.showreelUrl && (
                    <motion.div variants={itemVariants} className="rounded-3xl bg-white shadow-soft border border-neutral-100 hover:border-[#3678F1] transition-colors duration-200 p-6 sm:p-8">
                      <h2 className="text-base font-bold text-neutral-900 mb-4 flex items-center gap-2">
                        <span className="w-1 h-5 rounded-full bg-[#3678F1]" /> Showreel
                      </h2>
                      <video
                        src={(p as { showreelUrl?: string | null }).showreelUrl ?? undefined}
                        controls
                        playsInline
                        className="w-full rounded-xl border border-neutral-200 bg-black"
                      />
                    </motion.div>
                  )}

                  {activeTab === 'schedule' && showCalendarSection && (
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
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FCA5A5] border border-[#DC2626] px-2.5 py-1 text-[11px] font-extrabold text-[#7F1D1D] shadow-sm dark:bg-[#EF4444]/25 dark:border-[#F87171] dark:text-[#FCA5A5]">
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
                            <span className="w-3 h-3 rounded-sm bg-[#FCA5A5] border border-[#DC2626] dark:bg-[#EF4444]/30 dark:border-[#F87171]" />
                            Unavailable
                          </div>
                        </div>
                      </>
                    )}
                  </motion.div>
                  </>
                  )}

                  {/* Calendar date-detail modal — kept outside the tab gating
                      so the modal can stay mounted across tab switches and so
                      the parent fragment matches a single React subtree. */}
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
                    onMarkBookingComplete={handleMarkBookingComplete}
                    onBookCrewClick={() => {
                      setDetailDate(null);
                      setIsBookingModalOpen(true);
                    }}
                  />

                  {/* Vendor details (type, GST) — lives in the About tab next
                      to the bio. Equipment moved out into its own tab below
                      since the catalog is the vendor's primary offering. */}
                  {viewerIsCompany && activeTab === 'about' && isVendor && (
                    <motion.div variants={itemVariants} className="rounded-3xl bg-white shadow-soft border border-neutral-100 hover:border-[#3678F1] transition-colors duration-200 p-6 sm:p-8">
                      <h2 className="text-base font-bold text-neutral-900 mb-5 flex items-center gap-2">
                        <span className="w-1 h-5 rounded-full bg-[#3678F1]" /> Vendor details
                      </h2>
                      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm text-neutral-700">
                        <div>
                          <dt className="text-xs text-neutral-500 mb-0.5 uppercase tracking-wide font-semibold">Type</dt>
                          <dd>{p.vendorType ?? '—'}</dd>
                        </div>
                        <div>
                          <dt className="text-xs text-neutral-500 mb-0.5 uppercase tracking-wide font-semibold">GST Number</dt>
                          <dd>{p.gstNumber ?? '—'}</dd>
                        </div>
                      </dl>
                    </motion.div>
                  )}

                  {/* Equipment tab — vendor inventory grid. Each card shows
                      thumbnail (when uploaded), name, description, daily rate,
                      city, and quantity available. Falls back to an empty
                      state when the vendor hasn't listed any kit yet. */}
                  {viewerIsCompany && activeTab === 'equipment' && isVendor && (
                    <motion.div variants={itemVariants} className="rounded-3xl bg-white shadow-soft border border-neutral-100 hover:border-[#3678F1] transition-colors duration-200 p-6 sm:p-8">
                      <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
                        <h2 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                          <span className="w-1 h-5 rounded-full bg-[#3678F1]" />
                          Equipment Catalog
                          {p.equipment && p.equipment.length > 0 && (
                            <span className="text-xs font-semibold text-neutral-400 ml-1">
                              ({p.equipment.length} item{p.equipment.length === 1 ? '' : 's'})
                            </span>
                          )}
                        </h2>
                      </div>
                      {p.equipment && p.equipment.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {p.equipment.map((eq) => {
                            const city = eq.currentCity || eq.availabilities?.[0]?.locationCity || null;
                            const rateLabel = eq.dailyBudget != null ? `${formatPaise(eq.dailyBudget)} /day` : null;
                            return (
                              <div
                                key={eq.id}
                                className="flex gap-3 p-3 rounded-2xl border border-neutral-200 hover:border-[#3678F1] hover:shadow-sm transition-all bg-white"
                              >
                                <div className="w-20 h-20 sm:w-24 sm:h-24 shrink-0 rounded-xl overflow-hidden bg-gradient-to-br from-[#E8F0FE] to-[#DBEAFE] border border-neutral-100 flex items-center justify-center">
                                  {eq.imageUrl ? (
                                    <img
                                      src={eq.imageUrl}
                                      alt={eq.name}
                                      className="w-full h-full object-cover"
                                      loading="lazy"
                                    />
                                  ) : (
                                    <FaVideo className="w-7 h-7 text-[#3678F1]/60" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="text-sm font-bold text-neutral-900 truncate">{eq.name}</h3>
                                  {eq.description && (
                                    <p className="text-xs text-neutral-600 mt-0.5 line-clamp-2">{eq.description}</p>
                                  )}
                                  <div className="flex flex-wrap items-center gap-2 mt-2">
                                    {rateLabel && (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#E8F0FE] text-[#1D4ED8] text-[11px] font-bold border border-[#3678F1]/20">
                                        {rateLabel}
                                      </span>
                                    )}
                                    {city && (
                                      <span className="inline-flex items-center gap-1 text-[11px] text-neutral-500 font-medium">
                                        <FaLocationDot className="w-2.5 h-2.5" />
                                        {city}
                                      </span>
                                    )}
                                    {eq.quantityTotal != null && eq.quantityTotal > 1 && (
                                      <span className="text-[11px] text-neutral-500 font-medium">
                                        × {eq.quantityTotal}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2 py-10 text-center">
                          <div className="w-12 h-12 rounded-2xl bg-neutral-50 border border-neutral-200 flex items-center justify-center">
                            <FaVideo className="w-5 h-5 text-neutral-400" />
                          </div>
                          <p className="text-sm font-semibold text-neutral-700">No equipment listed yet</p>
                          <p className="text-xs text-neutral-500 max-w-xs">
                            This vendor hasn't published any inventory. Use Chat to ask what they have available.
                          </p>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* Properties tab — location listings grid. Shows photo,
                      sub-types, daily price, city, and a PDF link per property.
                      Falls back to an empty state when none are listed yet. */}
                  {viewerIsCompany && activeTab === 'properties' && isLocation && (
                    <motion.div variants={itemVariants} className="rounded-3xl bg-white shadow-soft border border-neutral-100 hover:border-[#0F766E] transition-colors duration-200 p-6 sm:p-8">
                      <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
                        <h2 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                          <span className="w-1 h-5 rounded-full bg-[#0F766E]" />
                          Properties &amp; Set-ups
                          {(p.properties?.length ?? 0) > 0 && (
                            <span className="text-xs font-semibold text-neutral-400 ml-1">
                              ({p.properties!.length} listing{p.properties!.length === 1 ? '' : 's'})
                            </span>
                          )}
                        </h2>
                      </div>
                      {p.properties && p.properties.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {p.properties.map((pr) => {
                            const photo = pr.photoUrls?.[0];
                            const rateLabel = pr.dailyBudget != null ? `${formatPaise(pr.dailyBudget)} /day` : null;
                            return (
                              <div key={pr.id} className="rounded-2xl border border-neutral-200 hover:border-[#0F766E] hover:shadow-sm transition-all bg-white overflow-hidden">
                                <button
                                  type="button"
                                  onClick={() => photo && setLightbox({ url: photo, type: 'image', title: pr.name })}
                                  className={`w-full h-36 bg-gradient-to-br from-[#E0F2F1] to-[#CCFBF1] flex items-center justify-center overflow-hidden ${photo ? 'cursor-zoom-in' : ''}`}
                                >
                                  {photo ? (
                                    <img src={photo} alt={pr.name} className="w-full h-full object-cover" loading="lazy" />
                                  ) : (
                                    <FaLocationDot className="w-8 h-8 text-[#0F766E]/50" />
                                  )}
                                </button>
                                <div className="p-3 flex items-start justify-between gap-3">
                                  {/* Left — property details */}
                                  <div className="min-w-0 flex-1">
                                    <h3 className="text-sm font-bold text-neutral-900 truncate">{pr.name}</h3>
                                    {pr.description && <p className="text-xs text-neutral-600 mt-0.5 line-clamp-2">{pr.description}</p>}
                                    {(pr.subTypes?.length ?? 0) > 0 && (
                                      <div className="flex flex-wrap gap-1 mt-2">
                                        {pr.subTypes!.slice(0, 3).map((s) => (
                                          <span key={s} className="px-2 py-0.5 bg-[#E0F2F1] text-[#0F766E] text-[10px] font-semibold rounded border border-[#0F766E]/20">{s}</span>
                                        ))}
                                      </div>
                                    )}
                                    {rateLabel && (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 mt-2 rounded-md bg-[#E0F2F1] text-[#0F766E] text-[11px] font-bold border border-[#0F766E]/20">{rateLabel}</span>
                                    )}
                                  </div>
                                  {/* Right — Location Images / Location PDF for this property. */}
                                  <div className="flex flex-col gap-1.5 shrink-0 items-stretch">
                                    {(pr.photoUrls?.length ?? 0) > 0 && (
                                      <button
                                        type="button"
                                        onClick={() => setGalleryImages({ title: pr.name, urls: pr.photoUrls ?? [] })}
                                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-white text-[11px] font-semibold text-neutral-700 hover:border-[#0F766E] hover:text-[#0F766E] transition-colors whitespace-nowrap"
                                      >
                                        <FaImages className="w-3 h-3" /> Location Images
                                      </button>
                                    )}
                                    {pr.pdfUrl && (
                                      <button
                                        type="button"
                                        onClick={() => setLightbox({ url: pr.pdfUrl!, type: 'document', title: pr.pdfName || pr.name })}
                                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-white text-[11px] font-semibold text-neutral-700 hover:border-[#0F766E] hover:text-[#0F766E] transition-colors whitespace-nowrap"
                                      >
                                        <FaFilePdf className="w-3 h-3 text-[#DC2626]" /> Location PDF
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2 py-10 text-center">
                          <div className="w-12 h-12 rounded-2xl bg-neutral-50 border border-neutral-200 flex items-center justify-center">
                            <FaLocationDot className="w-5 h-5 text-neutral-400" />
                          </div>
                          <p className="text-sm font-semibold text-neutral-700">No properties listed yet</p>
                          <p className="text-xs text-neutral-500 max-w-xs">
                            This provider hasn't published any properties. Use Chat to ask what's available.
                          </p>
                        </div>
                      )}
                    </motion.div>
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
                  {/* Average-rating summary — moved out of the hero card so it
                      reads as a proper headline for the reviews section. The
                      two-column layout (large numeric average | stars + meta)
                      is the standard pattern users recognize from app stores
                      and marketplace listings. */}
                  {reviewItems.length > 0 && (
                    <div className="rounded-2xl bg-white shadow-soft border border-neutral-100 p-5 sm:p-6 flex items-center gap-5 sm:gap-6">
                      <div className="flex flex-col items-center justify-center pr-5 sm:pr-6 border-r border-neutral-100 min-w-[88px]">
                        <span className="text-4xl sm:text-5xl font-extrabold text-neutral-900 tabular-nums leading-none">
                          {avgRating.toFixed(1)}
                        </span>
                        <span className="mt-1.5 text-[10px] uppercase tracking-widest font-bold text-neutral-400">
                          out of 5
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <StarRating rating={Math.round(avgRating * 2) / 2} size="md" />
                          <span className="text-xs font-semibold text-neutral-500">
                            {reviewItems.length} review{reviewItems.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-500 mt-2 leading-relaxed">
                          Based on feedback from companies that have worked with {title}.
                        </p>
                      </div>
                    </div>
                  )}
                  {viewer?.role === 'company' && (isIndividual || isVendor || isLocation) && (
                    <LeaveReviewSection
                      targetUserId={profile.id}
                      targetName={title}
                      onSubmitted={() => setReviewsRefreshKey((k) => k + 1)}
                    />
                  )}
                  <ReviewsList userId={profile.id} refreshKey={reviewsRefreshKey} showAverageHeader={false} />
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
          // Role label is per-target-type. The previous fallback always read
          // `vendorType ?? 'Vendor'` in the non-individual branch, which made
          // company→company bookings show the target labeled as "Vendor".
          userRole={
            isIndividual
              ? (p?.skills?.[0] ?? 'Individual')
              : isVendor
                ? (p?.vendorType ?? 'Vendor')
                : isCompany
                  ? 'Production House'
                  : isCast
                    ? (castRoleType ? castRoleType.charAt(0).toUpperCase() + castRoleType.slice(1) : 'Cast')
                    : isLocation
                      ? (p?.locationType ? (LOCATION_TYPE_LABELS[p.locationType] ?? 'Location') : 'Location')
                      : '—'
          }
          userRate={(isIndividual || isCast) && p?.dailyBudget ? formatPaise(p.dailyBudget) + ' /day' : '—'}
          targetUserId={profile.id}
          isVendor={isVendor}
          isLocation={isLocation}
          onSuccess={() => setIsBookingModalOpen(false)}
        />
      )}

      {/* Inquiry Request Modal (for chat before booking).
          Two entry points share this modal:
            1. Crew/vendor flow — selectedChatDate is a date string (from the
               calendar date-detail modal).
            2. Company→company flow — inquiryWithoutDateOpen is true and there
               is no selected date; the modal hides its date row. */}
      {(selectedChatDate || inquiryWithoutDateOpen) && (
        <InquiryRequestModal
          isOpen={!!selectedChatDate || inquiryWithoutDateOpen}
          onClose={() => {
            setSelectedChatDate(null);
            setInquiryWithoutDateOpen(false);
          }}
          targetUserId={userId!}
          targetName={title}
          selectedDate={selectedChatDate}
          projects={activeProjects}
          projectsLoading={projectsLoading}
          onSendInquiry={handleStartInquiryChat}
        />
      )}

      {/* Avatar / Cover lightbox previews (read-only — no upload action). */}
      <ImagePreviewModal
        open={avatarPreviewOpen}
        onClose={() => setAvatarPreviewOpen(false)}
        imageUrl={avatarUrl ?? null}
        title={`${title} — Profile Photo`}
        shape="circle"
      />
      <ImagePreviewModal
        open={coverPreviewOpen}
        onClose={() => setCoverPreviewOpen(false)}
        imageUrl={coverPhotoUrl ?? null}
        title={`${title} — Cover Photo`}
        shape="rect"
      />

      {/* Per-property "Location Images" gallery — opens from a property card,
          shows that property's photos. Click a thumbnail to enlarge in-app. */}
      {galleryImages && (
        <div
          className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setGalleryImages(null)}
        >
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[88vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="px-5 py-3.5 border-b border-neutral-100 flex items-center justify-between shrink-0">
              <h2 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                <FaImages className="w-4 h-4 text-[#0F766E]" /> {galleryImages.title} — Images
                <span className="text-xs font-semibold text-neutral-400">({galleryImages.urls.length})</span>
              </h2>
              <button type="button" onClick={() => setGalleryImages(null)} className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-500 hover:bg-neutral-200 transition-colors" aria-label="Close">
                <FaXmark className="text-sm" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-3">
              {galleryImages.urls.map((url, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setLightbox({ url, type: 'image', title: `${galleryImages.title} — Image ${i + 1}` })}
                  className="block rounded-xl overflow-hidden border border-neutral-200 hover:border-[#0F766E] transition-colors aspect-[4/3] bg-neutral-100 cursor-zoom-in"
                >
                  <img src={url} alt={`${galleryImages.title} ${i + 1}`} className="w-full h-full object-cover" loading="lazy" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* In-app media viewer for images & PDFs (keeps the raw signed storage
          URL out of the address bar). */}
      <MediaLightbox media={lightbox} onClose={() => setLightbox(null)} />
    </div>
  );
}
