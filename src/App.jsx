import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { canAccessModule } from '@/utils/modulePermissions'
import { useAuthStore } from '@/store/authStore'
import AuthLayout from '@/layouts/AuthLayout'
import DashboardLayout from '@/layouts/DashboardLayout'
import AdminLayout from '@/layouts/AdminLayout'
import Login from '@/pages/auth/Login'
import Register from '@/pages/auth/Register'
import ForgotPassword from '@/pages/auth/ForgotPassword'
import ResetPassword from '@/pages/auth/ResetPassword'
import VerifyEmail from '@/pages/auth/VerifyEmail'
import TenantSetupWizard from '@/pages/onboarding/TenantSetupWizard'
import Dashboard from '@/pages/dashboard/Dashboard'
import TeamManagement from '@/pages/team/TeamManagement'
import TeamMemberDetailPage from '@/pages/team/TeamMemberDetailPage'
import AdminDashboard from '@/pages/admin/AdminDashboard'
import UsersManagement from '@/pages/admin/UsersManagement'
import UserDetails from '@/pages/admin/UserDetails'
import PacksManagement from '@/pages/admin/PacksManagement'
import PackDetails from '@/pages/admin/PackDetails'

import ProductsPage from '@/pages/products/ProductsPage'
import CategoriesPage from '@/pages/products/CategoriesPage'
import ProductDetailPage from '@/pages/products/ProductDetailPage'
import CustomersPage from '@/pages/customers/CustomersPage'
import CustomerDetailPage from '@/pages/customers/CustomerDetailPage'
import SuppliersPage from '@/pages/suppliers/SuppliersPage'
import SettingsPage from '@/pages/settings/SettingsPage'
import SupplierDetailPage from '@/pages/suppliers/SupplierDetailPage'
import PurchaseOrdersPage from '@/pages/suppliers/PurchaseOrdersPage'
import PurchaseOrderDetailPage from '@/pages/suppliers/PurchaseOrderDetailPage'
import ExpensesPage from '@/pages/expenses/ExpensesPage'
import POSPage from '@/pages/pos/POSPage'
import OrdersPage from '@/pages/orders/OrdersPage'
import ReportsPage from '@/pages/reports/ReportsPage'
import BomsPage from '@/pages/production/BomsPage'
import BomFormPage from '@/pages/production/BomFormPage'
import BomDetailPage from '@/pages/production/BomDetailPage'
import ProductionsPage from '@/pages/production/ProductionsPage'
import ProductionNewPage from '@/pages/production/ProductionNewPage'
import ProductionDetailsPage from '@/pages/production/ProductionDetailsPage'
import MaterialsPage from '@/pages/production/MaterialsPage'

// ── Loading screen ────────────────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 rounded-full border-2 border-primary-100 border-t-primary-500 animate-spin" />
        <p className="text-muted-500 text-sm font-sans">Chargement…</p>
      </div>
    </div>
  )
}

// ── Redirection intelligente après login ──────────────────────────────────────
function DefaultRedirect() {
  const { user, role } = useAuthStore()
  if (role === 'super_admin') return <Navigate to="/admin/dashboard" replace />
  if (!user?.tenant_id)       return <Navigate to="/onboarding" replace />
  return <Navigate to="/dashboard" replace />
}

// ── Garde : doit être authentifié ─────────────────────────────────────────────
function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuthStore()
  if (isLoading)       return <LoadingScreen />
  if (!isAuthenticated) return <Navigate to="/auth/login" replace />
  return children
}

// ── Garde : doit être super_admin ─────────────────────────────────────────────
function SuperAdminRoute({ children }) {
  const { role, isLoading } = useAuthStore()
  if (isLoading)             return <LoadingScreen />
  if (role !== 'super_admin') return <Navigate to="/dashboard" replace />
  return children
}

// ── Garde : doit avoir un tenant ──────────────────────────────────────────────
function TenantRoute({ children }) {
  const { user, role } = useAuthStore()
  
  if (role === 'super_admin') return <Navigate to="/admin/dashboard" replace />
  if (!user?.tenant_id)       return <Navigate to="/onboarding" replace />
  
  // Rediriger vers la vérification d'e-mail si nécessaire
  if (!user?.email_verified_at) {
    return <Navigate to="/auth/verify-email" replace />
  }
  
  return children
}

// ── Garde : doit avoir accès au module ────────────────────────────────────────
function ModuleRoute({ module, children }) {
  const { user } = useAuthStore()

  if (!canAccessModule(user, module)) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

// ── Garde : invité seulement (non authentifié) ────────────────────────────────
function GuestRoute({ children }) {
  const { isAuthenticated, isLoading, user, role } = useAuthStore()
  if (isLoading) return <LoadingScreen />
  if (isAuthenticated) {
    if (role === 'super_admin')  return <Navigate to="/admin/dashboard" replace />
    if (!user?.tenant_id)        return <Navigate to="/onboarding" replace />
    return <Navigate to="/dashboard" replace />
  }
  return children
}

export default function App() {
  const { initAuth } = useAuthStore()

  useEffect(() => { initAuth() }, [initAuth])

  return (
    <Routes>
      {/* ── Auth pages ────────────────────────────────────────────── */}
      <Route element={<AuthLayout />}>
        <Route path="/auth/login"          element={<GuestRoute><Login /></GuestRoute>} />
        <Route path="/auth/register"       element={<GuestRoute><Register /></GuestRoute>} />
        <Route path="/auth/forgot-password" element={<GuestRoute><ForgotPassword /></GuestRoute>} />
        <Route path="/auth/reset-password" element={<GuestRoute><ResetPassword /></GuestRoute>} />
        <Route path="/auth/verify-email"   element={<ProtectedRoute><VerifyEmail /></ProtectedRoute>} />
      </Route>

      {/* ── Onboarding ────────────────────────────────────────────── */}
      <Route
        path="/onboarding"
        element={<ProtectedRoute><TenantSetupWizard /></ProtectedRoute>}
      />

      {/* ── Super Admin ───────────────────────────────────────────── */}
      <Route
        element={
          <ProtectedRoute>
            <SuperAdminRoute>
              <AdminLayout />
            </SuperAdminRoute>
          </ProtectedRoute>
        }
      >
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/users"     element={<UsersManagement />} />
        <Route path="/admin/users/:id" element={<UserDetails />} />
        <Route path="/admin/packs"     element={<PacksManagement />} />
        <Route path="/admin/packs/:id" element={<PackDetails />} />

      </Route>

      {/* ── Tenant dashboard ──────────────────────────────────────── */}
      <Route
        element={
          <ProtectedRoute>
            <TenantRoute>
              <DashboardLayout />
            </TenantRoute>
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/team"      element={<TeamManagement />} />
        <Route path="/team/:id"  element={<TeamMemberDetailPage />} />
        <Route path="/products"        element={<ModuleRoute module="products"><ProductsPage /></ModuleRoute>} />
        <Route path="/products/categories" element={<ModuleRoute module="products"><CategoriesPage /></ModuleRoute>} />
        <Route path="/products/:id"    element={<ModuleRoute module="products"><ProductDetailPage /></ModuleRoute>} />
        <Route path="/customers"       element={<ModuleRoute module="customers"><CustomersPage /></ModuleRoute>} />
        <Route path="/customers/:id"   element={<ModuleRoute module="customers"><CustomerDetailPage /></ModuleRoute>} />
        <Route path="/suppliers"       element={<ModuleRoute module="suppliers"><SuppliersPage /></ModuleRoute>} />
        <Route path="/suppliers/:id"   element={<ModuleRoute module="suppliers"><SupplierDetailPage /></ModuleRoute>} />
        <Route path="/purchase-orders"     element={<ModuleRoute module="purchase-orders"><PurchaseOrdersPage /></ModuleRoute>} />
        <Route path="/purchase-orders/:id" element={<ModuleRoute module="purchase-orders"><PurchaseOrderDetailPage /></ModuleRoute>} />
        <Route path="/expenses"        element={<ModuleRoute module="expenses"><ExpensesPage /></ModuleRoute>} />
        <Route path="/pos"             element={<ModuleRoute module="pos"><POSPage /></ModuleRoute>} />
        <Route path="/orders"          element={<ModuleRoute module="orders"><OrdersPage /></ModuleRoute>} />
        <Route path="/reports"         element={<ModuleRoute module="reports"><ReportsPage /></ModuleRoute>} />
        <Route path="/settings"        element={<ModuleRoute module="settings"><SettingsPage /></ModuleRoute>} />

        {/* Production */}
        <Route path="/production"            element={<ModuleRoute module="production"><ProductionsPage /></ModuleRoute>} />
        <Route path="/production/new"        element={<ModuleRoute module="production"><ProductionNewPage /></ModuleRoute>} />
        <Route path="/production/:id"        element={<ModuleRoute module="production"><ProductionDetailsPage /></ModuleRoute>} />
        <Route path="/production/boms"       element={<ModuleRoute module="production"><BomsPage /></ModuleRoute>} />
        <Route path="/production/boms/new"   element={<ModuleRoute module="production"><BomFormPage /></ModuleRoute>} />
        <Route path="/production/boms/:id"   element={<ModuleRoute module="production"><BomDetailPage /></ModuleRoute>} />
        <Route path="/production/boms/:id/edit" element={<ModuleRoute module="production"><BomFormPage /></ModuleRoute>} />
        <Route path="/production/materials"  element={<ModuleRoute module="production"><MaterialsPage /></ModuleRoute>} />
      </Route>

      {/* ── Redirections par défaut ───────────────────────────────── */}
      <Route path="/" element={<ProtectedRoute><DefaultRedirect /></ProtectedRoute>} />
      <Route path="*" element={<ProtectedRoute><DefaultRedirect /></ProtectedRoute>} />
    </Routes>
  )
}
