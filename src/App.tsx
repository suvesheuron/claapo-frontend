import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

const LandingPage = lazy(() => import('./pages/LandingPage'));
const UserTypeSelect = lazy(() => import('./pages/UserTypeSelect'));
const Login = lazy(() => import('./pages/Login'));
const CompanyRegistration = lazy(() => import('./pages/CompanyRegistration'));
const RegisterPlaceholder = lazy(() => import('./pages/RegisterPlaceholder'));
const CompanyDashboard = lazy(() => import('./pages/CompanyDashboard'));
const CreateProject = lazy(() => import('./pages/CreateProject'));
const SearchFilter = lazy(() => import('./pages/SearchFilter'));

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
          <Route path="/register/individual" element={<RegisterPlaceholder />} />
          <Route path="/register/vendor" element={<RegisterPlaceholder />} />
          <Route path="/dashboard" element={<CompanyDashboard />} />
          <Route path="/dashboard/projects" element={<CompanyDashboard />} />
          <Route path="/dashboard/projects/new" element={<CreateProject />} />
          <Route path="/dashboard/search" element={<SearchFilter />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
