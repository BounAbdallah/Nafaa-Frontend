import { useEffect, useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { invoiceService } from '@/services/prestateurService'
import toast from 'react-hot-toast'
import {
  Plus, Search, Receipt, Eye, Trash2, ChevronLeft, ChevronRight,
  RefreshCw, Filter, AlertCircle,
} from 'lucide-react'
import { cn } from '@/utils/cn'

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt  = (n) => new Intl.NumberFormat('fr-FR').format(n ?? 0) + ' FCFA'
const fmtD = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

const isOverdue = (inv) => {
  if (inv.status === 'paid' || inv.status === 'cancelled') return false
  if (!inv.due_at) return false
  return new Date(inv.due_at) < new Date()
}

const STATUS_MAP = {
  draft:     { label: 'Brouillon',   cls: 'bg-muted-100 text-muted-600' },
  sent:      { label: 'Envoyée',     cls: 'bg-blue-50 text-blue-600' },
  paid:      { label: 'Payée',       cls: 'bg-green-50 text-success' },
  overdue:   { label: 'En retard',   cls: 'bg-red-50 text-danger' },
  cancelled: { label: 'Annulée',     cls: 'bg-muted-100 text-muted-500' },
}

function StatusBadge({ status, overdue }) {
  const key = overdue ? 'overdue' : status
  const s   = STATUS_MAP[key] ?? { label: key, cls: 'bg-muted-100 text-muted-600' }
  return (
    <span className={cn('inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full', s.cls)}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {s.label}
    </span>
  )
}

export default function InvoicesPage() {
  const navigate = useNavigate()
  const [invoices, setInvoices]   = useState([])
  const [pageMeta, setPageMeta]   = useState(null)
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [status, setStatus]       = useState('')
  const [overdueOnly, setOverdue] = useState(false)
  const [page, setPage]           = useState(1)

  const fetchInvoices = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, per_page: 15 }
      if (search)     params.search  = search
      if (status)     params.status  = status
      if (overdueOnly) params.overdue = 1
      const res = await invoiceService.getAll(params)
      const d   = res.data?.data ?? res.data
      setInvoices(Array.isArray(d) ? d : d?.data ?? [])
      setPageMeta(d?.meta ?? res.data?.meta ?? null)
    } catch {
      toast.error('Impossible de charger les factures.')
    } finally {
      setLoading(false)
    }
  }, [page, search, status, overdueOnly])

  useEffect(() => { fetchInvoices() }, [fetchInvoices])

  const handleDelete = async (inv) => {
    if (!window.confirm(`Supprimer la facture "${inv.reference}" ?`)) return
    try {
      await invoiceService.remove(inv.id)
      toast.success('Facture supprimée.')
      fetchInvoices()
    } catch {
      toast.error('Erreur lors de la suppression.')
    }
  }

  const overdueCount = invoices.filter(isOverdue).length

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-navy">Factures</h1>
          <p className="text-sm text-muted-500 mt-1">
            {pageMeta ? `${pageMeta.total ?? invoices.length} facture${(pageMeta.total ?? invoices.length) > 1 ? 's' : ''}` : '…'}
            {overdueCount > 0 && (
              <span className="ml-2 text-danger font-semibold">
                · {overdueCount} en retard
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchInvoices} className="btn-outline p-2.5" title="Actualiser">
            <RefreshCw size={15} />
          </button>
          <Link to="/prestateur/invoices/new" className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Nouvelle facture
          </Link>
        </div>
      </div>

      {/* Alerte en retard */}
      {overdueCount > 0 && !overdueOnly && (
        <div
          className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-card text-danger text-sm cursor-pointer hover:bg-red-100 transition-colors"
          onClick={() => setOverdue(true)}
        >
          <AlertCircle size={16} className="flex-shrink-0" />
          <span>
            <strong>{overdueCount} facture{overdueCount > 1 ? 's' : ''} en retard</strong> — cliquez pour filtrer
          </span>
        </div>
      )}

      {/* Filtres */}
      <div className="bg-surface rounded-card shadow-card p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-500" />
          <input
            placeholder="Référence, client, titre…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="input-field pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-muted-500" />
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1) }}
            className="input-field appearance-none min-w-[160px]"
          >
            <option value="">Tous les statuts</option>
            {Object.entries(STATUS_MAP).map(([val, { label }]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        </div>
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={overdueOnly}
            onChange={(e) => { setOverdue(e.target.checked); setPage(1) }}
            className="w-4 h-4 accent-danger rounded"
          />
          <span className="text-sm text-muted-700">En retard uniquement</span>
        </label>
      </div>

      {/* Tableau */}
      <div className="bg-surface rounded-card shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-muted-200 bg-muted-50">
                {['Référence', 'Client', 'Titre', 'Date', 'Échéance', 'Total', 'Statut', ''].map((h) => (
                  <th key={h} className={cn(
                    'py-3 px-4 text-xs font-semibold text-muted-600 uppercase tracking-wide',
                    h === 'Total' ? 'text-right' : h === '' ? 'w-20' : 'text-left',
                    h === 'Titre' && 'hidden md:table-cell',
                    h === 'Date'  && 'hidden sm:table-cell',
                  )}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-muted-100">
              {loading
                ? [...Array(6)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {[...Array(8)].map((__, j) => (
                      <td key={j} className="py-3 px-4">
                        <div className="h-4 bg-muted-100 rounded w-full" />
                      </td>
                    ))}
                  </tr>
                ))
                : invoices.length === 0
                  ? (
                    <tr>
                      <td colSpan={8} className="py-16 text-center">
                        <Receipt size={32} className="mx-auto text-muted-300 mb-3" />
                        <p className="text-sm text-muted-500">Aucune facture trouvée.</p>
                        <Link to="/prestateur/invoices/new" className="btn-primary mt-4 inline-flex items-center gap-1.5 text-xs py-2 px-4">
                          <Plus size={13} /> Créer la première facture
                        </Link>
                      </td>
                    </tr>
                  )
                  : invoices.map((inv) => {
                    const overdue = isOverdue(inv)
                    return (
                      <tr
                        key={inv.id}
                        onClick={() => navigate(`/prestateur/invoices/${inv.id}`)}
                        className={cn(
                          'hover:bg-muted-50 cursor-pointer transition-colors',
                          overdue && 'bg-red-50/40 hover:bg-red-50'
                        )}
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {overdue && <AlertCircle size={13} className="text-danger flex-shrink-0" />}
                            <span className="text-sm font-mono font-semibold text-navy">{inv.reference}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-muted-700">{inv.customer?.name ?? '—'}</span>
                        </td>
                        <td className="py-3 px-4 hidden md:table-cell max-w-[200px]">
                          <span className="text-sm text-muted-700 truncate block">{inv.title ?? '—'}</span>
                        </td>
                        <td className="py-3 px-4 hidden sm:table-cell">
                          <span className="text-xs text-muted-500">{fmtD(inv.issued_at)}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={cn('text-xs', overdue ? 'text-danger font-semibold' : 'text-muted-500')}>
                            {fmtD(inv.due_at)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className={cn(
                            'text-sm font-semibold',
                            inv.status === 'paid' ? 'text-success' : overdue ? 'text-danger' : 'text-navy'
                          )}>
                            {fmt(inv.total)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <StatusBadge status={inv.status} overdue={overdue} />
                        </td>
                        <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <Link
                              to={`/prestateur/invoices/${inv.id}`}
                              className="p-1.5 rounded text-muted-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                              title="Voir"
                            >
                              <Eye size={14} />
                            </Link>
                            <button
                              onClick={() => handleDelete(inv)}
                              className="p-1.5 rounded text-muted-400 hover:text-danger hover:bg-danger/5 transition-colors"
                              title="Supprimer"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
              }
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pageMeta && pageMeta.last_page > 1 && (
          <div className="border-t border-muted-100 px-4 py-3 flex items-center justify-between">
            <span className="text-xs text-muted-500">
              Page {pageMeta.current_page} / {pageMeta.last_page}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => p - 1)}
                disabled={page === 1}
                className="p-1.5 rounded border border-muted-300 text-muted-500 hover:text-navy disabled:opacity-30"
              >
                <ChevronLeft size={15} />
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page === pageMeta.last_page}
                className="p-1.5 rounded border border-muted-300 text-muted-500 hover:text-navy disabled:opacity-30"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
