import { useEffect, useState, useCallback } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { expenseService } from '@/services/expenseService'
import toast from 'react-hot-toast'
import {
  Plus, Search, Receipt, Edit2, Trash2, X, Loader2,
  ChevronLeft, ChevronRight, RefreshCw, TrendingDown,
  Calendar, Wallet, Tag, Eye,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import DateRangePicker from '@/components/ui/DateRangePicker'

const fmt     = (n) => new Intl.NumberFormat('fr-FR').format(n ?? 0) + ' FCFA'
const today   = () => new Date().toISOString().split('T')[0]
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

const CATEGORY_COLORS = {
  loyer:         'bg-violet-100 text-violet-700',
  electricite:   'bg-amber-100 text-amber-700',
  eau:           'bg-blue-100 text-blue-700',
  salaires:      'bg-green-100 text-green-700',
  transport:     'bg-orange-100 text-orange-700',
  marketing:     'bg-pink-100 text-pink-700',
  fournitures:   'bg-cyan-100 text-cyan-700',
  maintenance:   'bg-red-100 text-red-700',
  communication: 'bg-indigo-100 text-indigo-700',
  taxes:         'bg-gray-100 text-gray-700',
  autre:         'bg-muted-100 text-muted-600',
}

const schema = z.object({
  category:       z.string().min(1, 'Catégorie requise'),
  description:    z.string().min(1, 'Description requise'),
  amount:         z.coerce.number().min(1, 'Montant invalide'),
  payment_method: z.string().min(1, 'Mode de paiement requis'),
  expense_date:   z.string().min(1, 'Date requise'),
  notes:          z.string().optional(),
})

// ── Modal Add/Edit/View ────────────────────────────────────────────────────────
function ExpenseModal({ expense, meta, onClose, onSaved, readOnly = false }) {
  const isEdit = !!expense
  const { register, handleSubmit, reset, control, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: expense
      ? { ...expense, expense_date: expense.expense_date }
      : { expense_date: today(), payment_method: 'cash' },
  })

  useEffect(() => { if (expense) reset({ ...expense }) }, [expense, reset])

  const onSubmit = async (data) => {
    try {
      if (isEdit) await expenseService.update(expense.id, data)
      else        await expenseService.create(data)
      toast.success(isEdit ? 'Dépense mise à jour.' : 'Dépense enregistrée.')
      onSaved()
    } catch (err) {
      const msg = err.response?.data?.errors
        ? Object.values(err.response.data.errors).flat()[0]
        : err.response?.data?.message || 'Erreur.'
      toast.error(msg)
    }
  }

  return (
    <div className="fixed inset-0 bg-navy/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-modal shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 pb-4 flex-shrink-0">
          <h3 className="font-display font-bold text-navy">
            {isEdit ? 'Modifier la dépense' : 'Enregistrer une dépense'}
          </h3>
          <button onClick={onClose} className="p-1.5 text-muted-500 hover:text-navy rounded-btn hover:bg-muted-100"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="overflow-y-auto flex-1">
          <div className="px-6 pb-6 space-y-4">
            {/* Catégorie */}
            <div className="space-y-1.5">
              <label className="block text-xs font-sans font-semibold text-muted-700 uppercase tracking-wide">Catégorie *</label>
              <Controller name="category" control={control} render={({ field }) => (
                <select {...field} disabled={readOnly} className={cn('input-field appearance-none', errors.category && 'border-danger')}>
                  <option value="">— Choisir —</option>
                  {meta?.categories?.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              )} />
              {errors.category && <p className="text-xs text-danger">{errors.category.message}</p>}
            </div>
 
            {/* Description */}
            <div className="space-y-1.5">
              <label className="block text-xs font-sans font-semibold text-muted-700 uppercase tracking-wide">Description *</label>
              <input {...register('description')} disabled={readOnly} placeholder="ex: Loyer local commercial — Avril 2026" className={cn('input-field', errors.description && 'border-danger')} />
              {errors.description && <p className="text-xs text-danger">{errors.description.message}</p>}
            </div>
 
            {/* Montant + Date */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-sans font-semibold text-muted-700 uppercase tracking-wide">Montant (FCFA) *</label>
                <input type="number" {...register('amount')} disabled={readOnly} placeholder="0" className={cn('input-field', errors.amount && 'border-danger')} />
                {errors.amount && <p className="text-xs text-danger">{errors.amount.message}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-sans font-semibold text-muted-700 uppercase tracking-wide">Date *</label>
                <input type="date" {...register('expense_date')} disabled={readOnly} className="input-field" />
              </div>
            </div>
 
            {/* Mode de paiement */}
            <div className="space-y-1.5">
              <label className="block text-xs font-sans font-semibold text-muted-700 uppercase tracking-wide">Mode de paiement *</label>
              <Controller name="payment_method" control={control} render={({ field }) => (
                <select {...field} disabled={readOnly} className="input-field appearance-none">
                  {meta?.payment_methods?.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              )} />
            </div>
 
            {/* Notes */}
            <div className="space-y-1.5">
              <label className="block text-xs font-sans font-semibold text-muted-700 uppercase tracking-wide">Notes</label>
              <textarea {...register('notes')} disabled={readOnly} rows={2} placeholder="Notes optionnelles…" className="input-field resize-none" />
            </div>
          </div>
        </form>

        <div className="flex gap-3 p-6 pt-4 border-t border-muted-100 flex-shrink-0">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">{readOnly ? 'Fermer' : 'Annuler'}</button>
          {!readOnly && (
            <button onClick={handleSubmit(onSubmit)} disabled={isSubmitting} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {isSubmitting && <Loader2 size={15} className="animate-spin" />}
              {isSubmitting ? 'Enregistrement…' : (isEdit ? 'Enregistrer' : 'Ajouter')}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Page principale ───────────────────────────────────────────────────────────
export default function ExpensesPage() {
  const [expenses, setExpenses] = useState([])
  const [meta, setMeta]         = useState(null)
  const [pageMeta, setPageMeta] = useState(null)
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [catFilter, setCat]     = useState('')
  const [range, setRange]       = useState({ start: '', end: '' })
  const [periodTotal, setPeriodTotal] = useState(0)
  const [page, setPage]         = useState(1)
  const [modal, setModal]       = useState(null)
  const [viewOnly, setViewOnly] = useState(false)

  useEffect(() => {
    expenseService.getMeta().then(r => setMeta(r.data)).catch(() => {})
  }, [])
  const fetchExpenses = useCallback(async () => {
    setLoading(true)
    try {
      const params = { 
        page, 
        per_page: 20,
        search,
        category: catFilter || undefined,
        start_date: range.start,
        end_date: range.end
      }
      const r = await expenseService.getAll(params)
      setExpenses(r.data.expenses)
      setPageMeta(r.data.meta)
      setPeriodTotal(r.data.period_total ?? 0)
    } catch { toast.error('Impossible de charger les dépenses.') }
    finally { setLoading(false) }
  }, [page, search, catFilter, range])

  useEffect(() => { fetchExpenses() }, [fetchExpenses])

  // Listen for AI actions (e.g. voice creation of expense)
  useEffect(() => {
    const handleAiAction = (e) => {
      const action = e.detail?.action
      if (action === 'create_expense' || action === 'bulk_create_expenses') {
        fetchExpenses()
      }
    }
    window.addEventListener('qiwam:ai-action', handleAiAction)
    return () => window.removeEventListener('qiwam:ai-action', handleAiAction)
  }, [fetchExpenses])

  const handleDelete = async (e) => {
    if (!window.confirm(`Supprimer cette dépense ?`)) return
    try {
      await expenseService.remove(e.id)
      toast.success('Dépense supprimée.')
      fetchExpenses()
    } catch { toast.error('Erreur lors de la suppression.') }
  }

  // Calcul répartition par catégorie sur la page courante
  const byCategory = expenses.reduce((acc, e) => {
    acc[e.category_label] = (acc[e.category_label] ?? 0) + e.amount
    return acc
  }, {})
  const topCategory = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0]

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-navy">Dépenses</h1>
          <p className="text-sm font-sans text-muted-500 mt-1">
            {pageMeta ? `${pageMeta.total} dépense${pageMeta.total > 1 ? 's' : ''}` : '…'}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchExpenses} className="btn-secondary p-2.5"><RefreshCw size={15} /></button>
          <button onClick={() => setModal('add')} className="btn-primary flex items-center gap-2">
            <Plus size={16} />Ajouter
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-4 flex items-center gap-3 sm:col-span-1">
          <div className="w-9 h-9 rounded-card bg-red-50 text-danger flex items-center justify-center flex-shrink-0">
            <TrendingDown size={17} />
          </div>
          <div>
            <p className="text-lg font-display font-bold text-navy">{fmt(periodTotal)}</p>
            <p className="text-xs text-muted-500 font-sans">Total période sélectionnée</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-card bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
            <Receipt size={17} />
          </div>
          <div>
            <p className="text-lg font-display font-bold text-navy">{pageMeta?.total ?? 0}</p>
            <p className="text-xs text-muted-500 font-sans">Nb de dépenses</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-card bg-violet-50 text-violet-600 flex items-center justify-center flex-shrink-0">
            <Tag size={17} />
          </div>
          <div>
            <p className="text-sm font-display font-bold text-navy truncate">{topCategory ? topCategory[0] : '—'}</p>
            <p className="text-xs text-muted-500 font-sans">Catégorie principale</p>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="card p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-500" />
          <input
            placeholder="Rechercher…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            className="input-field pl-9"
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <DateRangePicker onRangeChange={(r) => { setRange(r); setPage(1) }} />
          <select
            value={catFilter}
            onChange={e => { setCat(e.target.value); setPage(1) }}
            className="input-field appearance-none min-w-[160px]"
          >
            <option value="">Toutes catégories</option>
            {meta?.categories?.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
      </div>

      {/* Tableau */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-muted-300 bg-muted-100/50">
                <th className="text-left py-3 px-4 text-xs font-sans font-semibold text-muted-700 uppercase tracking-wide">Dépense</th>
                <th className="text-left py-3 px-4 text-xs font-sans font-semibold text-muted-700 uppercase tracking-wide hidden sm:table-cell">Catégorie</th>
                <th className="text-left py-3 px-4 text-xs font-sans font-semibold text-muted-700 uppercase tracking-wide hidden md:table-cell">Paiement</th>
                <th className="text-left py-3 px-4 text-xs font-sans font-semibold text-muted-700 uppercase tracking-wide hidden md:table-cell">Date</th>
                <th className="text-right py-3 px-4 text-xs font-sans font-semibold text-muted-700 uppercase tracking-wide">Montant</th>
                <th className="py-3 px-4 w-20" />
              </tr>
            </thead>
            <tbody className="divide-y divide-muted-100">
              {loading
                ? [...Array(5)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="py-3 px-4"><div className="h-4 w-40 bg-muted-100 rounded" /></td>
                      <td className="py-3 px-4 hidden sm:table-cell"><div className="h-5 w-24 bg-muted-100 rounded-badge" /></td>
                      <td className="py-3 px-4 hidden md:table-cell"><div className="h-4 w-20 bg-muted-100 rounded" /></td>
                      <td className="py-3 px-4 hidden md:table-cell"><div className="h-4 w-20 bg-muted-100 rounded" /></td>
                      <td className="py-3 px-4 text-right"><div className="h-4 w-24 bg-muted-100 rounded ml-auto" /></td>
                      <td className="py-3 px-4"><div className="h-7 w-16 bg-muted-100 rounded-btn ml-auto" /></td>
                    </tr>
                  ))
                : expenses.length === 0
                  ? (
                    <tr>
                      <td colSpan={6} className="py-16 text-center">
                        <Receipt size={32} className="mx-auto text-muted-300 mb-3" />
                        <p className="text-sm font-sans text-muted-500">Aucune dépense pour cette période.</p>
                        <button onClick={() => setModal('add')} className="btn-primary mt-4 mx-auto text-xs py-2 px-4">
                          Enregistrer une dépense
                        </button>
                      </td>
                    </tr>
                  )
                  : expenses.map(e => (
                    <tr key={e.id} className="hover:bg-muted-100/30 transition-colors">
                      <td className="py-3 px-4">
                        <p className="text-sm font-sans font-semibold text-navy">{e.description}</p>
                        {e.notes && <p className="text-[11px] text-muted-400 truncate max-w-[200px]">{e.notes}</p>}
                      </td>
                      <td className="py-3 px-4 hidden sm:table-cell">
                        <span className={cn(
                          'inline-flex items-center text-xs font-sans font-semibold px-2 py-0.5 rounded-badge',
                          CATEGORY_COLORS[e.category] ?? 'bg-muted-100 text-muted-600'
                        )}>
                          {e.category_label}
                        </span>
                      </td>
                      <td className="py-3 px-4 hidden md:table-cell">
                        <div className="flex items-center gap-1.5">
                          <Wallet size={11} className="text-muted-400" />
                          <span className="text-xs font-sans text-muted-700">{e.payment_label}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 hidden md:table-cell">
                        <span className="text-xs font-sans text-muted-700">{fmtDate(e.expense_date)}</span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="text-sm font-sans font-semibold text-danger">{fmt(e.amount)}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => { setModal(e); setViewOnly(true) }} className="p-1.5 rounded-btn text-muted-500 hover:text-primary-500 hover:bg-primary-50 transition-colors" title="Voir détails">
                            <Eye size={14} />
                          </button>
                          <button onClick={() => { setModal(e); setViewOnly(false) }} className="p-1.5 rounded-btn text-muted-500 hover:text-primary-500 hover:bg-primary-50 transition-colors" title="Modifier">
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => handleDelete(e)} className="p-1.5 rounded-btn text-muted-500 hover:text-danger hover:bg-danger/5 transition-colors" title="Supprimer">
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

        {/* Total visible en bas */}
        {expenses.length > 0 && !loading && (
          <div className="border-t border-muted-100 px-4 py-3 flex items-center justify-between bg-muted-100/30">
            <span className="text-xs text-muted-500 font-sans">
              {pageMeta && `Page ${pageMeta.current_page} / ${pageMeta.last_page} · `}Total période
            </span>
            <span className="text-sm font-display font-bold text-danger">{fmt(periodTotal)}</span>
          </div>
        )}

        {pageMeta && pageMeta.last_page > 1 && (
          <div className="border-t border-muted-100 px-4 py-3 flex items-center justify-between">
            <span className="text-xs text-muted-500 font-sans">Page {pageMeta.current_page} / {pageMeta.last_page}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => p - 1)} disabled={page === 1} className="p-1.5 rounded-btn border border-muted-300 text-muted-500 hover:text-navy disabled:opacity-30"><ChevronLeft size={15} /></button>
              <button onClick={() => setPage(p => p + 1)} disabled={page === pageMeta.last_page} className="p-1.5 rounded-btn border border-muted-300 text-muted-500 hover:text-navy disabled:opacity-30"><ChevronRight size={15} /></button>
            </div>
          </div>
        )}
      </div>

      {modal && (
        <ExpenseModal
          expense={modal === 'add' ? null : modal}
          meta={meta}
          readOnly={viewOnly}
          onClose={() => { setModal(null); setViewOnly(false) }}
          onSaved={() => { setModal(null); setViewOnly(false); fetchExpenses() }}
        />
      )}
    </div>
  )
}
