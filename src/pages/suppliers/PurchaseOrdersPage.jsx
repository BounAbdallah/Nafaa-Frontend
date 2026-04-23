import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useForm, Controller, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { purchaseOrderService } from '@/services/purchaseOrderService'
import toast from 'react-hot-toast'
import {
  Plus, Search, ShoppingCart, X, Loader2, ChevronLeft, ChevronRight,
  RefreshCw, Trash2, Package, TrendingUp, Clock, CheckCircle2,
  Truck, AlertCircle, XCircle, ChevronDown, Eye,
} from 'lucide-react'
import { cn } from '@/utils/cn'

const fmt     = (n) => new Intl.NumberFormat('fr-FR').format(n ?? 0) + ' FCFA'
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '—'

const STATUS_CONFIG = {
  draft:      { label: 'Brouillon',          color: 'bg-muted-100 text-muted-600',     icon: Clock },
  ordered:    { label: 'Commandé',            color: 'bg-blue-50 text-blue-600',        icon: ShoppingCart },
  in_transit: { label: 'En transit',          color: 'bg-violet-50 text-violet-600',    icon: Truck },
  partial:    { label: 'Reçu partiellement',  color: 'bg-amber-50 text-amber-700',      icon: AlertCircle },
  received:   { label: 'Reçu totalement',     color: 'bg-green-50 text-success',        icon: CheckCircle2 },
  cancelled:  { label: 'Annulé',              color: 'bg-red-50 text-danger',           icon: XCircle },
}

const NEXT_STATUS = {
  draft:      ['ordered', 'cancelled'],
  ordered:    ['in_transit', 'partial', 'received', 'cancelled'],
  in_transit: ['partial', 'received', 'cancelled'],
  partial:    ['received', 'cancelled'],
}

// ── Schema ──────────────────────────────────────────────────────────────────
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

// ── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft
  return (
    <span className={cn('inline-flex items-center gap-1 text-xs font-sans font-semibold px-2 py-0.5 rounded-badge', cfg.color)}>
      <cfg.icon size={10} />
      {cfg.label}
    </span>
  )
}

// ── Modal création ────────────────────────────────────────────────────────────
function CreateOrderModal({ meta, onClose, onSaved }) {
  const { register, handleSubmit, control, watch, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      order_date: new Date().toISOString().split('T')[0],
      items: [{ product_id: null, description: '', unit: 'pièce', quantity: 1, unit_price: 0 }],
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'items' })
  const watchItems = watch('items')

  const total = watchItems?.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unit_price) || 0), 0) ?? 0

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

  return (
    <div className="fixed inset-0 bg-navy/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-modal shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between p-6 pb-4 flex-shrink-0">
          <h3 className="font-display font-bold text-navy">Nouveau bon de commande</h3>
          <button onClick={onClose} className="p-1.5 text-muted-500 hover:text-navy rounded-btn hover:bg-muted-100"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="overflow-y-auto flex-1">
          <div className="px-6 pb-6 space-y-5">
            {/* En-tête commande */}
            <div className="grid grid-cols-2 gap-3">
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

            <div className="grid grid-cols-2 gap-3">
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
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-sans font-semibold text-muted-700 uppercase tracking-wide">Articles *</label>
                <button
                  type="button"
                  onClick={() => append({ product_id: null, description: '', unit: 'pièce', quantity: 1, unit_price: 0 })}
                  className="text-xs font-sans text-primary-500 hover:text-primary-600 flex items-center gap-1"
                >
                  <Plus size={13} />Ajouter une ligne
                </button>
              </div>

              {errors.items?.root && <p className="text-xs text-danger mb-2">{errors.items.root.message}</p>}

              <div className="space-y-2">
                {/* En-têtes colonnes */}
                <div className="grid grid-cols-12 gap-2 px-1">
                  <div className="col-span-5 text-[10px] font-sans font-semibold text-muted-500 uppercase">Description</div>
                  <div className="col-span-2 text-[10px] font-sans font-semibold text-muted-500 uppercase">Unité</div>
                  <div className="col-span-2 text-[10px] font-sans font-semibold text-muted-500 uppercase">Qté</div>
                  <div className="col-span-2 text-[10px] font-sans font-semibold text-muted-500 uppercase">Prix unit.</div>
                  <div className="col-span-1" />
                </div>

                {fields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-12 gap-2 items-start">
                    <div className="col-span-5">
                      <Controller
                        name={`items.${index}.product_id`}
                        control={control}
                        render={({ field: f }) => {
                          const selectedProduct = meta?.products?.find(p => p.id === Number(f.value))
                          return (
                            <select
                              value={f.value ?? ''}
                              onChange={e => {
                                f.onChange(e.target.value || null)
                                const p = meta?.products?.find(p => p.id === Number(e.target.value))
                                if (p) {
                                  // auto-fill description and unit
                                }
                              }}
                              className="input-field appearance-none text-xs py-2"
                            >
                              <option value="">Saisie libre</option>
                              {meta?.products?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                          )
                        }}
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
                          {(meta?.units ?? ['pièce', 'kg', 'g', 'litre', 'boîte', 'carton', 'sac']).map(u => (
                            <option key={u} value={u}>{u}</option>
                          ))}
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

        <div className="flex gap-3 p-6 pt-4 border-t border-muted-100 flex-shrink-0">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Annuler</button>
          <button onClick={handleSubmit(onSubmit)} disabled={isSubmitting} className="btn-primary flex-1 flex items-center justify-center gap-2">
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
    <div className="fixed inset-0 bg-navy/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-modal shadow-2xl w-full max-w-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-bold text-navy">Changer le statut</h3>
          <button onClick={onClose} className="p-1.5 text-muted-500 hover:text-navy rounded-btn hover:bg-muted-100"><X size={18} /></button>
        </div>
        <p className="text-sm font-sans text-muted-500">Commande : <span className="font-semibold text-navy">{order.reference}</span></p>
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
                <span className="text-sm font-sans font-medium text-navy">{cfg.label}</span>
                {s === 'received' && <span className="ml-auto text-[10px] text-success bg-green-50 px-1.5 py-0.5 rounded-badge font-sans">Met à jour le stock</span>}
              </label>
            )
          })}
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">Annuler</button>
          <button onClick={submit} disabled={loading || !status} className="btn-primary flex-1 flex items-center justify-center gap-2">
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
  const [orders, setOrders]   = useState([])
  const [meta, setMeta]       = useState(null)
  const [pageMeta, setPageMeta] = useState(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage]       = useState(1)
  const [createModal, setCreateModal] = useState(false)
  const [statusModal, setStatusModal] = useState(null)

  useEffect(() => {
    purchaseOrderService.getMeta().then(r => setMeta(r.data)).catch(() => {})
  }, [])

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, per_page: 15 }
      if (search)       params.search = search
      if (statusFilter) params.status = statusFilter
      const r = await purchaseOrderService.getAll(params)
      setOrders(r.data.orders)
      setPageMeta(r.data.meta)
    } catch { toast.error('Impossible de charger les commandes.') }
    finally { setLoading(false) }
  }, [page, search, statusFilter])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  const handleDelete = async (o) => {
    if (!window.confirm(`Supprimer la commande ${o.reference} ?`)) return
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
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-navy">Commandes Fournisseurs</h1>
          <p className="text-sm font-sans text-muted-500 mt-1">
            {pageMeta ? `${pageMeta.total} commande${pageMeta.total > 1 ? 's' : ''}` : '…'}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchOrders} className="btn-secondary p-2.5"><RefreshCw size={15} /></button>
          <button onClick={() => setCreateModal(true)} className="btn-primary flex items-center gap-2">
            <Plus size={16} />Nouvelle commande
          </button>
        </div>
      </div>

      {/* Stats */}
      {pageMeta && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total commandes',  value: stats.total,              icon: ShoppingCart, color: 'text-primary-500 bg-primary-50' },
            { label: 'En cours',         value: stats.pending,            icon: Clock,        color: 'text-amber-600 bg-amber-50' },
            { label: 'Reçues',           value: stats.received,           icon: CheckCircle2, color: 'text-success bg-green-50' },
            { label: 'Montant total',    value: fmt(stats.amount),        icon: TrendingUp,   color: 'text-violet-500 bg-violet-50' },
          ].map(s => (
            <div key={s.label} className="card p-4 flex items-center gap-3">
              <div className={cn('w-9 h-9 rounded-card flex items-center justify-center flex-shrink-0', s.color)}>
                <s.icon size={17} />
              </div>
              <div className="min-w-0">
                <p className="text-lg font-display font-bold text-navy truncate">{s.value}</p>
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
            placeholder="Rechercher par référence ou fournisseur…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            className="input-field pl-9"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
          className="input-field appearance-none min-w-[170px]"
        >
          <option value="">Tous les statuts</option>
          {Object.entries(STATUS_CONFIG).map(([v, c]) => (
            <option key={v} value={v}>{c.label}</option>
          ))}
        </select>
      </div>

      {/* Tableau */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-muted-300 bg-muted-100/50">
                <th className="text-left py-3 px-4 text-xs font-sans font-semibold text-muted-700 uppercase tracking-wide">Référence</th>
                <th className="text-left py-3 px-4 text-xs font-sans font-semibold text-muted-700 uppercase tracking-wide hidden sm:table-cell">Fournisseur</th>
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
                      <td className="py-3 px-4 hidden sm:table-cell"><div className="h-4 w-36 bg-muted-100 rounded" /></td>
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
                        <button onClick={() => setCreateModal(true)} className="btn-primary mt-4 mx-auto text-xs py-2 px-4">
                          Créer la première commande
                        </button>
                      </td>
                    </tr>
                  )
                  : orders.map(o => (
                    <tr key={o.id} className="hover:bg-muted-100/30 transition-colors">
                      <td className="py-3 px-4">
                        <p className="text-sm font-sans font-semibold text-navy font-mono">{o.reference}</p>
                        {o.items_count > 0 && <p className="text-[11px] text-muted-500">{o.items_count} article{o.items_count > 1 ? 's' : ''}</p>}
                      </td>
                      <td className="py-3 px-4 hidden sm:table-cell">
                        <span className="text-sm font-sans text-navy">{o.supplier?.name ?? '—'}</span>
                      </td>
                      <td className="py-3 px-4 hidden md:table-cell">
                        <p className="text-xs font-sans text-muted-700">{fmtDate(o.order_date)}</p>
                        {o.expected_date && <p className="text-[11px] text-muted-400">Prévu : {fmtDate(o.expected_date)}</p>}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="text-sm font-sans font-semibold text-navy">{fmt(o.total_amount)}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <StatusBadge status={o.status} />
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-1">
                          <Link to={`/purchase-orders/${o.id}`} className="p-1.5 rounded-btn text-muted-500 hover:text-primary-500 hover:bg-primary-50 transition-colors" title="Voir détails">
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
                          {o.status !== 'received' && (
                            <button
                              onClick={() => handleDelete(o)}
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
