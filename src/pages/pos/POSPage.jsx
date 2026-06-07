import { useState, useEffect, useCallback, useRef } from 'react'
import { productService } from '@/services/productService'
import { orderService } from '@/services/orderService'
import { customerService } from '@/services/customerService'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'
import {
  Search, ShoppingCart, Trash2, Plus, Minus, User,
  CreditCard, Banknote, Smartphone, X, Loader2,
  Package, CheckCircle2, ChevronRight, Info, Printer,
  UserPlus, Phone, Mail, ChevronDown, Share2,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { printReceipt } from '@/utils/printDocument'
import { useCurrency } from '@/utils/currency'

export default function POSPage() {
  const user = useAuthStore(s => s.user)
  const { format: fmt, symbol } = useCurrency()
  const [products, setProducts]   = useState([])
  const [customers, setCustomers] = useState([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [cart, setCart]           = useState([])
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [showPayment, setShowPayment]       = useState(false)
  const [showNewCustomer, setShowNewCustomer] = useState(false)
  const [showCart, setShowCart]             = useState(false) // mobile cart sheet

  // Stats
  const subtotal = cart.reduce((acc, item) => acc + (item.selling_price * item.quantity), 0)
  const total    = subtotal

  useEffect(() => {
    Promise.all([
      productService.getAll({ per_page: 50, exclude_type: 'material' }),
      customerService.getAll({ per_page: 100 })
    ]).then(([prodRes, custRes]) => {
      setProducts(prodRes.data.products)
      setCustomers(custRes.data.customers)
    }).finally(() => setLoading(false))
  }, [])

  const addToCart = (product) => {
    if (product.stock_quantity <= 0) {
      toast.error('Produit en rupture de stock')
      return
    }
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id)
      if (existing) {
        if (existing.quantity >= product.stock_quantity) {
          toast.error('Quantité max en stock atteinte')
          return prev
        }
        return prev.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      }
      return [...prev, { ...product, quantity: 1 }]
    })
  }

  const updateQuantity = (id, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta)
        if (newQty > item.stock_quantity) {
          toast.error('Stock insuffisant')
          return item
        }
        return { ...item, quantity: newQty }
      }
      return item
    }))
  }

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(item => item.id !== id))
  }

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku?.toLowerCase().includes(search.toLowerCase())
  )

  const handleCompleteSale = async (paymentData, printAfter = false, shareAfter = false) => {
    try {
      const payload = {
        customer_id: selectedCustomer?.id,
        payments: paymentData.payments,
        items: cart.map(item => ({
          product_id: item.id,
          quantity: item.quantity
        })),
        notes: paymentData.notes
      }

      const res   = await orderService.create(payload)
      const order = res.data?.order ?? res.data ?? null

      if (printAfter) {
        const totalPaid = paymentData.payments.reduce((acc, p) => acc + Number(p.amount), 0)
        const change    = Math.max(0, totalPaid - total)
        printReceipt(order, cart, selectedCustomer, paymentData.payments, total, change, user?.tenant)
      }

      if (shareAfter && order?.id) {
        await orderService.shareInvoice(order.id, order.reference)
      }

      toast.success('Vente terminée !')
      window.dispatchEvent(new CustomEvent('qiwam:data-changed'))
      setCart([])
      setSelectedCustomer(null)
      setShowPayment(false)
      setShowCart(false)

      const prodRes = await productService.getAll({ per_page: 50, exclude_type: 'material' })
      setProducts(prodRes.data.products)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la vente')
    }
  }

  // ── Cart Panel content (shared between desktop sidebar & mobile sheet) ──────
  const CartContent = ({ onClose }) => (
    <>
      {/* Header */}
      <div className="p-4 border-b border-muted-300 flex items-center gap-2.5 shrink-0">
        <div className="p-2 bg-primary-50 rounded-lg">
          <ShoppingCart className="w-5 h-5 text-primary-600" />
        </div>
        <h2 className="text-lg font-display font-bold text-navy">Panier actuel</h2>
        <span className="ml-auto px-2 py-0.5 bg-muted-100 rounded-badge text-xs font-bold text-muted-600">
          {cart.length} articles
        </span>
        {/* Close button — mobile sheet only */}
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 text-muted-400 hover:text-navy hover:bg-muted-100 rounded-btn transition-colors ml-1"
          >
            <ChevronDown size={18} />
          </button>
        )}
      </div>

      {/* Client */}
      <div className="px-4 py-3 border-b border-muted-300 bg-muted-50/50 shrink-0">
        <CustomerSearch
          customers={customers}
          selected={selectedCustomer}
          onSelect={setSelectedCustomer}
          onNew={() => setShowNewCustomer(true)}
        />
      </div>

      {/* Cart items */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-40">
            <div className="w-16 h-16 rounded-full bg-muted-100 flex items-center justify-center mb-4">
              <ShoppingCart className="w-8 h-8" />
            </div>
            <p className="text-sm font-sans">Le panier est vide.<br/>Sélectionnez des produits.</p>
          </div>
        ) : (
          cart.map(item => (
            <div key={item.id} className="flex gap-3 group animate-in fade-in slide-in-from-right-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-sans font-semibold text-navy truncate">{item.name}</p>
                <p className="text-xs text-primary-500 font-bold mt-0.5">{fmt(item.selling_price)}</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-bg rounded-btn border border-muted-300 p-0.5">
                  <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:text-primary-600"><Minus size={12}/></button>
                  <span className="w-7 text-center text-xs font-bold">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:text-primary-600"><Plus size={12}/></button>
                </div>
                <button onClick={() => removeFromCart(item.id)} className="p-1.5 text-muted-400 hover:text-danger hover:bg-red-50 rounded-btn transition-colors">
                  <Trash2 size={14}/>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Totaux & Action */}
      <div className="p-5 sm:p-6 bg-navy text-white rounded-t-3xl shadow-2xl shrink-0">
        <div className="space-y-2 mb-5">
          <div className="flex justify-between text-sm text-white/60">
            <span>Sous-total</span>
            <span>{fmt(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm text-white/60">
            <span>Remise</span>
            <span>{fmt(0)}</span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-white/10 mt-2">
            <span className="text-lg font-display">TOTAL</span>
            <span className="text-2xl font-display font-black text-primary-400">{fmt(total)}</span>
          </div>
        </div>

        <button
          disabled={cart.length === 0}
          onClick={() => setShowPayment(true)}
          className="w-full btn-primary h-14 text-lg font-display font-bold shadow-lg shadow-primary-500/20 disabled:grayscale disabled:opacity-50"
        >
          Payer {fmt(total)}
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* ── Main Layout ── */}
      <div className="h-[calc(100vh-120px)] flex gap-6 overflow-hidden">

        {/* ── Products Panel ── */}
        <div className="flex-1 flex flex-col min-w-0 bg-surface rounded-card shadow-card border border-muted-300 overflow-hidden">

          {/* Header */}
          <div className="p-3 sm:p-4 border-b border-muted-300 shrink-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <h2 className="text-lg sm:text-xl font-display font-bold text-navy shrink-0">Point de Vente</h2>
              <div className="relative flex-1 sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-500" />
                <input
                  type="text"
                  placeholder="Rechercher un produit…"
                  className="input-field pl-10 w-full"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Product Grid */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 pb-24 lg:pb-4">
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="h-40 bg-muted-100 animate-pulse rounded-card" />
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center opacity-40">
                <Package className="w-10 h-10 mb-2 text-muted-400" />
                <p className="text-sm text-muted-500">Aucun produit trouvé</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
                {filteredProducts.map(product => (
                  <button
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className={cn(
                      "group relative flex flex-col p-3 rounded-card border transition-all text-left",
                      product.stock_quantity <= 0
                        ? "bg-muted-50 border-muted-200 cursor-not-allowed grayscale"
                        : "bg-surface border-muted-300 hover:border-primary-400 hover:shadow-lg active:scale-95"
                    )}
                  >
                    <div className="w-full aspect-square bg-muted-100 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                      {product.image ? (
                        <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-8 h-8 sm:w-10 sm:h-10 text-muted-300" />
                      )}
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs sm:text-sm font-sans font-bold text-navy line-clamp-2">{product.name}</p>
                      <p className="text-[11px] text-muted-500">{product.category_name}</p>
                      <div className="flex items-center justify-between mt-1.5 flex-wrap gap-1">
                        <p className="text-xs sm:text-sm font-display font-black text-primary-600">{fmt(product.selling_price)}</p>
                        <span className={cn(
                          "text-[10px] px-1.5 py-0.5 rounded-badge font-bold",
                          product.stock_quantity < 5 ? "bg-red-50 text-danger" : "bg-green-50 text-success"
                        )}>
                          {product.stock_quantity}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Cart Sidebar — desktop only ── */}
        <div className="hidden lg:flex w-[400px] flex-col bg-surface rounded-card shadow-card border border-muted-300 overflow-hidden">
          <CartContent />
        </div>
      </div>

      {/* ── Mobile Cart FAB ── */}
      <div className="fixed bottom-4 inset-x-4 lg:hidden z-30">
        <button
          onClick={() => setShowCart(true)}
          className={cn(
            "w-full h-14 rounded-2xl flex items-center justify-between px-5 shadow-xl transition-all",
            cart.length === 0
              ? "bg-navy/80 text-white/60 cursor-default"
              : "bg-navy text-white shadow-navy/30 active:scale-[0.98]"
          )}
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <ShoppingCart size={20} />
              {cart.length > 0 && (
                <span className="absolute -top-2 -right-2.5 w-4 h-4 bg-primary-400 text-navy rounded-full text-[10px] font-black flex items-center justify-center">
                  {cart.length}
                </span>
              )}
            </div>
            <span className="font-semibold text-sm">
              {cart.length === 0 ? 'Panier vide' : `Voir le panier`}
            </span>
          </div>
          <span className="font-display font-black text-lg text-primary-400">{fmt(total)}</span>
        </button>
      </div>

      {/* ── Mobile Cart Bottom Sheet ── */}
      {showCart && (
        <div className="fixed inset-0 z-40 lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-navy/50 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setShowCart(false)}
          />
          {/* Sheet */}
          <div className="absolute inset-x-0 bottom-0 top-16 bg-surface rounded-t-2xl flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">
            <CartContent onClose={() => setShowCart(false)} />
          </div>
        </div>
      )}

      {/* ── Payment Modal ── */}
      {showPayment && (
        <PaymentModal
          total={total}
          onClose={() => setShowPayment(false)}
          onComplete={handleCompleteSale}
        />
      )}

      {/* ── New Customer Modal ── */}
      {showNewCustomer && (
        <NewCustomerModal
          onClose={() => setShowNewCustomer(false)}
          onCreated={(customer) => {
            setCustomers(prev => [customer, ...prev])
            setSelectedCustomer(customer)
            setShowNewCustomer(false)
            toast.success(`Client « ${customer.name} » ajouté et sélectionné`)
          }}
        />
      )}
    </>
  )
}

// ── Combobox recherche client ─────────────────────────────────────────────────
function CustomerSearch({ customers, selected, onSelect, onNew }) {
  const [query, setQuery] = useState('')
  const [open, setOpen]   = useState(false)
  const wrapRef           = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtered = query.trim()
    ? customers.filter(c =>
        c.name?.toLowerCase().includes(query.toLowerCase()) ||
        c.phone?.includes(query) ||
        c.email?.toLowerCase().includes(query.toLowerCase())
      )
    : customers

  const handleSelect = (customer) => {
    onSelect(customer)
    setQuery('')
    setOpen(false)
  }

  const handleClear = () => {
    onSelect(null)
    setQuery('')
  }

  if (selected) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex-1 flex items-center gap-2.5 px-3 py-2 rounded-btn border border-green-300 bg-green-50 min-w-0">
          <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center shrink-0">
            <span className="text-[10px] font-bold text-white">{selected.name?.[0]?.toUpperCase()}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-green-800 truncate">{selected.name}</p>
            {selected.phone && (
              <p className="text-[11px] text-green-600 truncate">{selected.phone}</p>
            )}
          </div>
          <button
            onClick={handleClear}
            className="p-1 text-green-400 hover:text-green-700 rounded transition-colors shrink-0"
            title="Changer de client"
          >
            <X size={14} />
          </button>
        </div>
        <button
          onClick={onNew}
          title="Nouveau client"
          className="h-10 w-10 flex items-center justify-center rounded-btn border border-primary-200 bg-primary-50 text-primary-600 hover:bg-primary-100 hover:border-primary-400 transition-colors shrink-0"
        >
          <UserPlus size={16} />
        </button>
      </div>
    )
  }

  return (
    <div ref={wrapRef} className="relative flex items-center gap-2">
      <div className="relative flex-1">
        <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          placeholder="Rechercher un client…"
          className="input-field pl-9 h-10 text-sm w-full"
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setOpen(false) }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-300 hover:text-muted-500"
          >
            <X size={13} />
          </button>
        )}
      </div>

      <button
        onClick={onNew}
        title="Nouveau client"
        className="h-10 w-10 flex items-center justify-center rounded-btn border border-primary-200 bg-primary-50 text-primary-600 hover:bg-primary-100 hover:border-primary-400 transition-colors shrink-0"
      >
        <UserPlus size={16} />
      </button>

      {open && (
        <div className="absolute top-full left-0 right-10 mt-1 bg-white border border-muted-200 rounded-card shadow-xl z-40 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
          <button
            onClick={() => { onSelect(null); setOpen(false); setQuery('') }}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left text-sm text-muted-500 hover:bg-muted-50 border-b border-muted-100 transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-muted-100 flex items-center justify-center shrink-0">
              <User size={13} className="text-muted-400" />
            </div>
            <span className="italic">Client de passage (Anonyme)</span>
          </button>

          <div className="max-h-[200px] overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-4 py-4 text-center text-sm text-muted-400">
                <p>Aucun client trouvé</p>
                <button
                  onClick={() => { setOpen(false); onNew() }}
                  className="mt-1.5 text-xs text-primary-600 font-bold hover:underline"
                >
                  + Créer « {query} »
                </button>
              </div>
            ) : (
              filtered.map(c => (
                <button
                  key={c.id}
                  onClick={() => handleSelect(c)}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-primary-50 transition-colors group"
                >
                  <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center shrink-0 group-hover:bg-primary-200 transition-colors">
                    <span className="text-[11px] font-bold text-primary-600">
                      {c.name?.[0]?.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-navy truncate">{c.name}</p>
                    {(c.phone || c.email) && (
                      <p className="text-[11px] text-muted-400 truncate">{c.phone || c.email}</p>
                    )}
                  </div>
                  {c.balance !== undefined && c.balance > 0 && (
                    <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded shrink-0">
                      Crédit
                    </span>
                  )}
                </button>
              ))
            )}
          </div>

          {filtered.length > 0 && (
            <div className="px-3 py-1.5 bg-muted-50 border-t border-muted-100 text-[11px] text-muted-400">
              {filtered.length} client{filtered.length > 1 ? 's' : ''}
              {query && ` pour « ${query} »`}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Modal création rapide client ─────────────────────────────────────────────
function NewCustomerModal({ onClose, onCreated }) {
  const [form, setForm]     = useState({ name: '', phone: '', email: '' })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) { toast.error('Le nom est requis'); return }
    setSaving(true)
    try {
      const res = await customerService.create({
        name:  form.name.trim(),
        phone: form.phone.trim() || undefined,
        email: form.email.trim() || undefined,
        type:  'individual',
      })
      const customer = res.data?.customer ?? res.customer
      onCreated(customer)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la création')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-navy/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface w-full sm:max-w-sm rounded-t-2xl sm:rounded-modal shadow-2xl overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-muted-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center">
              <UserPlus size={16} className="text-primary-600" />
            </div>
            <div>
              <h3 className="font-display font-bold text-navy text-sm">Nouveau client</h3>
              <p className="text-[11px] text-muted-400">Ajout rapide depuis la caisse</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-muted-400 hover:text-navy hover:bg-muted-100 rounded-btn transition-colors">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3">
          <div>
            <label className="block text-xs font-semibold text-muted-700 uppercase tracking-wide mb-1.5">
              Nom <span className="text-danger">*</span>
            </label>
            <input
              autoFocus
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Nom du client"
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-700 uppercase tracking-wide mb-1.5">
              Téléphone
            </label>
            <div className="relative">
              <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-400" />
              <input
                type="tel"
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="ex: 77 000 00 00"
                className="input-field pl-9"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-700 uppercase tracking-wide mb-1.5">
              Email
            </label>
            <div className="relative">
              <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-400" />
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="email@exemple.com"
                className="input-field pl-9"
              />
            </div>
          </div>
        </form>

        <div className="flex gap-2 px-5 py-4 border-t border-muted-100 bg-muted-50">
          <button type="button" onClick={onClose} className="flex-1 btn-secondary text-sm h-10">
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || !form.name.trim()}
            className="flex-[2] btn-primary text-sm h-10 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
            {saving ? 'Ajout…' : 'Ajouter & Sélectionner'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Modal paiement ────────────────────────────────────────────────────────────
function PaymentModal({ total, onClose, onComplete }) {
  const { format: fmt } = useCurrency()
  const [payments, setPayments] = useState([{ method: 'cash', amount: total, reference: '' }])
  const [loading, setLoading]   = useState(false)
  const [notes, setNotes]       = useState('')

  const totalPaid  = payments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0)
  const change     = Math.max(0, totalPaid - total)
  const remaining  = Math.max(0, total - totalPaid)

  const handleAddPayment = () => {
    if (remaining <= 0) return
    setPayments([...payments, { method: 'wave', amount: remaining, reference: '' }])
  }

  const handleRemovePayment = (index) => {
    setPayments(payments.filter((_, i) => i !== index))
  }

  const updatePayment = (index, field, value) => {
    const updated = [...payments]
    updated[index][field] = value
    setPayments(updated)
  }

  const handleFinish = async (printAfter = false, shareAfter = false) => {
    if (totalPaid < total) {
      toast.error('Le montant total encaissé est insuffisant')
      return
    }
    setLoading(true)
    await onComplete({
      payments: payments.map(p => ({ ...p, amount: Number(p.amount) })),
      notes,
    }, printAfter, shareAfter)
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-navy/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-surface w-full sm:max-w-2xl rounded-t-2xl sm:rounded-modal shadow-2xl overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-200 flex flex-col max-h-[95dvh] sm:max-h-[90vh]">

        {/* Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-muted-300 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-lg sm:text-xl font-display font-bold text-navy">Encaisser la vente</h3>
            <p className="text-xs text-muted-500 mt-0.5">Détail des règlements</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-5 sm:px-6 py-5 sm:py-6 space-y-5 sm:space-y-6">

          {/* Summary Banner */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            <div className="p-3 sm:p-4 bg-navy text-white rounded-card">
              <p className="text-[9px] sm:text-[10px] text-white/50 uppercase font-bold tracking-wider">À payer</p>
              <p className="text-base sm:text-xl font-display font-black">{fmt(total)}</p>
            </div>
            <div className="p-3 sm:p-4 bg-primary-50 border border-primary-100 rounded-card">
              <p className="text-[9px] sm:text-[10px] text-primary-600 uppercase font-bold tracking-wider">Encaissé</p>
              <p className="text-base sm:text-xl font-display font-black text-primary-700">{fmt(totalPaid)}</p>
            </div>
            <div className={cn(
              "p-3 sm:p-4 rounded-card border transition-colors",
              remaining > 0 ? "bg-orange-50 border-orange-100" : "bg-green-50 border-green-100"
            )}>
              <p className={cn("text-[9px] sm:text-[10px] uppercase font-bold tracking-wider", remaining > 0 ? "text-orange-600" : "text-success")}>
                {remaining > 0 ? 'Reste' : 'Monnaie'}
              </p>
              <p className={cn("text-base sm:text-xl font-display font-black", remaining > 0 ? "text-orange-700" : "text-success")}>
                {fmt(remaining > 0 ? remaining : change)}
              </p>
            </div>
          </div>

          {/* Payment Rows */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-muted-700 uppercase tracking-wide">Modes de paiement</label>
            <div className="max-h-[240px] overflow-y-auto pr-1 space-y-3">
              {payments.map((p, index) => (
                <div key={index} className="flex flex-col sm:flex-row items-stretch sm:items-end gap-2 animate-in slide-in-from-top-2">
                  {/* Row header on mobile */}
                  <div className="flex gap-2 sm:contents">
                    <div className="flex-1 sm:flex-1">
                      <select
                        value={p.method}
                        onChange={(e) => updatePayment(index, 'method', e.target.value)}
                        className="input-field h-10 text-sm w-full"
                      >
                        <option value="cash">Espèces</option>
                        <option value="wave">Wave</option>
                        <option value="orange_money">Orange Money</option>
                        <option value="card">Carte Bancaire</option>
                      </select>
                    </div>
                    <div className="w-28 sm:w-32">
                      <input
                        type="number"
                        placeholder="Montant"
                        value={p.amount}
                        onChange={(e) => updatePayment(index, 'amount', e.target.value)}
                        className="input-field h-10 text-sm text-right font-bold w-full"
                      />
                    </div>
                    {payments.length > 1 && (
                      <button
                        onClick={() => handleRemovePayment(index)}
                        className="sm:hidden p-2.5 text-muted-400 hover:text-danger hover:bg-red-50 rounded-btn self-center"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                  <div className="flex gap-2 sm:contents">
                    <div className="flex-1 sm:flex-1">
                      <input
                        type="text"
                        placeholder="Réf. (ex: ID Wave)"
                        value={p.reference}
                        onChange={(e) => updatePayment(index, 'reference', e.target.value)}
                        className="input-field h-10 text-sm w-full"
                      />
                    </div>
                    {payments.length > 1 && (
                      <button
                        onClick={() => handleRemovePayment(index)}
                        className="hidden sm:flex p-2.5 text-muted-400 hover:text-danger hover:bg-red-50 rounded-btn"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {remaining > 0 && (
              <button
                onClick={handleAddPayment}
                className="w-full py-2 border-2 border-dashed border-muted-300 rounded-card text-muted-500 hover:border-primary-400 hover:text-primary-600 transition-all flex items-center justify-center gap-2 text-sm font-bold"
              >
                <Plus size={16} />
                Ajouter un autre mode de paiement
              </button>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-muted-700 uppercase tracking-wide">Notes additionnelles</label>
            <textarea
              rows={2}
              className="input-field text-sm resize-none"
              placeholder="Commentaires sur la vente..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-5 sm:px-6 py-4 bg-muted-50 flex flex-col sm:flex-row gap-2 shrink-0 border-t border-muted-100">
          <button onClick={onClose} className="sm:flex-1 btn-secondary h-11 sm:h-12 text-sm order-last sm:order-first">
            Annuler
          </button>
          <button
            onClick={() => handleFinish(false)}
            disabled={loading || totalPaid < total}
            className="sm:flex-1 btn-secondary h-11 sm:h-12 flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="animate-spin" size={16}/> : <CheckCircle2 size={16}/>}
            Enregistrer
          </button>
          <button
            onClick={() => handleFinish(true)}
            disabled={loading || totalPaid < total}
            className="sm:flex-[2] btn-primary h-11 sm:h-12 flex items-center justify-center gap-2 text-sm shadow-lg shadow-primary-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="animate-spin" size={16}/> : <Printer size={16}/>}
            Enreg. &amp; Imprimer
          </button>
          <button
            onClick={() => handleFinish(false, true)}
            disabled={loading || totalPaid < total}
            className="sm:flex-1 h-11 sm:h-12 flex items-center justify-center gap-2 text-sm rounded-btn border border-green-300 text-green-700 bg-green-50 hover:bg-green-100 font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="animate-spin" size={16}/> : <Share2 size={16}/>}
            Partager
          </button>
        </div>
      </div>
    </div>
  )
}
