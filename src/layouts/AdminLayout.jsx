import { useState, useEffect, useRef } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { adminService } from '@/services/adminService'
import {
  LayoutDashboard,
  Users,
  Package,
  ShieldCheck,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Bell,
  Check,
  Building2,
  CreditCard,
  MessageSquare,
  Star,
} from 'lucide-react'
import Logo from '@/components/ui/Logo'

const NAV = [
  { to: '/admin/dashboard',     icon: LayoutDashboard, label: 'Tableau de bord' },
  { to: '/admin/messages',      icon: MessageSquare,   label: 'Messagerie' },
  { to: '/admin/ambassadors',   icon: Star,            label: 'Ambassadeurs' },
  { to: '/admin/tenants',       icon: Building2,       label: 'Espaces (Tenants)' },
  { to: '/admin/subscriptions', icon: CreditCard,      label: 'Abonnements' },
  { to: '/admin/users',         icon: Users,           label: 'Utilisateurs' },
  { to: '/admin/packs',         icon: Package,         label: 'Packs & Offres' },
]

function QiwamAdminLogo({ collapsed }) {
  return (
    <div className="flex items-center gap-3">
      <Logo size={collapsed ? 28 : 32} showText={!collapsed} variant="dark" />
      {!collapsed && (
        <span className="text-[10px] font-sans bg-primary-500/20 text-primary-300 px-1.5 py-0.5 rounded-badge font-semibold uppercase tracking-wider">
          Admin
        </span>
      )}
    </div>
  )
}

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [unreadMessages, setUnreadMessages] = useState(0)
  const notificationRef = useRef(null)
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    fetchNotifications()
    adminService.getContactMessages().then(res => setUnreadMessages(res.unread || 0)).catch(() => {})
    
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchNotifications = async () => {
    try {
      const res = await adminService.getNotifications()
      setNotifications(res.notifications || [])
    } catch (e) {
      console.error('Failed to fetch notifications', e)
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await adminService.markAllRead()
      setNotifications([])
      setShowNotifications(false)
    } catch (e) {
      console.error('Failed to mark notifications as read')
    }
  }

  const handleMarkAsRead = async (id) => {
    try {
      await adminService.markAsRead(id)
      setNotifications(prev => prev.filter(n => n.id !== id))
    } catch (e) {
      console.error('Failed to mark notification as read')
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate('/auth/login')
  }

  return (
    <div className="flex h-screen bg-bg overflow-hidden">
      {/* ── Sidebar ───────────────────────────────────────────────── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-navy transition-all duration-300 ${
          collapsed ? 'w-16' : 'w-60'
        } ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
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
            <QiwamAdminLogo />
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
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 mx-2 rounded-btn text-sm font-sans font-medium transition-all ${
                  isActive
                    ? 'bg-primary-500/20 text-primary-300'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`
              }
            >
              <Icon size={18} className="flex-shrink-0" />
              {!collapsed && <span className="flex-1">{label}</span>}
              {!collapsed && to === '/admin/messages' && unreadMessages > 0 && (
                <span className="bg-[#3AA0D8] text-white text-[9px] font-bold rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                  {unreadMessages}
                </span>
              )}
              {!collapsed && to !== '/admin/messages' && (
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

      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-navy/60 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Main content ──────────────────────────────────────────── */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${collapsed ? 'lg:ml-16' : 'lg:ml-60'}`}>
        {/* Topbar */}
        <header className="h-[57px] bg-surface border-b border-muted-300 flex items-center justify-between px-6 flex-shrink-0">
          <div className="flex items-center gap-2 text-sm text-muted-500 font-sans">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden text-muted-500 hover:text-navy mr-2"
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <ShieldCheck size={16} className="text-primary-500 hidden sm:block" />
            <span className="hidden sm:block">Console d'administration</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative" ref={notificationRef}>
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-btn text-muted-500 hover:text-navy hover:bg-muted-100 transition-colors"
              >
                <Bell size={18} />
                {notifications.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-surface" />
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-muted-200 overflow-hidden z-50">
                  <div className="p-3 border-b border-muted-200 flex items-center justify-between bg-muted-50/50">
                    <span className="font-semibold text-sm text-navy">Notifications</span>
                    {notifications.length > 0 && (
                      <button 
                        onClick={handleMarkAllRead}
                        className="text-[10px] text-primary-600 font-semibold uppercase tracking-wider hover:text-primary-700"
                      >
                        Tout marquer comme lu
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-muted-500 text-sm">
                        Aucune nouvelle notification
                      </div>
                    ) : (
                      <div className="divide-y divide-muted-100">
                        {notifications.map(notif => (
                          <div key={notif.id} className="p-3 hover:bg-muted-50/50 transition-colors group flex gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-navy mb-0.5">{notif.data?.title || 'Notification'}</p>
                              <p className="text-xs text-muted-500 line-clamp-2">{notif.data?.message || 'Nouvelle notification'}</p>
                            </div>
                            <button 
                              onClick={() => handleMarkAsRead(notif.id)}
                              className="text-muted-400 hover:text-green-600 opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Marquer comme lu"
                            >
                              <Check size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

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
        <main className="flex-1 overflow-y-auto py-6 px-4 lg:px-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
