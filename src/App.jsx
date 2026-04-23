import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
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
import AdminDashboard from '@/pages/admin/AdminDashboard'
import UsersManagement from '@/pages/admin/UsersManagement'
import ProductsPage from '@/pages/products/ProductsPage'
import ProductDetailPage from '@/pages/products/ProductDetailPage'
import CustomersPage from '@/pages/customers/CustomersPage'
import CustomerDetailPage from '@/pages/customers/CustomerDetailPage'
import SuppliersPage from '@/pages/suppliers/SuppliersPage'
import SupplierDetailPage from '@/pages/suppliers/SupplierDetailPage'
import PurchaseOrdersPage from '@/pages/suppliers/PurchaseOrdersPage'
import PurchaseOrderDetailPage from '@/pages/suppliers/PurchaseOrderDetailPage'
import ExpensesPage from '@/pages/expenses/ExpensesPage'
import POSPage from '@/pages/pos/POSPage'
import OrdersPage from '@/pages/orders/OrdersPage'

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
        <Route path="/products"        element={<ProductsPage />} />
        <Route path="/products/:id"    element={<ProductDetailPage />} />
        <Route path="/customers"       element={<CustomersPage />} />
        <Route path="/customers/:id"   element={<CustomerDetailPage />} />
        <Route path="/suppliers"       element={<SuppliersPage />} />
        <Route path="/suppliers/:id"   element={<SupplierDetailPage />} />
        <Route path="/purchase-orders"     element={<PurchaseOrdersPage />} />
        <Route path="/purchase-orders/:id" element={<PurchaseOrderDetailPage />} />
        <Route path="/expenses"        element={<ExpensesPage />} />
        <Route path="/pos"             element={<POSPage />} />
        <Route path="/orders"          element={<OrdersPage />} />
      </Route>

      {/* ── Redirections par défaut ───────────────────────────────── */}
      <Route path="/" element={<ProtectedRoute><DefaultRedirect /></ProtectedRoute>} />
      <Route path="*" element={<ProtectedRoute><DefaultRedirect /></ProtectedRoute>} />
    </Routes>
  )
}
