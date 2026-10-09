import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { History, Loader2 } from 'lucide-react'
import { productService } from '@/services/productService'
import { cn } from '@/utils/cn'

const fmtQty = (n) => Number(n || 0).toLocaleString('fr-FR', { maximumFractionDigits: 3 })
const fmtDateTime = (d) => new Date(d).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })

// Lien vers le document à l'origine du mouvement
const sourceLink = (m) => {
  if (m.source_type === 'Production' && m.source_id) return `/production/${m.source_id}`
  if (m.source_type === 'PurchaseOrder' && m.source_id) return `/purchase-orders/${m.source_id}`
  return null
}

export default function StockMovementsCard({ productId, unit }) {
  const [movements, setMovements] = useState([])
  const [page, setPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    productService.getStockMovements(productId, page)
      .then((res) => {
        if (cancelled) return
        setMovements((prev) => (page === 1 ? res.data.data : [...prev, ...res.data.data]))
        setLastPage(res.data.last_page)
      })
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false))
    return () => { cancelled = true }
  }, [productId, page])

  return (
    <div className="card p-4 sm:p-5">
      <h2 className="font-display font-semibold text-navy mb-3 flex items-center gap-2">
        <History size={15} className="text-muted-400" />Historique du stock
      </h2>

      {movements.length === 0 && !loading && (
        <p className="text-xs text-muted-400 font-sans">Aucun mouvement enregistré pour le moment.</p>
      )}

      {movements.length > 0 && (
        <div className="divide-y divide-muted-100 -mx-1">
          {movements.map((m) => {
            const link = sourceLink(m)
            return (
              <div key={m.id} className="px-1 py-2.5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-navy truncate">
                    {m.type_label}
                    {m.reference && (
                      link
                        ? <Link to={link} className="ml-1.5 font-mono text-primary-600 hover:underline">{m.reference}</Link>
                        : <span className="ml-1.5 font-mono text-muted-500">{m.reference}</span>
                    )}
                  </div>
                  <div className="text-[11px] text-muted-400 font-sans">
                    {fmtDateTime(m.created_at)}{m.user && ` · ${m.user}`} · stock {fmtQty(m.stock_before)} → {fmtQty(m.stock_after)}
                  </div>
                  {m.note && <div className="text-[11px] text-amber-600 font-semibold">{m.note}</div>}
                </div>
                <div className={cn('text-sm font-bold shrink-0', m.quantity < 0 ? 'text-danger' : 'text-success')}>
                  {m.quantity > 0 ? '+' : ''}{fmtQty(m.quantity)} {unit}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-3"><Loader2 size={18} className="animate-spin text-muted-300" /></div>
      )}

      {!loading && page < lastPage && (
        <button onClick={() => setPage((p) => p + 1)} className="btn-secondary w-full mt-3 py-2 text-xs">
          Voir plus
        </button>
      )}
    </div>
  )
}
