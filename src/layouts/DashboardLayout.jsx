import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import {
  LayoutDashboard, Package, Users, ShoppingCart,
  BarChart2, Settings, LogOut, ChevronLeft,
  ChevronRight, Menu, X, Bell, Search, UserCircle2,
  Truck, Receipt, Monitor
} from 'lucide-react'
import { cn } from '@/utils/cn'
import toast from 'react-hot-toast'
import Logo from '@/components/ui/Logo'
import { getAllowedModules, PROFILE_META } from '@/utils/modulePermissions'

const ALL_NAV = [
  { path: '/dashboard',       icon: LayoutDashboard, label: 'Tableau de bord',     module: 'dashboard' },
  { path: '/pos',             icon: Monitor,         label: 'Point de Vente',      module: 'pos' },
  { path: '/team',            icon: UserCircle2,     label: 'Équipe',              module: 'team', roles: ['admin'] },
  { path: '/products',        icon: Package,         label: 'Produits', module: 'products' },
  { path: '/products/categories', icon: Package,         label: 'Catégories',          module: 'products' },
  { path: '/customers',       icon: Users,           label: 'Clients',             module: 'customers' },
  { path: '/orders',          icon: ShoppingCart,    label: 'Commandes',           module: 'orders' },
  { path: '/suppliers',       icon: Truck,           label: 'Fournisseurs',        module: 'suppliers' },
  { path: '/purchase-orders', icon: ShoppingCart,    label: 'Cmd. fournisseurs',   module: 'purchase-orders' },
  { path: '/expenses',        icon: Receipt,         label: 'Dépenses',            module: 'expenses' },
  { path: '/reports',         icon: BarChart2,       label: 'Rapports',            module: 'reports' },
  { path: '/settings',        icon: Settings,        label: 'Paramètres',          module: 'settings' },
]

function NavItem({ item, collapsed, onClick }) {
  const location = useLocation()
  const isActive = location.pathname === item.path

  return (
    <Link
      to={item.path}
      onClick={onClick}
      title={collapsed ? item.label : undefined}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-btn text-sm transition-all duration-150 group',
        isActive
          ? 'bg-primary-50 text-primary-600 font-display font-semibold border border-primary-100'
          : 'text-white/60 hover:text-white hover:bg-white/[0.08] font-display font-medium'
      )}
    >
      <item.icon className={cn('w-[18px] h-[18px] shrink-0', isActive ? 'text-primary-500' : 'text-white/40 group-hover:text-white/80')} />
      {!collapsed && <span>{item.label}</span>}
    </Link>
  )
}

export default function DashboardLayout() {
  const { user, logout, role } = useAuthStore()

  // Filter nav by (1) allowed modules for this profile_type, (2) role restrictions
  const profileType    = user?.tenant?.profile_type
  const allowedModules = getAllowedModules(profileType)
  const profileMeta    = profileType ? PROFILE_META[profileType] : null

  const navItems = ALL_NAV
    .filter(item => allowedModules.includes(item.module))
    .filter(item => !item.roles || item.roles.includes(role))
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  const handleLogout = async () => {
    await logout()
    toast.success('À bientôt !')
    navigate('/auth/login')
  }

  return (
    <div className="min-h-screen bg-bg flex">

      {/* ── Sidebar ── */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col bg-navy transition-all duration-300',
          collapsed ? 'w-[64px]' : 'w-[240px]',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="gradient-band" />

        <div className={cn('flex items-center px-4 py-5 border-b border-white/[0.07]', collapsed && 'justify-center px-0')}>
          <Logo size={collapsed ? 32 : 36} showText={!collapsed} variant="dark" />
        </div>

        <nav className="flex-1 p-2.5 space-y-0.5 overflow-y-auto text-white">
          {navItems.map((item) => (
            <NavItem key={item.path} item={item} collapsed={collapsed} onClick={() => setSidebarOpen(false)} />
          ))}
        </nav>

        <div className="p-2.5 border-t border-white/[0.07] space-y-0.5">
          {!collapsed && (
            <div className="flex items-center gap-2.5 px-3 py-2.5 mb-1">
              <div className="w-7 h-7 rounded-full bg-primary-500 flex items-center justify-center text-xs font-display font-bold text-white shrink-0">
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="overflow-hidden flex-1 min-w-0">
                <div className="text-xs font-medium text-white/80 truncate">{user?.name}</div>
                <div className="text-[10px] text-white/35 truncate">{user?.email}</div>
              </div>
            </div>
          )}

          {/* Profile type badge */}
          {profileMeta && !collapsed && (
            <div className="mx-3 mb-1 px-2 py-1.5 rounded-btn bg-white/[0.06] border border-white/[0.08] flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full shrink-0 ${profileMeta.dot}`} />
              <div className="min-w-0">
                <div className="text-[10px] font-display font-semibold text-white/70 leading-tight">{profileMeta.label}</div>
                <div className="text-[9px] text-white/30 leading-tight truncate">{profileMeta.description}</div>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            title={collapsed ? 'Déconnexion' : undefined}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-btn text-sm text-white/50 hover:text-[#ff7a6a] hover:bg-red-500/10 transition-all duration-150 font-display font-medium',
              collapsed && 'justify-center'
            )}
          >
            <LogOut className="w-[18px] h-[18px] shrink-0" />
            {!collapsed && <span>Déconnexion</span>}
          </button>
        </div>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex absolute -right-3 top-20 w-6 h-6 rounded-full bg-surface border border-muted-300 shadow-card items-center justify-center text-muted-500 hover:text-navy hover:border-primary-300 transition-all duration-150"
        >
          {collapsed
            ? <ChevronRight className="w-3 h-3" />
            : <ChevronLeft className="w-3 h-3" />}
        </button>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-navy/60 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <main className={cn('flex-1 flex flex-col min-h-screen transition-all duration-300', collapsed ? 'lg:ml-[64px]' : 'lg:ml-[240px]')}>
        <header className="sticky top-0 z-30 bg-surface border-b border-muted-300 shadow-card px-6 py-3.5 flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden text-muted-500 hover:text-navy"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex-1 max-w-sm relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-500" />
            <input
              type="text"
              placeholder="Rechercher..."
              className="w-full bg-bg border border-muted-300 rounded-btn pl-9 pr-4 py-2 text-sm text-navy placeholder-muted-500 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all"
            />
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <button className="relative p-2 text-muted-500 hover:text-navy rounded-btn hover:bg-muted-100 transition-all">
              <Bell className="w-[18px] h-[18px]" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary-500 rounded-full" />
            </button>

            <div className="flex items-center gap-2.5 pl-3 border-l border-muted-300">
              <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-xs font-display font-bold text-white shrink-0">
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="hidden sm:block">
                <div className="text-sm font-display font-semibold text-navy leading-tight">{user?.name}</div>
                <div className="text-[11px] text-muted-500">{user?.tenant?.name || 'Aucun espace'}</div>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
