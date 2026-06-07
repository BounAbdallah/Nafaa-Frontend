import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { orderService } from '@/services/orderService'
import toast from 'react-hot-toast'
import {
  Search, Filter, Eye, Download, Trash2,
  RefreshCw, ChevronLeft, ChevronRight,
  ShoppingBag, Calendar, User, CreditCard,
  CheckCircle2, Clock, XCircle, Info, Plus, X, Share2,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import DateRangePicker from '@/components/ui/DateRangePicker'
import { useCurrency } from '@/utils/currency'

export default function OrdersPage() {
  const { can }  = useAuthStore()
  const { format: fmt, symbol } = useCurrency()
  const [orders, setOrders]   = useState([])
  const [meta, setMeta]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage]       = useState(1)
  const [search, setSearch]   = useState('')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [showModal, setShowModal]         = useState(false)
  const [range, setRange]                 = useState({ start: '', end: '' })

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    try {
      const res = await orderService.getAll({
        page,
        search,
        per_page: 15,
        start_date: range.start,
        end_date:   range.end,
      })
      setOrders(res.data.orders || [])
      setMeta(res.data.meta || null)
    } catch (err) {
      console.error('Orders Fetch Error:', err.response?.data)
      toast.error('Erreur lors de la récupération des commandes')
    } finally {
      setLoading(false)
    }
  }, [page, search, range])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  useEffect(() => {
    const handleAiAction = (e) => {
      const action = e.detail?.action
      if (action === 'list_orders' || action === 'query_order') fetchOrders()
    }
    window.addEventListener('qiwam:ai-action', handleAiAction)
    return () => window.removeEventListener('qiwam:ai-action', handleAiAction)
  }, [fetchOrders])

  const handleShowDetails = async (id) => {
    try {
      const res = await orderService.getById(id)
      setSelectedOrder(res.data.order)
      setShowModal(true)
    } catch {
      toast.error('Erreur lors du chargement des détails')
    }
  }

  const handleDownload = async (order, e) => {
    e?.stopPropagation()
    try {
      await orderService.downloadInvoice(order.id, order.reference)
    } catch {
      toast.error('Erreur lors du téléchargement de la facture')
    }
  }

  const handleShare = async (order, e) => {
    e?.stopPropagation()
    try {
      await orderService.shareInvoice(order.id, order.reference)
    } catch {
      toast.error('Erreur lors du partage de la facture')
    }
  }

  const handleExport = async () => {
    try {
      toast.loading('Préparation de l\'export…', { id: 'export' })
      const res = await orderService.getAll({
        search,
        start_date: range.start,
        end_date:   range.end,
        per_page:   9999,
        page:       1,
      })
      const allOrders = res.data.orders || []

      if (allOrders.length === 0) {
        toast.error('Aucune commande à exporter', { id: 'export' })
        return
      }

      const PAYMENT_LABELS = {
        cash: 'Espèces', wave: 'Wave', orange_money: 'Orange Money',
        card: 'Carte', mobile_money: 'Mobile Money', bank_transfer: 'Virement',
      }
      const STATUS_LABELS = { completed: 'Terminée', pending: 'En attente', cancelled: 'Annulée' }
      const headers = ['Référence', 'Date', 'Client', 'Email client', 'Vendeur', 'Mode paiement', `Montant (${symbol})`, 'Statut']
      const rows = allOrders.map(o => [
        o.reference,
        new Date(o.created_at).toLocaleDateString('fr-FR'),
        o.customer?.name  || 'Client de passage',
        o.customer?.email || '',
        o.user?.name      || '',
        PAYMENT_LABELS[o.payment_method] || o.payment_method || '',
        o.total_amount,
        STATUS_LABELS[o.status] || o.status,
      ])
      const escape = (v) => {
        const s = String(v ?? '')
        return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s
      }
      const csv  = [headers, ...rows].map(r => r.map(escape).join(',')).join('\n')
      const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
      const url  = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href     = url
      link.download = `ventes_${new Date().toLocaleDateString('fr-FR').replace(/\//g, '-')}.csv`
      link.click()
      URL.revokeObjectURL(url)
      toast.success(`${allOrders.length} commande${allOrders.length > 1 ? 's' : ''} exportée${allOrders.length > 1 ? 's' : ''}`, { id: 'export' })
    } catch {
      toast.error('Erreur lors de l\'export', { id: 'export' })
    }
  }

  const handleDelete = async (order, e) => {
    e?.stopPropagation()
    if (!confirm(`Voulez-vous vraiment annuler la commande ${order.reference} ? Le stock sera restauré.`)) return
    try {
      await orderService.remove(order.id)
      toast.success('Commande annulée')
      fetchOrders()
      window.dispatchEvent(new CustomEvent('qiwam:data-changed'))
    } catch {
      toast.error('Erreur lors de l\'annulation')
    }
  }

  const getStatusBadge = (status) => {
    const styles = {
      completed: 'bg-green-50 text-success border-green-200',
      pending:   'bg-orange-50 text-orange-600 border-orange-200',
      cancelled: 'bg-red-50 text-danger border-red-200',
    }
    const labels = { completed: 'Terminée', pending: 'En attente', cancelled: 'Annulée' }
    return (
      <span className={cn("px-2 py-0.5 rounded-badge text-[10px] sm:text-[11px] font-bold border whitespace-nowrap", styles[status] || styles.pending)}>
        {labels[status] || status}
      </span>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-black text-navy tracking-tight">Historique des Ventes</h1>
          <p className="text-muted-500 text-sm hidden sm:block">Suivez et gérez toutes les transactions de votre boutique.</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link to="/pos" className="btn-primary flex items-center gap-2 text-sm sm:text-base h-9 sm:h-10 px-3 sm:px-4">
            <Plus size={16} />
            <span>Nouvelle Vente</span>
          </Link>
          <button
            onClick={fetchOrders}
            className="p-2 sm:p-2.5 text-muted-500 hover:text-primary-500 bg-surface border border-muted-300 rounded-btn hover:border-primary-300 transition-all"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* ── Table Card ── */}
      <div className="bg-surface rounded-card shadow-card border border-muted-300 overflow-hidden">

        {/* Filters bar */}
        <div className="p-3 sm:p-4 border-b border-muted-300 bg-muted-50/50 flex flex-col gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-400" size={16} />
            <input
              type="text"
              placeholder="Rechercher par référence…"
              className="input-field pl-9 text-sm h-10 w-full"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            />
          </div>
          <div className="flex flex-col xs:flex-row gap-2">
            <div className="flex-1">
              <DateRangePicker onRangeChange={(r) => { setRange(r); setPage(1) }} />
            </div>
            <button onClick={handleExport} className="btn-secondary py-2 px-3 flex items-center justify-center gap-2 text-sm h-10 whitespace-nowrap">
              <Download size={15} />
              <span>Exporter CSV</span>
            </button>
          </div>
        </div>

        {/* ── Desktop table (sm+) ── */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted-50 text-[11px] uppercase tracking-wider font-bold text-muted-600 border-b border-muted-300">
                <th className="py-3 px-4 sm:px-6">Référence</th>
                <th className="py-3 px-4 sm:px-6 hidden sm:table-cell">Date</th>
                <th className="py-3 px-4 sm:px-6 hidden md:table-cell">Client</th>
                <th className="py-3 px-4 sm:px-6">Total</th>
                <th className="py-3 px-4 sm:px-6 hidden lg:table-cell">Paiement</th>
                <th className="py-3 px-4 sm:px-6">Statut</th>
                <th className="py-3 px-4 sm:px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-muted-200">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan="7" className="py-6 px-6">
                      <div className="h-4 bg-muted-100 rounded w-full" />
                    </td>
                  </tr>
                ))
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-20 text-center">
                    <div className="flex flex-col items-center opacity-40">
                      <ShoppingBag size={40} className="mb-3" />
                      <p className="font-sans text-sm">Aucune commande trouvée</p>
                    </div>
                  </td>
                </tr>
              ) : (
                orders.map(order => (
                  <tr
                    key={order.id}
                    className="hover:bg-muted-50/50 transition-colors group cursor-pointer"
                    onClick={() => handleShowDetails(order.id)}
                  >
                    <td className="py-3 px-4 sm:px-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-sans font-bold text-navy">{order.reference}</span>
                        <span className="text-[10px] text-muted-500 font-mono">#{order.id}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 sm:px-6 hidden sm:table-cell">
                      <div className="flex items-center gap-1.5 text-sm text-muted-600">
                        <Calendar size={13} className="text-muted-400 shrink-0" />
                        {new Date(order.created_at).toLocaleDateString('fr-FR')}
                      </div>
                    </td>
                    <td className="py-3 px-4 sm:px-6 hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary-50 flex items-center justify-center text-primary-600 text-[10px] font-bold shrink-0">
                          {order.customer?.name?.[0] || 'P'}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-sans text-navy truncate max-w-[120px]">{order.customer?.name || 'Client de passage'}</span>
                          <span className="text-[10px] text-muted-400">Par: {order.user?.name}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 sm:px-6">
                      <span className="text-sm font-display font-black text-navy whitespace-nowrap">{fmt(order.total_amount)}</span>
                    </td>
                    <td className="py-3 px-4 sm:px-6 hidden lg:table-cell">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-muted-600 capitalize">{order.payment_method?.replace('_', ' ') || '—'}</span>
                        {order.payment_status === 'paid'
                          ? <CheckCircle2 size={13} className="text-success" />
                          : <Clock size={13} className="text-orange-500" />
                        }
                      </div>
                    </td>
                    <td className="py-3 px-4 sm:px-6">{getStatusBadge(order.status)}</td>
                    <td className="py-3 px-4 sm:px-6 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleShowDetails(order.id)}
                          className="p-1.5 text-muted-500 hover:text-primary-500 hover:bg-primary-50 rounded-btn transition-all"
                          title="Voir détails"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          onClick={(e) => handleDownload(order, e)}
                          className="p-1.5 text-muted-500 hover:text-primary-500 hover:bg-primary-50 rounded-btn transition-all"
                          title="Télécharger facture"
                        >
                          <Download size={15} />
                        </button>
                        <button
                          onClick={(e) => handleShare(order, e)}
                          className="p-1.5 text-muted-500 hover:text-green-600 hover:bg-green-50 rounded-btn transition-all"
                          title="Partager facture"
                        >
                          <Share2 size={15} />
                        </button>
                        {order.status !== 'cancelled' && can('orders', 'delete') && (
                          <button
                            onClick={(e) => handleDelete(order, e)}
                            className="p-1.5 text-muted-400 hover:text-danger hover:bg-red-50 rounded-btn transition-all"
                            title="Annuler"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── Mobile card list (xs only) ── */}
        <div className="sm:hidden divide-y divide-muted-200">
          {loading ? (
            [...Array(4)].map((_, i) => (
              <div key={i} className="p-4 animate-pulse space-y-2">
                <div className="h-3.5 bg-muted-100 rounded w-2/3" />
                <div className="h-3 bg-muted-100 rounded w-1/3" />
              </div>
            ))
          ) : orders.length === 0 ? (
            <div className="py-16 flex flex-col items-center opacity-40">
              <ShoppingBag size={36} className="mb-3" />
              <p className="font-sans text-sm">Aucune commande trouvée</p>
            </div>
          ) : (
            orders.map(order => (
              <button
                key={order.id}
                onClick={() => handleShowDetails(order.id)}
                className="w-full text-left px-4 py-3.5 hover:bg-muted-50 transition-colors active:bg-muted-100"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-navy">{order.reference}</span>
                      {getStatusBadge(order.status)}
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-muted-500">
                      <span className="flex items-center gap-1">
                        <Calendar size={11} />
                        {new Date(order.created_at).toLocaleDateString('fr-FR')}
                      </span>
                      <span className="flex items-center gap-1">
                        <User size={11} />
                        {order.customer?.name || 'Passage'}
                      </span>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-display font-black text-navy">{fmt(order.total_amount)}</p>
                    <p className="text-[10px] text-muted-400 mt-0.5 capitalize">{order.payment_method?.replace('_', ' ') || '—'}</p>
                  </div>
                </div>

                {/* Mobile actions */}
                <div className="flex items-center gap-2 mt-2.5 pt-2.5 border-t border-muted-100" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleShowDetails(order.id) }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-btn border border-muted-200 text-xs text-muted-600 hover:border-primary-300 hover:text-primary-600 transition-colors"
                  >
                    <Eye size={13} /> Détails
                  </button>
                  <button
                    onClick={(e) => handleDownload(order, e)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-btn border border-muted-200 text-xs text-muted-600 hover:border-primary-300 hover:text-primary-600 transition-colors"
                  >
                    <Download size={13} /> Facture
                  </button>
                  <button
                    onClick={(e) => handleShare(order, e)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-btn border border-muted-200 text-xs text-muted-600 hover:border-green-300 hover:text-green-600 transition-colors"
                  >
                    <Share2 size={13} /> Partager
                  </button>
                  {order.status !== 'cancelled' && can('orders', 'delete') && (
                    <button
                      onClick={(e) => handleDelete(order, e)}
                      className="px-3 flex items-center justify-center gap-1.5 py-1.5 rounded-btn border border-red-200 text-xs text-danger hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </button>
            ))
          )}
        </div>

        {/* ── Pagination ── */}
        {meta && meta.last_page > 1 && (
          <div className="p-3 sm:p-4 border-t border-muted-300 bg-muted-50/50 flex items-center justify-between gap-2">
            <span className="text-xs text-muted-500 hidden sm:block">
              {orders.length} sur {meta.total} commandes
            </span>
            <span className="text-xs text-muted-500 sm:hidden">
              {meta.total} commandes
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="p-1.5 sm:p-2 rounded-btn border border-muted-300 hover:bg-surface disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              >
                <ChevronLeft size={15} />
              </button>
              <span className="text-xs font-bold text-navy px-2 sm:px-4 whitespace-nowrap">
                {page} / {meta.last_page}
              </span>
              <button
                disabled={page === meta.last_page}
                onClick={() => setPage(p => p + 1)}
                className="p-1.5 sm:p-2 rounded-btn border border-muted-300 hover:bg-surface disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Order Details Modal ── */}
      {showModal && selectedOrder && (
        <OrderDetailsModal order={selectedOrder} onClose={() => setShowModal(false)} />
      )}
    </div>
  )
}

// ── Modal détails commande ────────────────────────────────────────────────────
function OrderDetailsModal({ order, onClose }) {
  const { format: fmt } = useCurrency()   // ← hook propre au composant

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-navy/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-surface w-full sm:max-w-2xl rounded-t-2xl sm:rounded-modal shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom sm:zoom-in-95 duration-200 max-h-[95dvh] sm:max-h-[90vh]">

        {/* Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-muted-300 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-lg sm:text-xl font-display font-bold text-navy">Détails de la commande</h3>
            <p className="text-xs text-muted-500 mt-0.5">Réf : {order.reference}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-4 sm:px-6 py-5 sm:py-6 space-y-6 sm:space-y-8">

          {/* Client & Vendeur */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
            <div className="space-y-1">
              <p className="text-[10px] text-muted-500 uppercase font-bold tracking-wider">Client</p>
              <p className="text-sm font-sans font-bold text-navy">{order.customer?.name || 'Client de passage'}</p>
              <p className="text-xs text-muted-400">{order.customer?.email || '—'}</p>
            </div>
            <div className="space-y-1 sm:text-right">
              <p className="text-[10px] text-muted-500 uppercase font-bold tracking-wider">Vendu par</p>
              <p className="text-sm font-sans font-bold text-navy">{order.user?.name}</p>
              <p className="text-xs text-muted-400">{new Date(order.created_at).toLocaleString('fr-FR')}</p>
            </div>
          </div>

          {/* Articles */}
          <div className="space-y-3">
            <p className="text-[10px] text-muted-500 uppercase font-bold tracking-wider">Articles commandés</p>
            <div className="border border-muted-200 rounded-card overflow-hidden overflow-x-auto">
              <table className="w-full text-sm min-w-[320px]">
                <thead className="bg-muted-50 border-b border-muted-200">
                  <tr className="text-[10px] font-bold text-muted-600 uppercase">
                    <th className="py-2.5 px-3 sm:px-4 text-left">Description</th>
                    <th className="py-2.5 px-3 sm:px-4 text-center">Qté</th>
                    <th className="py-2.5 px-3 sm:px-4 text-right">P.U.</th>
                    <th className="py-2.5 px-3 sm:px-4 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-muted-100">
                  {order.items?.map(item => (
                    <tr key={item.id} className="text-navy">
                      <td className="py-2.5 px-3 sm:px-4 text-sm">{item.description}</td>
                      <td className="py-2.5 px-3 sm:px-4 text-center font-bold text-sm">{item.quantity}</td>
                      <td className="py-2.5 px-3 sm:px-4 text-right text-sm whitespace-nowrap">{fmt(item.unit_price)}</td>
                      <td className="py-2.5 px-3 sm:px-4 text-right font-bold text-sm whitespace-nowrap">{fmt(item.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-muted-50 font-bold border-t border-muted-200">
                  <tr>
                    <td colSpan="3" className="py-2.5 px-3 sm:px-4 text-right text-[10px] text-muted-500 uppercase">Sous-total</td>
                    <td className="py-2.5 px-3 sm:px-4 text-right text-navy whitespace-nowrap">{fmt(order.subtotal)}</td>
                  </tr>
                  {order.discount_amount > 0 && (
                    <tr>
                      <td colSpan="3" className="py-2 px-3 sm:px-4 text-right text-[10px] text-danger uppercase">Remise</td>
                      <td className="py-2 px-3 sm:px-4 text-right text-danger whitespace-nowrap">-{fmt(order.discount_amount)}</td>
                    </tr>
                  )}
                  <tr className="text-base sm:text-lg">
                    <td colSpan="3" className="py-3 px-3 sm:px-4 text-right uppercase font-display">Total</td>
                    <td className="py-3 px-3 sm:px-4 text-right text-primary-600 font-display font-black whitespace-nowrap">{fmt(order.total_amount)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Règlements */}
          <div className="space-y-3">
            <p className="text-[10px] text-muted-500 uppercase font-bold tracking-wider">Détail des règlements</p>
            <div className="space-y-2">
              {order.payments?.map(p => (
                <div key={p.id} className="flex items-center justify-between p-3 bg-muted-50 rounded-card border border-muted-200">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-primary-600 shadow-sm shrink-0">
                      <CreditCard size={14} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-navy capitalize">{p.payment_method?.replace('_', ' ') || '—'}</p>
                      <p className="text-[10px] text-muted-400">Réf : {p.reference || '—'}</p>
                    </div>
                  </div>
                  <p className="text-sm font-display font-black text-navy whitespace-nowrap">{fmt(p.amount)}</p>
                </div>
              ))}
              {order.change_amount > 0 && (
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-card border border-green-100">
                  <span className="text-xs font-bold text-success uppercase">Monnaie rendue</span>
                  <span className="text-sm font-display font-black text-success whitespace-nowrap">{fmt(order.change_amount)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-4 bg-muted-50 flex flex-col sm:flex-row gap-2 border-t border-muted-100 shrink-0">
          <button
            onClick={() => orderService.downloadInvoice(order.id, order.reference).catch(() => toast.error('Erreur téléchargement'))}
            className="sm:flex-1 btn-secondary h-11 flex items-center justify-center gap-2 text-sm"
          >
            <Download size={16} />
            Imprimer Facture
          </button>
          <button
            onClick={() => orderService.shareInvoice(order.id, order.reference).catch(() => toast.error('Erreur partage'))}
            className="sm:flex-1 h-11 flex items-center justify-center gap-2 text-sm rounded-btn border border-green-300 text-green-700 bg-green-50 hover:bg-green-100 transition-colors font-bold"
          >
            <Share2 size={16} />
            Partager Facture
          </button>
          <button onClick={onClose} className="sm:flex-1 btn-primary h-11 text-sm">
            Fermer
          </button>
        </div>
      </div>
    </div>
  )
}
