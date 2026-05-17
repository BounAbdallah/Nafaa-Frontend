import { useEffect, useState, useCallback } from 'react'
import { confirmDialog } from '@/utils/confirm'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useForm, Controller, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { purchaseOrderService } from '@/services/purchaseOrderService'
import toast from 'react-hot-toast'
import {
  Plus, Search, ShoppingCart, X, Loader2, ChevronLeft, ChevronRight,
  RefreshCw, Trash2, Package, TrendingUp, Clock, CheckCircle2,
  Truck, AlertCircle, XCircle, ChevronDown, Eye, Calendar,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import DateRangePicker from '@/components/ui/DateRangePicker'
import { useCurrency } from '@/utils/currency'

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '—'

const STATUS_CONFIG = {
  draft:      { label: 'Brouillon',         color: 'bg-muted-100 text-muted-600',   icon: Clock },
  ordered:    { label: 'Commandé',           color: 'bg-blue-50 text-blue-600',      icon: ShoppingCart },
  in_transit: { label: 'En transit',         color: 'bg-violet-50 text-violet-600',  icon: Truck },
  partial:    { label: 'Reçu partiel.',      color: 'bg-amber-50 text-amber-700',    icon: AlertCircle },
  received:   { label: 'Reçu totalement',    color: 'bg-green-50 text-success',      icon: CheckCircle2 },
  cancelled:  { label: 'Annulé',             color: 'bg-red-50 text-danger',         icon: XCircle },
}

const NEXT_STATUS = {
  draft:      ['ordered', 'cancelled'],
  ordered:    ['in_transit', 'partial', 'received', 'cancelled'],
  in_transit: ['partial', 'received', 'cancelled'],
  partial:    ['received', 'cancelled'],
}

// ── Schema ───────────────────────────────────────────────────────────────────
const itemSchema = z.object({
  product_id:  z.coerce.number().optional().nullable(),
  description: z.string().min(1, 'Description requise'),
  unit:        z.string().min(1, 'Unité requise'),
  quantity:    z.coerce.number().min(0.001, 'Quantité invalide'),
  unit_price:  z.coerce.number().min(0),
})

const schema = z.object({
  supplier_id:   z.coerce.number().min(1, 'Fournisseur requis'),
  order_date:    z.string().min(1, 'Date requise'),
  expected_date: z.string().optional(),
  notes:         z.string().optional(),
  items:         z.array(itemSchema).min(1, 'Ajoutez au moins un article'),
})

// ── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft
  return (
    <span className={cn('inline-flex items-center gap-1 text-[11px] font-sans font-semibold px-2 py-0.5 rounded-badge whitespace-nowrap', cfg.color)}>
      <cfg.icon size={10} />
      {cfg.label}
    </span>
  )
}

// ── Modal création ────────────────────────────────────────────────────────────
function CreateOrderModal({ meta, onClose, onSaved }) {
  const { format: fmt } = useCurrency()   // ← hook propre (bug fix)

  const { register, handleSubmit, control, watch, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      order_date: new Date().toISOString().split('T')[0],
      items: [{ product_id: null, description: '', unit: 'pièce', quantity: 1, unit_price: 0 }],
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'items' })
  const watchItems = watch('items')
  const total = watchItems?.reduce((sum, item) =>
    sum + (Number(item.quantity) || 0) * (Number(item.unit_price) || 0), 0) ?? 0

  const onSubmit = async (data) => {
    try {
      await purchaseOrderService.create(data)
      toast.success('Bon de commande créé.')
      onSaved()
    } catch (err) {
      const msg = err.response?.data?.errors
        ? Object.values(err.response.data.errors).flat()[0]
        : err.response?.data?.message || 'Erreur.'
      toast.error(msg)
    }
  }

  const unitOptions = meta?.units ?? ['pièce', 'kg', 'g', 'litre', 'boîte', 'carton', 'sac']

  return (
    <div className="fixed inset-0 bg-navy/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-surface rounded-t-2xl sm:rounded-modal shadow-2xl w-full sm:max-w-2xl max-h-[95dvh] sm:max-h-[92vh] flex flex-col animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">

        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-muted-100 shrink-0">
          <h3 className="font-display font-bold text-navy">Nouveau bon de commande</h3>
          <button onClick={onClose} className="p-1.5 text-muted-500 hover:text-navy rounded-btn hover:bg-muted-100">
            <X size={18} />
          </button>
        </div>

        {/* Form body */}
        <form onSubmit={handleSubmit(onSubmit)} className="overflow-y-auto flex-1">
          <div className="px-5 sm:px-6 py-4 space-y-4 sm:space-y-5">

            {/* Fournisseur + Date commande */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-sans font-semibold text-muted-700 uppercase tracking-wide">Fournisseur *</label>
                <Controller name="supplier_id" control={control} render={({ field }) => (
                  <select {...field} className={cn('input-field appearance-none', errors.supplier_id && 'border-danger')}>
                    <option value="">— Choisir —</option>
                    {meta?.suppliers?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                )} />
                {errors.supplier_id && <p className="text-xs text-danger">{errors.supplier_id.message}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-sans font-semibold text-muted-700 uppercase tracking-wide">Date de commande *</label>
                <input type="date" {...register('order_date')} className="input-field" />
                {errors.order_date && <p className="text-xs text-danger">{errors.order_date.message}</p>}
              </div>
            </div>

            {/* Date réception + Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-sans font-semibold text-muted-700 uppercase tracking-wide">Date de réception prévue</label>
                <input type="date" {...register('expected_date')} className="input-field" />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-sans font-semibold text-muted-700 uppercase tracking-wide">Notes</label>
                <input {...register('notes')} placeholder="Notes optionnelles…" className="input-field" />
              </div>
            </div>

            {/* Articles */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-xs font-sans font-semibold text-muted-700 uppercase tracking-wide">Articles *</label>
                <button
                  type="button"
                  onClick={() => append({ product_id: null, description: '', unit: 'pièce', quantity: 1, unit_price: 0 })}
                  className="text-xs font-sans text-primary-500 hover:text-primary-600 flex items-center gap-1 font-semibold"
                >
                  <Plus size={13} /> Ajouter une ligne
                </button>
              </div>

              {errors.items?.root && <p className="text-xs text-danger mb-2">{errors.items.root.message}</p>}

              {/* Desktop grid headers (sm+) */}
              <div className="hidden sm:grid grid-cols-12 gap-2 px-1 mb-1">
                <div className="col-span-5 text-[10px] font-sans font-semibold text-muted-500 uppercase">Description</div>
                <div className="col-span-2 text-[10px] font-sans font-semibold text-muted-500 uppercase">Unité</div>
                <div className="col-span-2 text-[10px] font-sans font-semibold text-muted-500 uppercase">Qté</div>
                <div className="col-span-2 text-[10px] font-sans font-semibold text-muted-500 uppercase">Prix unit.</div>
                <div className="col-span-1" />
              </div>

              <div className="space-y-3">
                {fields.map((field, index) => (
                  <div key={field.id}>
                    {/* Desktop row (sm+) */}
                    <div className="hidden sm:grid grid-cols-12 gap-2 items-start">
                      <div className="col-span-5">
                        <Controller
                          name={`items.${index}.product_id`}
                          control={control}
                          render={({ field: f }) => (
                            <select
                              value={f.value ?? ''}
                              onChange={e => f.onChange(e.target.value || null)}
                              className="input-field appearance-none text-xs py-2"
                            >
                              <option value="">Saisie libre</option>
                              {meta?.products?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                          )}
                        />
                        <input
                          {...register(`items.${index}.description`)}
                          placeholder="Description de l'article…"
                          className={cn('input-field text-xs py-2 mt-1', errors.items?.[index]?.description && 'border-danger')}
                        />
                      </div>
                      <div className="col-span-2">
                        <Controller name={`items.${index}.unit`} control={control} render={({ field }) => (
                          <select {...field} className="input-field appearance-none text-xs py-2">
                            {unitOptions.map(u => <option key={u} value={u}>{u}</option>)}
                          </select>
                        )} />
                      </div>
                      <div className="col-span-2">
                        <input type="number" step="0.001" {...register(`items.${index}.quantity`)} className="input-field text-xs py-2" />
                      </div>
                      <div className="col-span-2">
                        <input type="number" {...register(`items.${index}.unit_price`)} placeholder="0" className="input-field text-xs py-2" />
                      </div>
                      <div className="col-span-1 flex justify-center pt-2">
                        {fields.length > 1 && (
                          <button type="button" onClick={() => remove(index)} className="p-1 text-muted-400 hover:text-danger rounded">
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Mobile card (xs) */}
                    <div className="sm:hidden bg-muted-50 border border-muted-200 rounded-card p-3 space-y-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold text-muted-500 uppercase tracking-wide">Article {index + 1}</span>
                        {fields.length > 1 && (
                          <button type="button" onClick={() => remove(index)} className="p-1 text-muted-400 hover:text-danger rounded">
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>

                      {/* Produit (optionnel) */}
                      <Controller
                        name={`items.${index}.product_id`}
                        control={control}
                        render={({ field: f }) => (
                          <select
                            value={f.value ?? ''}
                            onChange={e => f.onChange(e.target.value || null)}
                            className="input-field appearance-none text-sm w-full"
                          >
                            <option value="">Saisie libre</option>
                            {meta?.products?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                          </select>
                        )}
                      />

                      {/* Description */}
                      <input
                        {...register(`items.${index}.description`)}
                        placeholder="Description de l'article…"
                        className={cn('input-field text-sm w-full', errors.items?.[index]?.description && 'border-danger')}
                      />
                      {errors.items?.[index]?.description && (
                        <p className="text-xs text-danger">{errors.items[index].description.message}</p>
                      )}

                      {/* Unité + Qté + Prix */}
                      <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-muted-500 uppercase">Unité</label>
                          <Controller name={`items.${index}.unit`} control={control} render={({ field }) => (
                            <select {...field} className="input-field appearance-none text-xs py-2">
                              {unitOptions.map(u => <option key={u} value={u}>{u}</option>)}
                            </select>
                          )} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-muted-500 uppercase">Qté</label>
                          <input type="number" step="0.001" {...register(`items.${index}.quantity`)} className="input-field text-xs py-2" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-muted-500 uppercase">Prix</label>
                          <input type="number" {...register(`items.${index}.unit_price`)} placeholder="0" className="input-field text-xs py-2" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Total */}
            <div className="flex justify-end pt-2 border-t border-muted-100">
              <div className="text-right">
                <p className="text-xs text-muted-500 font-sans">Total estimé</p>
                <p className="text-xl font-display font-bold text-navy">{fmt(total)}</p>
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex gap-3 px-5 sm:px-6 py-4 border-t border-muted-100 shrink-0">
          <button type="button" onClick={onClose} className="btn-secondary flex-1 h-11">Annuler</button>
          <button
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            className="btn-primary flex-[2] h-11 flex items-center justify-center gap-2 text-sm"
          >
            {isSubmitting && <Loader2 size={15} className="animate-spin" />}
            {isSubmitting ? 'Création…' : 'Créer le bon de commande'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Modal changement de statut ────────────────────────────────────────────────
function StatusModal({ order, onClose, onSaved }) {
  const nextStatuses = NEXT_STATUS[order.status] ?? []
  const [status, setStatus]   = useState(nextStatuses[0] ?? '')
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    if (!status) return
    setLoading(true)
    try {
      await purchaseOrderService.updateStatus(order.id, {
        status,
        received_date: status === 'received' ? new Date().toISOString().split('T')[0] : undefined,
      })
      toast.success('Statut mis à jour.')
      onSaved()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur.')
    } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-navy/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-surface rounded-t-2xl sm:rounded-modal shadow-2xl w-full sm:max-w-sm animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
        <div className="px-5 sm:px-6 py-4 border-b border-muted-100 flex items-center justify-between">
          <h3 className="font-display font-bold text-navy">Changer le statut</h3>
          <button onClick={onClose} className="p-1.5 text-muted-500 hover:text-navy rounded-btn hover:bg-muted-100">
            <X size={18} />
          </button>
        </div>

        <div className="px-5 sm:px-6 py-4 space-y-3">
          <p className="text-sm font-sans text-muted-500">
            Commande : <span className="font-semibold text-navy">{order.reference}</span>
          </p>
          <div className="space-y-2">
            {nextStatuses.map(s => {
              const cfg = STATUS_CONFIG[s]
              return (
                <label key={s} className={cn(
                  'flex items-center gap-3 p-3 rounded-card border cursor-pointer transition-all',
                  status === s ? 'border-primary-400 bg-primary-50' : 'border-muted-300 hover:border-muted-400'
                )}>
                  <input type="radio" value={s} checked={status === s} onChange={() => setStatus(s)} className="sr-only" />
                  <cfg.icon size={15} className={status === s ? 'text-primary-500' : 'text-muted-500'} />
                  <span className="text-sm font-sans font-medium text-navy flex-1">{cfg.label}</span>
                  {s === 'received' && (
                    <span className="text-[10px] text-success bg-green-50 px-1.5 py-0.5 rounded-badge font-sans shrink-0">
                      Met à jour le stock
                    </span>
                  )}
                </label>
              )
            })}
          </div>
        </div>

        <div className="flex gap-3 px-5 sm:px-6 py-4 border-t border-muted-100">
          <button onClick={onClose} className="btn-secondary flex-1 h-11">Annuler</button>
          <button
            onClick={submit}
            disabled={loading || !status}
            className="btn-primary flex-1 h-11 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            Confirmer
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Page principale ───────────────────────────────────────────────────────────
export default function PurchaseOrdersPage() {
  const { can }  = useAuthStore()
  const { format: fmt } = useCurrency()
  const [orders, setOrders]     = useState([])
  const [meta, setMeta]         = useState(null)
  const [pageMeta, setPageMeta] = useState(null)
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [range, setRange]       = useState({ start: '', end: '' })
  const [page, setPage]         = useState(1)
  const [createModal, setCreateModal] = useState(false)
  const [statusModal, setStatusModal] = useState(null)

  useEffect(() => {
    purchaseOrderService.getMeta().then(r => setMeta(r.data)).catch(() => {})
  }, [])

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    try {
      const res = await purchaseOrderService.getAll({
        page,
        search,
        status: statusFilter || undefined,
        start_date: range.start,
        end_date:   range.end,
      })
      setOrders(res.data.orders)
      setPageMeta(res.data.meta)
    } catch { toast.error('Impossible de charger les commandes.') }
    finally   { setLoading(false) }
  }, [page, search, statusFilter, range])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  const handleDelete = async (o, e) => {
    e?.stopPropagation()
    if (!(await confirmDialog({ title: `Supprimer la commande ${o.reference} ?`, text: 'Cette action est irréversible.', confirmText: 'Supprimer' }))) return
    try {
      await purchaseOrderService.remove(o.id)
      toast.success('Commande supprimée.')
      fetchOrders()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur.')
    }
  }

  const stats = {
    total:    pageMeta?.total ?? 0,
    pending:  orders.filter(o => ['draft','ordered','in_transit','partial'].includes(o.status)).length,
    received: orders.filter(o => o.status === 'received').length,
    amount:   orders.reduce((a, o) => a + o.total_amount, 0),
  }

  return (
    <div className="space-y-4 sm:space-y-5">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-bold text-navy">Commandes Fournisseurs</h1>
          <p className="text-sm font-sans text-muted-500 mt-0.5">
            {pageMeta ? `${pageMeta.total} commande${pageMeta.total > 1 ? 's' : ''}` : '…'}
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button onClick={fetchOrders} className="btn-secondary p-2 sm:p-2.5">
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
          {can('purchase_orders', 'create') && (
            <button
              onClick={() => setCreateModal(true)}
              className="btn-primary flex items-center gap-2 h-9 sm:h-10 px-3 sm:px-4 text-sm"
            >
              <Plus size={16} />
              <span className="hidden xs:inline">Nouvelle commande</span>
              <span className="xs:hidden">Nouveau</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Stats ── */}
      {pageMeta && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
          {[
            { label: 'Total',     value: stats.total,       icon: ShoppingCart, color: 'text-primary-500 bg-primary-50' },
            { label: 'En cours',  value: stats.pending,     icon: Clock,        color: 'text-amber-600 bg-amber-50' },
            { label: 'Reçues',    value: stats.received,    icon: CheckCircle2, color: 'text-success bg-green-50' },
            { label: 'Montant',   value: fmt(stats.amount), icon: TrendingUp,   color: 'text-violet-500 bg-violet-50' },
          ].map(s => (
            <div key={s.label} className="card p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
              <div className={cn('w-8 h-8 sm:w-9 sm:h-9 rounded-card flex items-center justify-center shrink-0', s.color)}>
                <s.icon size={15} />
              </div>
              <div className="min-w-0">
                <p className="text-sm sm:text-lg font-display font-bold text-navy truncate">{s.value}</p>
                <p className="text-[10px] sm:text-xs text-muted-500 font-sans">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Filtres ── */}
      <div className="card p-3 sm:p-4 space-y-3">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-500" />
          <input
            placeholder="Rechercher par référence ou fournisseur…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            className="input-field pl-9 h-10 text-sm w-full"
          />
        </div>
        <div className="flex flex-col xs:flex-row gap-2">
          <div className="flex-1">
            <DateRangePicker onRangeChange={r => { setRange(r); setPage(1) }} />
          </div>
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
            className="input-field h-10 text-sm xs:w-40"
          >
            <option value="">Tous les statuts</option>
            {meta?.statuses?.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="card overflow-hidden">

        {/* Desktop table (sm+) */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-muted-300 bg-muted-100/50">
                <th className="text-left py-3 px-4 text-xs font-sans font-semibold text-muted-700 uppercase tracking-wide">Référence</th>
                <th className="text-left py-3 px-4 text-xs font-sans font-semibold text-muted-700 uppercase tracking-wide">Fournisseur</th>
                <th className="text-left py-3 px-4 text-xs font-sans font-semibold text-muted-700 uppercase tracking-wide hidden md:table-cell">Date</th>
                <th className="text-right py-3 px-4 text-xs font-sans font-semibold text-muted-700 uppercase tracking-wide">Montant</th>
                <th className="text-center py-3 px-4 text-xs font-sans font-semibold text-muted-700 uppercase tracking-wide">Statut</th>
                <th className="py-3 px-4 w-24" />
              </tr>
            </thead>
            <tbody className="divide-y divide-muted-100">
              {loading
                ? [...Array(4)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="py-3 px-4"><div className="h-4 w-28 bg-muted-100 rounded" /></td>
                      <td className="py-3 px-4"><div className="h-4 w-36 bg-muted-100 rounded" /></td>
                      <td className="py-3 px-4 hidden md:table-cell"><div className="h-4 w-20 bg-muted-100 rounded" /></td>
                      <td className="py-3 px-4 text-right"><div className="h-4 w-24 bg-muted-100 rounded ml-auto" /></td>
                      <td className="py-3 px-4 text-center"><div className="h-5 w-24 bg-muted-100 rounded-badge mx-auto" /></td>
                      <td className="py-3 px-4"><div className="h-7 w-20 bg-muted-100 rounded-btn ml-auto" /></td>
                    </tr>
                  ))
                : orders.length === 0
                  ? (
                    <tr>
                      <td colSpan={6} className="py-16 text-center">
                        <ShoppingCart size={32} className="mx-auto text-muted-300 mb-3" />
                        <p className="text-sm font-sans text-muted-500">Aucune commande fournisseur.</p>
                        {can('purchase_orders', 'create') && (
                          <button onClick={() => setCreateModal(true)} className="btn-primary mt-4 mx-auto text-xs py-2 px-4">
                            Créer la première commande
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                  : orders.map(o => (
                    <tr key={o.id} className="hover:bg-muted-100/30 transition-colors">
                      <td className="py-3 px-4">
                        <p className="text-sm font-sans font-semibold text-navy font-mono">{o.reference}</p>
                        {o.items_count > 0 && (
                          <p className="text-[11px] text-muted-500">{o.items_count} article{o.items_count > 1 ? 's' : ''}</p>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm font-sans text-navy">{o.supplier?.name ?? '—'}</span>
                      </td>
                      <td className="py-3 px-4 hidden md:table-cell">
                        <p className="text-xs font-sans text-muted-700">{fmtDate(o.order_date)}</p>
                        <p className="text-[10px] text-muted-400 mt-0.5">Par : {o.user?.name ?? '—'}</p>
                        {o.expected_date && (
                          <p className="text-[10px] text-muted-400 mt-0.5">Prévu : {fmtDate(o.expected_date)}</p>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="text-sm font-sans font-semibold text-navy whitespace-nowrap">{fmt(o.total_amount)}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <StatusBadge status={o.status} />
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            to={`/purchase-orders/${o.id}`}
                            className="p-1.5 rounded-btn text-muted-500 hover:text-primary-500 hover:bg-primary-50 transition-colors"
                            title="Voir détails"
                          >
                            <Eye size={14} />
                          </Link>
                          {NEXT_STATUS[o.status]?.length > 0 && (
                            <button
                              onClick={() => setStatusModal(o)}
                              className="p-1.5 rounded-btn text-muted-500 hover:text-primary-500 hover:bg-primary-50 transition-colors"
                              title="Changer le statut"
                            >
                              <ChevronDown size={14} />
                            </button>
                          )}
                          {o.status !== 'received' && can('purchase_orders', 'delete') && (
                            <button
                              onClick={(e) => handleDelete(o, e)}
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

        {/* ── Mobile card list (xs) ── */}
        <div className="sm:hidden divide-y divide-muted-100">
          {loading
            ? [...Array(3)].map((_, i) => (
                <div key={i} className="p-4 animate-pulse space-y-2">
                  <div className="h-3.5 bg-muted-100 rounded w-2/5" />
                  <div className="h-3 bg-muted-100 rounded w-3/5" />
                </div>
              ))
            : orders.length === 0
              ? (
                <div className="py-14 flex flex-col items-center opacity-50">
                  <ShoppingCart size={32} className="mb-3 text-muted-300" />
                  <p className="text-sm font-sans text-muted-500">Aucune commande fournisseur.</p>
                  {can('purchase_orders', 'create') && (
                    <button onClick={() => setCreateModal(true)} className="btn-primary mt-4 text-xs py-2 px-4">
                      Créer la première commande
                    </button>
                  )}
                </div>
              )
              : orders.map(o => (
                <div key={o.id} className="px-4 py-3.5">
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-navy font-mono">{o.reference}</p>
                      <p className="text-xs text-muted-600 mt-0.5 truncate">{o.supplier?.name ?? '—'}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-display font-black text-navy whitespace-nowrap">{fmt(o.total_amount)}</p>
                      <div className="mt-1">
                        <StatusBadge status={o.status} />
                      </div>
                    </div>
                  </div>

                  {/* Meta row */}
                  <div className="flex items-center gap-3 text-[11px] text-muted-400 mb-2.5">
                    <span className="flex items-center gap-1">
                      <Calendar size={11} />{fmtDate(o.order_date)}
                    </span>
                    {o.items_count > 0 && (
                      <span>{o.items_count} article{o.items_count > 1 ? 's' : ''}</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2 border-t border-muted-100">
                    <Link
                      to={`/purchase-orders/${o.id}`}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-btn border border-muted-200 text-xs text-muted-600 hover:border-primary-300 hover:text-primary-600 transition-colors"
                    >
                      <Eye size={13} /> Voir détails
                    </Link>
                    {NEXT_STATUS[o.status]?.length > 0 && (
                      <button
                        onClick={() => setStatusModal(o)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-btn border border-muted-200 text-xs text-muted-600 hover:border-primary-300 hover:text-primary-600 transition-colors"
                      >
                        <ChevronDown size={13} /> Statut
                      </button>
                    )}
                    {o.status !== 'received' && can('purchase_orders', 'delete') && (
                      <button
                        onClick={(e) => handleDelete(o, e)}
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

        {/* Pagination */}
        {pageMeta && pageMeta.last_page > 1 && (
          <div className="border-t border-muted-100 px-4 py-3 flex items-center justify-between gap-2">
            <span className="text-xs text-muted-500 font-sans">
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

      {/* Modals */}
      {createModal && (
        <CreateOrderModal
          meta={meta}
          onClose={() => setCreateModal(false)}
          onSaved={() => { setCreateModal(false); fetchOrders() }}
        />
      )}
      {statusModal && (
        <StatusModal
          order={statusModal}
          onClose={() => setStatusModal(null)}
          onSaved={() => { setStatusModal(null); fetchOrders() }}
        />
      )}
    </div>
  )
}
