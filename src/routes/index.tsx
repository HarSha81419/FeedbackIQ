import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AuthLayout } from '@/layouts/AuthLayout';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { LoginPage } from '@/pages/auth/LoginPage';
import { SignupPage } from '@/pages/auth/SignupPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { FeedbackExplorerPage } from '@/pages/FeedbackExplorerPage';
import { Customer360Page } from '@/pages/Customer360Page';
import { InsightsPage } from '@/pages/InsightsPage';
import { AlertsPage } from '@/pages/AlertsPage';
import { AdminPage } from '@/pages/AdminPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />,
  },
  {
    element: <AuthLayout />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/signup', element: <SignupPage /> },
    ],
  },
  {
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: '/dashboard', element: <DashboardPage /> },
      { path: '/feedback', element: <FeedbackExplorerPage /> },
      { path: '/customers', element: <Customer360Page /> },
      { path: '/insights', element: <InsightsPage /> },
      { path: '/alerts', element: <AlertsPage /> },
      { path: '/admin', element: <AdminPage /> },
    ],
  },
  { path: '*', element: <Navigate to="/dashboard" replace /> },
]);
