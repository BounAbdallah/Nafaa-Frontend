import { useState, useEffect, useRef, useCallback } from 'react'
import { Bell, Mail, Store, CheckCheck, X, BellOff, Package, ShoppingCart } from 'lucide-react'
import { notificationService } from '@/services/notificationService'
import { pushService } from '@/services/pushService'
import { cn } from '@/utils/cn'
import toast from 'react-hot-toast'

const TYPE_META = {
  new_contact_message: {
    icon: Mail,
    color: 'text-[#3AA0D8]',
    bg:    'bg-[#3AA0D8]/10',
    label: 'Nouveau message',
  },
  new_subscription: {
    icon: Store,
    color: 'text-[#E8A020]',
    bg:    'bg-[#E8A020]/10',
    label: 'Nouvel abonnement',
  },
  low_stock: {
    icon: Package,
    color: 'text-orange-500',
    bg:    'bg-orange-50',
    label: 'Stock faible',
  },
  new_order: {
    icon: ShoppingCart,
    color: 'text-[#1A7A45]',
    bg:    'bg-green-50',
    label: 'Nouvelle vente',
  },
}

function NotifItem({ notif, onRead }) {
  const meta = TYPE_META[notif.type] || { icon: Bell, color: 'text-navy', bg: 'bg-navy/10', label: 'Info' }
  const Icon = meta.icon

  return (
    <button
      onClick={() => !notif.read && onRead(notif.id)}
      className={cn(
        'w-full flex items-start gap-3 px-4 py-3 hover:bg-[#F4F8FB] transition-colors text-left',
        !notif.read && 'bg-[#EBF6FD]'
      )}
    >
      <div className={cn('w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5', meta.bg)}>
        <Icon size={14} className={meta.color} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className={cn('text-[10px] font-bold uppercase tracking-wide', meta.color)}>{meta.label}</span>
          {!notif.read && <span className="w-1.5 h-1.5 bg-[#3AA0D8] rounded-full" />}
        </div>
        <p className="text-xs text-[#0F1E30] leading-snug line-clamp-2">{notif.message}</p>
        <p className="text-[10px] text-[#7A90A4] mt-1">{notif.created_at}</p>
      </div>
    </button>
  )
}

export default function NotificationBell() {
  const [open, setOpen]           = useState(false)
  const [notifications, setNotifs] = useState([])
  const [unread, setUnread]       = useState(0)
  const [loading, setLoading]     = useState(false)
  const [pushEnabled, setPushEnabled] = useState(false)
  const [pushLoading, setPushLoading] = useState(false)
  const dropdownRef               = useRef(null)

  const fetchNotifs = useCallback(async () => {
    try {
      const res = await notificationService.getAll()
      setNotifs(res.data.data || [])
      setUnread(res.data.unread_count || 0)
    } catch {
      // silently fail
    }
  }, [])

  // Charger au montage et toutes les 60 secondes
  useEffect(() => {
    fetchNotifs()
    const interval = setInterval(fetchNotifs, 60_000)
    return () => clearInterval(interval)
  }, [fetchNotifs])

  // Check push subscription status on mount
  useEffect(() => {
    if (pushService.isSupported()) {
      pushService.isSubscribed().then(setPushEnabled)
    }
  }, [])

  const handleTogglePush = async () => {
    setPushLoading(true)
    try {
      if (pushEnabled) {
        await pushService.unsubscribe()
        setPushEnabled(false)
      } else {
        await pushService.subscribe()
        setPushEnabled(true)
      }
    } catch (err) {
      const msg = err?.message || String(err)
      if (msg.includes('denied') || msg.includes('refus')) {
        toast.error('Notifications bloquées dans le navigateur. Autorisez-les dans les paramètres du site.')
      } else {
        toast.error('Erreur notifications : ' + msg)
      }
    } finally {
      setPushLoading(false)
    }
  }

  // Fermer si clic en dehors
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleOpen = () => {
    setOpen(o => !o)
    if (!open) fetchNotifs()
  }

  const handleRead = async (id) => {
    await notificationService.markRead(id)
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    setUnread(prev => Math.max(0, prev - 1))
  }

  const handleReadAll = async () => {
    setLoading(true)
    await notificationService.markAllRead()
    setNotifs(prev => prev.map(n => ({ ...n, read: true })))
    setUnread(0)
    setLoading(false)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button
        onClick={handleOpen}
        className="relative p-2 text-muted-500 hover:text-navy rounded-btn hover:bg-muted-100 transition-all"
      >
        <Bell className="w-[18px] h-[18px]" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-[#3AA0D8] text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-[#E8EFF5] z-50 overflow-hidden animate-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#E8EFF5]">
            <div className="flex items-center gap-2">
              <Bell size={14} className="text-[#0F1E30]" />
              <span className="text-sm font-black text-[#0F1E30]">Notifications</span>
              {unread > 0 && (
                <span className="bg-[#3AA0D8] text-white text-[9px] font-bold rounded-full px-1.5 py-0.5">
                  {unread}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unread > 0 && (
                <button
                  onClick={handleReadAll}
                  disabled={loading}
                  title="Tout marquer comme lu"
                  className="p-1.5 text-[#7A90A4] hover:text-[#3AA0D8] hover:bg-[#F4F8FB] rounded-lg transition-colors"
                >
                  <CheckCheck size={14} />
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 text-[#7A90A4] hover:text-[#0F1E30] hover:bg-[#F4F8FB] rounded-lg transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-[#F4F8FB]">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <Bell size={24} className="text-[#C4D0DC]" />
                <p className="text-xs text-[#7A90A4]">Aucune notification</p>
              </div>
            ) : (
              notifications.map(notif => (
                <NotifItem key={notif.id} notif={notif} onRead={handleRead} />
              ))
            )}
          </div>

          {/* Push toggle footer */}
          {pushService.isSupported() && (
            <div className="px-4 py-2.5 border-t border-[#E8EFF5] flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {pushEnabled
                  ? <Bell size={12} className="text-[#3AA0D8]" />
                  : <BellOff size={12} className="text-[#7A90A4]" />
                }
                <span className="text-[11px] text-[#7A90A4]">
                  {pushEnabled ? 'Notifications activées' : 'Activer les notifications'}
                </span>
              </div>
              <button
                onClick={handleTogglePush}
                disabled={pushLoading}
                className={cn(
                  'relative w-9 h-5 rounded-full transition-colors duration-200 flex-shrink-0',
                  pushEnabled ? 'bg-[#3AA0D8]' : 'bg-[#D1DBE4]',
                  pushLoading && 'opacity-50'
                )}
              >
                <span className={cn(
                  'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200',
                  pushEnabled ? 'left-4' : 'left-0.5'
                )} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
