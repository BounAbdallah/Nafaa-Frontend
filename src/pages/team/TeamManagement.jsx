import { useEffect, useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { teamService } from '@/services/teamService'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'
import {
  UserPlus, UserX, Crown, Shield, Eye, Mail,
  MoreHorizontal, X, Check, Loader2, Users,
  ClipboardList,
} from 'lucide-react'
import { cn } from '@/utils/cn'

// ── Constantes rôles ──────────────────────────────────────────────────────────
const ROLES = [
  {
    value: 'admin',
    label: 'Administrateur',
    icon: Crown,
    description: 'Accès complet à l\'espace de travail',
    color: 'text-amber-600 bg-amber-50 border-amber-200',
  },
  {
    value: 'employee',
    label: 'Employé',
    icon: Shield,
    description: 'Peut créer et modifier les données',
    color: 'text-primary-600 bg-primary-50 border-primary-200',
  },
  {
    value: 'viewer',
    label: 'Lecteur',
    icon: Eye,
    description: 'Lecture seule',
    color: 'text-muted-600 bg-muted-100 border-muted-300',
  },
]

const ROLE_MAP = Object.fromEntries(ROLES.map(r => [r.value, r]))

const ACTIVITY_LABELS = {
  'user.invited':      { label: 'a invité',        color: 'text-success' },
  'user.removed':      { label: 'a retiré',         color: 'text-danger' },
  'user.role_changed': { label: 'a changé le rôle de', color: 'text-primary-600' },
  'user.blocked':      { label: 'a bloqué',         color: 'text-danger' },
}

// ── Schemas de validation ─────────────────────────────────────────────────────
const inviteSchema = z.object({
  name:  z.string().min(2, 'Nom requis'),
  email: z.string().email('E-mail invalide'),
  role:  z.enum(['admin', 'employee', 'viewer'], { required_error: 'Rôle requis' }),
})

// ── Modal invitation/View ────────────────────────────────────────────────────────
function InviteModal({ onClose, onSuccess, member = null, readOnly = false }) {
  const { register, handleSubmit, watch, setValue, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(inviteSchema),
    defaultValues: member 
      ? { name: member.name, email: member.email, role: member.roles?.[0] }
      : { role: 'employee' },
  })

  useEffect(() => {
    if (member) reset({ name: member.name, email: member.email, role: member.roles?.[0] })
  }, [member, reset])
  const selectedRole = watch('role')
  const [tempPassword, setTempPassword] = useState(null)

  const onSubmit = async (data) => {
    try {
      const res = await teamService.invite(data)
      if (res.data.temp_password) setTempPassword(res.data.temp_password)
      else { toast.success(res.message); onSuccess() }
    } catch (err) {
      const msg = err.response?.data?.errors?.email?.[0]
             || err.response?.data?.message
             || 'Erreur lors de l\'invitation.'
      toast.error(msg)
    }
  }

  if (tempPassword) {
    return (
      <div className="fixed inset-0 bg-navy/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-surface rounded-modal shadow-2xl w-full max-w-md p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-card bg-green-50 flex items-center justify-center">
              <Check className="w-5 h-5 text-success" />
            </div>
            <div>
              <h3 className="font-display font-bold text-navy">Membre invité</h3>
              <p className="text-xs text-muted-500 font-sans">Compte créé avec succès</p>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-card p-4 space-y-2">
            <p className="text-xs font-sans font-semibold text-amber-700 uppercase tracking-wide">
              Mot de passe temporaire
            </p>
            <code className="block text-sm font-mono font-bold text-navy bg-white border border-amber-200 rounded-btn px-3 py-2">
              {tempPassword}
            </code>
            <p className="text-xs text-amber-600 font-sans">
              Communiquez ce mot de passe au membre. Il pourra le modifier à sa première connexion.
            </p>
          </div>

          <button
            onClick={() => { onSuccess(); onClose() }}
            className="btn-primary w-full"
          >
            Fermer
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-navy/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-modal shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-0">
          <div>
            <h3 className="font-display font-bold text-navy">Inviter un membre</h3>
            <p className="text-xs text-muted-500 font-sans mt-0.5">Ajoutez quelqu'un à votre équipe</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-muted-500 hover:text-navy rounded-btn hover:bg-muted-100">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
          {/* Nom */}
          <div className="space-y-1.5">
            <label className="block text-xs font-sans font-semibold text-muted-700 uppercase tracking-wide">Nom complet</label>
            <input
              {...register('name')}
              disabled={readOnly}
              placeholder="ex: Mariama Bah"
              className={cn('input-field', errors.name && 'border-danger focus:border-danger focus:ring-danger/20')}
            />
            {errors.name && <p className="text-xs text-danger">{errors.name.message}</p>}
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="block text-xs font-sans font-semibold text-muted-700 uppercase tracking-wide">Adresse e-mail</label>
            <div className="relative">
              <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-500" />
              <input
                {...register('email')}
                disabled={readOnly}
                type="email"
                placeholder="membre@exemple.com"
                className={cn('input-field pl-9', errors.email && 'border-danger focus:border-danger focus:ring-danger/20')}
              />
            </div>
            {errors.email && <p className="text-xs text-danger">{errors.email.message}</p>}
          </div>

          {/* Rôle */}
          <div className="space-y-2">
            <label className="block text-xs font-sans font-semibold text-muted-700 uppercase tracking-wide">Rôle</label>
            <div className="space-y-2">
              {ROLES.map(role => (
                <button
                  key={role.value}
                  type="button"
                  disabled={readOnly}
                  onClick={() => setValue('role', role.value)}
                  className={cn(
                    'w-full flex items-center gap-3 p-3 rounded-card border text-left transition-all',
                    selectedRole === role.value
                      ? 'border-primary-300 bg-primary-50'
                      : 'border-muted-300 bg-surface hover:border-muted-500',
                    readOnly && 'cursor-default'
                  )}
                >
                  <div className={cn('w-8 h-8 rounded-card flex items-center justify-center flex-shrink-0 border', role.color)}>
                    <role.icon size={15} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-sans font-semibold text-navy">{role.label}</p>
                    <p className="text-xs text-muted-500">{role.description}</p>
                  </div>
                  {selectedRole === role.value && (
                    <Check size={15} className="text-primary-500 flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
            {errors.role && <p className="text-xs text-danger">{errors.role.message}</p>}
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">{readOnly ? 'Fermer' : 'Annuler'}</button>
            {!readOnly && (
              <button type="submit" disabled={isSubmitting} className="btn-primary flex-1 flex items-center justify-center gap-2">
                {isSubmitting ? <Loader2 size={15} className="animate-spin" /> : <UserPlus size={15} />}
                {isSubmitting ? 'Invitation…' : 'Inviter'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Menu actions d'un membre ──────────────────────────────────────────────────
function MemberActions({ member, currentUserId, onRoleChange, onRemove }) {
  const [open, setOpen] = useState(false)
  const isSelf = member.id === currentUserId
  const isSuperAdmin = member.roles?.includes('super_admin')

  if (isSelf || isSuperAdmin) return null

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="p-1.5 rounded-btn text-muted-500 hover:text-navy hover:bg-muted-100 transition-colors"
      >
        <MoreHorizontal size={16} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-8 z-20 bg-surface border border-muted-300 rounded-card shadow-lg w-48 py-1 overflow-hidden">
            <p className="px-3 py-1.5 text-[10px] font-sans font-semibold text-muted-500 uppercase tracking-wider">
              Changer le rôle
            </p>
            {ROLES.filter(r => !member.roles?.includes(r.value)).map(role => (
              <button
                key={role.value}
                onClick={() => { onRoleChange(member, role.value); setOpen(false) }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm font-sans text-navy hover:bg-muted-100 transition-colors"
              >
                <role.icon size={13} className="text-muted-500" />
                {role.label}
              </button>
            ))}
            <div className="border-t border-muted-100 mt-1 pt-1">
              <button
                onClick={() => { onRemove(member); setOpen(false) }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm font-sans text-danger hover:bg-danger/5 transition-colors"
              >
                <UserX size={13} />
                Retirer de l'équipe
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ── Widget activité ───────────────────────────────────────────────────────────
function ActivityWidget({ logs, loading }) {
  const formatTime = (iso) => {
    const d = new Date(iso)
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-4">
        <ClipboardList size={16} className="text-primary-500" />
        <h3 className="font-display font-semibold text-navy text-sm">Activité récente</h3>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="w-6 h-6 rounded-full bg-muted-100 flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 bg-muted-100 rounded w-3/4" />
                <div className="h-2.5 bg-muted-100 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : logs.length === 0 ? (
        <p className="text-xs text-muted-500 font-sans text-center py-4">Aucune activité pour l'instant.</p>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => {
            const meta = ACTIVITY_LABELS[log.action]
            return (
              <div key={log.id} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-[9px] font-display font-bold text-white">
                    {log.user?.name?.[0]?.toUpperCase() ?? '?'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-sans text-navy leading-relaxed">
                    <span className="font-semibold">{log.user?.name ?? 'Système'}</span>
                    {' '}
                    <span className={meta?.color}>{meta?.label ?? log.action}</span>
                    {log.properties?.name && (
                      <> <span className="font-semibold">{log.properties.name}</span></>
                    )}
                    {log.properties?.to && (
                      <> → <span className="font-semibold">{ROLE_MAP[log.properties.to]?.label ?? log.properties.to}</span></>
                    )}
                  </p>
                  <p className="text-[10px] text-muted-500 mt-0.5">{formatTime(log.created_at)}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Page principale ───────────────────────────────────────────────────────────
export default function TeamManagement() {
  const { user } = useAuthStore()
  const [members, setMembers]     = useState([])
  const [logs, setLogs]           = useState([])
  const [loading, setLoading]     = useState(true)
  const [logsLoading, setLogsLoading] = useState(true)
  const [showInvite, setShowInvite]   = useState(false)
  const [viewMember, setViewMember]   = useState(null)

  const fetchMembers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await teamService.getMembers()
      setMembers(res.data.members)
    } catch { toast.error('Impossible de charger l\'équipe.') }
    finally { setLoading(false) }
  }, [])

  const fetchLogs = useCallback(async () => {
    setLogsLoading(true)
    try {
      const res = await teamService.getActivity(15)
      setLogs(res.data.logs)
    } catch (err) {
      console.error('Erreur chargement activité:', err)
    } finally { setLogsLoading(false) }
  }, [])

  useEffect(() => { fetchMembers(); fetchLogs() }, [fetchMembers, fetchLogs])

  const handleRoleChange = async (member, newRole) => {
    try {
      await teamService.updateRole(member.id, newRole)
      toast.success(`Rôle de ${member.name} mis à jour.`)
      fetchMembers(); fetchLogs()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors du changement de rôle.')
    }
  }

  const handleRemove = async (member) => {
    if (!window.confirm(`Retirer ${member.name} de l'équipe ?`)) return
    try {
      await teamService.removeMember(member.id)
      toast.success(`${member.name} a été retiré.`)
      fetchMembers(); fetchLogs()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors du retrait.')
    }
  }

  const isAdmin = user?.roles?.includes('admin')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-navy">Équipe</h1>
          <p className="text-sm font-sans text-muted-500 mt-1">
            {loading ? '…' : `${members.length} membre${members.length > 1 ? 's' : ''}`}
          </p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowInvite(true)} className="btn-primary flex items-center gap-2">
            <UserPlus size={16} />
            Inviter un membre
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Tableau membres */}
        <div className="lg:col-span-2 card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-muted-300 bg-muted-100/50">
                  <th className="text-left py-3 px-4 text-xs font-sans font-semibold text-muted-700 uppercase tracking-wide">Membre</th>
                  <th className="text-left py-3 px-4 text-xs font-sans font-semibold text-muted-700 uppercase tracking-wide">Rôle</th>
                  <th className="text-left py-3 px-4 text-xs font-sans font-semibold text-muted-700 uppercase tracking-wide hidden md:table-cell">Statut</th>
                  {isAdmin && <th className="py-3 px-4 w-10" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-muted-100">
                {loading ? (
                  [...Array(3)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-muted-100" />
                          <div>
                            <div className="h-3.5 w-28 bg-muted-100 rounded mb-1.5" />
                            <div className="h-3 w-20 bg-muted-100 rounded" />
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4"><div className="h-5 w-20 bg-muted-100 rounded-badge" /></td>
                      <td className="py-3 px-4 hidden md:table-cell"><div className="h-5 w-12 bg-muted-100 rounded-badge" /></td>
                      {isAdmin && <td className="py-3 px-4"><div className="h-6 w-6 bg-muted-100 rounded-btn ml-auto" /></td>}
                    </tr>
                  ))
                ) : members.map(member => {
                  const roleInfo = ROLE_MAP[member.roles?.[0]]
                  const isSelf = member.id === user?.id
                  return (
                    <tr key={member.id} className="hover:bg-muted-100/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-display font-bold text-white">
                              {member.name?.[0]?.toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-sans font-semibold text-navy flex items-center gap-1.5">
                              {member.name}
                              {isSelf && (
                                <span className="text-[10px] font-sans text-muted-500 bg-muted-100 px-1.5 py-0.5 rounded-badge">Vous</span>
                              )}
                            </p>
                            <p className="text-xs text-muted-500">{member.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {roleInfo ? (
                          <span className={cn('inline-flex items-center gap-1 text-xs font-sans font-semibold px-2 py-0.5 rounded-badge border', roleInfo.color)}>
                            <roleInfo.icon size={10} />
                            {roleInfo.label}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-300">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 hidden md:table-cell">
                        <span className={cn(
                          'inline-flex items-center gap-1 text-xs font-sans font-semibold px-2 py-0.5 rounded-badge',
                          member.is_active ? 'bg-green-50 text-success' : 'bg-red-50 text-danger'
                        )}>
                          <span className={cn('w-1.5 h-1.5 rounded-full', member.is_active ? 'bg-success' : 'bg-danger')} />
                          {member.is_active ? 'Actif' : 'Bloqué'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link to={`/team/${member.id}`} className="p-1.5 rounded-btn text-muted-500 hover:text-primary-500 hover:bg-primary-50 transition-colors" title="Voir détails">
                            <Eye size={14} />
                          </Link>
                          {isAdmin && (
                            <MemberActions
                              member={member}
                              currentUserId={user?.id}
                              onRoleChange={handleRoleChange}
                              onRemove={handleRemove}
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Activité */}
        <ActivityWidget logs={logs} loading={logsLoading} />
      </div>

      {/* Modal invitation */}
      {(showInvite || viewMember) && (
        <InviteModal
          member={viewMember}
          readOnly={!!viewMember}
          onClose={() => { setShowInvite(false); setViewMember(null) }}
          onSuccess={() => { fetchMembers(); fetchLogs(); setShowInvite(false); setViewMember(null) }}
        />
      )}
    </div>
  )
}
