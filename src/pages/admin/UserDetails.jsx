import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { adminService } from '@/services/adminService'
import { PROFILE_META, MODULE_IDS, MODULE_PERMISSIONS } from '@/utils/modulePermissions'
import { useCurrency } from '@/utils/currency'
import toast from 'react-hot-toast'
import {
  ArrowLeft,
  Mail,
  Building2,
  Calendar,
  ShieldCheck,
  UserX,
  UserCheck,
  Phone,
  ExternalLink,
  History,
  Activity,
  Shield,
  Loader2,
  Users,
  Settings,
  Zap,
  Globe,
  Lock,
  Unlock,
  XCircle,
  Clock,
  LayoutGrid
} from 'lucide-react'
import { cn } from '@/utils/cn'
import Button from '@/components/ui/Button'

const ROLE_BADGE = {
  super_admin: 'bg-purple-100 text-purple-700',
  admin:       'bg-primary-100 text-primary-700',
  employee:    'bg-amber-100 text-amber-700',
  viewer:      'bg-muted-100 text-muted-700',
}

// Labels lisibles pour chaque module
const MODULE_LABELS = {
  dashboard:       { label: 'Tableau de bord', icon: '📊' },
  pos:             { label: 'Point de Vente',  icon: '🛒' },
  products:        { label: 'Produits & Stock', icon: '📦' },
  customers:       { label: 'Clients (CRM)',   icon: '👥' },
  orders:          { label: 'Commandes Ventes', icon: '🧾' },
  suppliers:       { label: 'Fournisseurs',    icon: '🚚' },
  'purchase-orders': { label: 'Cmd. Fournisseurs', icon: '📋' },
  expenses:        { label: 'Dépenses',        icon: '💸' },
  reports:         { label: 'Rapports & Stats', icon: '📈' },
  team:            { label: 'Équipe',          icon: '🧑‍💼' },
  production:      { label: 'Production (BOM)', icon: '⚙️' },
  prestateur:      { label: 'Prestateur',      icon: '🤝' },
  settings:        { label: 'Paramètres',      icon: '⚙️' },
}

function ModuleModal({ tenant, pack, onSaveModules, onClose }) {
  const packModules   = pack?.features ?? []
  const profileModules = MODULE_PERMISSIONS[tenant.profile_type] ?? Object.values(MODULE_IDS)

  const [enabledModules, setEnabledModules] = useState(
    tenant.settings?.enabled_modules
      ?? packModules
      ?? profileModules
  )
  const [loading, setLoading] = useState(false)

  const handleToggle = (modId) => {
    if (modId === 'dashboard' || modId === 'settings') return
    setEnabledModules(prev =>
      prev.includes(modId) ? prev.filter(id => id !== modId) : [...prev, modId]
    )
  }

  const handleResetToPack = () => {
    if (packModules.length > 0) setEnabledModules(packModules)
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      await onSaveModules(tenant.id, enabledModules)
      onClose()
    } catch {
      toast.error('Erreur lors de la mise à jour')
    } finally {
      setLoading(false)
    }
  }

  const displayModules = [...new Set([...profileModules, ...enabledModules])]

  const isOverridden = (modId) =>
    packModules.length > 0 &&
    packModules.includes(modId) !== enabledModules.includes(modId)

  return (
    /* Bottom sheet on mobile, centered on sm+ */
    <div className="fixed inset-0 bg-navy/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-surface rounded-t-2xl sm:rounded-modal shadow-2xl w-full sm:max-w-xl max-h-[95dvh] sm:max-h-[90vh] flex flex-col animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">

        {/* Fixed header */}
        <div className="bg-navy p-4 sm:p-6 text-white flex items-center justify-between shrink-0 rounded-t-2xl sm:rounded-t-modal">
          <div>
            <h3 className="text-lg font-display font-bold">Modules activés</h3>
            <p className="text-white/60 text-sm font-sans">{tenant.name}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <XCircle size={24} />
          </button>
        </div>

        {/* Info banner */}
        {pack && (
          <div className="px-4 sm:px-6 py-3 bg-primary-50 border-b border-primary-100 flex items-center justify-between gap-4 shrink-0">
            <p className="text-xs text-primary-700 font-sans">
              <span className="font-bold">Pack actuel :</span> {pack.name} — {packModules.length} modules inclus
            </p>
            <button
              onClick={handleResetToPack}
              className="text-xs font-bold text-primary-600 hover:text-primary-800 underline shrink-0"
            >
              Réinitialiser
            </button>
          </div>
        )}

        {/* Module grid — scrollable body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          <p className="text-[11px] font-bold text-muted-500 uppercase tracking-widest mb-4">
            Cliquez pour activer / désactiver un module
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Object.values(MODULE_IDS).map((modId) => {
              const meta       = MODULE_LABELS[modId] ?? { label: modId, icon: '🔧' }
              const isActive   = enabledModules.includes(modId)
              const isLocked   = modId === 'dashboard' || modId === 'settings'
              const inPack     = packModules.includes(modId)
              const overridden = isOverridden(modId)

              return (
                <button
                  key={modId}
                  onClick={() => handleToggle(modId)}
                  disabled={isLocked}
                  className={cn(
                    'relative flex items-center gap-3 p-3 rounded-btn border text-left text-sm font-medium transition-all',
                    isLocked  && 'cursor-default opacity-70',
                    isActive  && !isLocked ? 'bg-primary-50 border-primary-200 text-primary-800'
                              : !isActive ? 'bg-white border-muted-100 text-muted-400 opacity-50'
                              : ''
                  )}
                >
                  <div className={cn(
                    'w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all',
                    isActive ? 'bg-primary-500 border-primary-500' : 'bg-white border-muted-200'
                  )}>
                    {isActive && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                  </div>

                  <div className="min-w-0 flex-1">
                    <span className="block truncate">{meta.icon} {meta.label}</span>
                    {inPack && !overridden && (
                      <span className="text-[9px] font-bold text-primary-400 uppercase tracking-wider">Pack</span>
                    )}
                    {overridden && (
                      <span className="text-[9px] font-bold text-amber-500 uppercase tracking-wider">Override</span>
                    )}
                    {isLocked && (
                      <span className="text-[9px] font-bold text-muted-400 uppercase tracking-wider">Requis</span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Fixed footer */}
        <div className="p-4 sm:p-6 bg-muted-50 flex items-center justify-between gap-3 border-t border-muted-200 shrink-0">
          <p className="text-xs text-muted-500">
            {enabledModules.length} module(s) activé(s)
          </p>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={onClose}>Annuler</Button>
            <Button variant="primary" onClick={handleSave} disabled={loading} className="px-6 sm:px-8">
              {loading ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function UserDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { format: fmt } = useCurrency()
  const [user, setUser] = useState(null)
  const [packs, setPacks] = useState([])
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [showModules, setShowModules] = useState(false)

  const fetchData = async () => {
    try {
      const [userRes, packsRes] = await Promise.all([
        adminService.getUser(id),
        adminService.getPacks()
      ])
      setUser(userRes.data.user)
      setLogs(userRes.data.logs || [])
      setPacks(packsRes.data.packs)
    } catch (err) {
      toast.error('Erreur lors du chargement des données')
      navigate('/admin/users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [id, navigate])

  const handleToggleUserStatus = async () => {
    if (!user) return
    setActionLoading(true)
    try {
      if (user.is_active) {
        await adminService.blockUser(user.id, 'Désactivé par le Super Admin')
        toast.success('Utilisateur bloqué')
      } else {
        await adminService.unblockUser(user.id)
        toast.success('Utilisateur débloqué')
      }
      fetchData()
    } catch (err) {
      toast.error('Une erreur est survenue')
    } finally {
      setActionLoading(false)
    }
  }

  const handleUpdateTenant = async (tenantId, payload) => {
    setActionLoading(true)
    try {
      await adminService.updateTenant(tenantId, payload)
      toast.success('Mise à jour réussie')
      fetchData()
    } catch (err) {
      toast.error('Erreur lors de la mise à jour')
    } finally {
      setActionLoading(false)
    }
  }

  const handleSaveModules = async (tenantId, enabledModules) => {
    await adminService.updateTenantModules(tenantId, enabledModules)
    toast.success('Modules mis à jour')
    fetchData()
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
    </div>
  )

  const isOwner = user.tenant && user.tenant.owner_id === user.id
  const tenant = user.tenant

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <button
            onClick={() => navigate('/admin/users')}
            className="flex items-center gap-2 text-muted-500 hover:text-navy transition-colors font-sans text-xs uppercase font-bold tracking-widest"
          >
            <ArrowLeft size={14} />
            Retour à la liste
          </button>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-display font-bold text-navy">Gestion de Compte</h1>
            {!user.is_active && (
              <span className="px-2 py-1 bg-red-100 text-red-600 rounded text-[10px] font-black uppercase tracking-tighter">Compte Suspendu</span>
            )}
          </div>
        </div>

        <div className="flex gap-2 shrink-0">
          {user.roles?.includes('super_admin') ? (
            <span className="px-3 sm:px-4 py-2 bg-muted-100 text-muted-500 rounded-btn text-sm font-semibold flex items-center gap-2">
              <Shield size={16} />
              <span className="hidden sm:inline">Accès Système Protégé</span>
              <span className="sm:hidden">Protégé</span>
            </span>
          ) : (
            <Button
              onClick={handleToggleUserStatus}
              disabled={actionLoading}
              variant={user.is_active ? 'danger' : 'success'}
              className="gap-2"
            >
              {user.is_active ? <Lock size={16} /> : <Unlock size={16} />}
              <span className="hidden sm:inline">
                {user.is_active ? "Suspendre l'utilisateur" : "Réactiver l'utilisateur"}
              </span>
              <span className="sm:hidden">
                {user.is_active ? 'Suspendre' : 'Réactiver'}
              </span>
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: User Profile (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="card p-4 sm:p-6 flex flex-col items-center text-center relative overflow-hidden">
            {/* Decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/5 rounded-full -translate-y-16 translate-x-16" />

            <div className="w-20 sm:w-24 h-20 sm:h-24 rounded-full bg-primary-500 flex items-center justify-center mb-4 ring-4 ring-primary-50 shadow-lg relative">
              <span className="text-2xl sm:text-3xl font-display font-black text-white">
                {user.name?.[0]?.toUpperCase()}
              </span>
              <div className={cn(
                "absolute bottom-0 right-0 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center shadow-sm",
                user.is_active ? "bg-success text-white" : "bg-danger text-white"
              )}>
                {user.is_active ? <UserCheck size={12} /> : <UserX size={12} />}
              </div>
            </div>

            <h2 className="text-lg sm:text-xl font-display font-bold text-navy">{user.name}</h2>
            <div className="flex flex-wrap justify-center gap-2 mt-2">
              {user.roles?.map(r => (
                <span key={r} className={cn("px-2.5 py-0.5 rounded-badge text-[10px] font-bold uppercase tracking-wider", ROLE_BADGE[r])}>
                  {r}
                </span>
              ))}
            </div>

            <div className="w-full h-px bg-muted-100 my-4 sm:my-6" />

            <div className="w-full space-y-4 text-left">
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-btn bg-muted-50 flex items-center justify-center text-muted-400 shrink-0">
                  <Mail size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] uppercase font-bold text-muted-400 tracking-widest">Identifiant / Email</p>
                  <p className="text-navy font-medium truncate">{user.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-btn bg-muted-50 flex items-center justify-center text-muted-400 shrink-0">
                  <Calendar size={16} />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] uppercase font-bold text-muted-400 tracking-widest">Date d'inscription</p>
                  <p className="text-navy font-medium">
                    {new Date(user.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>

              {user.phone && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-btn bg-muted-50 flex items-center justify-center text-muted-400 shrink-0">
                    <Phone size={16} />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] uppercase font-bold text-muted-400 tracking-widest">Contact direct</p>
                    <p className="text-navy font-medium">{user.phone}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Connection History */}
          <div className="card p-4 sm:p-6">
            <h3 className="text-sm font-display font-bold text-navy flex items-center gap-2 mb-5">
              <Clock size={16} className="text-primary-500" />
              Historique de Connexion
            </h3>

            <div className="space-y-4">
              {logs.length > 0 ? logs.map((log) => (
                <div key={log.id} className="flex items-center gap-3 group">
                  <div className="w-1 h-8 rounded-full bg-primary-100 group-hover:bg-primary-500 transition-colors shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-navy">Connexion réussie</p>
                    <p className="text-[10px] text-muted-500 font-sans">
                      {new Date(log.created_at).toLocaleString('fr-FR')} • IP: {log.ip_address || '—'}
                    </p>
                  </div>
                </div>
              )) : (
                <div className="text-center py-4 text-xs text-muted-400 font-sans italic">
                  Aucun historique disponible
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Tenant Management (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {tenant ? (
            <>
              {/* Workspace Overview */}
              <div className="card overflow-hidden">
                <div className="bg-navy p-4 sm:p-6 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 sm:w-14 h-12 sm:h-14 rounded-card bg-white/10 flex items-center justify-center text-white ring-1 ring-white/20 shrink-0">
                      {tenant.logo ? <img src={tenant.logo} alt="Logo" className="w-full h-full object-cover rounded-card" /> : <Building2 size={24} />}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-lg sm:text-xl font-display font-bold truncate">{tenant.name}</h3>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className="flex items-center gap-1.5 text-xs text-white/60">
                          <Globe size={14} /> {tenant.slug}.qiwam.app
                        </span>
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest",
                          tenant.is_active ? "bg-success/20 text-green-400" : "bg-danger/20 text-red-400"
                        )}>
                          {tenant.is_active ? 'Actif' : 'Inactif'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 shrink-0">
                    <Button
                      variant="ghost"
                      className="bg-white/5 hover:bg-white/10 text-white border-white/10 text-sm"
                      onClick={() => handleUpdateTenant(tenant.id, { is_active: !tenant.is_active })}
                      disabled={actionLoading}
                    >
                      {tenant.is_active ? "Désactiver" : "Réactiver"}
                    </Button>
                  </div>
                </div>

                <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {/* Activity Profile */}
                  <div className="card bg-muted-50/50 p-4 border-none">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-[10px] uppercase font-bold text-muted-400 tracking-widest">Profil d'activité</p>
                      <button onClick={() => setShowModules(true)} className="p-1.5 bg-white rounded-btn shadow-sm text-primary-500 hover:text-primary-600">
                        <Settings size={14} />
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={cn("w-2 h-2 rounded-full", PROFILE_META[tenant.profile_type]?.dot)} />
                      <span className="font-display font-bold text-navy text-sm">
                        {PROFILE_META[tenant.profile_type]?.label}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-500 mt-2 line-clamp-2">
                      {PROFILE_META[tenant.profile_type]?.description}
                    </p>
                  </div>

                  {/* Plan & Billing */}
                  <div className="card bg-muted-50/50 p-4 border-none">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-[10px] uppercase font-bold text-muted-400 tracking-widest">Abonnement</p>
                      <Zap size={14} className="text-gold" />
                    </div>
                    <select
                      className="bg-white border border-muted-200 rounded-btn px-2 py-1 text-sm font-bold text-navy w-full"
                      value={tenant.pack_id || ''}
                      onChange={(e) => handleUpdateTenant(tenant.id, { pack_id: e.target.value })}
                    >
                      <option value="" disabled>Sélectionner un pack</option>
                      {packs.map(pack => (
                        <option key={pack.id} value={pack.id}>
                          {pack.name} ({fmt(Number(pack.price))})
                        </option>
                      ))}
                    </select>
                    <div className="flex items-center justify-between mt-3 text-[10px] font-sans">
                      <span className="text-muted-500">Expire le :</span>
                      <span className="font-bold text-navy">
                        {tenant.plan_expires_at ? new Date(tenant.plan_expires_at).toLocaleDateString() : '—'}
                      </span>
                    </div>
                  </div>

                  {/* Usage Metrics */}
                  <div className="card bg-muted-50/50 p-4 border-none">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-[10px] uppercase font-bold text-muted-400 tracking-widest">Utilisation</p>
                      <Users size={14} className="text-muted-400" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-600">Utilisateurs</span>
                        <span className="text-xs font-bold text-navy">
                          {tenant.users_count} / {tenant.plan_limits?.users === -1 ? '∞' : tenant.plan_limits?.users}
                        </span>
                      </div>
                      <div className="w-full h-1 bg-muted-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary-500"
                          style={{ width: `${Math.min((tenant.users_count / (tenant.plan_limits?.users === -1 ? tenant.users_count : (tenant.plan_limits?.users || 1))) * 100, 100)}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[10px] text-muted-400">Volume stockage</span>
                        <span className="text-[10px] font-bold text-navy">{tenant.db_size || '0.0 MB'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Enabled Modules Bar */}
                <div className="px-4 sm:px-6 py-4 bg-white border-t border-muted-100">
                  <p className="text-[10px] uppercase font-bold text-muted-400 tracking-widest mb-3">Modules débloqués pour cet espace</p>
                  <div className="flex flex-wrap gap-2">
                    {tenant.settings?.enabled_modules?.map(mod => (
                      <span key={mod} className="inline-flex items-center gap-1.5 px-3 py-1 bg-surface border border-muted-200 rounded-badge text-[10px] font-bold text-navy uppercase tracking-wider">
                        <div className="w-1.5 h-1.5 bg-primary-500 rounded-full" />
                        {mod.replace('_', ' ')}
                      </span>
                    ))}
                    <button
                      onClick={() => setShowModules(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-muted-50 hover:bg-muted-100 rounded-badge text-[10px] font-bold text-muted-500 uppercase tracking-wider transition-colors"
                    >
                      <Settings size={10} /> Modifier
                    </button>
                  </div>
                </div>
              </div>

              {/* Warnings/Context for Owners */}
              {isOwner && (
                <div className="p-4 sm:p-5 bg-primary-50 border border-primary-100 rounded-card flex items-start gap-4">
                  <ShieldCheck size={24} className="text-primary-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-navy">Compte Propriétaire d'Espace</h4>
                    <p className="text-xs text-muted-600 mt-1 leading-relaxed">
                      Cet utilisateur est le responsable légal de l'espace de travail.
                      Toute modification de son statut ou du plan de facturation affectera l'ensemble de ses collaborateurs et leurs données associées.
                    </p>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="card p-8 sm:p-12 flex flex-col items-center text-center justify-center min-h-[200px] sm:min-h-[300px]">
              <div className="w-16 h-16 rounded-full bg-muted-50 flex items-center justify-center text-muted-300 mb-4">
                <LayoutGrid size={32} />
              </div>
              <h3 className="text-lg font-display font-bold text-navy">Aucun espace de travail rattaché</h3>
              <p className="text-sm text-muted-500 mt-2 max-w-sm">
                Cet utilisateur n'est actuellement lié à aucune boutique ou entreprise enregistrée sur la plateforme.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showModules && tenant && (
        <ModuleModal
          tenant={tenant}
          pack={packs.find(p => p.id === tenant.pack_id) ?? null}
          onSaveModules={handleSaveModules}
          onClose={() => setShowModules(false)}
        />
      )}
    </div>
  )
}
