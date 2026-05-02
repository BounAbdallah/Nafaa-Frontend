import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { productService } from '@/services/productService'
import toast from 'react-hot-toast'
import {
  Plus, Search, Package, Edit2, Trash2,
  ChevronLeft, ChevronRight, AlertTriangle,
  TrendingUp, RefreshCw, Beaker
} from 'lucide-react'
import { cn } from '@/utils/cn'
import ProductModal from '../products/ProductModal'

const fmt = (n) => new Intl.NumberFormat('fr-FR').format(n) + ' FCFA'

export default function MaterialsPage() {
  const [products, setProducts] = useState([])
  const [meta, setMeta]         = useState(null)
  const [pageMeta, setPageMeta] = useState(null)
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [page, setPage]         = useState(1)
  const [modal, setModal]       = useState(null)

  useEffect(() => {
    productService.getMeta()
      .then(r => setMeta(r.data))
      .catch(() => toast.error('Impossible de charger les métadonnées.'))
  }, [])

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, per_page: 15, type: 'material' }
      if (search) params.search = search
      const r = await productService.getAll(params)
      setProducts(r.data.products)
      setPageMeta(r.data.meta)
    } catch { toast.error('Impossible de charger les matières premières.') }
    finally { setLoading(false) }
  }, [page, search])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  const handleDelete = async (p) => {
    if (!window.confirm(`Supprimer "${p.name}" ?`)) return
    try {
      await productService.remove(p.id)
      toast.success('Matière supprimée.')
      fetchProducts()
    } catch { toast.error('Erreur lors de la suppression.') }
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-black text-navy tracking-tight">Matières Premières</h1>
          <p className="text-sm font-sans text-muted-500 mt-1">
            Gérez vos stocks d'ingrédients et composants de fabrication.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchProducts} className="p-2.5 text-muted-500 hover:text-primary-500 bg-surface border border-muted-300 rounded-btn hover:border-primary-300 transition-all"><RefreshCw size={18} className={loading ? 'animate-spin' : ''} /></button>
          <button onClick={() => setModal('add')} className="btn-primary flex items-center gap-2">
            <Plus size={18} />Ajouter une matière
          </button>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-surface p-4 rounded-card border border-muted-300 shadow-card flex gap-3">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-400" />
          <input
            placeholder="Rechercher une matière…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            className="input-field pl-10"
          />
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-surface rounded-card shadow-card border border-muted-300 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted-50/50 border-b border-muted-300">
                <th className="px-6 py-4 text-[11px] font-bold text-muted-500 uppercase tracking-wider">Matière</th>
                <th className="px-6 py-4 text-[11px] font-bold text-muted-500 uppercase tracking-wider">Catégorie</th>
                <th className="px-6 py-4 text-[11px] font-bold text-muted-500 uppercase tracking-wider text-right">Prix d'achat Est.</th>
                <th className="px-6 py-4 text-[11px] font-bold text-muted-500 uppercase tracking-wider text-center">Stock Actuel</th>
                <th className="px-6 py-4 text-[11px] font-bold text-muted-500 uppercase tracking-wider text-center">Statut</th>
                <th className="px-6 py-4 w-24" />
              </tr>
            </thead>
            <tbody className="divide-y divide-muted-200">
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan="6" className="px-6 py-8 bg-muted-50/20" />
                  </tr>
                ))
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-500">
                    <Beaker size={48} className="mx-auto opacity-10 mb-4" />
                    <p className="text-sm">Aucune matière première trouvée.</p>
                  </td>
                </tr>
              ) : products.map(p => (
                <tr key={p.id} className="hover:bg-muted-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-orange-50 text-orange-500 flex items-center justify-center font-bold">
                        {p.name[0]}
                      </div>
                      <div>
                        <Link to={`/products/${p.id}`} className="font-bold text-navy hover:text-primary-600 transition-colors">{p.name}</Link>
                        <div className="text-[10px] text-muted-500">SKU: {p.sku || '—'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs text-muted-600">
                    {p.category_label || '—'}
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-navy">
                    {fmt(p.cost_price)}
                    <div className="text-[10px] text-muted-400 font-normal">/{p.unit}</div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={cn(
                      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold',
                      p.is_low_stock ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                    )}>
                      {p.stock_quantity} {p.unit}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                     <span className={cn('w-2 h-2 rounded-full inline-block', p.is_active ? 'bg-success' : 'bg-muted-300')} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => setModal(p)} className="p-2 text-muted-400 hover:text-primary-500 hover:bg-primary-50 rounded-btn transition-all"><Edit2 size={16} /></button>
                      <button onClick={() => handleDelete(p)} className="p-2 text-muted-400 hover:text-danger hover:bg-red-50 rounded-btn transition-all"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {pageMeta && pageMeta.last_page > 1 && (
          <div className="px-6 py-4 bg-muted-50/50 border-t border-muted-300 flex items-center justify-between">
            <span className="text-xs text-muted-500">Page {pageMeta.current_page} sur {pageMeta.last_page}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => p - 1)} disabled={page === 1} className="p-1.5 rounded border border-muted-300 disabled:opacity-30"><ChevronLeft size={16} /></button>
              <button onClick={() => setPage(p => p + 1)} disabled={page === pageMeta.last_page} className="p-1.5 rounded border border-muted-300 disabled:opacity-30"><ChevronRight size={16} /></button>
            </div>
          </div>
        )}
      </div>

      {modal && (
        <ProductModal
          product={modal === 'add' ? { type: 'material' } : modal}
          meta={meta}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); fetchProducts() }}
        />
      )}
    </div>
  )
}
