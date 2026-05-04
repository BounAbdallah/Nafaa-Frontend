import { useEffect, useState } from 'react'
import { adminService } from '@/services/adminService'
import {
  Building2,
  Search,
  CheckCircle2,
  XCircle,
  MoreVertical,
  Activity,
} from 'lucide-react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { cn } from '@/utils/cn'
import toast from 'react-hot-toast'

const INDUSTRIES = [
  { value: 'retail', label: 'Vente au détail' },
  { value: 'wholesale', label: 'Gros & Demi-gros' },
  { value: 'manufacturing', label: 'Fabrication / Artisanat' },
  { value: 'services', label: 'Prestations de services' },
]

export default function TenantsManagement() {
  const [tenants, setTenants] = useState([])
  const [meta, setMeta] = useState(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [industryFilter, setIndustryFilter] = useState('')

  const fetchTenants = async (page = 1) => {
    setLoading(true)
    try {
      const res = await adminService.getTenants({
        search,
        industry: industryFilter,
        page,
        per_page: 20
      })
      setTenants(res.data.tenants)
      setMeta(res.data.meta)
    } catch (error) {
      toast.error('Erreur lors du chargement des espaces')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTenants()
    }, 500)
    return () => clearTimeout(timer)
  }, [search, industryFilter])

  const toggleTenantStatus = async (tenant) => {
    if (!window.confirm(`Voulez-vous vraiment ${tenant.is_active ? 'désactiver' : 'activer'} l'espace ${tenant.name} ?`)) {
      return
    }
    
    try {
      await adminService.updateTenant(tenant.id, { is_active: !tenant.is_active })
      toast.success(`Espace ${tenant.is_active ? 'désactivé' : 'activé'} avec succès`)
      fetchTenants(meta?.current_page || 1)
    } catch (error) {
      toast.error('Erreur lors de la modification du statut')
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-black text-navy flex items-center gap-2">
            <Building2 className="text-primary-500" />
            Espaces de Travail
          </h1>
          <p className="text-sm text-muted-500 mt-1">
            Gérez tous les locataires (Tenants) enregistrés sur la plateforme.
          </p>
        </div>
      </div>

      <Card className="!p-0 overflow-hidden">
        <div className="p-4 border-b border-muted-200 bg-muted-50/50 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-400" />
            <input
              type="text"
              placeholder="Rechercher par nom ou slug..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-muted-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
            />
          </div>
          <div className="w-full sm:w-64">
            <select
              value={industryFilter}
              onChange={(e) => setIndustryFilter(e.target.value)}
              className="w-full px-4 py-2 text-sm rounded-lg border border-muted-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all appearance-none"
            >
              <option value="">Toutes les industries</option>
              {INDUSTRIES.map(i => (
                <option key={i.value} value={i.value}>{i.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted-50/50 text-muted-500 border-b border-muted-200 font-sans uppercase tracking-wider text-[10px] font-bold">
              <tr>
                <th className="px-6 py-4">Espace</th>
                <th className="px-6 py-4">Industrie / Profil</th>
                <th className="px-6 py-4">Plan</th>
                <th className="px-6 py-4">Utilisateurs</th>
                <th className="px-6 py-4">Créé le</th>
                <th className="px-6 py-4 text-center">Statut</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-muted-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-muted-400">
                    <Activity className="w-6 h-6 animate-spin mx-auto mb-2 opacity-50" />
                    Chargement des espaces...
                  </td>
                </tr>
              ) : tenants.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-muted-400">
                    Aucun espace trouvé.
                  </td>
                </tr>
              ) : (
                tenants.map((tenant) => (
                  <tr key={tenant.id} className="hover:bg-muted-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-navy">{tenant.name}</div>
                      <div className="text-xs text-muted-500 font-mono mt-0.5">{tenant.slug}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-navy">{INDUSTRIES.find(i => i.value === tenant.industry)?.label || tenant.industry || '-'}</div>
                      <div className="text-xs text-muted-500 uppercase tracking-wider">{tenant.profile_type || '-'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-primary-50 text-primary-700 uppercase">
                        {tenant.plan || 'Free'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold">{tenant.users_count || 1}</span> membres
                    </td>
                    <td className="px-6 py-4 text-muted-500 text-xs">
                      {new Date(tenant.created_at).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold",
                        tenant.is_active ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
                      )}>
                        {tenant.is_active ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                        {tenant.is_active ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => toggleTenantStatus(tenant)}
                        className="text-muted-400 hover:text-navy p-1.5 rounded hover:bg-muted-100 transition-colors"
                        title={tenant.is_active ? "Désactiver l'espace" : "Activer l'espace"}
                      >
                        <MoreVertical size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {!loading && meta && meta.last_page > 1 && (
          <div className="p-4 border-t border-muted-200 flex items-center justify-between bg-muted-50/50">
            <span className="text-xs text-muted-500 font-medium">
              Affichage {((meta.current_page - 1) * meta.per_page) + 1} à Math.min(meta.current_page * meta.per_page, meta.total) sur {meta.total} espaces
            </span>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                disabled={meta.current_page === 1}
                onClick={() => fetchTenants(meta.current_page - 1)}
              >
                Précédent
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                disabled={meta.current_page === meta.last_page}
                onClick={() => fetchTenants(meta.current_page + 1)}
              >
                Suivant
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
