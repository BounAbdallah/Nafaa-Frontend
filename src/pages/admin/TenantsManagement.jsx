import { useEffect, useState } from 'react'
import { adminService } from '@/services/adminService'
import { PROFILE_META, MODULE_IDS } from '@/utils/modulePermissions'
import { 
  Building2, 
  Search, 
  Filter, 
  MoreHorizontal, 
  ChevronRight, 
  CheckCircle2, 
  XCircle,
  Shield,
  Zap,
  ArrowUpDown,
  LayoutGrid
} from 'lucide-react'
import { cn } from '@/utils/cn'
import toast from 'react-hot-toast'
import Button from '@/components/ui/Button'

export default function TenantsManagement() {
  const [tenants, setTenants] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [meta, setMeta] = useState(null)
  const [updatingId, setUpdatingId] = useState(null)

  const fetchTenants = async (params = {}) => {
    setLoading(true)
    try {
      const res = await adminService.getTenants(params)
      setTenants(res.data.tenants)
      setMeta(res.data.meta)
    } catch (err) {
      toast.error('Erreur lors du chargement des espaces de travail')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTenants()
  }, [])

  const handleProfileUpdate = async (id, profile) => {
    setUpdatingId(id)
    try {
      await adminService.updateTenantProfile(id, profile)
      toast.success('Profil mis à jour avec succès')
      fetchTenants()
    } catch (err) {
      toast.error('Erreur lors de la mise à jour')
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-navy flex items-center gap-2">
            <Building2 className="w-6 h-6 text-primary-500" />
            Espaces de travail
          </h1>
          <p className="text-sm font-sans text-muted-500 mt-1">
            Gérez les tenants et configurez leurs profils d'activité
          </p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="card p-4 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-400" />
          <input
            type="text"
            placeholder="Rechercher un espace..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchTenants({ search })}
            className="w-full bg-bg border border-muted-200 rounded-btn pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all"
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Button variant="ghost" size="sm" className="gap-2">
            <Filter className="w-4 h-4" />
            Filtrer
          </Button>
          <Button variant="primary" size="sm" onClick={() => fetchTenants({ search })}>
            Rechercher
          </Button>
        </div>
      </div>

      {/* Tenants Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted-50/50 border-b border-muted-200">
                <th className="px-6 py-4 text-xs font-display font-bold text-muted-500 uppercase tracking-wider">Entreprise</th>
                <th className="px-6 py-4 text-xs font-display font-bold text-muted-500 uppercase tracking-wider">Profil</th>
                <th className="px-6 py-4 text-xs font-display font-bold text-muted-500 uppercase tracking-wider">Plan</th>
                <th className="px-6 py-4 text-xs font-display font-bold text-muted-500 uppercase tracking-wider">Statut</th>
                <th className="px-6 py-4 text-xs font-display font-bold text-muted-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-muted-100">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-4 bg-muted-100 rounded w-32" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-muted-100 rounded w-24" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-muted-100 rounded w-16" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-muted-100 rounded w-20" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-muted-100 rounded w-8 ml-auto" /></td>
                  </tr>
                ))
              ) : tenants.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-muted-500">
                    Aucun espace de travail trouvé
                  </td>
                </tr>
              ) : (
                tenants.map((tenant) => (
                  <tr key={tenant.id} className="hover:bg-muted-50/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-modal bg-primary-50 border border-primary-100 flex items-center justify-center text-primary-600 font-display font-bold">
                          {tenant.name[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-display font-bold text-navy text-sm">{tenant.name}</p>
                          <p className="text-xs text-muted-500">{tenant.industry_label}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5">
                        <select
                          disabled={updatingId === tenant.id}
                          value={tenant.profile_type}
                          onChange={(e) => handleProfileUpdate(tenant.id, e.target.value)}
                          className={cn(
                            "text-xs font-display font-bold px-2 py-1 rounded-badge border outline-none transition-all cursor-pointer",
                            PROFILE_META[tenant.profile_type]?.color || "bg-muted-100 text-muted-600 border-muted-200"
                          )}
                        >
                          {Object.entries(PROFILE_META).map(([key, meta]) => (
                            <option key={key} value={key}>{meta.label}</option>
                          ))}
                        </select>
                        <span className="text-[10px] text-muted-400 flex items-center gap-1">
                          <LayoutGrid className="w-3 h-3" />
                          {PROFILE_META[tenant.profile_type]?.modules} modules actifs
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-gold" />
                        <span className="text-sm font-sans font-medium text-navy capitalize">{tenant.plan}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {tenant.is_active ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 text-green-700 text-[10px] font-display font-bold border border-green-100">
                          <CheckCircle2 className="w-3 h-3" /> Actif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 text-red-700 text-[10px] font-display font-bold border border-red-100">
                          <XCircle className="w-3 h-3" /> Suspendu
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 text-muted-400 hover:text-navy hover:bg-muted-100 rounded-btn transition-all">
                        <MoreHorizontal className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta && meta.last_page > 1 && (
          <div className="px-6 py-4 border-t border-muted-200 bg-muted-50/50 flex items-center justify-between">
            <p className="text-xs text-muted-500 font-sans">
              Affichage de {tenants.length} sur {meta.total} espaces
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                disabled={meta.current_page === 1}
                onClick={() => fetchTenants({ page: meta.current_page - 1, search })}
              >
                Précédent
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={meta.current_page === meta.last_page}
                onClick={() => fetchTenants({ page: meta.current_page + 1, search })}
              >
                Suivant
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
