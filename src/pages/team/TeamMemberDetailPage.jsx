import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import api from '@/services/api'
import toast from 'react-hot-toast'
import {
  ChevronLeft, UserCircle2, Mail, Phone, Shield, Clock,
  Activity, X, Loader2, CheckCircle2, XCircle, Calendar,
  RefreshCw,
} from 'lucide-react'
import { cn } from '@/utils/cn'

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
  const sizeClass = size === 'lg' ? 'w-20 h-20 text-2xl' : 'w-10 h-10 text-base'
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
    <div className="card p-4 flex flex-col items-center text-center gap-2">
      <div className="w-9 h-9 rounded-card bg-primary-50 flex items-center justify-center">
        <Icon size={16} className="text-primary-500" />
      </div>
      <p className="text-sm font-display font-bold text-navy leading-snug">{value ?? '—'}</p>
      <p className="text-xs font-sans text-muted-500">{label}</p>
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
    <div className="fixed inset-0 bg-navy/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-modal shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-0">
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
    <div className="fixed inset-0 bg-navy/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-modal shadow-2xl w-full max-w-sm p-6 space-y-5">
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

  const [member,   setMember]   = useState(null)
  const [activity, setActivity] = useState([])
  const [loading,  setLoading]  = useState(true)

  const [showRoleModal,   setShowRoleModal]   = useState(false)
  const [showRemoveModal, setShowRemoveModal] = useState(false)

  const isSelf = user?.id === Number(id) || user?.id === id

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.get('/team/members/' + id)
      setMember(res.data.data.member)
      setActivity(res.data.data.activity ?? [])
    } catch {
      toast.error('Membre introuvable.')
      navigate('/team')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id])

  // ── Loading skeleton ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={24} className="animate-spin text-primary-500" />
      </div>
    )
  }

  if (!member) return null

  const memberRole   = member.roles?.[0] ?? 'viewer'
  const roleCfg      = ROLE_CONFIG[memberRole] ?? ROLE_CONFIG.viewer
  const lastLogin    = member.last_login_at ? fmtDate(member.last_login_at) : 'Jamais'

  return (
    <div className="space-y-5">

      {/* Breadcrumb + header ─────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          {/* Breadcrumb */}
          <Link
            to="/team"
            className="inline-flex items-center gap-1.5 text-xs font-sans text-muted-500 hover:text-navy transition-colors"
          >
            <ChevronLeft size={14} />Équipe
          </Link>

          {/* Identity */}
          <div className="flex items-center gap-4 flex-wrap">
            <MemberAvatar member={member} size="lg" />
            <div>
              <h1 className="text-2xl font-display font-bold text-navy leading-tight flex items-center gap-2 flex-wrap">
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
        <div className="flex gap-2 flex-shrink-0 flex-wrap justify-end">
          <button onClick={load} className="btn-secondary p-2.5" title="Rafraîchir">
            <RefreshCw size={15} />
          </button>
          {!isSelf && (
            <>
              <button
                onClick={() => setShowRoleModal(true)}
                className="btn-secondary flex items-center gap-2"
              >
                <Shield size={14} />Modifier le rôle
              </button>
              <button
                onClick={() => setShowRemoveModal(true)}
                className="btn-danger flex items-center gap-2"
              >
                <XCircle size={14} />Retirer de l'équipe
              </button>
            </>
          )}
        </div>
      </div>

      {/* Stats ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatBox
          icon={Calendar}
          label="Membre depuis"
          value={fmtDate(member.created_at)}
        />
        <StatBox
          icon={Clock}
          label="Dernière connexion"
          value={lastLogin}
        />
        <StatBox
          icon={Shield}
          label="Rôle"
          value={roleCfg.label}
        />
      </div>

      {/* Corps principal ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Colonne gauche — Activité récente ──────────────────────────────── */}
        <div className="md:col-span-2">
          <div className="card p-5">
            <h2 className="font-display font-semibold text-navy mb-4 flex items-center gap-2">
              <Activity size={15} className="text-muted-400" />Activité récente
            </h2>

            {activity.length === 0 ? (
              <div className="text-center py-8">
                <Activity size={28} className="mx-auto text-muted-200 mb-2" />
                <p className="text-xs font-sans text-muted-400">
                  Aucune activité enregistrée pour ce membre.
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {activity.map((log) => {
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
            )}
          </div>
        </div>

        {/* Colonne droite — Informations + Accès ──────────────────────────── */}
        <div className="space-y-4">

          {/* Informations */}
          <div className="card p-5">
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

          {/* Accès */}
          <div className="card p-5">
            <h2 className="font-display font-semibold text-navy mb-3 flex items-center gap-2">
              <Shield size={15} className="text-muted-400" />Accès
            </h2>
            <div
              className={cn(
                'flex items-center gap-3 p-3 rounded-card border',
                roleCfg.borderClass,
                roleCfg.badgeClass,
              )}
            >
              <Shield size={16} className="flex-shrink-0" />
              <div>
                <p className="text-sm font-sans font-semibold">{roleCfg.label}</p>
                <p className="text-xs font-sans opacity-80">{roleCfg.description}</p>
              </div>
            </div>
          </div>

        </div>
      </div>

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
