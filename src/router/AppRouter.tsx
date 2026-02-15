import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useAdminAuthStore } from '@/store/adminAuthStore';
import { MainLayout } from '@/components/layout/MainLayout';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { UserRole } from '@/types';

// Pages
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { AdminLoginPage } from '@/pages/admin/AdminLoginPage';
import { AdminUsersPage } from '@/pages/admin/AdminUsersPage';
import { AdminKycReviewPage } from '@/pages/admin/AdminKycReviewPage';
import { AdminRolesPage } from '@/pages/admin/AdminRolesPage';
import { AdminAccountStatusPage } from '@/pages/admin/AdminAccountStatusPage';
import { AdminTestToolsPage } from '@/pages/admin/AdminTestToolsPage';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { WalletPage } from '@/pages/wallet/WalletPage';
import { InvestmentsPage } from '@/pages/investment/InvestmentsPage';
import { SellPage } from '@/pages/investment/SellPage';
import { PortfolioPage } from '@/pages/portfolio/PortfolioPage';
import { GoalsPage } from '@/pages/goals/GoalsPage';
import { SipsPage } from '@/pages/sip/SipsPage';
import { SchemesPage } from '@/pages/schemes/SchemesPage';
import { PlanDetailPage } from '@/pages/schemes/PlanDetailPage';
import { PlanInvestPage } from '@/pages/schemes/PlanInvestPage';
import { ProfilePage } from '@/pages/profile/ProfilePage';
import { RiskProfilePage } from '@/pages/profile/RiskProfilePage';
import { FamilyPage } from '@/pages/family/FamilyPage';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <MainLayout>{children}</MainLayout>;
};

const AdminProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAdminAuthenticated, isLoading, admin } = useAdminAuthStore();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAdminAuthenticated || admin?.role !== UserRole.ADMIN) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
};

const LegacyPlanDetailRedirect = () => {
  const { planId } = useParams();
  return <Navigate to={`/mutual-fund-schemes/plans/${planId}`} replace />;
};

const LegacyPlanInvestRedirect = () => {
  const { planId } = useParams();
  return <Navigate to={`/mutual-fund-schemes/plans/${planId}/invest`} replace />;
};

export const AppRouter = () => {
  const { isAuthenticated, isLoading } = useAuthStore();
  const {
    isAdminAuthenticated,
    isLoading: isAdminLoading,
    admin,
  } = useAdminAuthStore();

  if (isLoading || isAdminLoading) {
    return <LoadingSpinner />;
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route
          path="/login"
          element={
            isAdminAuthenticated ? (
              <Navigate to="/admin/users" />
            ) : isAuthenticated ? (
              <Navigate to="/dashboard" />
            ) : (
              <LoginPage />
            )
          }
        />
        <Route
          path="/register"
          element={
            isAdminAuthenticated ? (
              <Navigate to="/admin/users" />
            ) : isAuthenticated ? (
              <Navigate to="/dashboard" />
            ) : (
              <RegisterPage />
            )
          }
        />
        <Route
          path="/admin/login"
          element={
            isAdminAuthenticated && admin?.role === UserRole.ADMIN ? (
              <Navigate to="/admin/users" />
            ) : (
              <AdminLoginPage />
            )
          }
        />

        {/* Protected routes */}
        <Route
          path="/admin"
          element={<Navigate to="/admin/users" replace />}
        />
        <Route
          path="/admin/users"
          element={
            <AdminProtectedRoute>
              <AdminUsersPage />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/kyc-review"
          element={
            <AdminProtectedRoute>
              <AdminKycReviewPage />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/roles"
          element={
            <AdminProtectedRoute>
              <AdminRolesPage />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/account-status"
          element={
            <AdminProtectedRoute>
              <AdminAccountStatusPage />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/test-tools"
          element={
            <AdminProtectedRoute>
              <AdminTestToolsPage />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/wallet"
          element={
            <ProtectedRoute>
              <WalletPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/order-history"
          element={
            <ProtectedRoute>
              <InvestmentsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/sell"
          element={
            <ProtectedRoute>
              <SellPage />
            </ProtectedRoute>
          }
        />
        <Route path="/investments" element={<Navigate to="/order-history" replace />} />
        <Route
          path="/family-portfolio"
          element={
            <ProtectedRoute>
              <PortfolioPage />
            </ProtectedRoute>
          }
        />
        <Route path="/portfolio" element={<Navigate to="/family-portfolio" replace />} />
        <Route
          path="/goals"
          element={
            <ProtectedRoute>
              <GoalsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/sips"
          element={
            <ProtectedRoute>
              <SipsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mutual-fund-schemes"
          element={
            <ProtectedRoute>
              <SchemesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mutual-fund-schemes/plans/:planId"
          element={
            <ProtectedRoute>
              <PlanDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mutual-fund-schemes/plans/:planId/invest"
          element={
            <ProtectedRoute>
              <PlanInvestPage />
            </ProtectedRoute>
          }
        />
        <Route path="/schemes" element={<Navigate to="/mutual-fund-schemes" replace />} />
        <Route path="/schemes/plans/:planId" element={<LegacyPlanDetailRedirect />} />
        <Route path="/schemes/plans/:planId/invest" element={<LegacyPlanInvestRedirect />} />
        <Route
          path="/family"
          element={
            <ProtectedRoute>
              <FamilyPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile/risk-profile"
          element={
            <ProtectedRoute>
              <RiskProfilePage />
            </ProtectedRoute>
          }
        />

        {/* Default redirect */}
        <Route
          path="/"
          element={<Navigate to={isAdminAuthenticated ? '/admin/users' : '/dashboard'} replace />}
        />
        <Route
          path="*"
          element={<Navigate to={isAdminAuthenticated ? '/admin/users' : '/dashboard'} replace />}
        />
      </Routes>
    </BrowserRouter>
  );
};
