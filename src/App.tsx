import { lazy, Suspense, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth, type BackendRole } from './contexts/AuthContext';
import { useRole, type UserRole } from './contexts/RoleContext';
import { ChatUnreadProvider } from './contexts/ChatUnreadContext';

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
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
      <p className="text-neutral-600">Loading…</p>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ChatUnreadProvider>
        <ScrollToTop />
        <Toaster position="top-center" toastOptions={{ duration: 4000 }} />
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
          <Route path="/dashboard/projects" element={<ProtectedRoute allowedRoles={['company', 'admin']}><Projects /></ProtectedRoute>} />
          <Route path="/dashboard/projects/:id" element={<ProtectedRoute><ProjectDetail /></ProtectedRoute>} />
          <Route path="/dashboard/company-availability" element={<ProtectedRoute allowedRoles={['company', 'admin']}><CompanyAvailability /></ProtectedRoute>} />
          <Route path="/dashboard/projects/new" element={<ProtectedRoute allowedRoles={['company', 'admin']}><CreateProject /></ProtectedRoute>} />
          <Route path="/dashboard/projects/:id/edit" element={<ProtectedRoute allowedRoles={['company', 'admin']}><EditProject /></ProtectedRoute>} />
          <Route path="/dashboard/search" element={<ProtectedRoute allowedRoles={['company', 'admin']}><SearchFilter /></ProtectedRoute>} />
          <Route path="/dashboard/profile/:userId" element={<ProtectedRoute allowedRoles={['company', 'admin']}><OtherUserProfile /></ProtectedRoute>} />

          {/* Shared routes */}
          <Route path="/dashboard/chat/:userId" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
          <Route path="/dashboard/conversations" element={<ProtectedRoute><Conversations /></ProtectedRoute>} />
          <Route path="/dashboard/invoices" element={<ProtectedRoute><InvoicesList /></ProtectedRoute>} />
          <Route path="/dashboard/invoice/new" element={<ProtectedRoute allowedRoles={['individual', 'vendor']}><CreateInvoice /></ProtectedRoute>} />
          <Route path="/dashboard/invoice/:invoiceId" element={<ProtectedRoute><Invoice /></ProtectedRoute>} />
          <Route path="/dashboard/bookings" element={<ProtectedRoute allowedRoles={['individual', 'vendor']}><Bookings /></ProtectedRoute>} />
          <Route path="/dashboard/project-details" element={<ProtectedRoute allowedRoles={['individual', 'vendor']}><ProjectDetails /></ProtectedRoute>} />
          <Route path="/dashboard/ongoing-projects" element={<ProtectedRoute allowedRoles={['individual', 'vendor']}><OngoingProjects /></ProtectedRoute>} />
          <Route path="/dashboard/team" element={<ProtectedRoute allowedRoles={['company', 'admin']}><TeamPage /></ProtectedRoute>} />

          {/* Reports */}
          <Route path="/dashboard/earnings" element={<ProtectedRoute allowedRoles={['individual', 'vendor']}><EarningsDashboard /></ProtectedRoute>} />
          <Route path="/dashboard/spending" element={<ProtectedRoute allowedRoles={['company', 'admin']}><SpendingDashboard /></ProtectedRoute>} />

          {/* Individual routes */}
          <Route path="/dashboard/availability" element={<ProtectedRoute allowedRoles={['individual']}><IndividualAvailability /></ProtectedRoute>} />
          <Route path="/dashboard/past-projects" element={<ProtectedRoute allowedRoles={['individual']}><IndividualPastProjects /></ProtectedRoute>} />
          <Route path="/dashboard/profile" element={<ProtectedRoute allowedRoles={['individual']}><IndividualProfile /></ProtectedRoute>} />

          {/* Vendor routes */}
          <Route path="/dashboard/equipment" element={<ProtectedRoute allowedRoles={['vendor']}><VendorEquipment /></ProtectedRoute>} />
          <Route path="/dashboard/vendor-availability" element={<ProtectedRoute allowedRoles={['vendor']}><VendorAvailability /></ProtectedRoute>} />
          <Route path="/dashboard/past-rentals" element={<ProtectedRoute allowedRoles={['vendor']}><VendorPastRentals /></ProtectedRoute>} />
          <Route path="/dashboard/vendor-profile" element={<ProtectedRoute allowedRoles={['vendor']}><VendorProfile /></ProtectedRoute>} />

          {/* Company extended routes */}
          <Route path="/dashboard/company-past-projects" element={<ProtectedRoute allowedRoles={['company', 'admin']}><CompanyPastProjects /></ProtectedRoute>} />
          <Route path="/dashboard/company-profile" element={<ProtectedRoute allowedRoles={['company', 'admin']}><CompanyProfile /></ProtectedRoute>} />
          <Route path="/dashboard/cancel-requests" element={<ProtectedRoute allowedRoles={['company', 'admin']}><CancelRequests /></ProtectedRoute>} />

          {/* Admin routes */}
          <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['admin']}><AdminUsers /></ProtectedRoute>} />
          <Route path="/admin/projects" element={<ProtectedRoute allowedRoles={['admin']}><AdminProjects /></ProtectedRoute>} />
          <Route path="/admin/invoices" element={<ProtectedRoute allowedRoles={['admin']}><AdminInvoices /></ProtectedRoute>} />
          </Routes>
        </Suspense>
      </ChatUnreadProvider>
    </BrowserRouter>
  );
}
