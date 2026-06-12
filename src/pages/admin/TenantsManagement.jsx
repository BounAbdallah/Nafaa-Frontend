import { useEffect, useState, useCallback, useRef } from 'react'
import CountryFilter from '@/components/admin/CountryFilter'
import { confirmDialog } from '@/utils/confirm'
import { adminService } from '@/services/adminService'
import {
  Building2, Search, CheckCircle2, XCircle, Activity,
  ChevronLeft, ChevronRight, RefreshCw, Filter, X,
  Power, Eye, Users, Package,
} from 'lucide-react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { cn } from '@/utils/cn'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

const INDUSTRIES = [
  { value: 'retail',        label: 'Vente au détail' },
  { value: 'wholesale',     label: 'Gros & Demi-gros' },
  { value: 'manufacturing', label: 'Fabrication / Artisanat' },
  { value: 'services',      label: 'Prestations de services' },
]

export default function TenantsManagement() {
  const navigate = useNavigate()

  const [tenants,  setTenants]  = useState([])
  const [meta,     setMeta]     = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')
  const [industry, setIndustry] = useState('')
  const [status,   setStatus]   = useState('')          // '' | 'active' | 'inactive'
  const [country,  setCountry]  = useState('')

  // Debounce search
  const debounceRef = useRef(null)

  const fetchTenants = useCallback(async (page = 1) => {
    setLoading(true)
    try {
      const params = { page, per_page: 20 }
      if (search)   params.search   = search
      if (industry) params.industry = industry
      if (status)   params.status   = status
      if (country)  params.country  = country

      const res = await adminService.getTenants(params)
      setTenants(res.data?.tenants ?? [])
      setMeta(res.data?.meta ?? null)
    } catch {
      toast.error('Erreur lors du chargement des espaces')
    } finally {
      setLoading(false)
    }
  }, [search, industry, status, country])

  // Fetch on filter change (with debounce for search)
  useEffect(() => {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchTenants(1), search ? 400 : 0)
    return () => clearTimeout(debounceRef.current)
  }, [fetchTenants])

  const toggleStatus = async (tenant) => {
    const action = tenant.is_active ? 'désactiver' : 'activer'
    if (!(await confirmDialog({ title: `${action.charAt(0).toUpperCase() + action.slice(1)} cet espace ?`, text: `Espace « ${tenant.name} » — cette action affecte tous ses membres.`, confirmText: action.charAt(0).toUpperCase() + action.slice(1), type: tenant.is_active ? 'danger' : 'info' }))) return
    try {
      await adminService.updateTenant(tenant.id, { is_active: !tenant.is_active })
      toast.success(`Espace ${tenant.is_active ? 'désactivé' : 'activé'} avec succès`)
      fetchTenants(meta?.current_page ?? 1)
    } catch {
      toast.error('Erreur lors de la modification du statut')
    }
  }

  const resetFilters = () => { setSearch(''); setIndustry(''); setStatus('') }
  const hasFilters   = search || industry || status

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-300">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-black text-navy flex items-center gap-2">
            <Building2 className="text-primary-500" size={24} />
            Espaces de Travail
          </h1>
          <p className="text-sm text-muted-500 mt-1">
            Gérez tous les espaces enregistrés sur la plateforme.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <CountryFilter value={country} onChange={setCountry} className="w-44" />
          <button onClick={() => fetchTenants(meta?.current_page ?? 1)}
            className="p-2 text-muted-400 hover:text-primary-500 rounded-lg hover:bg-muted-100 transition-colors">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Stats rapides — 3 cols on mobile too */}
      {meta && (
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          {[
            { label: 'Total',     value: meta.total,           color: 'text-navy'        },
            { label: 'Actifs',    value: meta.active_count,    color: 'text-green-600'   },
            { label: 'Inactifs',  value: meta.inactive_count,  color: 'text-red-500'     },
          ].map(s => (
            <div key={s.label} className="bg-surface border border-muted-200 rounded-card px-3 sm:px-4 py-3 shadow-sm text-center">
              <div className={cn('text-xl sm:text-2xl font-black', s.color)}>{s.value ?? '—'}</div>
              <div className="text-[10px] sm:text-[11px] text-muted-400 font-medium mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      <Card className="!p-0 overflow-hidden">

        {/* Barre de filtres */}
        <div className="p-3 sm:p-4 border-b border-muted-200 bg-muted-50/50 flex flex-col sm:flex-row flex-wrap gap-3 items-stretch sm:items-center">
          <div className="flex items-center gap-1.5 text-xs font-bold text-muted-400 uppercase tracking-wider">
            <Filter size={13} /> Filtres
          </div>

          {/* Recherche */}
          <div className="relative flex-1 min-w-0 sm:min-w-[200px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-400" />
            <input
              type="text"
              placeholder="Nom ou slug…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-field pl-9 h-9 text-sm w-full"
            />
          </div>

          <div className="flex gap-2">
            {/* Industrie */}
            <select value={industry} onChange={e => setIndustry(e.target.value)}
              className="input-field h-9 text-sm flex-1 min-w-0">
              <option value="">Toutes industries</option>
              {INDUSTRIES.map(i => (
                <option key={i.value} value={i.value}>{i.label}</option>
              ))}
            </select>

            {/* Statut */}
            <select value={status} onChange={e => setStatus(e.target.value)}
              className="input-field h-9 text-sm w-28 sm:w-32">
              <option value="">Tous statuts</option>
              <option value="active">Actifs</option>
              <option value="inactive">Inactifs</option>
            </select>
          </div>

          {hasFilters && (
            <button onClick={resetFilters}
              className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-800 font-bold self-start">
              <X size={12} /> Réinitialiser
            </button>
          )}
        </div>

        {/* Table for sm+, card list for mobile */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted-50/50 border-b border-muted-200">
              <tr>
                {['Espace', 'Propriétaire', 'Pack / Plan', 'Membres', 'Industrie', 'Créé le', 'Statut', ''].map(h => (
                  <th key={h} className={cn(
                    "px-5 py-3 text-[11px] font-bold text-muted-500 uppercase tracking-wider whitespace-nowrap",
                    ['Membres', 'Créé le', 'Industrie'].includes(h) && "hidden md:table-cell",
                    ['Propriétaire', 'Pack / Plan'].includes(h) && "hidden lg:table-cell"
                  )}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-muted-100">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-5 py-4">
                      <div className="h-4 bg-muted-100 rounded w-32 mb-1" />
                      <div className="h-3 bg-muted-100 rounded w-20" />
                    </td>
                    {[...Array(6)].map((_, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-4 bg-muted-100 rounded w-24" />
                      </td>
                    ))}
                    <td className="px-5 py-4" />
                  </tr>
                ))
              ) : tenants.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center text-muted-400">
                    <Building2 size={36} className="mx-auto mb-3 opacity-20" />
                    <p className="font-semibold text-navy">Aucun espace trouvé</p>
                    {hasFilters && (
                      <button onClick={resetFilters} className="text-xs text-primary-600 mt-1 underline">
                        Effacer les filtres
                      </button>
                    )}
                  </td>
                </tr>
              ) : tenants.map(tenant => (
                <tr key={tenant.id} className="hover:bg-muted-50/40 transition-colors group">

                  {/* Espace */}
                  <td className="px-5 py-3">
                    <button
                      onClick={() => navigate(`/admin/tenants/${tenant.id}`)}
                      className="font-semibold text-navy hover:text-primary-600 transition-colors text-left"
                    >
                      {tenant.name}
                    </button>
                    <div className="text-[11px] text-muted-400 font-mono mt-0.5">{tenant.slug}</div>
                  </td>

                  {/* Propriétaire */}
                  <td className="px-5 py-3 hidden lg:table-cell">
                    {tenant.owner ? (
                      <>
                        <div className="text-navy text-sm">{tenant.owner.name}</div>
                        <div className="text-[11px] text-muted-400">{tenant.owner.email}</div>
                      </>
                    ) : (
                      <span className="text-muted-300 text-xs">—</span>
                    )}
                  </td>

                  {/* Pack / Plan */}
                  <td className="px-5 py-3 hidden lg:table-cell">
                    {tenant.pack ? (
                      <div className="flex items-center gap-1.5">
                        <Package size={12} className="text-primary-400 shrink-0" />
                        <span className="text-sm font-semibold text-primary-700">{tenant.pack.name}</span>
                      </div>
                    ) : (
                      <span className="inline-flex px-2 py-0.5 rounded text-[11px] font-bold bg-muted-100 text-muted-500 uppercase">
                        {tenant.plan || 'Free'}
                      </span>
                    )}
                  </td>

                  {/* Membres */}
                  <td className="px-5 py-3 hidden md:table-cell">
                    <div className="flex items-center gap-1.5 text-muted-600">
                      <Users size={13} className="text-muted-300" />
                      <span className="font-semibold">{tenant.users_count ?? 1}</span>
                    </div>
                  </td>

                  {/* Industrie */}
                  <td className="px-5 py-3 text-sm text-muted-600 hidden md:table-cell">
                    {tenant.industry_label || tenant.industry || <span className="text-muted-300">—</span>}
                  </td>

                  {/* Créé le */}
                  <td className="px-5 py-3 text-xs text-muted-400 whitespace-nowrap hidden md:table-cell">
                    {new Date(tenant.created_at).toLocaleDateString('fr-FR')}
                  </td>

                  {/* Statut */}
                  <td className="px-5 py-3">
                    <span className={cn(
                      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold',
                      tenant.is_active
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'bg-red-50 text-red-600 border border-red-200'
                    )}>
                      {tenant.is_active ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                      {tenant.is_active ? 'Actif' : 'Inactif'}
                    </span>
                  </td>

                  {/* Actions — always visible */}
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => navigate(`/admin/tenants/${tenant.id}`)}
                        title="Voir le détail de l'espace"
                        className="p-1.5 rounded text-muted-400 hover:text-primary-600 hover:bg-primary-50 transition-colors">
                        <Eye size={14} />
                      </button>
                      <button
                        onClick={() => toggleStatus(tenant)}
                        title={tenant.is_active ? "Désactiver l'espace" : "Activer l'espace"}
                        className={cn(
                          'p-1.5 rounded transition-colors',
                          tenant.is_active
                            ? 'text-muted-400 hover:text-red-500 hover:bg-red-50'
                            : 'text-muted-400 hover:text-green-600 hover:bg-green-50'
                        )}>
                        <Power size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile card list */}
        <div className="sm:hidden divide-y divide-muted-100">
          {loading ? (
            [...Array(4)].map((_, i) => (
              <div key={i} className="p-4 animate-pulse space-y-2">
                <div className="h-4 bg-muted-100 rounded w-40" />
                <div className="h-3 bg-muted-100 rounded w-24" />
              </div>
            ))
          ) : tenants.length === 0 ? (
            <div className="px-6 py-12 text-center text-muted-400">
              <Building2 size={36} className="mx-auto mb-3 opacity-20" />
              <p className="font-semibold text-navy">Aucun espace trouvé</p>
              {hasFilters && (
                <button onClick={resetFilters} className="text-xs text-primary-600 mt-1 underline">
                  Effacer les filtres
                </button>
              )}
            </div>
          ) : tenants.map(tenant => (
            <div key={tenant.id} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <button
                  onClick={() => navigate(`/admin/tenants/${tenant.id}`)}
                  className="font-semibold text-navy hover:text-primary-600 transition-colors text-left"
                >
                  {tenant.name}
                </button>
                <span className={cn(
                  'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold shrink-0',
                  tenant.is_active
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-red-50 text-red-600 border border-red-200'
                )}>
                  {tenant.is_active ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
                  {tenant.is_active ? 'Actif' : 'Inactif'}
                </span>
              </div>
              <div className="text-[11px] text-muted-400 font-mono mt-0.5">{tenant.slug}</div>
              {tenant.owner && (
                <div className="text-xs text-muted-500 mt-1">{tenant.owner.name} · {tenant.owner.email}</div>
              )}
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-2 text-xs text-muted-500">
                  {tenant.pack ? (
                    <span className="flex items-center gap-1 font-semibold text-primary-700">
                      <Package size={11} /> {tenant.pack.name}
                    </span>
                  ) : (
                    <span className="uppercase font-bold">{tenant.plan || 'Free'}</span>
                  )}
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <Users size={11} /> {tenant.users_count ?? 1}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => navigate(`/admin/tenants/${tenant.id}`)}
                    className="p-1.5 rounded text-muted-400 hover:text-primary-600 hover:bg-primary-50 transition-colors">
                    <Eye size={14} />
                  </button>
                  <button
                    onClick={() => toggleStatus(tenant)}
                    className={cn(
                      'p-1.5 rounded transition-colors',
                      tenant.is_active
                        ? 'text-muted-400 hover:text-red-500 hover:bg-red-50'
                        : 'text-muted-400 hover:text-green-600 hover:bg-green-50'
                    )}>
                    <Power size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {!loading && meta && meta.last_page > 1 && (
          <div className="px-4 sm:px-5 py-3 border-t border-muted-100 bg-muted-50/50 flex items-center justify-between">
            <span className="text-xs text-muted-500">
              {((meta.current_page - 1) * meta.per_page) + 1}–{Math.min(meta.current_page * meta.per_page, meta.total)} sur {meta.total}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchTenants(meta.current_page - 1)}
                disabled={meta.current_page === 1}
                className="p-1.5 rounded border border-muted-200 text-muted-500 hover:bg-muted-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                <ChevronLeft size={14} />
              </button>
              <span className="text-xs font-bold text-navy">
                {meta.current_page} / {meta.last_page}
              </span>
              <button
                onClick={() => fetchTenants(meta.current_page + 1)}
                disabled={meta.current_page === meta.last_page}
                className="p-1.5 rounded border border-muted-200 text-muted-500 hover:bg-muted-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
