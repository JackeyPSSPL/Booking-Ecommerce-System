import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { useAuthStore } from '../store/auth.store';

const LoginPage        = lazy(() => import('../features/auth/login-page'));
const RegisterPage     = lazy(() => import('../features/auth/register-page'));
const OtpPage          = lazy(() => import('../features/auth/otp-page'));
const SearchPage       = lazy(() => import('../features/search/search-page'));
const PropertyDetail   = lazy(() => import('../features/property/property-detail-page'));
const GuestDetailsPage = lazy(() => import('../features/checkout/guest-details-page'));
const PaymentPage      = lazy(() => import('../features/checkout/payment-page'));
const ConfirmationPage = lazy(() => import('../features/checkout/confirmation-page'));
const TripsPage        = lazy(() => import('../features/trips/trips-page'));
const TripDetailPage   = lazy(() => import('../features/trips/trip-detail-page'));

const PartnerDashboard    = lazy(() => import('../features/partner/dashboard/partner-dashboard-page'));
const PartnerOnboarding   = lazy(() => import('../features/partner/onboarding/partner-onboarding-page'));
const PartnerBookings     = lazy(() => import('../features/partner/bookings/partner-bookings-page'));
const PartnerAvailability = lazy(() => import('../features/partner/availability/partner-availability-page'));
const PartnerEarnings     = lazy(() => import('../features/partner/earnings/partner-earnings-page'));
const PartnerPropertyEdit = lazy(() => import('../features/partner/edit/partner-property-edit-page'));

const AdminDashboard   = lazy(() => import('../features/admin/dashboard/admin-dashboard-page'));
const AdminUsers       = lazy(() => import('../features/admin/users/admin-users-page'));
const AdminProperties  = lazy(() => import('../features/admin/properties/admin-properties-page'));
const AdminBookings    = lazy(() => import('../features/admin/bookings/admin-bookings-page'));

function HomeRoute(): React.ReactElement {
  const { user } = useAuthStore();
  if (user?.role === 'PARTNER') return <Navigate to="/partner/dashboard" replace />;
  if (user?.role === 'ADMIN')   return <Navigate to="/admin/dashboard"   replace />;
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center text-gray-400">Loading…</div>}>
      <SearchPage />
    </Suspense>
  );
}

function ProtectedRoute({ children, role }: { children: React.ReactNode; role?: string }): React.ReactElement {
  const { user, accessToken } = useAuthStore();
  if (!accessToken) return <Navigate to="/login" replace />;
  if (role && user?.role !== role) return <Navigate to="/" replace />;
  return <>{children}</>;
}

const router = createBrowserRouter([
  { path: '/', element: <HomeRoute /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  { path: '/verify-otp', element: <OtpPage /> },
  { path: '/property/:id', element: <PropertyDetail /> },
  {
    path: '/checkout/details',
    element: <ProtectedRoute><GuestDetailsPage /></ProtectedRoute>,
  },
  {
    path: '/checkout/payment',
    element: <ProtectedRoute><PaymentPage /></ProtectedRoute>,
  },
  {
    path: '/booking/confirmation/:bookingId',
    element: <ProtectedRoute><ConfirmationPage /></ProtectedRoute>,
  },
  {
    path: '/trips',
    element: <ProtectedRoute><TripsPage /></ProtectedRoute>,
  },
  {
    path: '/trips/:bookingId',
    element: <ProtectedRoute><TripDetailPage /></ProtectedRoute>,
  },
  {
    path: '/partner/dashboard',
    element: <ProtectedRoute role="PARTNER"><PartnerDashboard /></ProtectedRoute>,
  },
  {
    path: '/partner/onboarding',
    element: <ProtectedRoute role="PARTNER"><PartnerOnboarding /></ProtectedRoute>,
  },
  {
    path: '/partner/bookings',
    element: <ProtectedRoute role="PARTNER"><PartnerBookings /></ProtectedRoute>,
  },
  {
    path: '/partner/properties/:id/availability',
    element: <ProtectedRoute role="PARTNER"><PartnerAvailability /></ProtectedRoute>,
  },
  {
    path: '/partner/properties/:id/edit',
    element: <ProtectedRoute role="PARTNER"><PartnerPropertyEdit /></ProtectedRoute>,
  },
  {
    path: '/partner/earnings',
    element: <ProtectedRoute role="PARTNER"><PartnerEarnings /></ProtectedRoute>,
  },
  {
    path: '/admin/dashboard',
    element: <ProtectedRoute role="ADMIN"><AdminDashboard /></ProtectedRoute>,
  },
  {
    path: '/admin/users',
    element: <ProtectedRoute role="ADMIN"><AdminUsers /></ProtectedRoute>,
  },
  {
    path: '/admin/properties',
    element: <ProtectedRoute role="ADMIN"><AdminProperties /></ProtectedRoute>,
  },
  {
    path: '/admin/bookings',
    element: <ProtectedRoute role="ADMIN"><AdminBookings /></ProtectedRoute>,
  },
]);

export function AppRouter(): React.ReactElement {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center text-gray-400">Loading…</div>}>
      <RouterProvider router={router} />
    </Suspense>
  );
}
