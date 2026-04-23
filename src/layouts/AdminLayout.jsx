import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import {
  LayoutDashboard,
  Users,
  Building2,
  ShieldCheck,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Bell,
} from 'lucide-react'

const NAV = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Tableau de bord' },
  { to: '/admin/users',     icon: Users,           label: 'Utilisateurs' },
  { to: '/admin/tenants',   icon: Building2,        label: 'Espaces de travail' },
]

function NafaaAdminLogo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex gap-[3px] items-end h-6">
        {[1, 0.75, 0.55, 0.35].map((op, i) => (
          <div
            key={i}
            className="w-[5px] rounded-[1px]"
            style={{
              height: `${100 - i * 18}%`,
              background: `rgba(58,160,216,${op})`,
            }}
          />
        ))}
        <div className="w-[5px] h-[5px] rounded-full bg-gold mb-0.5" />
      </div>
      <span className="font-display font-bold text-lg text-white tracking-wide">NAFAA</span>
      <span className="text-[10px] font-sans bg-primary-500/20 text-primary-300 px-1.5 py-0.5 rounded-badge font-semibold uppercase tracking-wider">
        Admin
      </span>
    </div>
  )
}

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/auth/login')
  }

  return (
    <div className="flex h-screen bg-bg overflow-hidden">
      {/* ── Sidebar ───────────────────────────────────────────────── */}
      <aside
        className={`flex flex-col bg-navy transition-all duration-300 ${
          collapsed ? 'w-16' : 'w-60'
        }`}
      >
        {/* Logo */}
        <div className="h-[57px] flex items-center px-4 border-b border-white/10 flex-shrink-0">
          {collapsed ? (
            <div className="flex gap-[3px] items-end h-5 mx-auto">
              {[1, 0.7, 0.45, 0.25].map((op, i) => (
                <div
                  key={i}
                  className="w-[4px] rounded-[1px]"
                  style={{ height: `${100 - i * 20}%`, background: `rgba(58,160,216,${op})` }}
                />
              ))}
              <div className="w-[4px] h-[4px] rounded-full bg-gold" />
            </div>
          ) : (
            <NafaaAdminLogo />
          )}
        </div>

        {/* Gradient band */}
        <div className="h-0.5 flex-shrink-0" style={{ background: 'linear-gradient(90deg, #3AA0D8 0%, #7EC3E8 60%, transparent 100%)' }} />

        {/* Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 mx-2 rounded-btn text-sm font-sans font-medium transition-all ${
                  isActive
                    ? 'bg-primary-500/20 text-primary-300'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`
              }
            >
              <Icon size={18} className="flex-shrink-0" />
              {!collapsed && <span>{label}</span>}
              {!collapsed && (
                <ChevronRight size={14} className="ml-auto opacity-40" />
              )}
            </NavLink>
          ))}
        </nav>

        {/* Collapse toggle */}
        <div className="p-3 border-t border-white/10 flex-shrink-0">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center gap-2 py-1.5 text-white/40 hover:text-white/70 text-xs transition-colors"
          >
            {collapsed ? <Menu size={16} /> : <><X size={14} /><span className="font-sans">Réduire</span></>}
          </button>
        </div>
      </aside>

      {/* ── Main content ──────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-[57px] bg-surface border-b border-muted-300 flex items-center justify-between px-6 flex-shrink-0">
          <div className="flex items-center gap-2 text-sm text-muted-500 font-sans">
            <ShieldCheck size={16} className="text-primary-500" />
            <span>Console d'administration</span>
          </div>

          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-btn text-muted-500 hover:text-navy hover:bg-muted-100 transition-colors">
              <Bell size={18} />
            </button>

            <div className="flex items-center gap-2 pl-3 border-l border-muted-300">
              <div className="w-7 h-7 rounded-full bg-primary-500 flex items-center justify-center">
                <span className="text-xs font-display font-bold text-white">
                  {user?.name?.[0]?.toUpperCase() ?? 'A'}
                </span>
              </div>
              {!collapsed && (
                <span className="text-sm font-sans font-medium text-navy max-w-[120px] truncate">
                  {user?.name}
                </span>
              )}
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-btn text-muted-500 hover:text-danger hover:bg-danger/5 transition-colors"
                title="Déconnexion"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
