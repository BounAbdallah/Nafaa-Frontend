import { useEffect, useState, useCallback, useRef } from 'react'
import { confirmDialog } from '@/utils/confirm'
import { Link, useNavigate } from 'react-router-dom'
import { contractService, templateService } from '@/services/prestateurService'
import toast from 'react-hot-toast'
import {
  Plus, Search, FileSignature, Eye, Trash2, ChevronLeft, ChevronRight,
  RefreshCw, Upload, X, Loader2, Filter,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { useCurrency } from '@/utils/currency'

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtD = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

const STATUS_MAP = {
  draft:     { label: 'Brouillon',  cls: 'bg-muted-100 text-muted-600' },
  sent:      { label: 'Envoyé',     cls: 'bg-blue-50 text-blue-600' },
  signed:    { label: 'Signé',      cls: 'bg-green-50 text-success' },
  expired:   { label: 'Expiré',     cls: 'bg-orange-50 text-orange-600' },
  cancelled: { label: 'Annulé',     cls: 'bg-muted-100 text-muted-500' },
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

// ── Modal d'import PDF ─────────────────────────────────────────────────────────
function ImportPdfModal({ onClose, onImported }) {
  const [file, setFile]       = useState(null)
  const [name, setName]       = useState('')
  const [loading, setLoading] = useState(false)
  const fileRef               = useRef(null)

  const handleFileChange = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (f.type !== 'application/pdf') {
      toast.error('Veuillez sélectionner un fichier PDF.')
      return
    }
    setFile(f)
    if (!name) setName(f.name.replace(/\.pdf$/i, ''))
  }

  const handleImport = async () => {
    if (!file)   { toast.error('Sélectionnez un fichier PDF.'); return }
    if (!name.trim()) { toast.error('Donnez un nom au template.'); return }

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('name', name.trim())
      formData.append('type', 'contract')
      await templateService.importPdf(formData)
      toast.success('Template importé avec succès.')
      onImported()
    } catch (err) {
      const msg = err.response?.data?.message ?? 'Erreur lors de l\'import.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-navy/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-card shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-5 pb-4 border-b border-muted-100">
          <div className="flex items-center gap-2">
            <Upload size={18} className="text-primary-500" />
            <h3 className="font-display font-bold text-navy">Importer un template PDF</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-muted-500 hover:text-navy rounded hover:bg-muted-100"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Zone de dépôt */}
          <div
            onClick={() => fileRef.current?.click()}
            className={cn(
              'border-2 border-dashed rounded-card p-6 text-center cursor-pointer transition-colors',
              file ? 'border-primary-400 bg-primary-50' : 'border-muted-300 hover:border-primary-300 hover:bg-muted-50'
            )}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileChange}
              className="hidden"
            />
            <Upload size={24} className={cn('mx-auto mb-2', file ? 'text-primary-500' : 'text-muted-400')} />
            {file ? (
              <div>
                <p className="text-sm font-semibold text-navy">{file.name}</p>
                <p className="text-xs text-muted-500 mt-0.5">
                  {(file.size / 1024).toFixed(1)} Ko
                </p>
              </div>
            ) : (
              <div>
                <p className="text-sm text-muted-600 font-medium">Cliquez pour sélectionner un PDF</p>
                <p className="text-xs text-muted-400 mt-0.5">Format PDF uniquement</p>
              </div>
            )}
          </div>

          {/* Nom du template */}
          <div className="space-y-1.5">
            <label className="label-field">Nom du template *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ex: Contrat de prestation standard"
              className="input-field"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-5 pt-3 border-t border-muted-100">
          <button type="button" onClick={onClose} className="btn-outline flex-1">Annuler</button>
          <button
            onClick={handleImport}
            disabled={loading || !file || !name.trim()}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            {loading ? 'Import en cours…' : 'Importer'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ContractsPage() {
  const navigate = useNavigate()
  const { format: _fmt } = useCurrency()
  const fmt = (n) => n != null ? _fmt(n) : '—'
  const [contracts, setContracts] = useState([])
  const [pageMeta, setPageMeta]   = useState(null)
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [status, setStatus]       = useState('')
  const [page, setPage]           = useState(1)
  const [showImport, setShowImport] = useState(false)

  const fetchContracts = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, per_page: 15 }
      if (search) params.search = search
      if (status) params.status = status
      const res = await contractService.getAll(params)
      const d   = res.data?.data ?? res.data
      setContracts(Array.isArray(d) ? d : d?.data ?? [])
      setPageMeta(d?.meta ?? res.data?.meta ?? null)
    } catch {
      toast.error('Impossible de charger les contrats.')
    } finally {
      setLoading(false)
    }
  }, [page, search, status])

  useEffect(() => { fetchContracts() }, [fetchContracts])

  const handleDelete = async (c) => {
    if (!(await confirmDialog({ title: `Supprimer le contrat ${c.reference} ?`, text: 'Cette action est irréversible.', confirmText: 'Supprimer' }))) return
    try {
      await contractService.remove(c.id)
      toast.success('Contrat supprimé.')
      fetchContracts()
    } catch {
      toast.error('Erreur lors de la suppression.')
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-navy">Contrats</h1>
          <p className="text-sm text-muted-500 mt-1">
            {pageMeta ? `${pageMeta.total ?? contracts.length} contrat${(pageMeta.total ?? contracts.length) > 1 ? 's' : ''}` : '…'}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchContracts} className="btn-outline p-2.5" title="Actualiser">
            <RefreshCw size={15} />
          </button>
          <button
            onClick={() => setShowImport(true)}
            className="btn-outline flex items-center gap-2"
          >
            <Upload size={14} /> Importer PDF
          </button>
          <Link to="/prestateur/contracts/new" className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Nouveau contrat
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
                {['Référence', 'Client', 'Titre', 'Valeur', 'Début', 'Fin', 'Statut', ''].map((h) => (
                  <th key={h} className={cn(
                    'py-3 px-4 text-xs font-semibold text-muted-600 uppercase tracking-wide',
                    h === 'Valeur' ? 'text-right' : h === '' ? 'w-20' : 'text-left',
                    h === 'Titre'  && 'hidden md:table-cell',
                    h === 'Début'  && 'hidden lg:table-cell',
                  )}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-muted-100">
              {loading
                ? [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {[...Array(8)].map((__, j) => (
                      <td key={j} className="py-3 px-4">
                        <div className="h-4 bg-muted-100 rounded w-full" />
                      </td>
                    ))}
                  </tr>
                ))
                : contracts.length === 0
                  ? (
                    <tr>
                      <td colSpan={8} className="py-16 text-center">
                        <FileSignature size={32} className="mx-auto text-muted-300 mb-3" />
                        <p className="text-sm text-muted-500">Aucun contrat trouvé.</p>
                        <Link to="/prestateur/contracts/new" className="btn-primary mt-4 inline-flex items-center gap-1.5 text-xs py-2 px-4">
                          <Plus size={13} /> Créer le premier contrat
                        </Link>
                      </td>
                    </tr>
                  )
                  : contracts.map((c) => (
                    <tr
                      key={c.id}
                      onClick={() => navigate(`/prestateur/contracts/${c.id}`)}
                      className="hover:bg-muted-50 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4">
                        <span className="text-sm font-mono font-semibold text-navy">{c.reference}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-muted-700">{c.customer?.name ?? '—'}</span>
                      </td>
                      <td className="py-3 px-4 hidden md:table-cell max-w-[200px]">
                        <span className="text-sm text-muted-700 truncate block">{c.title ?? '—'}</span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="text-sm font-semibold text-navy">{fmt(c.value)}</span>
                      </td>
                      <td className="py-3 px-4 hidden lg:table-cell">
                        <span className="text-xs text-muted-500">{fmtD(c.start_at)}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={cn(
                          'text-xs',
                          c.status === 'expired' ? 'text-orange-600 font-semibold' : 'text-muted-500'
                        )}>
                          {fmtD(c.end_at)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={c.status} />
                      </td>
                      <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            to={`/prestateur/contracts/${c.id}`}
                            className="p-1.5 rounded text-muted-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                            title="Voir"
                          >
                            <Eye size={14} />
                          </Link>
                          <button
                            onClick={() => handleDelete(c)}
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

      {/* Modal import PDF */}
      {showImport && (
        <ImportPdfModal
          onClose={() => setShowImport(false)}
          onImported={() => { setShowImport(false); toast.success('Template disponible dans l\'éditeur.') }}
        />
      )}
    </div>
  )
}
