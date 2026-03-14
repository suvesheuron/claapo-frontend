import { lazy, Suspense, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
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
const SearchFilter = lazy(() => import('./pages/SearchFilter'));

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

// Company cancel requests
const CancelRequests = lazy(() => import('./pages/company/CancelRequests'));

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
        <Toaster position="top-center" toastOptions={{ duration: 4000 }} />
        {/* Syncs auth role into RoleContext — must be inside BrowserRouter + both providers */}
        <AuthRoleSyncBridge />
        <Suspense fallback={<PageFallback />}>
          <Routes>
          <Route path="/" element={<LandingPage />} />
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
          <Route path="/dashboard/search" element={<ProtectedRoute allowedRoles={['company', 'admin']}><SearchFilter /></ProtectedRoute>} />

          {/* Shared routes */}
          <Route path="/dashboard/chat/:userId" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
          <Route path="/dashboard/conversations" element={<ProtectedRoute><Conversations /></ProtectedRoute>} />
          <Route path="/dashboard/invoices" element={<ProtectedRoute><InvoicesList /></ProtectedRoute>} />
          <Route path="/dashboard/invoice/new" element={<ProtectedRoute allowedRoles={['individual', 'vendor']}><CreateInvoice /></ProtectedRoute>} />
          <Route path="/dashboard/invoice/:invoiceId" element={<ProtectedRoute><Invoice /></ProtectedRoute>} />
          <Route path="/dashboard/bookings" element={<ProtectedRoute allowedRoles={['individual', 'vendor']}><Bookings /></ProtectedRoute>} />
          <Route path="/dashboard/ongoing-projects" element={<ProtectedRoute allowedRoles={['individual', 'vendor']}><OngoingProjects /></ProtectedRoute>} />
          <Route path="/dashboard/team" element={<ProtectedRoute allowedRoles={['company', 'admin']}><TeamPage /></ProtectedRoute>} />

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
          </Routes>
        </Suspense>
      </ChatUnreadProvider>
    </BrowserRouter>
  );
}
