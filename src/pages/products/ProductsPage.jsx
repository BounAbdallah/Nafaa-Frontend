import { useEffect, useState, useCallback } from 'react'
import { confirmDialog } from '@/utils/confirm'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { productService } from '@/services/productService'
import toast from 'react-hot-toast'
import {
  Plus, Search, Package, Zap, Edit2, Trash2,
  ChevronLeft, ChevronRight, AlertTriangle,
  TrendingUp, RefreshCw,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import ProductModal from './ProductModal'
import { useCurrency } from '@/utils/currency'

export default function ProductsPage() {
  const navigate = useNavigate()
  const { can }  = useAuthStore()
  const { format: fmt } = useCurrency()
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
      else            params.exclude_type = 'material'
      const r = await productService.getAll(params)
      setProducts(r.data.products)
      setPageMeta(r.data.meta)
    } catch { toast.error('Impossible de charger les produits.') }
    finally  { setLoading(false) }
  }, [page, search, typeFilter])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  useEffect(() => {
    const handler = (e) => {
      const action = e.detail?.action
      if (['add_stock_movement', 'create_product', 'bulk_create_products', 'query_stock'].includes(action)) {
        fetchProducts()
      }
    }
    window.addEventListener('qiwam:ai-action', handler)
    return () => window.removeEventListener('qiwam:ai-action', handler)
  }, [fetchProducts])

  const handleDelete = async (p, e) => {
    e?.stopPropagation()
    if (!(await confirmDialog({ title: `Supprimer "${p.name}" ?`, text: 'Cette action est irréversible.', confirmText: 'Supprimer' }))) return
    try {
      await productService.remove(p.id)
      toast.success('Produit supprimé.')
      fetchProducts()
    } catch { toast.error('Erreur lors de la suppression.') }
  }

  const stats = {
    total:    pageMeta?.total ?? 0,
    lowStock: products.filter(p => p.is_low_stock).length,
    active:   products.filter(p => p.is_active).length,
  }

  const StockBadge = ({ p }) => {
    if (p.type === 'service') return <span className="text-xs text-muted-400">—</span>
    return (
      <span className={cn(
        'inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-badge',
        p.stock_quantity <= 0  ? 'bg-red-100 text-red-700' :
        p.is_low_stock         ? 'bg-amber-100 text-amber-700' :
                                 'bg-green-50 text-success'
      )}>
        {(p.stock_quantity <= 0 || p.is_low_stock) && <AlertTriangle size={10} />}
        {p.stock_quantity} {p.unit}
      </span>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-5">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-bold text-navy">Produits</h1>
          <p className="text-sm font-sans text-muted-500 mt-0.5">
            {pageMeta ? `${pageMeta.total} article${pageMeta.total > 1 ? 's' : ''}` : '…'}
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          {can('products', 'delete') && (
            <button
              onClick={() => navigate('/products/trash')}
              className="btn-secondary flex items-center gap-2 p-2 sm:px-3 sm:py-2.5"
              title="Corbeille"
            >
              <Trash2 size={15} />
              <span className="hidden sm:inline text-sm">Corbeille</span>
            </button>
          )}
          <button onClick={fetchProducts} className="btn-secondary p-2 sm:p-2.5">
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
          {can('products', 'create') && (
            <button onClick={() => setModal('add')} className="btn-primary flex items-center gap-2 h-9 sm:h-10 px-3 sm:px-4 text-sm">
              <Plus size={16} />
              <span>Ajouter</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Stats rapides ── */}
      {pageMeta && (
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          {[
            { label: 'Total',     value: pageMeta.total, icon: Package,       color: 'text-primary-500 bg-primary-50' },
            { label: 'Stock bas', value: stats.lowStock,  icon: AlertTriangle, color: 'text-warning bg-amber-50' },
            { label: 'Actifs',    value: stats.active,    icon: TrendingUp,    color: 'text-success bg-green-50' },
          ].map(s => (
            <div key={s.label} className="card p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
              <div className={cn('w-8 h-8 sm:w-9 sm:h-9 rounded-card flex items-center justify-center shrink-0', s.color)}>
                <s.icon size={15} />
              </div>
              <div className="min-w-0">
                <p className="text-base sm:text-lg font-display font-bold text-navy">{s.value}</p>
                <p className="text-[10px] sm:text-xs text-muted-500 font-sans truncate">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Recherche ── */}
      <div className="card p-3 sm:p-4">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-500" />
          <input
            placeholder="Rechercher par nom ou SKU…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            className="input-field pl-9 h-10 text-sm w-full"
          />
        </div>
      </div>

      {/* ── Table ── */}
      <div className="card overflow-hidden">

        {/* Desktop table (sm+) */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-muted-300 bg-muted-100/50">
                <th className="text-left py-3 px-4 text-xs font-sans font-semibold text-muted-700 uppercase tracking-wide">Article</th>
                <th className="text-left py-3 px-4 text-xs font-sans font-semibold text-muted-700 uppercase tracking-wide hidden md:table-cell">Catégorie</th>
                <th className="text-right py-3 px-4 text-xs font-sans font-semibold text-muted-700 uppercase tracking-wide hidden md:table-cell">Prix achat</th>
                <th className="text-right py-3 px-4 text-xs font-sans font-semibold text-muted-700 uppercase tracking-wide">Prix vente</th>
                <th className="text-right py-3 px-4 text-xs font-sans font-semibold text-muted-700 uppercase tracking-wide hidden lg:table-cell">Marge</th>
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
                      <td className="py-3 px-4 hidden md:table-cell"><div className="h-4 w-24 bg-muted-100 rounded" /></td>
                      <td className="py-3 px-4 hidden md:table-cell text-right"><div className="h-4 w-20 bg-muted-100 rounded ml-auto" /></td>
                      <td className="py-3 px-4 text-right"><div className="h-4 w-20 bg-muted-100 rounded ml-auto" /></td>
                      <td className="py-3 px-4 hidden lg:table-cell text-right"><div className="h-4 w-12 bg-muted-100 rounded ml-auto" /></td>
                      <td className="py-3 px-4 hidden lg:table-cell text-center"><div className="h-5 w-14 bg-muted-100 rounded-badge mx-auto" /></td>
                      <td className="py-3 px-4 text-center"><div className="h-5 w-14 bg-muted-100 rounded-badge mx-auto" /></td>
                      <td className="py-3 px-4"><div className="h-7 w-16 bg-muted-100 rounded-btn ml-auto" /></td>
                    </tr>
                  ))
                : products.length === 0
                  ? (
                    <tr>
                      <td colSpan={8} className="py-16 text-center">
                        <Package size={32} className="mx-auto text-muted-300 mb-3" />
                        <p className="text-sm font-sans text-muted-500">Aucun produit trouvé.</p>
                        {can('products', 'create') && (
                          <button onClick={() => setModal('add')} className="btn-primary mt-4 mx-auto text-xs py-2 px-4">
                            Ajouter le premier produit
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                  : products.map(p => (
                    <tr
                      key={p.id}
                      onClick={() => navigate(`/products/${p.id}`)}
                      className={cn(
                        'transition-colors cursor-pointer',
                        p.type !== 'service' && p.stock_quantity <= 0
                          ? 'bg-red-50/60 hover:bg-red-100'
                          : p.is_low_stock
                            ? 'bg-amber-50/40 hover:bg-amber-50/80'
                            : 'hover:bg-primary-50/40'
                      )}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            'w-8 h-8 rounded-card flex items-center justify-center shrink-0 overflow-hidden',
                            p.type === 'service'  ? 'bg-violet-50 text-violet-500' :
                            p.type === 'material' ? 'bg-orange-50 text-orange-500' :
                                                    'bg-primary-50 text-primary-500'
                          )}>
                            {p.image
                              ? <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                              : p.type === 'service' ? <Zap size={15} /> : <Package size={15} />
                            }
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-sans font-semibold text-navy truncate max-w-[180px]">{p.name}</p>
                            {p.sku && <p className="text-[11px] text-muted-500">SKU: {p.sku}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 hidden md:table-cell">
                        <span className="text-xs font-sans text-muted-700">{p.category_label ?? '—'}</span>
                      </td>
                      <td className="py-3 px-4 text-right hidden md:table-cell">
                        <span className="text-sm font-sans text-muted-700 whitespace-nowrap">
                          {p.cost_price > 0 ? fmt(p.cost_price) : '—'}
                        </span>
                        {p.cost_price > 0 && <p className="text-[11px] text-muted-500">/{p.unit}</p>}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="text-sm font-sans font-semibold text-navy whitespace-nowrap">{fmt(p.selling_price)}</span>
                        <p className="text-[11px] text-muted-500">/{p.unit}</p>
                      </td>
                      <td className="py-3 px-4 text-right hidden lg:table-cell">
                        <span className={cn('text-sm font-sans font-semibold', p.margin >= 30 ? 'text-success' : p.margin >= 10 ? 'text-warning' : 'text-danger')}>
                          {p.margin}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center hidden lg:table-cell">
                        <StockBadge p={p} />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={cn(
                          'inline-flex items-center gap-1 text-xs font-sans font-semibold px-2 py-0.5 rounded-badge whitespace-nowrap',
                          p.is_active ? 'bg-green-50 text-success' : 'bg-muted-100 text-muted-500'
                        )}>
                          <span className={cn('w-1.5 h-1.5 rounded-full', p.is_active ? 'bg-success' : 'bg-muted-400')} />
                          {p.is_active ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                      <td className="py-3 px-4" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          {can('products', 'edit') && (
                            <button
                              onClick={e => { e.stopPropagation(); setModal(p) }}
                              className="p-1.5 rounded-btn text-muted-500 hover:text-primary-500 hover:bg-primary-50 transition-colors"
                              title="Modifier"
                            >
                              <Edit2 size={14} />
                            </button>
                          )}
                          {can('products', 'delete') && (
                            <button
                              onClick={e => handleDelete(p, e)}
                              className="p-1.5 rounded-btn text-muted-500 hover:text-danger hover:bg-danger/5 transition-colors"
                              title="Supprimer"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>

        {/* ── Mobile card list (xs only) ── */}
        <div className="sm:hidden divide-y divide-muted-100">
          {loading
            ? [...Array(4)].map((_, i) => (
                <div key={i} className="p-4 animate-pulse space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-card bg-muted-100 shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3.5 bg-muted-100 rounded w-2/3" />
                      <div className="h-3 bg-muted-100 rounded w-1/3" />
                    </div>
                  </div>
                </div>
              ))
            : products.length === 0
              ? (
                <div className="py-14 flex flex-col items-center opacity-50">
                  <Package size={32} className="mb-3 text-muted-300" />
                  <p className="text-sm font-sans text-muted-500">Aucun produit trouvé.</p>
                  {can('products', 'create') && (
                    <button onClick={() => setModal('add')} className="btn-primary mt-4 text-xs py-2 px-4">
                      Ajouter le premier produit
                    </button>
                  )}
                </div>
              )
              : products.map(p => (
                <div
                  key={p.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(`/products/${p.id}`)}
                  onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/products/${p.id}`) }}
                  className={cn(
                    'w-full text-left px-4 py-3.5 transition-colors active:bg-muted-50 cursor-pointer',
                    p.type !== 'service' && p.stock_quantity <= 0
                      ? 'bg-red-50/40'
                      : p.is_low_stock
                        ? 'bg-amber-50/30'
                        : ''
                  )}
                >
                  <div className="flex items-center gap-3">
                    {/* Thumbnail */}
                    <div className={cn(
                      'w-10 h-10 rounded-card flex items-center justify-center shrink-0 overflow-hidden',
                      p.type === 'service'  ? 'bg-violet-50 text-violet-500' :
                      p.type === 'material' ? 'bg-orange-50 text-orange-500' :
                                              'bg-primary-50 text-primary-500'
                    )}>
                      {p.image
                        ? <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                        : p.type === 'service' ? <Zap size={16} /> : <Package size={16} />
                      }
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-sans font-semibold text-navy truncate">{p.name}</p>
                        <div className="shrink-0 text-right">
                          <p className="text-sm font-display font-black text-navy whitespace-nowrap">{fmt(p.selling_price)}</p>
                          {p.cost_price > 0 && (
                            <p className="text-[10px] text-muted-400 whitespace-nowrap">Achat : {fmt(p.cost_price)}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-1 gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {p.sku && (
                            <span className="text-[10px] text-muted-400 font-mono">{p.sku}</span>
                          )}
                          <StockBadge p={p} />
                        </div>
                        <span className={cn(
                          'inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-badge shrink-0',
                          p.is_active ? 'bg-green-50 text-success' : 'bg-muted-100 text-muted-500'
                        )}>
                          <span className={cn('w-1.5 h-1.5 rounded-full', p.is_active ? 'bg-success' : 'bg-muted-400')} />
                          {p.is_active ? 'Actif' : 'Inactif'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Mobile actions */}
                  <div className="flex gap-2 mt-2.5 pt-2.5 border-t border-muted-100" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={e => { e.stopPropagation(); navigate(`/products/${p.id}`) }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-btn border border-muted-200 text-xs text-muted-600 hover:border-primary-300 hover:text-primary-600 transition-colors"
                    >
                      Voir détails
                    </button>
                    {can('products', 'edit') && (
                      <button
                        onClick={e => { e.stopPropagation(); setModal(p) }}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-btn border border-muted-200 text-xs text-muted-600 hover:border-primary-300 hover:text-primary-600 transition-colors"
                      >
                        <Edit2 size={13} /> Modifier
                      </button>
                    )}
                    {can('products', 'delete') && (
                      <button
                        onClick={e => handleDelete(p, e)}
                        className="px-3 flex items-center justify-center py-1.5 rounded-btn border border-red-200 text-xs text-danger hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              ))
          }
        </div>

        {/* ── Pagination ── */}
        {pageMeta && pageMeta.last_page > 1 && (
          <div className="border-t border-muted-100 px-4 py-3 flex items-center justify-between gap-2">
            <span className="text-xs text-muted-500 font-sans">
              <span className="hidden sm:inline">Page </span>
              {pageMeta.current_page} / {pageMeta.last_page}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => p - 1)}
                disabled={page === 1}
                className="p-1.5 rounded-btn border border-muted-300 text-muted-500 hover:text-navy disabled:opacity-30 transition-colors"
              >
                <ChevronLeft size={15} />
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page === pageMeta.last_page}
                className="p-1.5 rounded-btn border border-muted-300 text-muted-500 hover:text-navy disabled:opacity-30 transition-colors"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Modal produit ── */}
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
