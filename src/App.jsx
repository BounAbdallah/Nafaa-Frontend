import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, lazy, Suspense } from 'react'
import { canAccessModule } from '@/utils/modulePermissions'
import { useAuthStore } from '@/store/authStore'
const LandingPage = lazy(() => import('@/pages/landing/LandingPage'))
const SignupGuidePage = lazy(() => import('@/pages/landing/SignupGuidePage'))
const PrivacyPage = lazy(() => import('@/pages/landing/PrivacyPage'))
const TermsPage = lazy(() => import('@/pages/landing/TermsPage'))
const ContactPage = lazy(() => import('@/pages/landing/ContactPage'))
const SupportPage = lazy(() => import('@/pages/landing/SupportPage'))
const PricingPage = lazy(() => import('@/pages/landing/PricingPage'))
import AuthLayout from '@/layouts/AuthLayout'
import DashboardLayout from '@/layouts/DashboardLayout'
import AdminLayout from '@/layouts/AdminLayout'
const Login = lazy(() => import('@/pages/auth/Login'))
const Register = lazy(() => import('@/pages/auth/Register'))
const ForgotPassword = lazy(() => import('@/pages/auth/ForgotPassword'))
const ResetPassword = lazy(() => import('@/pages/auth/ResetPassword'))
const VerifyEmail = lazy(() => import('@/pages/auth/VerifyEmail'))
const VerifyEmailCallback = lazy(() => import('@/pages/auth/VerifyEmailCallback'))
const TenantSetupWizard = lazy(() => import('@/pages/onboarding/TenantSetupWizard'))
const Dashboard = lazy(() => import('@/pages/dashboard/Dashboard'))
const TeamManagement = lazy(() => import('@/pages/team/TeamManagement'))
const TeamMemberDetailPage = lazy(() => import('@/pages/team/TeamMemberDetailPage'))
const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard'))
const UsersManagement = lazy(() => import('@/pages/admin/UsersManagement'))
const UserDetails = lazy(() => import('@/pages/admin/UserDetails'))
const PacksManagement = lazy(() => import('@/pages/admin/PacksManagement'))
const PackDetails = lazy(() => import('@/pages/admin/PackDetails'))
const TenantsManagement = lazy(() => import('@/pages/admin/TenantsManagement'))
const TenantDetailPage = lazy(() => import('@/pages/admin/TenantDetailPage'))
const SubscriptionsManagement = lazy(() => import('@/pages/admin/SubscriptionsManagement'))
const MessagesPage = lazy(() => import('@/pages/admin/MessagesPage'))
const AmbassadorsPage = lazy(() => import('@/pages/admin/AmbassadorsPage'))
const MonitoringPage = lazy(() => import('@/pages/admin/MonitoringPage'))
const AdminsManagement = lazy(() => import('@/pages/admin/AdminsManagement'))
const CatalogManagement = lazy(() => import('@/pages/admin/CatalogManagement'))
const AdminDetailPage = lazy(() => import('@/pages/admin/AdminDetailPage'))
const AdminProfilePage = lazy(() => import('@/pages/admin/AdminProfilePage'))
const AmbassadorDashboard = lazy(() => import('@/pages/ambassador/AmbassadorDashboard'))

const ProductsPage = lazy(() => import('@/pages/products/ProductsPage'))
const CategoriesPage = lazy(() => import('@/pages/products/CategoriesPage'))
const ProductDetailPage = lazy(() => import('@/pages/products/ProductDetailPage'))
const TrashedProductsPage = lazy(() => import('@/pages/products/TrashedProductsPage'))
const CustomersPage = lazy(() => import('@/pages/customers/CustomersPage'))
const CustomerDetailPage = lazy(() => import('@/pages/customers/CustomerDetailPage'))
const SuppliersPage = lazy(() => import('@/pages/suppliers/SuppliersPage'))
const SettingsPage = lazy(() => import('@/pages/settings/SettingsPage'))
const SubscriptionPage = lazy(() => import('@/pages/settings/SubscriptionPage'))
const SupplierDetailPage = lazy(() => import('@/pages/suppliers/SupplierDetailPage'))
const PurchaseOrdersPage = lazy(() => import('@/pages/suppliers/PurchaseOrdersPage'))
const PurchaseOrderDetailPage = lazy(() => import('@/pages/suppliers/PurchaseOrderDetailPage'))
const ExpensesPage = lazy(() => import('@/pages/expenses/ExpensesPage'))
const POSPage = lazy(() => import('@/pages/pos/POSPage'))
const OrdersPage = lazy(() => import('@/pages/orders/OrdersPage'))
const ReportsPage = lazy(() => import('@/pages/reports/ReportsPage'))
const BomsPage = lazy(() => import('@/pages/production/BomsPage'))
const BomFormPage = lazy(() => import('@/pages/production/BomFormPage'))
const BomDetailPage = lazy(() => import('@/pages/production/BomDetailPage'))
const ProductionsPage = lazy(() => import('@/pages/production/ProductionsPage'))
const ProductionNewPage = lazy(() => import('@/pages/production/ProductionNewPage'))
const ProductionDetailsPage = lazy(() => import('@/pages/production/ProductionDetailsPage'))
const MaterialsPage = lazy(() => import('@/pages/production/MaterialsPage'))

// ── Prestateur ────────────────────────────────────────────────────────────────
const PrestateurDashboard = lazy(() => import('@/pages/prestateur/PrestateurDashboard'))
const CalendarPage = lazy(() => import('@/pages/prestateur/CalendarPage'))
const QuotesPage = lazy(() => import('@/pages/prestateur/QuotesPage'))
const QuoteEditorPage = lazy(() => import('@/pages/prestateur/QuoteEditorPage'))
const InvoicesPage = lazy(() => import('@/pages/prestateur/InvoicesPage'))
const InvoiceEditorPage = lazy(() => import('@/pages/prestateur/InvoiceEditorPage'))
const ContractsPage = lazy(() => import('@/pages/prestateur/ContractsPage'))
const ContractEditorPage = lazy(() => import('@/pages/prestateur/ContractEditorPage'))

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
  if (role === 'super_admin' || role === 'country_admin') return <Navigate to="/admin/dashboard" replace />
  if (role === 'ambassador')  return <Navigate to="/ambassador" replace />
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

// ── Garde : doit être un admin plateforme (super_admin ou admin pays) ─────────
function SuperAdminRoute({ children }) {
  const { role, isLoading } = useAuthStore()
  if (isLoading)             return <LoadingScreen />
  if (role === 'ambassador')  return <Navigate to="/ambassador" replace />
  if (role !== 'super_admin' && role !== 'country_admin') return <Navigate to="/dashboard" replace />
  return children
}

// ── Garde : doit avoir un tenant ──────────────────────────────────────────────
function TenantRoute({ children }) {
  const { user, role } = useAuthStore()

  if (role === 'super_admin' || role === 'country_admin') return <Navigate to="/admin/dashboard" replace />
  if (role === 'ambassador')  return <Navigate to="/ambassador" replace />
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
    if (role === 'super_admin' || role === 'country_admin')  return <Navigate to="/admin/dashboard" replace />
    if (role === 'ambassador')   return <Navigate to="/ambassador" replace />
    if (!user?.tenant_id)        return <Navigate to="/onboarding" replace />
    return <Navigate to="/dashboard" replace />
  }
  return children
}

export default function App() {
  const { initAuth } = useAuthStore()

  useEffect(() => { initAuth() }, [initAuth])

  return (
    <Suspense fallback={<LoadingScreen />}>
    <Routes>
      {/* ── Auth pages ────────────────────────────────────────────── */}
      <Route element={<AuthLayout />}>
        <Route path="/auth/login"          element={<GuestRoute><Login /></GuestRoute>} />
        <Route path="/auth/register"       element={<GuestRoute><Register /></GuestRoute>} />
        <Route path="/auth/forgot-password" element={<GuestRoute><ForgotPassword /></GuestRoute>} />
        <Route path="/auth/reset-password" element={<GuestRoute><ResetPassword /></GuestRoute>} />
        <Route path="/auth/verify-email"            element={<ProtectedRoute><VerifyEmail /></ProtectedRoute>} />
        <Route path="/auth/verify-email/:id/:hash" element={<VerifyEmailCallback />} />
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
        <Route path="/admin/tenants"      element={<TenantsManagement />} />
        <Route path="/admin/tenants/:id"  element={<TenantDetailPage />} />
        <Route path="/admin/subscriptions" element={<SubscriptionsManagement />} />
        <Route path="/admin/messages"      element={<MessagesPage />} />
        <Route path="/admin/ambassadors"   element={<AmbassadorsPage />} />
        <Route path="/admin/monitoring"    element={<MonitoringPage />} />
        <Route path="/admin/admins"        element={<AdminsManagement />} />
        <Route path="/admin/catalog"       element={<CatalogManagement />} />
        <Route path="/admin/admins/:id"    element={<AdminDetailPage />} />
        <Route path="/admin/profile"       element={<AdminProfilePage />} />

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
        <Route path="/products/trash"  element={<ModuleRoute module="products"><TrashedProductsPage /></ModuleRoute>} />
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
        <Route path="/subscription"    element={<SubscriptionPage />} />

        {/* Production */}
        <Route path="/production"            element={<ModuleRoute module="production"><ProductionsPage /></ModuleRoute>} />
        <Route path="/production/new"        element={<ModuleRoute module="production"><ProductionNewPage /></ModuleRoute>} />
        <Route path="/production/:id"        element={<ModuleRoute module="production"><ProductionDetailsPage /></ModuleRoute>} />
        <Route path="/production/boms"       element={<ModuleRoute module="production"><BomsPage /></ModuleRoute>} />
        <Route path="/production/boms/new"   element={<ModuleRoute module="production"><BomFormPage /></ModuleRoute>} />
        <Route path="/production/boms/:id"   element={<ModuleRoute module="production"><BomDetailPage /></ModuleRoute>} />
        <Route path="/production/boms/:id/edit" element={<ModuleRoute module="production"><BomFormPage /></ModuleRoute>} />
        <Route path="/production/materials"  element={<ModuleRoute module="production"><MaterialsPage /></ModuleRoute>} />

        {/* ── Prestateur ──────────────────────────────────────────────── */}
        <Route path="/prestateur"                  element={<PrestateurDashboard />} />
        <Route path="/prestateur/calendar"         element={<CalendarPage />} />
        <Route path="/prestateur/quotes"           element={<QuotesPage />} />
        <Route path="/prestateur/quotes/new"       element={<QuoteEditorPage />} />
        <Route path="/prestateur/quotes/:id"       element={<QuoteEditorPage />} />
        <Route path="/prestateur/invoices"         element={<InvoicesPage />} />
        <Route path="/prestateur/invoices/new"     element={<InvoiceEditorPage />} />
        <Route path="/prestateur/invoices/:id"     element={<InvoiceEditorPage />} />
        <Route path="/prestateur/contracts"        element={<ContractsPage />} />
        <Route path="/prestateur/contracts/new"    element={<ContractEditorPage />} />
        <Route path="/prestateur/contracts/:id"    element={<ContractEditorPage />} />
      </Route>

      {/* ── Portail public ───────────────────────────────────────── */}
      <Route path="/"                element={<LandingPage />} />
      <Route path="/inscription"     element={<SignupGuidePage />} />
      <Route path="/ambassador"      element={<AmbassadorDashboard />} />
      <Route path="/legal/privacy"   element={<PrivacyPage />} />
      <Route path="/legal/terms"     element={<TermsPage />} />
      <Route path="/tarifs"          element={<PricingPage />} />
      <Route path="/legal/contact"   element={<ContactPage />} />
      <Route path="/legal/support"   element={<SupportPage />} />

      {/* ── Redirections par défaut ───────────────────────────────── */}
      <Route path="*" element={<ProtectedRoute><DefaultRedirect /></ProtectedRoute>} />
    </Routes>
    </Suspense>
  )
}
