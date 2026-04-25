import { lazy, Suspense, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth, type BackendRole } from './contexts/AuthContext';
import { useRole, type UserRole } from './contexts/RoleContext';
import { useTheme } from './contexts/ThemeContext';
import { ChatUnreadProvider } from './contexts/ChatUnreadContext';
import { NavBadgesProvider } from './contexts/NavBadgesContext';
import { SidebarProvider } from './contexts/SidebarContext';

const LandingPage = lazy(() => import('./pages/LandingPage'));
const UserTypeSelect = lazy(() => import('./pages/UserTypeSelect'));
const Login = lazy(() => import('./pages/Login'));
const CompanyRegistration = lazy(() => import('./pages/CompanyRegistration'));
const IndividualRegistration = lazy(() => import('./pages/IndividualRegistration'));
const VendorRegistration = lazy(() => import('./pages/VendorRegistration'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const CreateProject = lazy(() => import('./pages/CreateProject'));
const EditProject = lazy(() => import('./pages/EditProject'));
const SearchFilter = lazy(() => import('./pages/SearchFilter'));
const OtherUserProfile = lazy(() => import('./pages/OtherUserProfile'));

// Individual routes
const IndividualAvailability = lazy(() => import('./pages/individual/Availability'));
const IndividualPastProjects = lazy(() => import('./pages/individual/PastProjects'));
const IndividualProfile = lazy(() => import('./pages/individual/Profile'));

// Vendor routes
const VendorEquipment = lazy(() => import('./pages/vendor/Equipment'));
const VendorAvailability = lazy(() => import('./pages/vendor/Availability'));
const VendorPastRentals = lazy(() => import('./pages/vendor/PastRentals'));

// Company routes
const Projects = lazy(() => import('./pages/company/Projects'));
const ProjectDetail = lazy(() => import('./pages/company/ProjectDetail'));
const CompanyAvailability = lazy(() => import('./pages/company/Availability'));
const CompanyPastProjects = lazy(() => import('./pages/company/PastProjects'));
const CompanyProfile = lazy(() => import('./pages/company/Profile'));

// Vendor additional routes
const VendorProfile = lazy(() => import('./pages/vendor/Profile'));

// Shared routes
const Chat = lazy(() => import('./pages/Chat'));
const Conversations = lazy(() => import('./pages/Conversations'));
const Invoice = lazy(() => import('./pages/Invoice'));
const Bookings = lazy(() => import('./pages/Bookings'));
const OtpVerify = lazy(() => import('./pages/OtpVerify'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));

// Team management
const TeamPage = lazy(() => import('./pages/company/Team'));

// Invoice pages
const InvoicesList = lazy(() => import('./pages/InvoicesList'));
const CreateInvoice = lazy(() => import('./pages/CreateInvoice'));

// Ongoing projects (individual + vendor)
const OngoingProjects = lazy(() => import('./pages/OngoingProjects'));

// Project Details (merged ongoing + past)
const ProjectDetails = lazy(() => import('./pages/ProjectDetails'));

// Company cancel requests
const CancelRequests = lazy(() => import('./pages/company/CancelRequests'));

// Admin pages
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const AdminProjects = lazy(() => import('./pages/admin/AdminProjects'));
const AdminInvoices = lazy(() => import('./pages/admin/AdminInvoices'));

// Reports pages
const EarningsDashboard = lazy(() => import('./pages/reports/EarningsDashboard'));
const SpendingDashboard = lazy(() => import('./pages/reports/SpendingDashboard'));

// Public pages
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));
const Privacy = lazy(() => import('./pages/Privacy'));
const Terms = lazy(() => import('./pages/Terms'));

/**
 * Syncs the authenticated user's backend role ('individual' | 'company' | 'vendor')
 * into the existing RoleContext ('Individual' | 'Company' | 'Vendor').
 * This keeps all existing components that call useRole() working without changes.
 */
const ROLE_MAP: Record<BackendRole, UserRole> = {
  individual: 'Individual',
  company: 'Company',
  vendor: 'Vendor',
  admin: 'Company', // admin uses the company dashboard view
};

function AuthRoleSyncBridge() {
  const { user } = useAuth();
  const { setCurrentRole } = useRole();

  useEffect(() => {
    if (user?.role) {
      setCurrentRole(ROLE_MAP[user.role]);
    }
  }, [user?.role, setCurrentRole]);

  return null;
}

/** Scrolls to top on every route change — fixes footer link navigation issue */
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function PageFallback() {
  return (
    <div className="min-h-screen bg-[#F3F4F6] dark:bg-[#0A0E17] flex flex-col items-center justify-center gap-4">
      <span className="w-10 h-10 border-[2.5px] border-[#3678F1]/15 border-t-[#3678F1] border-r-[#3678F1] rounded-full animate-spin" />
      <p className="text-sm text-neutral-500 dark:text-neutral-400 font-medium">Loading…</p>
    </div>
  );
}

/**
 * Wrapper that prevents subusers from accessing the CreateProject page.
 * Subusers have mainUserId set (pointing to their parent company).
 */
function SubuserRestrictedCreateProject() {
  const { user } = useAuth();
  const isSubuser = user?.mainUserId != null;

  if (isSubuser) {
    // Redirect subusers to the projects list page
    return <Navigate to="/projects" replace />;
  }

  return <CreateProject />;
}

/**
 * Catches legacy `/dashboard/<sub>` URLs (bookmarks, in-flight links, external
 * shares) and 301s them to the new flat path. The exact `/dashboard` route is
 * matched first by the router's specificity ranking and renders the dashboard.
 */
function LegacyDashboardRedirect() {
  const location = useLocation();
  const sub = location.pathname.replace(/^\/dashboard\/?/, '');
  const to = sub ? `/${sub}${location.search}${location.hash}` : '/dashboard';
  return <Navigate to={to} replace />;
}

function ThemedToaster() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  return (
    <Toaster
      position="top-center"
      toastOptions={{
        duration: 4000,
        style: {
          background: isDark ? '#141A28' : '#ffffff',
          color: isDark ? '#E5E7EB' : '#0f172a',
          border: `1px solid ${isDark ? '#1F2940' : '#E5E7EB'}`,
        },
      }}
    />
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ChatUnreadProvider>
        <NavBadgesProvider>
        <SidebarProvider>
        <ScrollToTop />
        <ThemedToaster />
        <AuthRoleSyncBridge />
        <Suspense fallback={<PageFallback />}>
          <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/otp-verify" element={<OtpVerify />} />
          <Route path="/register" element={<UserTypeSelect />} />
          <Route path="/register/company" element={<CompanyRegistration />} />
          <Route path="/register/individual" element={<IndividualRegistration />} />
          <Route path="/register/vendor" element={<VendorRegistration />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/projects" element={<ProtectedRoute allowedRoles={['company', 'admin']}><Projects /></ProtectedRoute>} />
          <Route path="/projects/:id" element={<ProtectedRoute><ProjectDetail /></ProtectedRoute>} />
          <Route path="/company-availability" element={<ProtectedRoute allowedRoles={['company', 'admin']}><CompanyAvailability /></ProtectedRoute>} />
          <Route path="/projects/new" element={<ProtectedRoute allowedRoles={['company', 'admin']}>
            <SubuserRestrictedCreateProject />
          </ProtectedRoute>} />
          <Route path="/projects/:id/edit" element={<ProtectedRoute allowedRoles={['company', 'admin']}><EditProject /></ProtectedRoute>} />
          <Route path="/search" element={<ProtectedRoute allowedRoles={['company', 'admin']}><SearchFilter /></ProtectedRoute>} />
          <Route path="/profile/:userId" element={<ProtectedRoute allowedRoles={['company', 'admin']}><OtherUserProfile /></ProtectedRoute>} />

          {/* Shared routes */}
          <Route path="/chat/:userId" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
          <Route path="/conversations" element={<ProtectedRoute><Conversations /></ProtectedRoute>} />
          <Route path="/conversations/:projectId" element={<ProtectedRoute><Conversations /></ProtectedRoute>} />
          <Route path="/invoices" element={<ProtectedRoute><InvoicesList /></ProtectedRoute>} />
          <Route path="/invoices/:projectId" element={<ProtectedRoute><InvoicesList /></ProtectedRoute>} />
          <Route path="/invoice/new" element={<ProtectedRoute allowedRoles={['individual', 'vendor']}><CreateInvoice /></ProtectedRoute>} />
          <Route path="/invoice/:invoiceId" element={<ProtectedRoute><Invoice /></ProtectedRoute>} />
          <Route path="/bookings" element={<ProtectedRoute allowedRoles={['individual', 'vendor']}><Bookings /></ProtectedRoute>} />
          <Route path="/project-details" element={<ProtectedRoute allowedRoles={['individual', 'vendor']}><ProjectDetails /></ProtectedRoute>} />
          <Route path="/ongoing-projects" element={<ProtectedRoute allowedRoles={['individual', 'vendor']}><OngoingProjects /></ProtectedRoute>} />
          <Route path="/team" element={<ProtectedRoute allowedRoles={['company', 'vendor', 'admin']}><TeamPage /></ProtectedRoute>} />

          {/* Reports */}
          <Route path="/earnings" element={<ProtectedRoute allowedRoles={['individual', 'vendor']}><EarningsDashboard /></ProtectedRoute>} />
          <Route path="/spending" element={<ProtectedRoute allowedRoles={['company', 'admin']}><SpendingDashboard /></ProtectedRoute>} />

          {/* Individual routes */}
          <Route path="/availability" element={<ProtectedRoute allowedRoles={['individual']}><IndividualAvailability /></ProtectedRoute>} />
          <Route path="/past-projects" element={<ProtectedRoute allowedRoles={['individual']}><IndividualPastProjects /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute allowedRoles={['individual']}><IndividualProfile /></ProtectedRoute>} />

          {/* Vendor routes */}
          <Route path="/equipment" element={<ProtectedRoute allowedRoles={['vendor']}><VendorEquipment /></ProtectedRoute>} />
          <Route path="/vendor-availability" element={<ProtectedRoute allowedRoles={['vendor']}><VendorAvailability /></ProtectedRoute>} />
          <Route path="/past-rentals" element={<ProtectedRoute allowedRoles={['vendor']}><VendorPastRentals /></ProtectedRoute>} />
          <Route path="/vendor-profile" element={<ProtectedRoute allowedRoles={['vendor']}><VendorProfile /></ProtectedRoute>} />

          {/* Company extended routes */}
          <Route path="/company-past-projects" element={<ProtectedRoute allowedRoles={['company', 'admin']}><CompanyPastProjects /></ProtectedRoute>} />
          <Route path="/company-profile" element={<ProtectedRoute allowedRoles={['company', 'admin']}><CompanyProfile /></ProtectedRoute>} />
          <Route path="/cancel-requests" element={<ProtectedRoute allowedRoles={['company', 'admin']}><CancelRequests /></ProtectedRoute>} />

          {/* Admin routes */}
          <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['admin']}><AdminUsers /></ProtectedRoute>} />
          <Route path="/admin/projects" element={<ProtectedRoute allowedRoles={['admin']}><AdminProjects /></ProtectedRoute>} />
          <Route path="/admin/invoices" element={<ProtectedRoute allowedRoles={['admin']}><AdminInvoices /></ProtectedRoute>} />

          {/* Legacy redirect — old /dashboard/<sub> URLs → flat /<sub> */}
          <Route path="/dashboard/*" element={<LegacyDashboardRedirect />} />
          </Routes>
        </Suspense>
        </SidebarProvider>
        </NavBadgesProvider>
      </ChatUnreadProvider>
    </BrowserRouter>
  );
}
