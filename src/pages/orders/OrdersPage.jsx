import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { orderService } from '@/services/orderService'
import toast from 'react-hot-toast'
import { 
  Search, Filter, Eye, Download, Trash2, 
  RefreshCw, ChevronLeft, ChevronRight,
  ShoppingBag, Calendar, User, CreditCard,
  CheckCircle2, Clock, XCircle, Info, Plus, X
} from 'lucide-react'
import { cn } from '@/utils/cn'
import DateRangePicker from '@/components/ui/DateRangePicker'

const fmt = (n) => new Intl.NumberFormat('fr-FR').format(n ?? 0) + ' FCFA'

export default function OrdersPage() {
  const [orders, setOrders] = useState([])
  const [meta, setMeta]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage]     = useState(1)
  const [search, setSearch] = useState('')
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
        end_date: range.end
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

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  // Listen for AI actions
  useEffect(() => {
    const handleAiAction = (e) => {
      const action = e.detail?.action
      // For orders, we refresh on any sales-related tool
      if (action === 'list_orders' || action === 'query_order') {
        fetchOrders()
      }
    }
    window.addEventListener('qiwam:ai-action', handleAiAction)
    return () => window.removeEventListener('qiwam:ai-action', handleAiAction)
  }, [fetchOrders])

  const handleShowDetails = async (id) => {
    try {
      const res = await orderService.getById(id)
      setSelectedOrder(res.data.order)
      setShowModal(true)
    } catch (err) {
      toast.error('Erreur lors du chargement des détails')
    }
  }

  const handleDownload = async (order) => {
    try {
      await orderService.downloadInvoice(order.id, order.reference)
    } catch {
      toast.error('Erreur lors du téléchargement de la facture')
    }
  }

  const handleExport = async () => {
    try {
      toast.loading('Préparation de l\'export…', { id: 'export' })

      // Récupérer toutes les commandes avec les filtres actifs (sans pagination)
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

      // Construire le CSV
      const PAYMENT_LABELS = {
        cash:          'Espèces',
        wave:          'Wave',
        orange_money:  'Orange Money',
        card:          'Carte',
        mobile_money:  'Mobile Money',
        bank_transfer: 'Virement',
      }
      const STATUS_LABELS = { completed: 'Terminée', pending: 'En attente', cancelled: 'Annulée' }

      const headers = ['Référence', 'Date', 'Client', 'Email client', 'Vendeur', 'Mode paiement', 'Montant (FCFA)', 'Statut']

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
        return s.includes(',') || s.includes('"') || s.includes('\n')
          ? `"${s.replace(/"/g, '""')}"`
          : s
      }

      const csv = [headers, ...rows].map(r => r.map(escape).join(',')).join('\n')
      const bom  = '﻿' // BOM UTF-8 pour Excel
      const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' })
      const url  = URL.createObjectURL(blob)
      const link = document.createElement('a')

      const dateStr = new Date().toLocaleDateString('fr-FR').replace(/\//g, '-')
      link.href     = url
      link.download = `ventes_${dateStr}.csv`
      link.click()
      URL.revokeObjectURL(url)

      toast.success(`${allOrders.length} commande${allOrders.length > 1 ? 's' : ''} exportée${allOrders.length > 1 ? 's' : ''}`, { id: 'export' })
    } catch {
      toast.error('Erreur lors de l\'export', { id: 'export' })
    }
  }

  const handleDelete = async (order) => {
    if (!confirm(`Voulez-vous vraiment annuler la commande ${order.reference} ? Le stock sera restauré.`)) return
    try {
      await orderService.remove(order.id)
      toast.success('Commande annulée')
      fetchOrders()
    } catch (err) {
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
      <span className={cn("px-2.5 py-1 rounded-badge text-[11px] font-bold border", styles[status] || styles.pending)}>
        {labels[status] || status}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-black text-navy tracking-tight">Historique des Ventes</h1>
          <p className="text-muted-500 text-sm">Suivez et gérez toutes les transactions de votre boutique.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/pos" className="btn-primary flex items-center gap-2">
            <Plus size={18} />
            <span>Nouvelle Vente</span>
          </Link>
          <button onClick={fetchOrders} className="p-2.5 text-muted-500 hover:text-primary-500 bg-surface border border-muted-300 rounded-btn hover:border-primary-300 transition-all">
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Filtres & Table */}
      <div className="bg-surface rounded-card shadow-card border border-muted-300 overflow-hidden">
        <div className="p-4 border-b border-muted-300 bg-muted-50/50 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-400" size={18} />
            <input 
              type="text" 
              placeholder="Rechercher par référence..." 
              className="input-field pl-10"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <DateRangePicker onRangeChange={(r) => { setRange(r); setPage(1) }} />
            <button onClick={handleExport} className="btn-secondary py-2 px-4 flex items-center gap-2">
              <Download size={16} />
              <span>Exporter</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted-50 text-[11px] uppercase tracking-wider font-bold text-muted-600 border-b border-muted-300">
                <th className="py-4 px-6">Référence</th>
                <th className="py-4 px-6">Date</th>
                <th className="py-4 px-6">Client</th>
                <th className="py-4 px-6">Total</th>
                <th className="py-4 px-6">Paiement</th>
                <th className="py-4 px-6">Statut</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-muted-200">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan="7" className="py-8 px-6"><div className="h-4 bg-muted-100 rounded w-full" /></td>
                  </tr>
                ))
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-20 text-center">
                    <div className="flex flex-col items-center opacity-40">
                      <ShoppingBag size={48} className="mb-4" />
                      <p className="font-sans">Aucune commande trouvée</p>
                    </div>
                  </td>
                </tr>
              ) : (
                orders.map(order => (
                  <tr key={order.id} className="hover:bg-muted-50/50 transition-colors group">
                    <td className="py-4 px-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-sans font-bold text-navy">{order.reference}</span>
                        <span className="text-[10px] text-muted-500 font-mono">ID: #{order.id}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2 text-sm text-muted-600 font-sans">
                        <Calendar size={14} className="text-muted-400" />
                        {new Date(order.created_at).toLocaleDateString('fr-FR')}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary-50 flex items-center justify-center text-primary-600 text-[10px] font-bold">
                          {order.customer?.name?.[0] || 'P'}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-sans text-navy">{order.customer?.name || 'Client de passage'}</span>
                          <span className="text-[10px] text-muted-400">Par: {order.user?.name}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm font-display font-black text-navy">{fmt(order.total_amount)}</span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-sans text-muted-600 capitalize">{order.payment_method?.replace('_', ' ') || '—'}</span>
                        {order.payment_status === 'paid' ? (
                          <CheckCircle2 size={14} className="text-success" />
                        ) : (
                          <Clock size={14} className="text-orange-500" />
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleShowDetails(order.id)}
                          className="p-2 text-muted-500 hover:text-primary-500 hover:bg-primary-50 rounded-btn transition-all" 
                          title="Voir détails"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => handleDownload(order)}
                          className="p-2 text-muted-500 hover:text-primary-500 hover:bg-primary-50 rounded-btn transition-all"
                          title="Télécharger facture"
                        >
                          <Download size={16} />
                        </button>
                        {order.status !== 'cancelled' && (
                          <button onClick={() => handleDelete(order)} className="p-2 text-muted-400 hover:text-danger hover:bg-red-50 rounded-btn transition-all" title="Annuler">
                            <Trash2 size={16} />
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

        {/* Pagination */}
        {meta && meta.last_page > 1 && (
          <div className="p-4 border-t border-muted-300 bg-muted-50/50 flex items-center justify-between">
            <span className="text-xs text-muted-500 font-sans">Affichage de {orders.length} sur {meta.total} commandes</span>
            <div className="flex items-center gap-2">
              <button 
                disabled={page === 1} 
                onClick={() => setPage(p => p - 1)}
                className="p-2 rounded-btn border border-muted-300 hover:bg-surface disabled:opacity-30 disabled:hover:bg-transparent"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs font-bold text-navy px-4">Page {page} / {meta.last_page}</span>
              <button 
                disabled={page === meta.last_page} 
                onClick={() => setPage(p => p + 1)}
                className="p-2 rounded-btn border border-muted-300 hover:bg-surface disabled:opacity-30 disabled:hover:bg-transparent"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Détails */}
      {showModal && selectedOrder && (
        <OrderDetailsModal order={selectedOrder} onClose={() => setShowModal(false)} />
      )}
    </div>
  )
}

function OrderDetailsModal({ order, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-surface w-full max-w-2xl rounded-modal shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-muted-300 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-display font-bold text-navy">Détails de la commande</h3>
            <p className="text-xs text-muted-500 mt-0.5">Réf: {order.reference}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[70vh] space-y-8">
          {/* Infos Client & Vente */}
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-1">
              <p className="text-[10px] text-muted-500 uppercase font-bold tracking-wider">Client</p>
              <p className="text-sm font-sans font-bold text-navy">{order.customer?.name || 'Client de passage'}</p>
              <p className="text-xs text-muted-400">{order.customer?.email || '—'}</p>
            </div>
            <div className="space-y-1 text-right">
              <p className="text-[10px] text-muted-500 uppercase font-bold tracking-wider">Vendu par</p>
              <p className="text-sm font-sans font-bold text-navy">{order.user?.name}</p>
              <p className="text-xs text-muted-400">{new Date(order.created_at).toLocaleString('fr-FR')}</p>
            </div>
          </div>

          {/* Table des items */}
          <div className="space-y-3">
            <p className="text-[10px] text-muted-500 uppercase font-bold tracking-wider">Articles commandés</p>
            <div className="border border-muted-200 rounded-card overflow-hidden overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted-50 border-b border-muted-200">
                  <tr className="text-[10px] font-bold text-muted-600 uppercase">
                    <th className="py-2.5 px-4 text-left">Description</th>
                    <th className="py-2.5 px-4 text-center">Qté</th>
                    <th className="py-2.5 px-4 text-right">Prix Unit.</th>
                    <th className="py-2.5 px-4 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-muted-100">
                  {order.items?.map(item => (
                    <tr key={item.id} className="text-navy">
                      <td className="py-3 px-4">{item.description}</td>
                      <td className="py-3 px-4 text-center font-bold">{item.quantity}</td>
                      <td className="py-3 px-4 text-right">{fmt(item.unit_price)}</td>
                      <td className="py-3 px-4 text-right font-bold">{fmt(item.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-muted-50 font-bold border-t border-muted-200">
                  <tr>
                    <td colSpan="3" className="py-3 px-4 text-right uppercase text-[10px] text-muted-500">Sous-total</td>
                    <td className="py-3 px-4 text-right text-navy">{fmt(order.subtotal)}</td>
                  </tr>
                  {order.discount_amount > 0 && (
                    <tr>
                      <td colSpan="3" className="py-2 px-4 text-right uppercase text-[10px] text-danger">Remise</td>
                      <td className="py-2 px-4 text-right text-danger">-{fmt(order.discount_amount)}</td>
                    </tr>
                  )}
                  <tr className="text-lg">
                    <td colSpan="3" className="py-4 px-4 text-right uppercase font-display">Total</td>
                    <td className="py-4 px-4 text-right text-primary-600 font-display font-black">{fmt(order.total_amount)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Paiements */}
          <div className="space-y-3">
            <p className="text-[10px] text-muted-500 uppercase font-bold tracking-wider">Détail des règlements</p>
            <div className="grid grid-cols-1 gap-2">
              {order.payments?.map(p => (
                <div key={p.id} className="flex items-center justify-between p-3 bg-muted-50 rounded-card border border-muted-200">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-primary-600 shadow-sm">
                      <CreditCard size={14} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-navy capitalize">{p.payment_method?.replace('_', ' ') || '—'}</p>
                      <p className="text-[10px] text-muted-400">Réf: {p.reference || '—'}</p>
                    </div>
                  </div>
                  <p className="text-sm font-display font-black text-navy">{fmt(p.amount)}</p>
                </div>
              ))}
              {order.change_amount > 0 && (
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-card border border-green-100 mt-2">
                  <span className="text-xs font-bold text-success uppercase">Monnaie rendue</span>
                  <span className="text-sm font-display font-black text-success">{fmt(order.change_amount)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 bg-muted-50 flex gap-3">
          <button
            onClick={() => orderService.downloadInvoice(order.id, order.reference).catch(() => toast.error('Erreur téléchargement'))}
            className="flex-1 btn-secondary py-2.5 flex items-center justify-center gap-2"
          >
            <Download size={18} />
            Imprimer Facture
          </button>
          <button onClick={onClose} className="flex-1 btn-primary py-2.5">
            Fermer
          </button>
        </div>
      </div>
    </div>
  )
}
