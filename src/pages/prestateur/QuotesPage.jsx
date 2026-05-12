import { useEffect, useState, useCallback } from 'react'
import { confirmDialog } from '@/utils/confirm'
import { Link, useNavigate } from 'react-router-dom'
import { quoteService } from '@/services/prestateurService'
import toast from 'react-hot-toast'
import {
  Plus, Search, FileText, Eye, Trash2, ChevronLeft, ChevronRight,
  RefreshCw, ArrowRightLeft, Filter,
} from 'lucide-react'
import { cn } from '@/utils/cn'

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt  = (n) => new Intl.NumberFormat('fr-FR').format(n ?? 0) + ' FCFA'
const fmtD = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

const STATUS_MAP = {
  draft:    { label: 'Brouillon',  cls: 'bg-muted-100 text-muted-600' },
  sent:     { label: 'Envoyé',     cls: 'bg-blue-50 text-blue-600' },
  accepted: { label: 'Accepté',    cls: 'bg-green-50 text-success' },
  rejected: { label: 'Refusé',     cls: 'bg-red-50 text-danger' },
  expired:  { label: 'Expiré',     cls: 'bg-orange-50 text-orange-600' },
}

function StatusBadge({ status }) {
  const s = STATUS_MAP[status] ?? { label: status, cls: 'bg-muted-100 text-muted-600' }
  return (
    <span className={cn('inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full', s.cls)}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {s.label}
    </span>
  )
}

export default function QuotesPage() {
  const navigate = useNavigate()
  const [quotes, setQuotes]       = useState([])
  const [pageMeta, setPageMeta]   = useState(null)
  const [loading, setLoading]     = useState(true)
  const [converting, setConverting] = useState(null)
  const [search, setSearch]       = useState('')
  const [status, setStatus]       = useState('')
  const [page, setPage]           = useState(1)

  const fetchQuotes = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, per_page: 15 }
      if (search) params.search = search
      if (status) params.status = status
      const res = await quoteService.getAll(params)
      const d   = res.data?.data ?? res.data
      setQuotes(Array.isArray(d) ? d : d?.data ?? [])
      setPageMeta(d?.meta ?? res.data?.meta ?? null)
    } catch {
      toast.error('Impossible de charger les devis.')
    } finally {
      setLoading(false)
    }
  }, [page, search, status])

  useEffect(() => { fetchQuotes() }, [fetchQuotes])

  const handleDelete = async (q) => {
    if (!(await confirmDialog({ title: `Supprimer le devis ${q.reference} ?`, text: 'Cette action est irréversible.', confirmText: 'Supprimer' }))) return
    try {
      await quoteService.remove(q.id)
      toast.success('Devis supprimé.')
      fetchQuotes()
    } catch {
      toast.error('Erreur lors de la suppression.')
    }
  }

  const handleConvert = async (q) => {
    if (!(await confirmDialog({ title: `Convertir ${q.reference} en facture ?`, text: 'Un brouillon de facture sera créé automatiquement.', confirmText: 'Convertir', type: 'info' }))) return
    setConverting(q.id)
    try {
      const res = await quoteService.convertInvoice(q.id)
      toast.success('Devis converti en facture.')
      const invoiceId = res.data?.data?.id ?? res.data?.id
      if (invoiceId) navigate(`/prestateur/invoices/${invoiceId}`)
      else fetchQuotes()
    } catch {
      toast.error('Erreur lors de la conversion.')
    } finally {
      setConverting(null)
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-navy">Devis</h1>
          <p className="text-sm text-muted-500 mt-1">
            {pageMeta ? `${pageMeta.total ?? quotes.length} devis` : '…'}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchQuotes} className="btn-outline p-2.5" title="Actualiser">
            <RefreshCw size={15} />
          </button>
          <Link to="/prestateur/quotes/new" className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Nouveau devis
          </Link>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-surface rounded-card shadow-card p-4 flex flex-wrap gap-3">
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
                    h === 'Total' ? 'text-right' : h === '' ? 'w-28' : 'text-left',
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
                : quotes.length === 0
                  ? (
                    <tr>
                      <td colSpan={8} className="py-16 text-center">
                        <FileText size={32} className="mx-auto text-muted-300 mb-3" />
                        <p className="text-sm text-muted-500">Aucun devis trouvé.</p>
                        <Link to="/prestateur/quotes/new" className="btn-primary mt-4 inline-flex items-center gap-1.5 text-xs py-2 px-4">
                          <Plus size={13} /> Créer le premier devis
                        </Link>
                      </td>
                    </tr>
                  )
                  : quotes.map((q) => (
                    <tr
                      key={q.id}
                      onClick={() => navigate(`/prestateur/quotes/${q.id}`)}
                      className="hover:bg-muted-50 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4">
                        <span className="text-sm font-mono font-semibold text-navy">{q.reference}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-muted-700">{q.customer?.name ?? '—'}</span>
                      </td>
                      <td className="py-3 px-4 hidden md:table-cell max-w-[200px]">
                        <span className="text-sm text-muted-700 truncate block">{q.title ?? '—'}</span>
                      </td>
                      <td className="py-3 px-4 hidden sm:table-cell">
                        <span className="text-xs text-muted-500">{fmtD(q.issued_at)}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={cn(
                          'text-xs',
                          q.status === 'expired' ? 'text-danger font-semibold' : 'text-muted-500'
                        )}>
                          {fmtD(q.expires_at)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="text-sm font-semibold text-navy">{fmt(q.total)}</span>
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={q.status} />
                      </td>
                      <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            to={`/prestateur/quotes/${q.id}`}
                            className="p-1.5 rounded text-muted-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                            title="Voir"
                          >
                            <Eye size={14} />
                          </Link>
                          {q.status === 'accepted' && (
                            <button
                              onClick={() => handleConvert(q)}
                              disabled={converting === q.id}
                              className="p-1.5 rounded text-muted-400 hover:text-green-600 hover:bg-green-50 transition-colors"
                              title="Convertir en facture"
                            >
                              <ArrowRightLeft size={14} />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(q)}
                            className="p-1.5 rounded text-muted-400 hover:text-danger hover:bg-danger/5 transition-colors"
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
