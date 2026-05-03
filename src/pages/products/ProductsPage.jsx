import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { productService } from '@/services/productService'
import toast from 'react-hot-toast'
import {
  Plus, Search, Package, Zap, Edit2, Trash2,
  ChevronLeft, ChevronRight, AlertTriangle,
  TrendingUp, RefreshCw,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import ProductModal from './ProductModal'

const fmt = (n) => new Intl.NumberFormat('fr-FR').format(n) + ' FCFA'

export default function ProductsPage() {
  const [products, setProducts] = useState([])
  const [meta, setMeta]         = useState(null)
  const [pageMeta, setPageMeta] = useState(null)
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [typeFilter, setType]   = useState('')
  const [page, setPage]         = useState(1)
  const [modal, setModal]       = useState(null)

  useEffect(() => {
    productService.getMeta()
      .then(r => setMeta(r.data))
      .catch(() => toast.error('Impossible de charger les métadonnées produit.'))
  }, [])

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, per_page: 15 }
      if (search)     params.search = search
      if (typeFilter) params.type   = typeFilter
      else            params.exclude_type = 'material' // Custom param to handle in backend
      const r = await productService.getAll(params)
      setProducts(r.data.products)
      setPageMeta(r.data.meta)
    } catch { toast.error('Impossible de charger les produits.') }
    finally { setLoading(false) }
  }, [page, search, typeFilter])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  // Refresh when Qiwam Intelligent performs a product/stock action
  useEffect(() => {
    const handler = (e) => {
      const action = e.detail?.action
      if (['add_stock_movement', 'create_product', 'query_stock'].includes(action)) {
        fetchProducts()
      }
    }
    window.addEventListener('qiwam:ai-action', handler)
    return () => window.removeEventListener('qiwam:ai-action', handler)
  }, [fetchProducts])

  const handleDelete = async (p) => {
    if (!window.confirm(`Supprimer "${p.name}" ?`)) return
    try {
      await productService.remove(p.id)
      toast.success('Produit supprimé.')
      fetchProducts()
    } catch { toast.error('Erreur lors de la suppression.') }
  }

  const stats = {
    total:    pageMeta?.total ?? 0,
    active:   products.filter(p => p.is_active).length,
    lowStock: products.filter(p => p.is_low_stock).length,
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-navy">Produits</h1>
          <p className="text-sm font-sans text-muted-500 mt-1">
            {pageMeta ? `${pageMeta.total} article${pageMeta.total > 1 ? 's' : ''}` : '…'}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchProducts} className="btn-secondary p-2.5"><RefreshCw size={15} /></button>
          <button onClick={() => setModal('add')} className="btn-primary flex items-center gap-2">
            <Plus size={16} />Ajouter
          </button>
        </div>
      </div>

      {/* Stats rapides */}
      {pageMeta && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total',     value: pageMeta.total,    icon: Package,       color: 'text-primary-500 bg-primary-50' },
            { label: 'Stock bas', value: stats.lowStock,    icon: AlertTriangle, color: 'text-warning bg-amber-50' },
            { label: 'Actifs',    value: stats.active,      icon: TrendingUp,    color: 'text-success bg-green-50' },
          ].map(s => (
            <div key={s.label} className="card p-4 flex items-center gap-3">
              <div className={cn('w-9 h-9 rounded-card flex items-center justify-center flex-shrink-0', s.color)}>
                <s.icon size={17} />
              </div>
              <div>
                <p className="text-lg font-display font-bold text-navy">{s.value}</p>
                <p className="text-xs text-muted-500 font-sans">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filtres */}
      <div className="card p-4 flex gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-500" />
          <input
            placeholder="Rechercher par nom ou SKU…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            className="input-field pl-9"
          />
        </div>
      </div>

      {/* Tableau */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-muted-300 bg-muted-100/50">
                <th className="text-left py-3 px-4 text-xs font-sans font-semibold text-muted-700 uppercase tracking-wide">Article</th>
                <th className="text-left py-3 px-4 text-xs font-sans font-semibold text-muted-700 uppercase tracking-wide hidden sm:table-cell">Catégorie</th>
                <th className="text-right py-3 px-4 text-xs font-sans font-semibold text-muted-700 uppercase tracking-wide">Prix vente</th>
                <th className="text-right py-3 px-4 text-xs font-sans font-semibold text-muted-700 uppercase tracking-wide hidden md:table-cell">Marge</th>
                <th className="text-center py-3 px-4 text-xs font-sans font-semibold text-muted-700 uppercase tracking-wide hidden lg:table-cell">Stock</th>
                <th className="text-center py-3 px-4 text-xs font-sans font-semibold text-muted-700 uppercase tracking-wide">Statut</th>
                <th className="py-3 px-4 w-20" />
              </tr>
            </thead>
            <tbody className="divide-y divide-muted-100">
              {loading
                ? [...Array(5)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="py-3 px-4"><div className="h-4 w-40 bg-muted-100 rounded" /></td>
                      <td className="py-3 px-4 hidden sm:table-cell"><div className="h-4 w-24 bg-muted-100 rounded" /></td>
                      <td className="py-3 px-4 text-right"><div className="h-4 w-20 bg-muted-100 rounded ml-auto" /></td>
                      <td className="py-3 px-4 hidden md:table-cell text-right"><div className="h-4 w-12 bg-muted-100 rounded ml-auto" /></td>
                      <td className="py-3 px-4 hidden lg:table-cell text-center"><div className="h-5 w-14 bg-muted-100 rounded-badge mx-auto" /></td>
                      <td className="py-3 px-4 text-center"><div className="h-5 w-14 bg-muted-100 rounded-badge mx-auto" /></td>
                      <td className="py-3 px-4"><div className="h-7 w-16 bg-muted-100 rounded-btn ml-auto" /></td>
                    </tr>
                  ))
                : products.length === 0
                  ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center">
                        <Package size={32} className="mx-auto text-muted-300 mb-3" />
                        <p className="text-sm font-sans text-muted-500">Aucun produit trouvé.</p>
                        <button onClick={() => setModal('add')} className="btn-primary mt-4 mx-auto text-xs py-2 px-4">
                          Ajouter le premier produit
                        </button>
                      </td>
                    </tr>
                  )
                  : products.map(p => (
                    <tr key={p.id} className="hover:bg-muted-100/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            'w-8 h-8 rounded-card flex items-center justify-center flex-shrink-0 overflow-hidden',
                            p.type === 'service' ? 'bg-violet-50 text-violet-500' : 
                            p.type === 'material' ? 'bg-orange-50 text-orange-500' :
                            'bg-primary-50 text-primary-500'
                          )}>
                            {p.image ? (
                              <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                            ) : (
                              p.type === 'service' ? <Zap size={15} /> : <Package size={15} />
                            )}
                          </div>
                          <div>
                            <Link
                              to={`/products/${p.id}`}
                              className="text-sm font-sans font-semibold text-navy hover:text-primary-500 transition-colors"
                            >
                              {p.name}
                            </Link>
                            {p.sku && <p className="text-[11px] text-muted-500">SKU: {p.sku}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 hidden sm:table-cell">
                        <span className="text-xs font-sans text-muted-700">{p.category_label ?? '—'}</span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="text-sm font-sans font-semibold text-navy">{fmt(p.selling_price)}</span>
                        <p className="text-[11px] text-muted-500">/{p.unit}</p>
                      </td>
                      <td className="py-3 px-4 text-right hidden md:table-cell">
                        <span className={cn('text-sm font-sans font-semibold', p.margin >= 30 ? 'text-success' : p.margin >= 10 ? 'text-warning' : 'text-danger')}>
                          {p.margin}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center hidden lg:table-cell">
                        {p.type === 'service' ? (
                          <span className="text-xs text-muted-400 font-sans">—</span>
                        ) : (
                          <span className={cn(
                            'inline-flex items-center gap-1 text-xs font-sans font-semibold px-2 py-0.5 rounded-badge',
                            p.is_low_stock ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-success'
                          )}>
                            {p.is_low_stock && <AlertTriangle size={10} />}
                            {p.stock_quantity} {p.unit}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={cn(
                          'inline-flex items-center gap-1 text-xs font-sans font-semibold px-2 py-0.5 rounded-badge',
                          p.is_active ? 'bg-green-50 text-success' : 'bg-muted-100 text-muted-500'
                        )}>
                          <span className={cn('w-1.5 h-1.5 rounded-full', p.is_active ? 'bg-success' : 'bg-muted-400')} />
                          {p.is_active ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setModal(p)}
                            className="p-1.5 rounded-btn text-muted-500 hover:text-primary-500 hover:bg-primary-50 transition-colors"
                            title="Modifier"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(p)}
                            className="p-1.5 rounded-btn text-muted-500 hover:text-danger hover:bg-danger/5 transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pageMeta && pageMeta.last_page > 1 && (
          <div className="border-t border-muted-100 px-4 py-3 flex items-center justify-between">
            <span className="text-xs text-muted-500 font-sans">Page {pageMeta.current_page} / {pageMeta.last_page}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => p - 1)} disabled={page === 1} className="p-1.5 rounded-btn border border-muted-300 text-muted-500 hover:text-navy disabled:opacity-30">
                <ChevronLeft size={15} />
              </button>
              <button onClick={() => setPage(p => p + 1)} disabled={page === pageMeta.last_page} className="p-1.5 rounded-btn border border-muted-300 text-muted-500 hover:text-navy disabled:opacity-30">
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <ProductModal
          product={modal === 'add' ? null : modal}
          meta={meta}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); fetchProducts() }}
        />
      )}

    </div>
  )
}
