import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import RoleSwitcher from './components/RoleSwitcher';

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
const Invoice = lazy(() => import('./pages/Invoice'));

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
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<UserTypeSelect />} />
          <Route path="/register/company" element={<CompanyRegistration />} />
          <Route path="/register/individual" element={<IndividualRegistration />} />
          <Route path="/register/vendor" element={<VendorRegistration />} />
          <Route path="/dashboard" element={<><Dashboard /><RoleSwitcher /></>} />
          <Route path="/dashboard/projects" element={<><Projects /><RoleSwitcher /></>} />
          <Route path="/dashboard/projects/:id" element={<><ProjectDetail /><RoleSwitcher /></>} />
          <Route path="/dashboard/company-availability" element={<><CompanyAvailability /><RoleSwitcher /></>} />
          <Route path="/dashboard/projects/new" element={<CreateProject />} />
          <Route path="/dashboard/search" element={<SearchFilter />} />
          
          {/* Shared routes */}
          <Route path="/dashboard/chat/:userId" element={<><Chat /><RoleSwitcher /></>} />
          <Route path="/dashboard/invoice/:invoiceId" element={<><Invoice /><RoleSwitcher /></>} />
          
          {/* Individual routes */}
          <Route path="/dashboard/availability" element={<><IndividualAvailability /><RoleSwitcher /></>} />
          <Route path="/dashboard/past-projects" element={<><IndividualPastProjects /><RoleSwitcher /></>} />
          <Route path="/dashboard/profile" element={<><IndividualProfile /><RoleSwitcher /></>} />
          
          {/* Vendor routes */}
          <Route path="/dashboard/equipment" element={<><VendorEquipment /><RoleSwitcher /></>} />
          <Route path="/dashboard/vendor-availability" element={<><VendorAvailability /><RoleSwitcher /></>} />
          <Route path="/dashboard/past-rentals" element={<><VendorPastRentals /><RoleSwitcher /></>} />
          <Route path="/dashboard/vendor-profile" element={<><VendorProfile /><RoleSwitcher /></>} />

          {/* Company extended routes */}
          <Route path="/dashboard/company-past-projects" element={<><CompanyPastProjects /><RoleSwitcher /></>} />
          <Route path="/dashboard/company-profile" element={<><CompanyProfile /><RoleSwitcher /></>} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
