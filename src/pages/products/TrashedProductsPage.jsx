import { useEffect, useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { productService } from '@/services/productService'
import { confirmDialog } from '@/utils/confirm'
import toast from 'react-hot-toast'
import {
  Trash2, RotateCcw, Search, Package, ChevronLeft, ChevronRight, ChevronLeft as Back,
} from 'lucide-react'
import { cn } from '@/utils/cn'

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'

export default function TrashedProductsPage() {
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [meta, setMeta]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage]   = useState(1)
  const [search, setSearch] = useState('')
  const [busy, setBusy]   = useState(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, per_page: 15 }
      if (search) params.search = search
      const r = await productService.getTrashed(params)
      setProducts(r.data.products)
      setMeta(r.data.meta)
    } catch { toast.error('Impossible de charger la corbeille.') }
    finally { setLoading(false) }
  }, [page, search])

  useEffect(() => {
    const t = setTimeout(fetch, search ? 300 : 0)
    return () => clearTimeout(t)
  }, [fetch])

  const handleRestore = async (p) => {
    setBusy(p.id)
    try {
      const r = await productService.restore(p.id)
      toast.success(r.message)
      fetch()
    } catch { toast.error('Erreur lors de la restauration.') }
    finally { setBusy(null) }
  }

  const handleForceDelete = async (p) => {
    if (!(await confirmDialog({
      title: `Supprimer définitivement « ${p.name} » ?`,
      text: 'Cette action est irréversible. Le produit sera effacé pour toujours.',
      confirmText: 'Supprimer définitivement',
    }))) return
    setBusy(p.id)
    try {
      const r = await productService.forceDelete(p.id)
      toast.success(r.message)
      fetch()
    } catch { toast.error('Erreur lors de la suppression.') }
    finally { setBusy(null) }
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Header */}
      <div>
        <Link to="/products" className="inline-flex items-center gap-1.5 text-xs font-sans text-muted-500 hover:text-navy transition-colors">
          <Back size={14} />Produits
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-2">
          <div>
            <h1 className="text-xl sm:text-2xl font-display font-bold text-navy flex items-center gap-2">
              <Trash2 size={22} className="text-muted-400" />
              Corbeille
            </h1>
            <p className="text-sm font-sans text-muted-500 mt-1">
              Produits supprimés — restaurez-les ou supprimez-les définitivement.
            </p>
          </div>
        </div>
      </div>

      {/* Recherche */}
      <div className="card p-3 sm:p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-500" />
          <input
            type="text"
            placeholder="Rechercher dans la corbeille…"
            className="input-field pl-10 w-full"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
      </div>

      {/* Liste */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-muted-300 bg-muted-100/50">
                <th className="text-left py-3 px-4 text-xs font-sans font-semibold text-muted-700 uppercase tracking-wide">Article</th>
                <th className="text-right py-3 px-4 text-xs font-sans font-semibold text-muted-700 uppercase tracking-wide hidden sm:table-cell">Supprimé le</th>
                <th className="py-3 px-4 w-40" />
              </tr>
            </thead>
            <tbody className="divide-y divide-muted-100">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-3 px-4"><div className="h-4 w-44 bg-muted-100 rounded" /></td>
                    <td className="py-3 px-4 hidden sm:table-cell"><div className="h-4 w-28 bg-muted-100 rounded ml-auto" /></td>
                    <td className="py-3 px-4"><div className="h-7 w-28 bg-muted-100 rounded-btn ml-auto" /></td>
                  </tr>
                ))
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-16 text-center">
                    <Trash2 size={32} className="mx-auto text-muted-300 mb-3" />
                    <p className="text-sm font-sans text-muted-500">La corbeille est vide.</p>
                    <button onClick={() => navigate('/products')} className="text-xs text-primary-500 hover:underline mt-2">
                      ← Retour aux produits
                    </button>
                  </td>
                </tr>
              ) : products.map(p => (
                <tr key={p.id} className="hover:bg-muted-50/60 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-card bg-muted-100 flex items-center justify-center shrink-0 overflow-hidden grayscale opacity-70">
                        {p.image
                          ? <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                          : <Package size={15} className="text-muted-300" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-sans font-semibold text-navy truncate max-w-[200px]">{p.name}</p>
                        {p.sku && <p className="text-[11px] text-muted-500">SKU: {p.sku}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right hidden sm:table-cell">
                    <span className="text-xs text-muted-500">{fmtDate(p.updated_at)}</span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleRestore(p)}
                        disabled={busy === p.id}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-btn border border-muted-200 text-xs font-sans font-semibold text-muted-600 hover:text-success hover:border-green-300 hover:bg-green-50 transition-colors disabled:opacity-50"
                      >
                        <RotateCcw size={13} />Restaurer
                      </button>
                      <button
                        onClick={() => handleForceDelete(p)}
                        disabled={busy === p.id}
                        className="p-1.5 rounded-btn text-muted-500 hover:text-danger hover:bg-danger/5 transition-colors disabled:opacity-50"
                        title="Supprimer définitivement"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {meta && meta.last_page > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-muted-200">
            <p className="text-xs text-muted-500">{meta.total} produit(s) — page {meta.current_page}/{meta.last_page}</p>
            <div className="flex gap-1">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="p-1.5 rounded-btn border border-muted-200 text-muted-600 disabled:opacity-40 hover:bg-muted-50"><ChevronLeft size={15} /></button>
              <button disabled={page >= meta.last_page} onClick={() => setPage(p => p + 1)} className="p-1.5 rounded-btn border border-muted-200 text-muted-600 disabled:opacity-40 hover:bg-muted-50"><ChevronRight size={15} /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
