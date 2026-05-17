import { useEffect, useState } from 'react'
import { confirmDialog } from '@/utils/confirm'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { purchaseOrderService } from '@/services/purchaseOrderService'
import toast from 'react-hot-toast'
import {
  ShoppingCart, ChevronLeft, Truck, Clock, CheckCircle2,
  AlertCircle, XCircle, Package, Calendar, RefreshCw,
  ChevronDown, X, Loader2, Info,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { useCurrency } from '@/utils/currency'

const fmtDate = (iso) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
}

/* ─── Status config ──────────────────────────────────────────────────── */
const STATUS_CONFIG = {
  draft:      { label: 'Brouillon',         color: 'bg-muted-100 text-muted-600' },
  ordered:    { label: 'Commandé',           color: 'bg-blue-50 text-blue-600' },
  in_transit: { label: 'En transit',         color: 'bg-violet-50 text-violet-600' },
  partial:    { label: 'Reçu partiel.',      color: 'bg-amber-50 text-amber-700' },
  received:   { label: 'Reçu totalement',    color: 'bg-green-50 text-success' },
  cancelled:  { label: 'Annulé',             color: 'bg-red-50 text-danger' },
}

const NEXT_STATUS = {
  draft:      ['ordered', 'cancelled'],
  ordered:    ['in_transit', 'partial', 'received', 'cancelled'],
  in_transit: ['partial', 'received', 'cancelled'],
  partial:    ['received', 'cancelled'],
}

const TIMELINE_STEPS = ['draft', 'ordered', 'in_transit', 'partial', 'received']

const STEP_ICONS = {
  draft:      Clock,
  ordered:    ShoppingCart,
  in_transit: Truck,
  partial:    AlertCircle,
  received:   CheckCircle2,
}

/* ─── StatusBadge ────────────────────────────────────────────────────── */
function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, color: 'bg-muted-100 text-muted-600' }
  return (
    <span className={cn('inline-flex items-center gap-1 text-xs font-sans font-semibold px-2.5 py-1 rounded-badge whitespace-nowrap', cfg.color)}>
      {cfg.label}
    </span>
  )
}

/* ─── StatBox ────────────────────────────────────────────────────────── */
function StatBox({ label, value, sub, color }) {
  return (
    <div className="card p-3 sm:p-4 text-center space-y-1">
      <p className={cn('text-lg sm:text-2xl font-display font-bold leading-tight', color ?? 'text-navy')}>{value}</p>
      {sub && <p className="text-[10px] sm:text-[11px] text-muted-400 font-sans">{sub}</p>}
      <p className="text-xs text-muted-500 font-sans">{label}</p>
    </div>
  )
}

/* ─── StatusTimeline ─────────────────────────────────────────────────── */
function StatusTimeline({ status }) {
  const isCancelled = status === 'cancelled'
  const currentIdx  = TIMELINE_STEPS.indexOf(status)

  return (
    <div className="card p-3 sm:p-4 overflow-x-auto">
      {isCancelled ? (
        <div className="flex items-center gap-2 justify-center py-1">
          <XCircle size={16} className="text-danger" />
          <span className="text-sm font-sans font-semibold text-danger">Commande annulée</span>
        </div>
      ) : (
        <div className="flex items-center min-w-[360px]">
          {TIMELINE_STEPS.map((step, idx) => {
            const Icon    = STEP_ICONS[step]
            const done    = idx < currentIdx
            const active  = idx === currentIdx
            const pending = idx > currentIdx
            return (
              <div key={step} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center gap-1 shrink-0">
                  <div className={cn(
                    'w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all',
                    done    && 'bg-success text-white',
                    active  && 'bg-primary-500 text-white ring-4 ring-primary-100',
                    pending && 'bg-muted-100 text-muted-400',
                  )}>
                    <Icon size={13} />
                  </div>
                  <span className={cn(
                    'text-[9px] sm:text-[10px] font-sans text-center whitespace-nowrap',
                    done    && 'text-success font-semibold',
                    active  && 'text-primary-600 font-bold',
                    pending && 'text-muted-400',
                  )}>
                    {STATUS_CONFIG[step].label}
                  </span>
                </div>
                {idx < TIMELINE_STEPS.length - 1 && (
                  <div className={cn(
                    'flex-1 h-0.5 mx-1 mb-4 rounded-full transition-all',
                    idx < currentIdx ? 'bg-success' : 'bg-muted-200',
                  )} />
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ─── StatusModal ────────────────────────────────────────────────────── */
function StatusModal({ order, onClose, onUpdated }) {
  const { format: fmt } = useCurrency()   // ← hook propre (bug fix)
  const nextOptions = NEXT_STATUS[order.status] ?? []
  const [selected, setSelected]         = useState('')
  const [saving, setSaving]             = useState(false)
  const [sellingPrices, setSellingPrices] = useState({})

  const handleSubmit = async () => {
    if (!selected) return
    setSaving(true)
    try {
      const payload = { status: selected }
      if (selected === 'received') {
        payload.received_date   = new Date().toISOString().slice(0, 10)
        payload.selling_prices  = Object.entries(sellingPrices).map(([id, price]) => ({
          item_id:       parseInt(id),
          selling_price: parseFloat(price),
        }))
      }
      await purchaseOrderService.updateStatus(order.id, payload)
      toast.success('Statut mis à jour et stocks incrémentés !')
      onUpdated()
    } catch {
      toast.error('Erreur lors du changement de statut.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm">
      <div className={cn(
        'rounded-t-2xl sm:rounded-modal bg-white w-full shadow-2xl flex flex-col max-h-[95dvh] sm:max-h-[90vh] animate-in slide-in-from-bottom sm:zoom-in-95 duration-200',
        selected === 'received' ? 'sm:max-w-2xl' : 'sm:max-w-sm'
      )}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-muted-100 shrink-0">
          <h3 className="font-display font-semibold text-navy">Changer le statut</h3>
          <button onClick={onClose} className="p-1.5 text-muted-400 hover:text-navy rounded-btn hover:bg-muted-100 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4 overflow-y-auto flex-1">
          <p className="text-xs font-sans text-muted-500">
            Statut actuel : <span className="font-semibold text-navy">{STATUS_CONFIG[order.status]?.label}</span>
          </p>

          {/* Status options */}
          <div className={cn(
            'grid gap-2',
            selected === 'received' ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'
          )}>
            {nextOptions.map(opt => (
              <label
                key={opt}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-card border cursor-pointer transition-all',
                  selected === opt
                    ? 'border-primary-400 bg-primary-50'
                    : 'border-muted-200 hover:border-primary-200 hover:bg-muted-50',
                )}
              >
                <input
                  type="radio"
                  name="next_status"
                  value={opt}
                  checked={selected === opt}
                  onChange={() => setSelected(opt)}
                  className="accent-primary-500"
                />
                <span className="text-sm font-sans font-medium text-navy">
                  {STATUS_CONFIG[opt]?.label ?? opt}
                </span>
              </label>
            ))}
          </div>

          {/* Prix de vente (si received) */}
          {selected === 'received' && (
            <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-start gap-2 p-3 rounded-card bg-green-50 border border-green-100">
                <Info size={14} className="text-success mt-0.5 shrink-0" />
                <p className="text-[11px] font-sans text-success">
                  Définissez vos prix de vente. Le stock sera mis à jour automatiquement.
                </p>
              </div>

              <div className="border border-muted-200 rounded-card overflow-hidden overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[300px]">
                  <thead className="bg-muted-50 border-b border-muted-200">
                    <tr>
                      <th className="p-2.5 font-bold text-muted-600">Article</th>
                      <th className="p-2.5 font-bold text-muted-600 text-right hidden sm:table-cell">Prix Achat</th>
                      <th className="p-2.5 font-bold text-muted-600 text-right w-28">Prix Vente</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-muted-100">
                    {order.items?.map(item => (
                      <tr key={item.id}>
                        <td className="p-2.5">
                          <p className="font-bold text-navy">{item.product_name || item.description}</p>
                          <p className="text-[10px] text-muted-400">Qté : {item.quantity} {item.unit}</p>
                          <p className="text-[10px] text-muted-400 sm:hidden">{fmt(item.unit_price)}</p>
                        </td>
                        <td className="p-2.5 text-right text-muted-500 hidden sm:table-cell">{fmt(item.unit_price)}</td>
                        <td className="p-2.5 text-right">
                          <input
                            type="number"
                            placeholder="0"
                            className="w-full text-right p-1.5 rounded border border-muted-300 focus:border-primary-400 outline-none font-bold text-primary-600 text-xs"
                            value={sellingPrices[item.id] || ''}
                            onChange={e => setSellingPrices(prev => ({ ...prev, [item.id]: e.target.value }))}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {selected === 'cancelled' && (
            <div className="flex items-start gap-2 p-3 rounded-card bg-red-50 border border-red-200">
              <XCircle size={14} className="text-danger mt-0.5 shrink-0" />
              <p className="text-xs font-sans text-danger">
                Cette action est irréversible. La commande sera annulée.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 px-5 py-4 border-t border-muted-100 shrink-0">
          <button onClick={onClose} className="btn-secondary flex-1 h-11">Annuler</button>
          <button
            onClick={handleSubmit}
            disabled={!selected || saving}
            className="btn-primary flex-1 h-11 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <ChevronDown size={14} />}
            Confirmer
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Page principale ────────────────────────────────────────────────── */
export default function PurchaseOrderDetailPage() {
  const { id }   = useParams()
  const navigate = useNavigate()
  const { can }  = useAuthStore()
  const { format: fmt } = useCurrency()

  const [order, setOrder]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [showStatusModal, setShowStatusModal] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const r = await purchaseOrderService.getOne(id)
      setOrder(r.data.order)
    } catch {
      toast.error('Bon de commande introuvable.')
      navigate('/purchase-orders')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id])

  const handleDelete = async () => {
    if (!(await confirmDialog({
      title: `Supprimer la commande ${order.reference} ?`,
      text: 'Cette action est irréversible.',
      confirmText: 'Supprimer',
    }))) return
    try {
      await purchaseOrderService.remove(order.id)
      toast.success('Bon de commande supprimé.')
      navigate('/purchase-orders')
    } catch {
      toast.error('Erreur lors de la suppression.')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={24} className="animate-spin text-primary-500" />
      </div>
    )
  }

  if (!order) return null

  const canChangeStatus = !['received', 'cancelled'].includes(order.status)
  const canDelete       = order.status !== 'received'
  const stockUpdated    = order.status === 'received' || order.status === 'partial'
  const supplier        = order.supplier ?? {}

  return (
    <div className="space-y-4 sm:space-y-5">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
        <div className="space-y-2 min-w-0">
          <Link
            to="/purchase-orders"
            className="inline-flex items-center gap-1.5 text-xs font-sans text-muted-500 hover:text-navy transition-colors"
          >
            <ChevronLeft size={14} />Bons de commande
          </Link>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-card flex items-center justify-center shrink-0 bg-primary-50 text-primary-500">
              <ShoppingCart size={18} />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-2xl font-display font-bold text-navy font-mono leading-tight tracking-tight">
                {order.reference}
              </h1>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="text-sm font-sans text-muted-500 truncate">{supplier.name ?? '—'}</span>
                <StatusBadge status={order.status} />
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={load} className="btn-secondary p-2 sm:p-2.5" title="Rafraîchir">
            <RefreshCw size={15} />
          </button>
          {canChangeStatus && can('purchase_orders', 'edit') && (
            <button
              onClick={() => setShowStatusModal(true)}
              className="btn-primary flex items-center gap-1.5 h-9 sm:h-10 px-3 sm:px-4 text-sm"
            >
              <ChevronDown size={14} />
              <span className="hidden xs:inline">Changer statut</span>
              <span className="xs:hidden">Statut</span>
            </button>
          )}
          {canDelete && can('purchase_orders', 'delete') && (
            <button
              onClick={handleDelete}
              className="btn-danger flex items-center gap-1.5 h-9 sm:h-10 px-3 sm:px-4 text-sm"
            >
              <XCircle size={14} />
              <span className="hidden xs:inline">Supprimer</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Timeline ── */}
      <StatusTimeline status={order.status} />

      {/* ── Stats ── */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <StatBox
          label="Total commande"
          value={fmt(order.total_amount)}
          sub="Montant HT"
          color="text-navy"
        />
        <StatBox
          label="Articles"
          value={order.items_count ?? (order.items?.length ?? 0)}
          sub="Lignes de commande"
          color="text-primary-600"
        />
        <StatBox
          label="Date commande"
          value={fmtDate(order.order_date)}
          sub={order.expected_date ? `Prévu : ${fmtDate(order.expected_date)}` : undefined}
          color="text-muted-700"
        />
      </div>

      {/* ── Articles ── */}
      <div className="card overflow-hidden">
        <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-muted-100 flex items-center justify-between gap-3 flex-wrap">
          <h2 className="font-display font-semibold text-navy flex items-center gap-2">
            <Package size={15} className="text-muted-400" />Articles commandés
          </h2>
          {stockUpdated && (
            <span className="inline-flex items-center gap-1.5 text-xs font-sans font-medium text-success bg-green-50 px-2.5 py-1 rounded-badge">
              <CheckCircle2 size={12} />
              <span className="hidden sm:inline">Stock mis à jour automatiquement</span>
              <span className="sm:hidden">Stock mis à jour</span>
            </span>
          )}
        </div>

        {/* Desktop table (sm+) */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm font-sans">
            <thead>
              <tr className="bg-muted-50 text-left">
                <th className="px-4 py-3 text-xs font-semibold text-muted-500 uppercase tracking-wide">Article</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-500 uppercase tracking-wide">Unité</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-500 uppercase tracking-wide text-right">Qté cmd.</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-500 uppercase tracking-wide text-right">Prix unit.</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-500 uppercase tracking-wide text-right">Sous-total</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-500 uppercase tracking-wide text-right">Qté reçue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-muted-100">
              {(order.items ?? []).map(item => (
                <tr key={item.id} className="hover:bg-muted-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-navy">{item.product_name ?? item.description ?? '—'}</p>
                    {item.description && item.product_name && (
                      <p className="text-[11px] text-muted-400 mt-0.5">{item.description}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-600">{item.unit ?? '—'}</td>
                  <td className="px-4 py-3 text-right text-navy font-medium">
                    {new Intl.NumberFormat('fr-FR').format(item.quantity ?? 0)}
                  </td>
                  <td className="px-4 py-3 text-right text-muted-700 whitespace-nowrap">{fmt(item.unit_price)}</td>
                  <td className="px-4 py-3 text-right font-semibold text-navy whitespace-nowrap">{fmt(item.subtotal)}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={cn(
                      'inline-block px-2 py-0.5 rounded-badge text-xs font-semibold',
                      (item.received_quantity ?? 0) >= (item.quantity ?? 0)
                        ? 'bg-green-50 text-success'
                        : (item.received_quantity ?? 0) > 0
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-muted-100 text-muted-500',
                    )}>
                      {new Intl.NumberFormat('fr-FR').format(item.received_quantity ?? 0)}
                    </span>
                  </td>
                </tr>
              ))}
              {(!order.items || order.items.length === 0) && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center">
                    <Package size={24} className="mx-auto text-muted-200 mb-2" />
                    <p className="text-sm font-sans text-muted-400">Aucun article dans cette commande.</p>
                  </td>
                </tr>
              )}
            </tbody>
            {order.items && order.items.length > 0 && (
              <tfoot>
                <tr className="bg-muted-50 border-t-2 border-muted-200">
                  <td colSpan={4} className="px-4 py-3 text-xs font-sans font-semibold text-muted-500 uppercase tracking-wide text-right">
                    TOTAL
                  </td>
                  <td className="px-4 py-3 text-right font-display font-bold text-navy text-base whitespace-nowrap">
                    {fmt(order.total_amount)}
                  </td>
                  <td className="px-4 py-3" />
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Mobile card list (xs) */}
        <div className="sm:hidden divide-y divide-muted-100">
          {(!order.items || order.items.length === 0) ? (
            <div className="py-10 flex flex-col items-center opacity-40">
              <Package size={28} className="mb-2" />
              <p className="text-sm font-sans text-muted-400">Aucun article.</p>
            </div>
          ) : (
            order.items.map(item => (
              <div key={item.id} className="px-4 py-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-navy">{item.product_name ?? item.description ?? '—'}</p>
                    {item.description && item.product_name && (
                      <p className="text-[11px] text-muted-400">{item.description}</p>
                    )}
                  </div>
                  <p className="text-sm font-display font-black text-navy shrink-0 whitespace-nowrap">
                    {fmt(item.subtotal)}
                  </p>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-500 flex-wrap gap-x-3 gap-y-1">
                  <span>{item.quantity} {item.unit} × {fmt(item.unit_price)}</span>
                  <span className={cn(
                    'px-2 py-0.5 rounded-badge font-semibold',
                    (item.received_quantity ?? 0) >= (item.quantity ?? 0)
                      ? 'bg-green-50 text-success'
                      : (item.received_quantity ?? 0) > 0
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-muted-100 text-muted-500',
                  )}>
                    Reçu : {item.received_quantity ?? 0}
                  </span>
                </div>
              </div>
            ))
          )}
          {order.items && order.items.length > 0 && (
            <div className="px-4 py-3 bg-muted-50 flex justify-between items-center border-t-2 border-muted-200">
              <span className="text-xs font-semibold text-muted-500 uppercase tracking-wide">Total</span>
              <span className="font-display font-bold text-navy whitespace-nowrap">{fmt(order.total_amount)}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Fournisseur + Métadonnées ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Infos fournisseur */}
        <div className="md:col-span-2 card p-4 sm:p-5 space-y-4">
          <h2 className="font-display font-semibold text-navy flex items-center gap-2">
            <Truck size={15} className="text-muted-400" />Informations fournisseur
          </h2>
          {supplier.name ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-card bg-primary-50 flex items-center justify-center shrink-0 mt-0.5">
                  <Package size={13} className="text-primary-500" />
                </div>
                <div>
                  <p className="text-[10px] font-sans font-semibold text-muted-400 uppercase tracking-wide">Nom</p>
                  <p className="text-sm font-sans text-navy font-medium">{supplier.name}</p>
                </div>
              </div>
              {supplier.phone && (
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-card bg-blue-50 flex items-center justify-center shrink-0 mt-0.5">
                    <AlertCircle size={13} className="text-blue-500" />
                  </div>
                  <div>
                    <p className="text-[10px] font-sans font-semibold text-muted-400 uppercase tracking-wide">Téléphone</p>
                    <p className="text-sm font-sans text-navy">{supplier.phone}</p>
                  </div>
                </div>
              )}
              {supplier.email && (
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-card bg-violet-50 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 size={13} className="text-violet-500" />
                  </div>
                  <div>
                    <p className="text-[10px] font-sans font-semibold text-muted-400 uppercase tracking-wide">Email</p>
                    <p className="text-sm font-sans text-navy break-all">{supplier.email}</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm font-sans text-muted-400 italic">Informations fournisseur non disponibles.</p>
          )}
        </div>

        {/* Métadonnées + Notes */}
        <div className="space-y-4">

          <div className="card p-4 sm:p-5">
            <h2 className="font-display font-semibold text-navy mb-3 flex items-center gap-2">
              <Calendar size={15} className="text-muted-400" />Métadonnées
            </h2>
            <div className="space-y-2">
              {[
                { label: 'Créé le',    value: fmtDate(order.created_at) },
                { label: 'Créé par',   value: order.user?.name ?? '—' },
                { label: 'Modifié le', value: fmtDate(order.updated_at) },
                ...(order.received_date ? [{ label: 'Reçu le', value: fmtDate(order.received_date), highlight: true }] : []),
                { label: 'ID interne', value: `#${order.id}`, mono: true },
              ].map(({ label, value, highlight, mono }) => (
                <div key={label} className="flex justify-between text-xs font-sans gap-2">
                  <span className="text-muted-500 shrink-0">{label}</span>
                  <span className={cn(
                    'text-right',
                    highlight ? 'text-success font-semibold' :
                    mono      ? 'text-muted-400 font-mono'   : 'text-navy'
                  )}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-4 sm:p-5">
            <h2 className="font-display font-semibold text-navy mb-3 flex items-center gap-2">
              <Clock size={15} className="text-muted-400" />Notes
            </h2>
            {order.notes
              ? <p className="text-sm font-sans text-muted-700 leading-relaxed whitespace-pre-line">{order.notes}</p>
              : <p className="text-sm font-sans text-muted-400 italic">Aucune note renseignée.</p>
            }
          </div>
        </div>
      </div>

      {/* Modal statut */}
      {showStatusModal && (
        <StatusModal
          order={order}
          onClose={() => setShowStatusModal(false)}
          onUpdated={() => { setShowStatusModal(false); load() }}
        />
      )}
    </div>
  )
}
