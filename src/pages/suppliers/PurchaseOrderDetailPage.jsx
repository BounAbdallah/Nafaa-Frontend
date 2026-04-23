import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { purchaseOrderService } from '@/services/purchaseOrderService'
import toast from 'react-hot-toast'
import {
  ShoppingCart, ChevronLeft, Truck, Clock, CheckCircle2,
  AlertCircle, XCircle, Package, Calendar, RefreshCw,
  ChevronDown, X, Loader2, Info
} from 'lucide-react'
import { cn } from '@/utils/cn'

const fmt     = (n) => new Intl.NumberFormat('fr-FR').format(n ?? 0) + ' FCFA'
const fmtDate = (iso) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
}

/* ─── Status config ─────────────────────────────────────────────────── */
const STATUS_CONFIG = {
  draft:      { label: 'Brouillon',          color: 'bg-muted-100 text-muted-600' },
  ordered:    { label: 'Commandé',            color: 'bg-blue-50 text-blue-600' },
  in_transit: { label: 'En transit',          color: 'bg-violet-50 text-violet-600' },
  partial:    { label: 'Reçu partiellement',  color: 'bg-amber-50 text-amber-700' },
  received:   { label: 'Reçu totalement',     color: 'bg-green-50 text-success' },
  cancelled:  { label: 'Annulé',              color: 'bg-red-50 text-danger' },
}

const NEXT_STATUS = {
  draft:      ['ordered', 'cancelled'],
  ordered:    ['in_transit', 'partial', 'received', 'cancelled'],
  in_transit: ['partial', 'received', 'cancelled'],
  partial:    ['received', 'cancelled'],
}

/* ─── Timeline steps (linear flow, excluding cancelled) ─────────────── */
const TIMELINE_STEPS = ['draft', 'ordered', 'in_transit', 'partial', 'received']

const STEP_ICONS = {
  draft:      Clock,
  ordered:    ShoppingCart,
  in_transit: Truck,
  partial:    AlertCircle,
  received:   CheckCircle2,
}

/* ─── Small components ───────────────────────────────────────────────── */
function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, color: 'bg-muted-100 text-muted-600' }
  return (
    <span className={cn(
      'inline-flex items-center gap-1 text-xs font-sans font-semibold px-2.5 py-1 rounded-badge',
      cfg.color,
    )}>
      {cfg.label}
    </span>
  )
}

function StatBox({ label, value, sub, color }) {
  return (
    <div className="card p-4 text-center space-y-1">
      <p className={cn('text-2xl font-display font-bold', color ?? 'text-navy')}>{value}</p>
      {sub && <p className="text-[11px] text-muted-400 font-sans">{sub}</p>}
      <p className="text-xs text-muted-500 font-sans">{label}</p>
    </div>
  )
}

/* ─── Status timeline ────────────────────────────────────────────────── */
function StatusTimeline({ status }) {
  const isCancelled = status === 'cancelled'
  const currentIdx  = TIMELINE_STEPS.indexOf(status)

  return (
    <div className="card p-4">
      {isCancelled ? (
        <div className="flex items-center gap-2 justify-center py-1">
          <XCircle size={16} className="text-danger" />
          <span className="text-sm font-sans font-semibold text-danger">Commande annulée</span>
        </div>
      ) : (
        <div className="flex items-center">
          {TIMELINE_STEPS.map((step, idx) => {
            const Icon    = STEP_ICONS[step]
            const done    = idx < currentIdx
            const active  = idx === currentIdx
            const pending = idx > currentIdx
            return (
              <div key={step} className="flex items-center flex-1 last:flex-none">
                {/* Step dot */}
                <div className="flex flex-col items-center gap-1 flex-shrink-0">
                  <div className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center transition-all',
                    done   && 'bg-success text-white',
                    active && 'bg-primary-500 text-white ring-4 ring-primary-100',
                    pending && 'bg-muted-100 text-muted-400',
                  )}>
                    <Icon size={14} />
                  </div>
                  <span className={cn(
                    'text-[10px] font-sans text-center whitespace-nowrap',
                    done   && 'text-success font-semibold',
                    active && 'text-primary-600 font-bold',
                    pending && 'text-muted-400',
                  )}>
                    {STATUS_CONFIG[step].label}
                  </span>
                </div>
                {/* Connector line */}
                {idx < TIMELINE_STEPS.length - 1 && (
                  <div className={cn(
                    'flex-1 h-0.5 mx-1 mb-4 rounded-full transition-all',
                    idx < currentIdx ? 'bg-success' : 'bg-muted-150',
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

/* ─── Status change modal ────────────────────────────────────────────── */
function StatusModal({ order, onClose, onUpdated }) {
  const nextOptions  = NEXT_STATUS[order.status] ?? []
  const [selected, setSelected]   = useState('')
  const [saving, setSaving]       = useState(false)
  const [sellingPrices, setSellingPrices] = useState({}) // {item_id: price}

  const handleSubmit = async () => {
    if (!selected) return
    setSaving(true)
    try {
      const payload = { status: selected }
      if (selected === 'received') {
        payload.received_date = new Date().toISOString().slice(0, 10)
        payload.selling_prices = Object.entries(sellingPrices).map(([id, price]) => ({
          item_id: parseInt(id),
          selling_price: parseFloat(price)
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className={cn("rounded-modal bg-white w-full shadow-2xl transition-all", selected === 'received' ? 'max-w-2xl' : 'max-w-sm')}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-muted-100">
          <h3 className="font-display font-semibold text-navy">Changer le statut</h3>
          <button onClick={onClose} className="text-muted-400 hover:text-navy transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4">
          <p className="text-xs font-sans text-muted-500">
            Statut actuel : <span className="font-semibold text-navy">{STATUS_CONFIG[order.status]?.label}</span>
          </p>
          
          <div className={cn("grid gap-2", selected === 'received' ? 'grid-cols-2' : 'grid-cols-1')}>
            {nextOptions.map(opt => (
              <label
                key={opt}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-card border cursor-pointer transition-all',
                  selected === opt
                    ? 'border-primary-400 bg-primary-50'
                    : 'border-muted-150 hover:border-primary-200 hover:bg-muted-50',
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
                <span className={cn(
                  'text-sm font-sans font-medium',
                  STATUS_CONFIG[opt]?.color.replace('bg-', 'text-').split(' ')[1] ?? 'text-navy',
                )}>
                  {STATUS_CONFIG[opt]?.label ?? opt}
                </span>
              </label>
            ))}
          </div>

          {selected === 'received' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-start gap-2 p-3 rounded-card bg-green-50 border border-green-100">
                <Info size={14} className="text-success mt-0.5 flex-shrink-0" />
                <p className="text-[11px] font-sans text-success">
                  Définissez vos prix de vente. Le stock sera mis à jour automatiquement.
                </p>
              </div>

              <div className="border border-muted-200 rounded-card overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted-50 border-b border-muted-200">
                    <tr>
                      <th className="p-3 font-bold text-muted-600">Article</th>
                      <th className="p-3 font-bold text-muted-600 text-right">Prix Achat</th>
                      <th className="p-3 font-bold text-muted-600 w-32 text-right">Prix Vente</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-muted-100">
                    {order.items?.map(item => (
                      <tr key={item.id}>
                        <td className="p-3">
                          <p className="font-bold text-navy">{item.product_name || item.description}</p>
                          <p className="text-[10px] text-muted-400">Qté: {item.quantity} {item.unit}</p>
                        </td>
                        <td className="p-3 text-right text-muted-500">{fmt(item.unit_price)}</td>
                        <td className="p-3 text-right">
                          <input 
                            type="number"
                            placeholder="Prix vente"
                            className="w-full text-right p-1.5 rounded border border-muted-300 focus:border-primary-400 outline-none font-bold text-primary-600"
                            value={sellingPrices[item.id] || ''}
                            onChange={(e) => setSellingPrices(prev => ({ ...prev, [item.id]: e.target.value }))}
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
              <XCircle size={14} className="text-danger mt-0.5 flex-shrink-0" />
              <p className="text-xs font-sans text-danger">
                Cette action est irréversible. La commande sera annulée.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-muted-100">
          <button onClick={onClose} className="btn-secondary">Annuler</button>
          <button
            onClick={handleSubmit}
            disabled={!selected || saving}
            className="btn-primary flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <ChevronDown size={14} />}
            Confirmer
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Main page ──────────────────────────────────────────────────────── */
export default function PurchaseOrderDetailPage() {
  const { id }   = useParams()
  const navigate = useNavigate()

  const [order,   setOrder]   = useState(null)
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
    if (!window.confirm(`Supprimer la commande "${order.reference}" définitivement ?`)) return
    try {
      await purchaseOrderService.remove(order.id)
      toast.success('Bon de commande supprimé.')
      navigate('/purchase-orders')
    } catch {
      toast.error('Erreur lors de la suppression.')
    }
  }

  /* ── Loading state ── */
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
    <div className="space-y-5 max-w-5xl">

      {/* ── Breadcrumb + header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-1 min-w-0">
          <Link
            to="/purchase-orders"
            className="inline-flex items-center gap-1.5 text-xs font-sans text-muted-500 hover:text-navy transition-colors"
          >
            <ChevronLeft size={14} />Bons de commande fournisseurs
          </Link>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="w-10 h-10 rounded-card flex items-center justify-center flex-shrink-0 bg-primary-50 text-primary-500">
              <ShoppingCart size={20} />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-display font-bold text-navy font-mono leading-tight tracking-tight">
                {order.reference}
              </h1>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="text-sm font-sans text-muted-500">
                  {supplier.name ?? '—'}
                </span>
                <StatusBadge status={order.status} />
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2 flex-shrink-0 flex-wrap">
          <button onClick={load} className="btn-secondary p-2.5" title="Rafraîchir">
            <RefreshCw size={15} />
          </button>
          {canChangeStatus && (
            <button
              onClick={() => setShowStatusModal(true)}
              className="btn-primary flex items-center gap-2"
            >
              <ChevronDown size={14} />Changer statut
            </button>
          )}
          {canDelete && (
            <button onClick={handleDelete} className="btn-danger flex items-center gap-2">
              <XCircle size={14} />Supprimer
            </button>
          )}
        </div>
      </div>

      {/* ── Status timeline ── */}
      <StatusTimeline status={order.status} />

      {/* ── Stats ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatBox
          label="Total commande"
          value={fmt(order.total_amount)}
          sub="Montant HT"
          color="text-navy"
        />
        <StatBox
          label="Nombre d'articles"
          value={order.items_count ?? (order.items?.length ?? 0)}
          sub="Lignes de commande"
          color="text-primary-600"
        />
        <StatBox
          label="Date de commande"
          value={fmtDate(order.order_date)}
          sub={order.expected_date ? `Livraison prévue : ${fmtDate(order.expected_date)}` : undefined}
          color="text-muted-700"
        />
      </div>

      {/* ── Items table ── */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-muted-100 flex items-center justify-between gap-3 flex-wrap">
          <h2 className="font-display font-semibold text-navy flex items-center gap-2">
            <Package size={15} className="text-muted-400" />Articles commandés
          </h2>
          {stockUpdated && (
            <span className="inline-flex items-center gap-1.5 text-xs font-sans font-medium text-success bg-green-50 px-2.5 py-1 rounded-badge">
              <CheckCircle2 size={12} />Stock mis à jour automatiquement
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm font-sans">
            <thead>
              <tr className="bg-muted-50 text-left">
                <th className="px-4 py-3 text-xs font-semibold text-muted-500 uppercase tracking-wide">Article</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-500 uppercase tracking-wide">Unité</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-500 uppercase tracking-wide text-right">Qté commandée</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-500 uppercase tracking-wide text-right">Prix unitaire</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-500 uppercase tracking-wide text-right">Sous-total</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-500 uppercase tracking-wide text-right">Qté reçue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-muted-100">
              {(order.items ?? []).map((item) => (
                <tr key={item.id} className="hover:bg-muted-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-navy">
                      {item.product_name ?? item.description ?? '—'}
                    </p>
                    {item.description && item.product_name && (
                      <p className="text-[11px] text-muted-400 mt-0.5">{item.description}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-600">{item.unit ?? '—'}</td>
                  <td className="px-4 py-3 text-right text-navy font-medium">
                    {new Intl.NumberFormat('fr-FR').format(item.quantity ?? 0)}
                  </td>
                  <td className="px-4 py-3 text-right text-muted-700">
                    {fmt(item.unit_price)}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-navy">
                    {fmt(item.subtotal)}
                  </td>
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

              {/* Empty state */}
              {(!order.items || order.items.length === 0) && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center">
                    <Package size={24} className="mx-auto text-muted-200 mb-2" />
                    <p className="text-sm font-sans text-muted-400">Aucun article dans cette commande.</p>
                  </td>
                </tr>
              )}
            </tbody>

            {/* Total footer */}
            {order.items && order.items.length > 0 && (
              <tfoot>
                <tr className="bg-muted-50 border-t-2 border-muted-200">
                  <td colSpan={4} className="px-4 py-3 text-xs font-sans font-semibold text-muted-500 uppercase tracking-wide text-right">
                    TOTAL
                  </td>
                  <td className="px-4 py-3 text-right font-display font-bold text-navy text-base">
                    {fmt(order.total_amount)}
                  </td>
                  <td className="px-4 py-3" />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* ── Bottom layout: 2/3 + 1/3 ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Left: Supplier info */}
        <div className="md:col-span-2 card p-5 space-y-4">
          <h2 className="font-display font-semibold text-navy flex items-center gap-2">
            <Truck size={15} className="text-muted-400" />Informations fournisseur
          </h2>
          {supplier.name ? (
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-card bg-primary-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Package size={13} className="text-primary-500" />
                </div>
                <div>
                  <p className="text-[10px] font-sans font-semibold text-muted-400 uppercase tracking-wide">Nom</p>
                  <p className="text-sm font-sans text-navy font-medium">{supplier.name}</p>
                </div>
              </div>
              {supplier.phone && (
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-card bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
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
                  <div className="w-7 h-7 rounded-card bg-violet-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle2 size={13} className="text-violet-500" />
                  </div>
                  <div>
                    <p className="text-[10px] font-sans font-semibold text-muted-400 uppercase tracking-wide">Email</p>
                    <p className="text-sm font-sans text-navy">{supplier.email}</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm font-sans text-muted-400 italic">Informations fournisseur non disponibles.</p>
          )}
        </div>

        {/* Right: Metadata + Notes */}
        <div className="space-y-4">

          {/* Metadata */}
          <div className="card p-5">
            <h2 className="font-display font-semibold text-navy mb-3 flex items-center gap-2">
              <Calendar size={15} className="text-muted-400" />Métadonnées
            </h2>
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-sans">
                <span className="text-muted-500">Créé le</span>
                <span className="text-navy">{fmtDate(order.created_at)}</span>
              </div>
              <div className="flex justify-between text-xs font-sans">
                <span className="text-muted-500">Modifié le</span>
                <span className="text-navy">{fmtDate(order.updated_at)}</span>
              </div>
              {order.received_date && (
                <div className="flex justify-between text-xs font-sans">
                  <span className="text-muted-500">Reçu le</span>
                  <span className="text-success font-semibold">{fmtDate(order.received_date)}</span>
                </div>
              )}
              <div className="flex justify-between text-xs font-sans">
                <span className="text-muted-500">ID interne</span>
                <span className="text-muted-400 font-mono">#{order.id}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="card p-5">
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

      {/* ── Status modal ── */}
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
