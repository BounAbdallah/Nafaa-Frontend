import { useEffect, useState } from 'react'
import { confirmDialog } from '@/utils/confirm'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { adminService } from '@/services/adminService'
import {
  Building2, ArrowLeft, Power, RefreshCw, Users, Package,
  CheckCircle2, XCircle, Mail, Phone, Calendar, Globe,
  ShieldCheck, User, Clock, ExternalLink, LayoutGrid,
} from 'lucide-react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { cn } from '@/utils/cn'
import toast from 'react-hot-toast'

const INDUSTRY_LABEL = {
  retail:        'Vente au détail',
  wholesale:     'Gros & Demi-gros',
  manufacturing: 'Fabrication / Artisanat',
  services:      'Prestations de services',
}

const ROLE_COLOR = {
  super_admin: 'bg-purple-100 text-purple-700',
  admin:       'bg-primary-100 text-primary-700',
  manager:     'bg-amber-100 text-amber-700',
  employee:    'bg-muted-100 text-muted-600',
  viewer:      'bg-muted-100 text-muted-500',
}

function RoleBadge({ role }) {
  return (
    <span className={cn('inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full', ROLE_COLOR[role] ?? ROLE_COLOR.viewer)}>
      {role === 'super_admin' && <ShieldCheck size={10} />}
      {role ?? 'member'}
    </span>
  )
}

export default function TenantDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [tenant,  setTenant]  = useState(null)
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await adminService.getTenant(id)
      setTenant(res.data?.tenant ?? null)
      setMembers(res.data?.members ?? [])
    } catch {
      toast.error('Impossible de charger cet espace')
      navigate('/admin/tenants')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [id])

  const toggleStatus = async () => {
    if (!tenant) return
    const action = tenant.is_active ? 'désactiver' : 'activer'
    if (!(await confirmDialog({ title: `${action.charAt(0).toUpperCase() + action.slice(1)} cet espace ?`, text: `Espace « ${tenant.name} » — cette action affecte tous ses membres.`, confirmText: action.charAt(0).toUpperCase() + action.slice(1), type: tenant.is_active ? 'danger' : 'info' }))) return
    try {
      await adminService.updateTenant(tenant.id, { is_active: !tenant.is_active })
      toast.success(`Espace ${tenant.is_active ? 'désactivé' : 'activé'}`)
      fetchData()
    } catch {
      toast.error('Erreur lors de la modification')
    }
  }

  // ── Skeleton ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-muted-100 rounded w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-surface rounded-card p-6 h-48" />
            <div className="bg-surface rounded-card p-6 h-64" />
          </div>
          <div className="bg-surface rounded-card p-6 h-72" />
        </div>
      </div>
    )
  }

  if (!tenant) return null

  const enabledModules = tenant.settings?.enabled_modules ?? []

  return (
    <div className="space-y-6 animate-in fade-in duration-300">

      {/* ── Breadcrumb & Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin/tenants')}
            className="p-2 rounded-lg text-muted-400 hover:text-navy hover:bg-muted-100 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <Building2 size={20} className="text-primary-500" />
              <h1 className="text-xl font-display font-black text-navy">{tenant.name}</h1>
              <span className={cn(
                'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold',
                tenant.is_active
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-red-50 text-red-600 border border-red-200'
              )}>
                {tenant.is_active ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                {tenant.is_active ? 'Actif' : 'Inactif'}
              </span>
            </div>
            <p className="text-xs text-muted-400 font-mono mt-0.5">slug : {tenant.slug}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            className="p-2 text-muted-400 hover:text-primary-500 rounded-lg hover:bg-muted-100 transition-colors"
            title="Rafraîchir"
          >
            <RefreshCw size={16} />
          </button>
          <Button
            variant={tenant.is_active ? 'danger' : 'primary'}
            size="sm"
            onClick={toggleStatus}
            className="flex items-center gap-2"
          >
            <Power size={14} />
            {tenant.is_active ? "Désactiver l'espace" : "Activer l'espace"}
          </Button>
        </div>
      </div>

      {/* ── Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Colonne gauche (2/3) ── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Infos générales */}
          <Card>
            <h2 className="font-display font-bold text-navy text-sm mb-4 flex items-center gap-2">
              <Building2 size={15} className="text-primary-400" />
              Informations de l'espace
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoRow label="Nom" value={tenant.name} />
              <InfoRow label="Slug" value={<span className="font-mono text-xs">{tenant.slug}</span>} />
              <InfoRow
                label="Industrie"
                value={INDUSTRY_LABEL[tenant.industry] ?? tenant.industry ?? '—'}
              />
              <InfoRow
                label="Plan / Pack"
                value={
                  tenant.pack ? (
                    <Link
                      to={`/admin/packs/${tenant.pack.id}`}
                      className="flex items-center gap-1.5 text-primary-600 hover:underline font-semibold"
                    >
                      <Package size={13} />
                      {tenant.pack.name}
                      <ExternalLink size={11} />
                    </Link>
                  ) : (
                    <span className="font-mono text-xs uppercase text-muted-500">{tenant.plan ?? 'Free'}</span>
                  )
                }
              />
              <InfoRow
                label="Créé le"
                value={new Date(tenant.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
              />
              <InfoRow
                label="Membres"
                value={<span className="font-semibold">{members.length}</span>}
              />
            </div>
          </Card>

          {/* Propriétaire */}
          {tenant.owner && (
            <Card>
              <h2 className="font-display font-bold text-navy text-sm mb-4 flex items-center gap-2">
                <User size={15} className="text-primary-400" />
                Propriétaire
              </h2>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center font-bold text-primary-700 text-sm">
                    {tenant.owner.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-semibold text-navy">{tenant.owner.name}</div>
                    <div className="text-xs text-muted-400">{tenant.owner.email}</div>
                  </div>
                </div>
                <Link to={`/admin/users/${tenant.owner.id}`}>
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <ExternalLink size={13} />
                    Voir le profil
                  </Button>
                </Link>
              </div>
            </Card>
          )}

          {/* Membres */}
          <Card className="!p-0 overflow-hidden">
            <div className="px-5 py-4 border-b border-muted-100 flex items-center justify-between">
              <h2 className="font-display font-bold text-navy text-sm flex items-center gap-2">
                <Users size={15} className="text-primary-400" />
                Membres ({members.length})
              </h2>
            </div>
            {members.length === 0 ? (
              <div className="px-6 py-10 text-center text-muted-400 text-sm">
                Aucun membre dans cet espace.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted-50 border-b border-muted-100">
                    <tr>
                      {['Nom', 'Email', 'Rôle', 'E-mail vérifié', 'Membre depuis'].map(h => (
                        <th key={h} className="px-5 py-3 text-left text-[11px] font-bold text-muted-500 uppercase tracking-wider whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                      <th className="px-5 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-muted-100">
                    {members.map(m => (
                      <tr key={m.id} className="hover:bg-muted-50/40 transition-colors group">
                        <td className="px-5 py-3 font-medium text-navy whitespace-nowrap">
                          {m.name}
                        </td>
                        <td className="px-5 py-3 text-muted-500 text-xs">{m.email}</td>
                        <td className="px-5 py-3">
                          <RoleBadge role={m.role} />
                        </td>
                        <td className="px-5 py-3">
                          {m.email_verified_at
                            ? <span className="text-green-600 flex items-center gap-1 text-xs"><CheckCircle2 size={12} /> Vérifié</span>
                            : <span className="text-amber-500 flex items-center gap-1 text-xs"><Clock size={12} /> En attente</span>
                          }
                        </td>
                        <td className="px-5 py-3 text-xs text-muted-400 whitespace-nowrap">
                          {new Date(m.created_at).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="px-5 py-3">
                          <Link
                            to={`/admin/users/${m.id}`}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded text-muted-400 hover:text-primary-600 hover:bg-primary-50 inline-flex"
                            title="Voir le profil"
                          >
                            <ExternalLink size={13} />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        {/* ── Colonne droite (1/3) ── */}
        <div className="space-y-6">

          {/* Modules actifs */}
          <Card>
            <h2 className="font-display font-bold text-navy text-sm mb-4 flex items-center gap-2">
              <LayoutGrid size={15} className="text-primary-400" />
              Modules activés
            </h2>
            {enabledModules.length === 0 ? (
              <p className="text-xs text-muted-400">Aucun module configuré (pack par défaut).</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {enabledModules.map(mod => (
                  <span key={mod} className="inline-flex px-2.5 py-1 rounded-full bg-primary-50 text-primary-700 text-xs font-semibold border border-primary-100">
                    {mod}
                  </span>
                ))}
              </div>
            )}
          </Card>

          {/* Actions rapides */}
          <Card>
            <h2 className="font-display font-bold text-navy text-sm mb-4">Actions rapides</h2>
            <div className="space-y-2">
              <Link to={`/admin/subscriptions`} className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-800 font-medium p-2 rounded-lg hover:bg-primary-50 transition-colors">
                <Package size={14} />
                Voir les abonnements
              </Link>
              <Link to={`/admin/tenants`} className="flex items-center gap-2 text-sm text-muted-600 hover:text-navy font-medium p-2 rounded-lg hover:bg-muted-50 transition-colors">
                <Building2 size={14} />
                Tous les espaces
              </Link>
            </div>
          </Card>

          {/* Danger zone */}
          <Card className="border-red-100">
            <h2 className="font-display font-bold text-red-600 text-sm mb-3">Zone sensible</h2>
            <p className="text-xs text-muted-500 mb-3">
              {tenant.is_active
                ? "Désactiver cet espace bloquera l'accès à tous ses membres."
                : "Activer cet espace rétablira l'accès à tous ses membres."}
            </p>
            <button
              onClick={toggleStatus}
              className={cn(
                'w-full py-2 rounded-lg text-sm font-semibold border transition-colors',
                tenant.is_active
                  ? 'border-red-200 text-red-600 hover:bg-red-50'
                  : 'border-green-200 text-green-700 hover:bg-green-50'
              )}
            >
              <Power size={13} className="inline mr-2" />
              {tenant.is_active ? "Désactiver l'espace" : "Activer l'espace"}
            </button>
          </Card>
        </div>
      </div>
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] font-bold text-muted-400 uppercase tracking-wider">{label}</span>
      <span className="text-sm text-navy">{value ?? <span className="text-muted-300">—</span>}</span>
    </div>
  )
}
