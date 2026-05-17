import { useEffect, useState, useCallback } from 'react'
import { confirmDialog } from '@/utils/confirm'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { productService } from '@/services/productService'
import { useCurrency } from '@/utils/currency'
import toast from 'react-hot-toast'
import {
  Plus, Search, Package, Edit2, Trash2,
  ChevronLeft, ChevronRight, AlertTriangle,
  TrendingUp, RefreshCw, Beaker
} from 'lucide-react'
import { cn } from '@/utils/cn'
import ProductModal from '../products/ProductModal'

export default function MaterialsPage() {
  const { isAdmin } = useAuthStore()
  const { format: fmt } = useCurrency()
  const [products, setProducts] = useState([])
  const [meta, setMeta]         = useState(null)
  const [pageMeta, setPageMeta] = useState(null)
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [category, setCategory] = useState('')
  const [lowStock, setLowStock] = useState(false)
  const [sort, setSort]         = useState('date')
  const [showFilters, setShowFilters] = useState(false)
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
      const params = {
        page,
        per_page: 15,
        type: 'material',
        search,
        category,
        low_stock: lowStock ? 1 : 0,
        sort
      }
      const r = await productService.getAll(params)
      setProducts(r.data.products)
      setPageMeta(r.data.meta)
    } catch { toast.error('Impossible de charger les matières premières.') }
    finally { setLoading(false) }
  }, [page, search, category, lowStock, sort])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  useEffect(() => {
    const handler = (e) => {
      const action = e.detail?.action
      if (['create_product', 'bulk_create_products', 'add_stock_movement', 'list_materials'].includes(action)) {
        fetchProducts()
      }
    }
    window.addEventListener('qiwam:ai-action', handler)
    return () => window.removeEventListener('qiwam:ai-action', handler)
  }, [fetchProducts])

  const handleDelete = async (p) => {
    if (!(await confirmDialog({ title: `Supprimer "${p.name}" ?`, text: 'Cette action est irréversible.', confirmText: 'Supprimer' }))) return
    try {
      await productService.remove(p.id)
      toast.success('Matière supprimée.')
      fetchProducts()
    } catch { toast.error('Erreur lors de la suppression.') }
  }

  const activeFiltersCount = [category, lowStock, sort !== 'date'].filter(Boolean).length

  return (
    <div className="space-y-4 sm:space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-black text-navy tracking-tight">Matières Premières</h1>
          <p className="text-sm font-sans text-muted-500 mt-1">
            Gérez vos stocks d'ingrédients et composants de fabrication.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchProducts} className="p-2.5 text-muted-500 hover:text-primary-500 bg-surface border border-muted-300 rounded-btn hover:border-primary-300 transition-all">
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          {isAdmin() && (
            <button onClick={() => setModal('add')} className="btn-primary flex items-center gap-2">
              <Plus size={18} />
              <span className="hidden sm:inline">Ajouter une matière</span>
            </button>
          )}
        </div>
      </div>

      {/* Search & Filters */}
      <div className="space-y-3">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-400" />
            <input
              placeholder="Rechercher une matière…"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              className="input-field pl-10 h-11"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "flex items-center gap-2 px-4 h-11 rounded-btn border font-medium transition-all",
              showFilters || activeFiltersCount > 0
                ? "bg-primary-50 border-primary-300 text-primary-700"
                : "bg-surface border-muted-300 text-muted-600 hover:border-muted-400"
            )}
          >
            <Beaker size={18} />
            <span className="hidden sm:inline">Filtres</span>
            {activeFiltersCount > 0 && (
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary-600 text-white text-[10px] font-bold">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>

        {showFilters && (
          <div className="bg-surface p-4 sm:p-5 rounded-card border border-primary-100 shadow-sm flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-4 animate-in slide-in-from-top-2 duration-200">
            <div className="space-y-1.5 w-full sm:flex-1 sm:min-w-[200px]">
              <label className="text-[10px] font-bold text-muted-400 uppercase tracking-wider ml-1">Catégorie</label>
              <select
                value={category}
                onChange={e => { setCategory(e.target.value); setPage(1) }}
                className="input-field py-2 text-sm"
              >
                <option value="">Toutes les catégories</option>
                {meta?.static_categories?.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                {meta?.dynamic_categories?.length > 0 && <optgroup label="Personnalisées">
                  {meta.dynamic_categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </optgroup>}
              </select>
            </div>

            <div className="space-y-1.5 w-full sm:flex-1 sm:min-w-[200px]">
              <label className="text-[10px] font-bold text-muted-400 uppercase tracking-wider ml-1">Trier par</label>
              <select
                value={sort}
                onChange={e => { setSort(e.target.value); setPage(1) }}
                className="input-field py-2 text-sm"
              >
                <option value="date">Date d'ajout</option>
                <option value="name">Nom (A-Z)</option>
                <option value="stock">Stock (Croissant)</option>
              </select>
            </div>

            <div className="pt-0 sm:pt-5">
              <button
                onClick={() => { setLowStock(!lowStock); setPage(1) }}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-btn border text-sm font-medium transition-all",
                  lowStock
                    ? "bg-amber-50 border-amber-300 text-amber-700"
                    : "bg-muted-50 border-muted-200 text-muted-600 hover:border-muted-300"
                )}
              >
                <AlertTriangle size={16} className={lowStock ? "text-amber-500" : "text-muted-400"} />
                <span>Stock Faible</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Table — sm+ */}
      <div className="bg-surface rounded-card shadow-card border border-muted-300 overflow-hidden hidden sm:block">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted-50/50 border-b border-muted-300">
                <th className="px-6 py-4 text-[11px] font-bold text-muted-500 uppercase tracking-wider">Matière</th>
                <th className="px-6 py-4 text-[11px] font-bold text-muted-500 uppercase tracking-wider hidden sm:table-cell">Catégorie</th>
                <th className="px-6 py-4 text-[11px] font-bold text-muted-500 uppercase tracking-wider text-right">Prix d'achat Est.</th>
                <th className="px-6 py-4 text-[11px] font-bold text-muted-500 uppercase tracking-wider text-center hidden md:table-cell">Stock Actuel</th>
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
                      <div className="w-10 h-10 rounded-lg bg-orange-50 text-orange-500 flex items-center justify-center font-bold shrink-0">
                        {p.name[0]}
                      </div>
                      <div>
                        <Link to={`/products/${p.id}`} className="font-bold text-navy hover:text-primary-600 transition-colors">{p.name}</Link>
                        <div className="text-[10px] text-muted-500">SKU: {p.sku || '—'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs text-muted-600 hidden sm:table-cell">
                    {p.category_label || '—'}
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-navy">
                    {fmt(p.cost_price)}
                    <div className="text-[10px] text-muted-400 font-normal">/{p.unit}</div>
                  </td>
                  <td className="px-6 py-4 text-center hidden md:table-cell">
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
                      {isAdmin() && (
                        <>
                          <button onClick={() => setModal(p)} className="p-2 text-muted-400 hover:text-primary-500 hover:bg-primary-50 rounded-btn transition-all"><Edit2 size={16} /></button>
                          <button onClick={() => handleDelete(p)} className="p-2 text-muted-400 hover:text-danger hover:bg-red-50 rounded-btn transition-all"><Trash2 size={16} /></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

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

      {/* Mobile card list */}
      <div className="sm:hidden bg-surface rounded-card shadow-card border border-muted-300 overflow-hidden divide-y divide-muted-200">
        {loading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="p-4 animate-pulse">
              <div className="h-4 bg-muted-100 rounded w-1/2 mb-2" />
              <div className="h-3 bg-muted-100 rounded w-1/3" />
            </div>
          ))
        ) : products.length === 0 ? (
          <div className="p-8 text-center text-muted-500">
            <Beaker size={40} className="mx-auto opacity-10 mb-3" />
            <p className="text-sm">Aucune matière première trouvée.</p>
          </div>
        ) : products.map(p => (
          <div key={p.id} className="p-4 hover:bg-muted-50/50 transition-colors">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-orange-50 text-orange-500 flex items-center justify-center font-bold shrink-0">
                  {p.name[0]}
                </div>
                <div className="min-w-0">
                  <Link to={`/products/${p.id}`} className="font-bold text-navy hover:text-primary-600 transition-colors truncate block">
                    {p.name}
                  </Link>
                  <div className="text-[10px] text-muted-500">{p.category_label || '—'} &bull; SKU: {p.sku || '—'}</div>
                </div>
              </div>
              <span className={cn('w-2 h-2 rounded-full inline-block mt-2 shrink-0', p.is_active ? 'bg-success' : 'bg-muted-300')} />
            </div>
            <div className="flex items-center justify-between mt-3 pl-12">
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-navy">{fmt(p.cost_price)} <span className="font-normal text-muted-400">/{p.unit}</span></div>
                <span className={cn(
                  'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold',
                  p.is_low_stock ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                )}>
                  {p.stock_quantity} {p.unit}
                </span>
              </div>
              {isAdmin() && (
                <div className="flex items-center gap-1">
                  <button onClick={() => setModal(p)} className="p-1.5 text-muted-400 hover:text-primary-500 hover:bg-primary-50 rounded-btn transition-all"><Edit2 size={15} /></button>
                  <button onClick={() => handleDelete(p)} className="p-1.5 text-muted-400 hover:text-danger hover:bg-red-50 rounded-btn transition-all"><Trash2 size={15} /></button>
                </div>
              )}
            </div>
          </div>
        ))}

        {pageMeta && pageMeta.last_page > 1 && (
          <div className="px-4 py-3 bg-muted-50/50 flex items-center justify-between">
            <span className="text-xs text-muted-500">Page {pageMeta.current_page} / {pageMeta.last_page}</span>
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
