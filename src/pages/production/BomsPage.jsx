import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { bomService } from '@/services/bomService'
import toast from 'react-hot-toast'
import {
  Plus, Search, ClipboardList, Edit2, Trash2, X, Loader2,
  ChevronLeft, ChevronRight, RefreshCw, Info, CheckCircle2,
  XCircle, TrendingUp, Beaker, Package, DollarSign
} from 'lucide-react'
import { productService } from '@/services/productService'
import { cn } from '@/utils/cn'

const fmt = (n) => new Intl.NumberFormat('fr-FR').format(n ?? 0) + ' FCFA'

export default function BomsPage() {
  const { isAdmin } = useAuthStore()
  const [boms, setBoms] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [materialsCount, setMaterialsCount] = useState(0)

  const fetchBoms = useCallback(async () => {
    setLoading(true)
    try {
      const [res, matRes] = await Promise.all([
        bomService.getAll(),
        productService.getAll({ type: 'material', per_page: 1 })
      ])
      setBoms(res.data || [])
      setMaterialsCount(matRes.data?.meta?.total || 0)
    } catch (err) {
      toast.error('Erreur lors du chargement des données')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBoms()
  }, [fetchBoms])

  // Refresh when Qiwam assistant performs a BOM-related action
  useEffect(() => {
    const handler = (e) => {
      if (['list_boms', 'query_bom', 'launch_production', 'bulk_create_boms'].includes(e.detail?.action)) {
        fetchBoms()
      }
    }
    window.addEventListener('qiwam:ai-action', handler)
    return () => window.removeEventListener('qiwam:ai-action', handler)
  }, [fetchBoms])

  const stats = {
    count: boms.length,
    materials: materialsCount,
    estimatedValue: boms.reduce((acc, b) => acc + (b.product?.selling_price || 0) * b.quantity, 0)
  }

  const handleDelete = async (id) => {
    if (!confirm('Supprimer cette recette ?')) return
    try {
      await bomService.remove(id)
      toast.success('Recette supprimée')
      fetchBoms()
    } catch (err) {
      toast.error('Erreur lors de la suppression')
    }
  }

  const filteredBoms = boms.filter(b => 
    b.product?.name?.toLowerCase().includes(search.toLowerCase()) ||
    b.name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-black text-navy tracking-tight uppercase">Recettes de Fabrication (BOM)</h1>
          <p className="text-muted-500 text-sm">Définissez les ingrédients, les processus et optimisez vos coûts de revient.</p>
        </div>
        <div className="flex items-center gap-3">
          {isAdmin() && (
            <Link to="/production/boms/new" className="btn-primary shadow-lg shadow-primary-500/20 flex items-center gap-2 px-6">
              <Plus size={18} />
              <span>Nouvelle Recette</span>
            </Link>
          )}
          <button onClick={fetchBoms} className="p-2.5 text-muted-500 hover:text-primary-500 bg-surface border border-muted-300 rounded-btn hover:border-primary-300 transition-all">
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface p-5 rounded-card border border-muted-300 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center">
            <ClipboardList size={24} />
          </div>
          <div>
            <div className="text-2xl font-display font-black text-navy">{stats.count}</div>
            <div className="text-xs text-muted-500 uppercase tracking-wider font-bold">Total Recettes</div>
          </div>
        </div>

        <div className="bg-surface p-5 rounded-card border border-muted-300 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center">
            <Beaker size={24} />
          </div>
          <div>
            <div className="text-2xl font-display font-black text-navy">{stats.materials}</div>
            <div className="text-xs text-muted-500 uppercase tracking-wider font-bold">Matières Premières</div>
          </div>
        </div>

        <div className="bg-surface p-5 rounded-card border border-muted-300 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-green-50 text-green-500 flex items-center justify-center">
            <DollarSign size={24} />
          </div>
          <div>
            <div className="text-2xl font-display font-black text-navy">{fmt(stats.estimatedValue)}</div>
            <div className="text-xs text-muted-500 uppercase tracking-wider font-bold">Estimation Valeur Prod.</div>
          </div>
        </div>
      </div>

      <div className="bg-surface rounded-card shadow-card border border-muted-300 overflow-hidden">
        <div className="p-4 border-b border-muted-300 bg-muted-50/50 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-400" size={18} />
            <input 
              type="text" 
              placeholder="Rechercher une recette ou un produit..." 
              className="input-field pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted-50/50 border-b border-muted-300">
                <th className="px-6 py-4 text-[11px] font-bold text-muted-500 uppercase tracking-wider">Produit & Recette</th>
                <th className="px-6 py-4 text-[11px] font-bold text-muted-500 uppercase tracking-wider">Quantité Base</th>
                <th className="px-6 py-4 text-[11px] font-bold text-muted-500 uppercase tracking-wider text-center">Ingrédients</th>
                <th className="px-6 py-4 text-[11px] font-bold text-muted-500 uppercase tracking-wider text-center">Pertes</th>
                <th className="px-6 py-4 text-[11px] font-bold text-muted-500 uppercase tracking-wider text-center">Statut</th>
                <th className="px-6 py-4 text-[11px] font-bold text-muted-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-muted-200">
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan="6" className="px-6 py-8 bg-muted-50/20" />
                  </tr>
                ))
              ) : filteredBoms.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-muted-500">
                    <ClipboardList className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>Aucune recette trouvée.</p>
                  </td>
                </tr>
              ) : filteredBoms.map((bom) => (
                <tr key={bom.id} className="hover:bg-muted-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center text-primary-600">
                        <Beaker size={20} />
                      </div>
                      <div>
                        <Link to={`/production/boms/${bom.id}`} className="font-bold text-navy hover:text-primary-600 transition-colors">{bom.product?.name}</Link>
                        <div className="text-xs text-muted-500">{bom.name || 'Recette standard'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-600">
                    {bom.quantity} {bom.product?.unit}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {bom.items_count} ingrédients
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center text-sm font-medium text-danger">
                    {bom.waste_percentage}%
                  </td>
                  <td className="px-6 py-4 text-center">
                    {bom.is_active ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800 uppercase tracking-wider">
                        <CheckCircle2 size={12} /> Actif
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 uppercase tracking-wider">
                        <XCircle size={12} /> Inactif
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {isAdmin() && (
                        <>
                          <Link
                            to={`/production/boms/${bom.id}/edit`}
                            className="p-2 text-muted-400 hover:text-primary-500 hover:bg-primary-50 rounded-btn transition-all"
                          >
                            <Edit2 size={16} />
                          </Link>
                          <button
                            onClick={() => handleDelete(bom.id)}
                            className="p-2 text-muted-400 hover:text-red-500 hover:bg-red-50 rounded-btn transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
