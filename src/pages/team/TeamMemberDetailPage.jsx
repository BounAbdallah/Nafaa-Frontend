import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import api from '@/services/api'
import toast from 'react-hot-toast'
import {
  ChevronLeft, UserCircle2, Mail, Phone, Shield, Clock,
  Activity, X, Loader2, CheckCircle2, XCircle, Calendar,
  RefreshCw, TrendingUp, Lock, Save, Eye, Plus, Edit2, Trash2,
  ShoppingCart, Package, Users, Truck, Receipt, BarChart2, Settings,
  Tag
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { cn } from '@/utils/cn'
import { useCurrency } from '@/utils/currency'

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
    : '—'

// ── Constantes rôles ──────────────────────────────────────────────────────────
const ROLE_CONFIG = {
  admin: {
    label: 'Administrateur',
    description: 'Gestion complète',
    badgeClass: 'bg-blue-50 text-blue-600',
    borderClass: 'border-blue-200',
  },
  employee: {
    label: 'Employé',
    description: 'Opérations courantes',
    badgeClass: 'bg-green-50 text-green-700',
    borderClass: 'border-green-200',
  },
  viewer: {
    label: 'Lecteur',
    description: 'Lecture seule',
    badgeClass: 'bg-muted-100 text-muted-600',
    borderClass: 'border-muted-300',
  },
}

const ROLES = ['admin', 'employee', 'viewer']

// ── Labels d'activité ─────────────────────────────────────────────────────────
const ACTIVITY_LABELS = {
  'user.invited':      'Utilisateur invité',
  'user.role_changed': 'Rôle modifié',
  'user.removed':      'Membre retiré',
  'product.created':   'Produit créé',
  'product.updated':   'Produit modifié',
}

const ACTIVITY_ICONS = {
  'user.invited':      { Icon: CheckCircle2, color: 'text-success bg-green-50' },
  'user.role_changed': { Icon: Shield,       color: 'text-blue-500 bg-blue-50' },
  'user.removed':      { Icon: XCircle,      color: 'text-danger bg-red-50' },
  'product.created':   { Icon: CheckCircle2, color: 'text-success bg-green-50' },
  'product.updated':   { Icon: Activity,     color: 'text-primary-500 bg-primary-50' },
}

function getActivityIcon(action) {
  return ACTIVITY_ICONS[action] ?? { Icon: Activity, color: 'text-muted-500 bg-muted-100' }
}

function getActivityLabel(action) {
  return ACTIVITY_LABELS[action] ?? action
}

// ── Avatar (initiales ou photo) ───────────────────────────────────────────────
function MemberAvatar({ member, size = 'lg' }) {
  const sizeClass = size === 'lg' ? 'w-16 h-16 sm:w-20 sm:h-20 text-xl sm:text-2xl' : 'w-10 h-10 text-base'
  const initials = member.name
    ?.split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() ?? '?'

  if (member.avatar) {
    return (
      <img
        src={member.avatar}
        alt={member.name}
        className={cn('rounded-full object-cover flex-shrink-0', sizeClass)}
      />
    )
  }

  return (
    <div
      className={cn(
        'rounded-full bg-primary-500 flex items-center justify-center flex-shrink-0 font-display font-bold text-white',
        sizeClass,
      )}
    >
      {initials}
    </div>
  )
}

// ── StatBox ───────────────────────────────────────────────────────────────────
function StatBox({ icon: Icon, label, value }) {
  return (
    <div className="card p-3 sm:p-4 flex flex-col items-center text-center gap-1.5 sm:gap-2">
      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-card bg-primary-50 flex items-center justify-center">
        <Icon size={15} className="text-primary-500" />
      </div>
      <p className="text-xs sm:text-sm font-display font-bold text-navy leading-snug">{value ?? '—'}</p>
      <p className="text-[10px] sm:text-xs font-sans text-muted-500">{label}</p>
    </div>
  )
}

// ── Modal changement de rôle ──────────────────────────────────────────────────
function ChangeRoleModal({ member, onClose, onSuccess }) {
  const currentRole = member.roles?.[0] ?? 'viewer'
  const [selectedRole, setSelectedRole] = useState(currentRole)
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (selectedRole === currentRole) { onClose(); return }
    setSaving(true)
    try {
      await api.patch('/team/members/' + member.id + '/role', { role: selectedRole })
      toast.success('Rôle mis à jour.')
      onSuccess()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors du changement de rôle.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-navy/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-surface rounded-t-2xl sm:rounded-modal shadow-2xl w-full sm:max-w-md max-h-[95dvh] flex flex-col animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 pb-0 flex-shrink-0">
          <div>
            <h3 className="font-display font-bold text-navy">Modifier le rôle</h3>
            <p className="text-xs text-muted-500 font-sans mt-0.5">
              Rôle actuel de {member.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-muted-500 hover:text-navy rounded-btn hover:bg-muted-100"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          <div className="space-y-2">
            {ROLES.map((role) => {
              const cfg = ROLE_CONFIG[role]
              const isSelected = selectedRole === role
              return (
                <label
                  key={role}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-card border cursor-pointer transition-all',
                    isSelected
                      ? 'border-primary-300 bg-primary-50'
                      : 'border-muted-300 bg-surface hover:border-muted-500',
                  )}
                >
                  <input
                    type="radio"
                    name="role"
                    value={role}
                    checked={isSelected}
                    onChange={() => setSelectedRole(role)}
                    className="accent-primary-500"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-sans font-semibold text-navy">{cfg.label}</p>
                    <p className="text-xs text-muted-500">{cfg.description}</p>
                  </div>
                  {isSelected && (
                    <CheckCircle2 size={15} className="text-primary-500 flex-shrink-0" />
                  )}
                </label>
              )
            })}
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Modal confirmation retrait ────────────────────────────────────────────────
function RemoveModal({ member, onClose, onSuccess }) {
  const [removing, setRemoving] = useState(false)

  const handleRemove = async () => {
    setRemoving(true)
    try {
      await api.delete('/team/members/' + member.id)
      toast.success(`${member.name} a été retiré de l'équipe.`)
      onSuccess()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors du retrait.')
      setRemoving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-navy/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-surface rounded-t-2xl sm:rounded-modal shadow-2xl w-full sm:max-w-sm p-5 sm:p-6 space-y-5 max-h-[95dvh] overflow-y-auto animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
        {/* Icon + title */}
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-card bg-red-50 flex items-center justify-center flex-shrink-0">
            <XCircle size={20} className="text-danger" />
          </div>
          <div>
            <h3 className="font-display font-bold text-navy">Retirer de l'équipe</h3>
            <p className="text-xs text-muted-500 font-sans mt-1 leading-relaxed">
              Êtes-vous sûr de vouloir retirer{' '}
              <span className="font-semibold text-navy">{member.name}</span> de l'équipe ?
              Cette action est irréversible.
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1" disabled={removing}>
            Annuler
          </button>
          <button
            onClick={handleRemove}
            disabled={removing}
            className="btn-danger flex-1 flex items-center justify-center gap-2"
          >
            {removing ? <Loader2 size={15} className="animate-spin" /> : <XCircle size={15} />}
            {removing ? 'Retrait…' : 'Retirer'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Permissions config ────────────────────────────────────────────────────────
const MODULES = [
  { key: 'pos',             label: 'Point de vente',   icon: ShoppingCart, actions: ['view', 'create'] },
  { key: 'orders',          label: 'Commandes',         icon: Receipt,      actions: ['view', 'create', 'edit', 'delete'] },
  { key: 'products',        label: 'Produits',          icon: Package,      actions: ['view', 'create', 'edit', 'delete'] },
  { key: 'customers',       label: 'Clients',           icon: Users,        actions: ['view', 'create', 'edit', 'delete'] },
  { key: 'suppliers',       label: 'Fournisseurs',      icon: Truck,        actions: ['view', 'create', 'edit', 'delete'] },
  { key: 'expenses',        label: 'Dépenses',          icon: Tag,          actions: ['view', 'create', 'edit', 'delete'] },
  { key: 'purchase_orders', label: 'Bons de commande',  icon: Truck,        actions: ['view', 'create', 'edit', 'delete'] },
  { key: 'reports',         label: 'Rapports',          icon: BarChart2,    actions: ['view'] },
]

const ACTION_LABELS = { view: 'Voir', create: 'Créer', edit: 'Modifier', delete: 'Supprimer' }
const ACTION_ICONS  = { view: Eye, create: Plus, edit: Edit2, delete: Trash2 }

// Build default "all false" permission set
function buildEmpty() {
  const perms = {}
  MODULES.forEach(({ key, actions }) => {
    perms[key] = {}
    actions.forEach((a) => { perms[key][a] = false })
  })
  return perms
}

// Deep-merge stored permissions over empty template
function mergePerms(stored) {
  const base = buildEmpty()
  if (!stored) return base
  MODULES.forEach(({ key, actions }) => {
    actions.forEach((a) => {
      if (stored[key]?.[a] !== undefined) base[key][a] = !!stored[key][a]
    })
  })
  return base
}

// ── PermissionsCard ───────────────────────────────────────────────────────────
function PermissionsCard({ member, isAdmin, onSaved }) {
  const [perms,   setPerms]   = useState(() => mergePerms(member.module_permissions))
  const [saving,  setSaving]  = useState(false)
  const [dirty,   setDirty]   = useState(false)

  // Re-init when member changes
  useEffect(() => {
    setPerms(mergePerms(member.module_permissions))
    setDirty(false)
  }, [member.id, member.module_permissions])

  const toggle = (module, action) => {
    setPerms((prev) => ({
      ...prev,
      [module]: { ...prev[module], [action]: !prev[module][action] },
    }))
    setDirty(true)
  }

  const toggleAll = (module) => {
    const mod = perms[module]
    const allOn = Object.values(mod).every(Boolean)
    setPerms((prev) => ({
      ...prev,
      [module]: Object.fromEntries(Object.keys(mod).map((a) => [a, !allOn])),
    }))
    setDirty(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.patch('/team/members/' + member.id + '/permissions', { permissions: perms })
      toast.success('Permissions mises à jour.')
      setDirty(false)
      onSaved?.()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la mise à jour.')
    } finally {
      setSaving(false)
    }
  }

  if (isAdmin) {
    return (
      <div className="card p-4 sm:p-5">
        <h2 className="font-display font-semibold text-navy mb-3 flex items-center gap-2">
          <Lock size={15} className="text-muted-400" />Permissions
        </h2>
        <div className="flex items-center gap-3 p-3 rounded-card bg-blue-50 border border-blue-200">
          <Shield size={16} className="text-blue-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-sans font-semibold text-blue-700">Administrateur</p>
            <p className="text-xs font-sans text-blue-500">Accès complet à toutes les fonctionnalités</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="card p-4 sm:p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display font-semibold text-navy flex items-center gap-2">
          <Lock size={15} className="text-muted-400" />Permissions
        </h2>
        {dirty && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary flex items-center gap-1.5 text-xs py-1.5 px-3"
          >
            {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        )}
      </div>

      <div className="space-y-1">
        {/* Header row */}
        <div className="grid grid-cols-[1fr_repeat(4,28px)] gap-1.5 items-center pb-1 mb-1">
          <span className="text-[10px] font-sans font-semibold text-muted-400 uppercase tracking-wide">Module</span>
          {['view', 'create', 'edit', 'delete'].map((a) => {
            const Icon = ACTION_ICONS[a]
            return (
              <div key={a} className="flex justify-center" title={ACTION_LABELS[a]}>
                <Icon size={11} className="text-muted-400" />
              </div>
            )
          })}
        </div>

        {MODULES.map(({ key, label, icon: ModIcon, actions }) => {
          const modPerms = perms[key] ?? {}
          const allOn    = actions.every((a) => modPerms[a])

          return (
            <div
              key={key}
              className="grid grid-cols-[1fr_repeat(4,28px)] gap-1.5 items-center py-2 border-b border-muted-100 last:border-0"
            >
              {/* Module label — click to toggle all */}
              <button
                type="button"
                onClick={() => toggleAll(key)}
                className="flex items-center gap-2 text-left group"
                title="Tout cocher/décocher"
              >
                <div className={cn(
                  'w-6 h-6 rounded-card flex items-center justify-center flex-shrink-0',
                  allOn ? 'bg-primary-100' : 'bg-muted-100',
                )}>
                  <ModIcon size={12} className={allOn ? 'text-primary-500' : 'text-muted-400'} />
                </div>
                <span className={cn(
                  'text-xs font-sans leading-tight',
                  allOn ? 'text-navy font-medium' : 'text-muted-500',
                )}>
                  {label}
                </span>
              </button>

              {/* Action checkboxes — render 4 slots, empty if action not in module */}
              {['view', 'create', 'edit', 'delete'].map((action) => {
                if (!actions.includes(action)) {
                  return <div key={action} />
                }
                const on = !!modPerms[action]
                return (
                  <div key={action} className="flex justify-center">
                    <button
                      type="button"
                      onClick={() => toggle(key, action)}
                      title={ACTION_LABELS[action]}
                      className={cn(
                        'w-5 h-5 rounded flex items-center justify-center border transition-all',
                        on
                          ? 'bg-primary-500 border-primary-500'
                          : 'bg-surface border-muted-300 hover:border-muted-500',
                      )}
                    >
                      {on && <CheckCircle2 size={11} className="text-white" />}
                    </button>
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 mt-3 pt-2 border-t border-muted-100 flex-wrap">
        {['view', 'create', 'edit', 'delete'].map((a) => {
          const Icon = ACTION_ICONS[a]
          return (
            <div key={a} className="flex items-center gap-1 text-[10px] font-sans text-muted-400">
              <Icon size={10} />{ACTION_LABELS[a]}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── InfoRow ───────────────────────────────────────────────────────────────────
function InfoRow({ icon: Icon, label, value }) {
  if (!value) return null
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-muted-100 last:border-0">
      <Icon size={14} className="text-muted-400 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-sans font-semibold text-muted-500 uppercase tracking-wide">
          {label}
        </p>
        <p className="text-sm font-sans text-navy truncate">{value}</p>
      </div>
    </div>
  )
}

// ── Page principale ───────────────────────────────────────────────────────────
export default function TeamMemberDetailPage() {
  const { id }       = useParams()
  const navigate     = useNavigate()
  const { user }     = useAuthStore()
  const { format: fmt } = useCurrency()

  const [member,   setMember]   = useState(null)
  const [activity, setActivity]       = useState([])
  const [performance, setPerformance] = useState([])
  const [lifetimeStats, setLifetimeStats] = useState(null)
  const [loading,  setLoading]        = useState(true)

  const [showRoleModal,   setShowRoleModal]   = useState(false)
  const [showRemoveModal, setShowRemoveModal] = useState(false)

  // Pagination activité
  const [activityPage, setActivityPage] = useState(1)
  const ACTIVITY_PER_PAGE = 10

  const isSelf = user?.id === Number(id) || user?.id === id

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.get('/team/members/' + id)
      setMember(res.data.data.member)
      setActivity(res.data.data.activity ?? [])
      setPerformance(res.data.data.performance ?? [])
      setLifetimeStats(res.data.data.lifetime_stats ?? null)
    } catch {
      toast.error('Membre introuvable.')
      navigate('/team')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id])

  // Reset pagination when member changes
  useEffect(() => { setActivityPage(1) }, [id])

  // ── Loading skeleton ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={24} className="animate-spin text-primary-500" />
      </div>
    )
  }

  if (!member) return null

  const memberRole      = member.roles?.[0] ?? 'viewer'
  const roleCfg         = ROLE_CONFIG[memberRole] ?? ROLE_CONFIG.viewer
  const lastLogin       = member.last_login_at ? fmtDate(member.last_login_at) : 'Jamais'
  const memberIsAdmin   = memberRole === 'admin'

  return (
    <div className="space-y-5">

      {/* Breadcrumb + header ─────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          {/* Breadcrumb */}
          <Link
            to="/team"
            className="inline-flex items-center gap-1.5 text-xs font-sans text-muted-500 hover:text-navy transition-colors"
          >
            <ChevronLeft size={14} />Équipe
          </Link>

          {/* Identity */}
          <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
            <MemberAvatar member={member} size="lg" />
            <div>
              <h1 className="text-xl sm:text-2xl font-display font-bold text-navy leading-tight flex items-center gap-2 flex-wrap">
                {member.name}
                {isSelf && (
                  <span className="text-xs font-sans text-muted-500 bg-muted-100 px-2 py-0.5 rounded-badge">
                    Vous
                  </span>
                )}
              </h1>
              <p className="text-sm font-sans text-muted-500 mt-0.5">{member.email}</p>

              {/* Badges */}
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {/* Role badge */}
                <span
                  className={cn(
                    'inline-flex items-center gap-1 text-xs font-sans font-semibold px-2.5 py-1 rounded-badge',
                    roleCfg.badgeClass,
                  )}
                >
                  <Shield size={10} />
                  {roleCfg.label}
                </span>

                {/* Status badge */}
                <span
                  className={cn(
                    'inline-flex items-center gap-1 text-xs font-sans font-semibold px-2.5 py-1 rounded-badge',
                    member.is_active ? 'bg-green-50 text-success' : 'bg-muted-100 text-muted-500',
                  )}
                >
                  <span
                    className={cn(
                      'w-1.5 h-1.5 rounded-full',
                      member.is_active ? 'bg-success' : 'bg-muted-400',
                    )}
                  />
                  {member.is_active ? 'Actif' : 'Inactif'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 flex-shrink-0 flex-wrap">
          <button onClick={load} className="btn-secondary p-2.5" title="Rafraîchir">
            <RefreshCw size={15} />
          </button>
          {!isSelf && (
            <>
              <button
                onClick={() => setShowRoleModal(true)}
                className="btn-secondary flex items-center gap-2"
              >
                <Shield size={14} />
                <span className="hidden sm:inline">Modifier le rôle</span>
                <span className="sm:hidden">Rôle</span>
              </button>
              <button
                onClick={() => setShowRemoveModal(true)}
                className="btn-danger flex items-center gap-2"
              >
                <XCircle size={14} />
                <span className="hidden sm:inline">Retirer de l'équipe</span>
                <span className="sm:hidden">Retirer</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Stats ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <StatBox
          icon={Calendar}
          label="Membre depuis"
          value={fmtDate(member.created_at)}
        />
        <StatBox
          icon={TrendingUp}
          label="Ventes globales"
          value={lifetimeStats ? fmt(lifetimeStats.total_sales) : '—'}
        />
        <StatBox
          icon={Activity}
          label="Commandes traitées"
          value={lifetimeStats ? lifetimeStats.orders_count : '—'}
        />
        <StatBox
          icon={Shield}
          label="Dépenses initiées"
          value={lifetimeStats ? fmt(lifetimeStats.total_expenses) : '—'}
        />
      </div>

      {/* Corps principal ─────────────────────────────────────────────────── */}
      {(() => {
        const activityTotal = activity.length
        const activityPages = Math.ceil(activityTotal / ACTIVITY_PER_PAGE)
        const pagedActivity = activity.slice(
          (activityPage - 1) * ACTIVITY_PER_PAGE,
          activityPage * ACTIVITY_PER_PAGE,
        )
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            {/* Colonne gauche — Activité récente + Permissions ────────────── */}
            <div className="md:col-span-2 space-y-4">

              {/* Activité récente */}
              <div className="card p-4 sm:p-5">
                <h2 className="font-display font-semibold text-navy mb-4 flex items-center gap-2">
                  <Activity size={15} className="text-muted-400" />Activité récente
                </h2>

                {activityTotal === 0 ? (
                  <div className="text-center py-8">
                    <Activity size={28} className="mx-auto text-muted-200 mb-2" />
                    <p className="text-xs font-sans text-muted-400">
                      Aucune activité enregistrée pour ce membre.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-1">
                      {pagedActivity.map((log) => {
                        const { Icon, color } = getActivityIcon(log.action)
                        const label = getActivityLabel(log.action)
                        return (
                          <div
                            key={log.id}
                            className="flex items-start gap-3 py-2.5 border-b border-muted-100 last:border-0"
                          >
                            <div
                              className={cn(
                                'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
                                color,
                              )}
                            >
                              <Icon size={13} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-sans text-navy leading-snug">{label}</p>
                              {log.properties && Object.keys(log.properties).length > 0 && (
                                <p className="text-[11px] font-sans text-muted-400 mt-0.5 truncate">
                                  {log.properties.name ?? log.properties.to ?? ''}
                                </p>
                              )}
                            </div>
                            <span className="text-[11px] font-sans text-muted-400 flex-shrink-0 mt-0.5">
                              {fmtDate(log.created_at)}
                            </span>
                          </div>
                        )
                      })}
                    </div>

                    {/* Pagination */}
                    {activityPages > 1 && (
                      <div className="flex items-center justify-between pt-3 mt-1 border-t border-muted-100">
                        <span className="text-xs font-sans text-muted-400">
                          {(activityPage - 1) * ACTIVITY_PER_PAGE + 1}–{Math.min(activityPage * ACTIVITY_PER_PAGE, activityTotal)} sur {activityTotal}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setActivityPage((p) => Math.max(1, p - 1))}
                            disabled={activityPage === 1}
                            className="px-2.5 py-1 text-xs font-sans rounded-btn border border-muted-200 text-muted-600 hover:bg-muted-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                          >
                            ← Préc.
                          </button>
                          {Array.from({ length: activityPages }, (_, i) => i + 1).map((p) => (
                            <button
                              key={p}
                              onClick={() => setActivityPage(p)}
                              className={cn(
                                'w-7 h-7 text-xs font-sans rounded-btn border transition-colors',
                                p === activityPage
                                  ? 'bg-primary-500 border-primary-500 text-white font-semibold'
                                  : 'border-muted-200 text-muted-600 hover:bg-muted-50',
                              )}
                            >
                              {p}
                            </button>
                          ))}
                          <button
                            onClick={() => setActivityPage((p) => Math.min(activityPages, p + 1))}
                            disabled={activityPage === activityPages}
                            className="px-2.5 py-1 text-xs font-sans rounded-btn border border-muted-200 text-muted-600 hover:bg-muted-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                          >
                            Suiv. →
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Permissions */}
              {!isSelf && (
                <PermissionsCard
                  member={member}
                  isAdmin={memberIsAdmin}
                  onSaved={load}
                />
              )}

            </div>

            {/* Colonne droite — Informations + Performances ───────────────── */}
            <div className="space-y-4">

              {/* Informations */}
              <div className="card p-4 sm:p-5">
                <h2 className="font-display font-semibold text-navy mb-3 flex items-center gap-2">
                  <UserCircle2 size={15} className="text-muted-400" />Informations
                </h2>
                <div>
                  <InfoRow icon={Mail}  label="E-mail" value={member.email} />
                  {member.phone && (
                    <InfoRow icon={Phone} label="Téléphone" value={member.phone} />
                  )}
                  <div className="flex items-center gap-3 py-2.5">
                    <Shield size={14} className="text-muted-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-sans font-semibold text-muted-500 uppercase tracking-wide">
                        ID interne
                      </p>
                      <p className="text-sm font-mono text-muted-400">#{member.id}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Performances */}
              <div className="card p-4 sm:p-5">
                <h2 className="font-display font-semibold text-navy mb-3 flex items-center gap-2">
                  <TrendingUp size={15} className="text-muted-400" />Performances (Ventes)
                </h2>
                <div className="h-48 mt-4">
                  {performance.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                      <BarChart data={performance} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} tickFormatter={(val) => val > 1000 ? `${(val/1000).toFixed(1)}k` : val} />
                        <Tooltip
                          formatter={(value) => [`${value} FCFA`, 'Ventes']}
                          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                          labelStyle={{ fontWeight: 'bold', color: '#1E293B', marginBottom: '4px' }}
                        />
                        <Bar dataKey="Ventes" fill="#3B82F6" radius={[2, 2, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-muted-300">
                      <TrendingUp size={24} className="mb-2" />
                      <p className="text-xs font-sans text-center">Aucune donnée disponible</p>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        )
      })()}

      {/* Modals ──────────────────────────────────────────────────────────── */}
      {showRoleModal && (
        <ChangeRoleModal
          member={member}
          onClose={() => setShowRoleModal(false)}
          onSuccess={() => { setShowRoleModal(false); load() }}
        />
      )}

      {showRemoveModal && (
        <RemoveModal
          member={member}
          onClose={() => setShowRemoveModal(false)}
          onSuccess={() => navigate('/team')}
        />
      )}
    </div>
  )
}
