import { useState, useEffect, useCallback } from 'react'
import { productService } from '@/services/productService'
import { orderService } from '@/services/orderService'
import { customerService } from '@/services/customerService'
import toast from 'react-hot-toast'
import { 
  Search, ShoppingCart, Trash2, Plus, Minus, User, 
  CreditCard, Banknote, Smartphone, X, Loader2,
  Package, CheckCircle2, ChevronRight, Info
} from 'lucide-react'
import { cn } from '@/utils/cn'

const fmt = (n) => new Intl.NumberFormat('fr-FR').format(n ?? 0) + ' FCFA'

export default function POSPage() {
  const [products, setProducts]   = useState([])
  const [customers, setCustomers] = useState([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [cart, setCart]           = useState([])
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [showPayment, setShowPayment] = useState(false)
  
  // Stats
  const subtotal = cart.reduce((acc, item) => acc + (item.selling_price * item.quantity), 0)
  const total    = subtotal // On peut ajouter taxes/remises plus tard

  useEffect(() => {
    Promise.all([
      productService.getAll({ per_page: 50 }),
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

  const handleCompleteSale = async (paymentData) => {
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
      
      await orderService.create(payload)
      toast.success('Vente terminée !')
      setCart([])
      setSelectedCustomer(null)
      setShowPayment(false)
      
      // Refresh products stock
      const prodRes = await productService.getAll({ per_page: 50 })
      setProducts(prodRes.data.products)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la vente')
    }
  }

  return (
    <div className="h-[calc(100vh-120px)] flex gap-6 overflow-hidden">
      
      {/* ── Liste Produits ── */}
      <div className="flex-1 flex flex-col min-w-0 bg-surface rounded-card shadow-card border border-muted-300">
        {/* Header Produits */}
        <div className="p-4 border-b border-muted-300 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-display font-bold text-navy">Point de Vente</h2>
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-500" />
              <input 
                type="text" 
                placeholder="Rechercher un produit..." 
                className="input-field pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Grille */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-40 bg-muted-100 animate-pulse rounded-card" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
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
                      <Package className="w-10 h-10 text-muted-300" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-sans font-bold text-navy line-clamp-1">{product.name}</p>
                    <p className="text-xs text-muted-500">{product.category_name}</p>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-sm font-display font-black text-primary-600">{fmt(product.selling_price)}</p>
                      <span className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded-badge font-bold",
                        product.stock_quantity < 5 ? "bg-red-50 text-danger" : "bg-green-50 text-success"
                      )}>
                        {product.stock_quantity} en stock
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Panier & Paiement ── */}
      <div className="w-[400px] flex flex-col bg-surface rounded-card shadow-card border border-muted-300 overflow-hidden">
        <div className="p-4 border-b border-muted-300 flex items-center gap-2.5">
          <div className="p-2 bg-primary-50 rounded-lg">
            <ShoppingCart className="w-5 h-5 text-primary-600" />
          </div>
          <h2 className="text-lg font-display font-bold text-navy">Panier actuel</h2>
          <span className="ml-auto px-2 py-0.5 bg-muted-100 rounded-badge text-xs font-bold text-muted-600">
            {cart.length} articles
          </span>
        </div>

        {/* Client Selection */}
        <div className="px-4 py-3 border-b border-muted-300 bg-muted-50/50">
          <div className="relative group">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-400 group-focus-within:text-primary-500" />
            <select 
              className="input-field pl-10 h-10 text-sm bg-surface"
              value={selectedCustomer?.id || ''}
              onChange={(e) => {
                const c = customers.find(cust => cust.id === Number(e.target.value))
                setSelectedCustomer(c || null)
              }}
            >
              <option value="">Client de passage (Anonyme)</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Liste Cart */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-40">
              <div className="w-16 h-16 rounded-full bg-muted-100 flex items-center justify-center mb-4">
                <ShoppingCart className="w-8 h-8" />
              </div>
              <p className="text-sm font-sans">Le panier est vide.<br/>Sélectionnez des produits à gauche.</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex gap-3 group animate-in fade-in slide-in-from-right-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-sans font-semibold text-navy truncate">{item.name}</p>
                  <p className="text-xs text-primary-500 font-bold mt-0.5">{fmt(item.selling_price)}</p>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center bg-bg rounded-btn border border-muted-300 p-0.5">
                    <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:text-primary-600"><Minus size={12}/></button>
                    <span className="w-8 text-center text-xs font-bold">{item.quantity}</span>
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
        <div className="p-6 bg-navy text-white rounded-t-3xl shadow-2xl">
          <div className="space-y-2 mb-6">
            <div className="flex justify-between text-sm text-white/60">
              <span>Sous-total</span>
              <span>{fmt(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-white/60">
              <span>Remise</span>
              <span>0 FCFA</span>
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
      </div>

      {/* ── Modal de Paiement ── */}
      {showPayment && (
        <PaymentModal 
          total={total} 
          onClose={() => setShowPayment(false)} 
          onComplete={handleCompleteSale}
        />
      )}

    </div>
  )
}

function PaymentModal({ total, onClose, onComplete }) {
  const [payments, setPayments] = useState([{ method: 'cash', amount: total, reference: '' }])
  const [loading, setLoading]   = useState(false)
  const [notes, setNotes]       = useState('')
  
  const totalPaid = payments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0)
  const change    = Math.max(0, totalPaid - total)
  const remaining = Math.max(0, total - totalPaid)

  const handleAddPayment = () => {
    if (remaining <= 0) return
    setPayments([...payments, { method: 'wave', amount: remaining, reference: '' }])
  }

  const handleRemovePayment = (index) => {
    setPayments(payments.filter((_, i) => i !== index))
  }

  const updatePayment = (index, field, value) => {
    const newPayments = [...payments]
    newPayments[index][field] = value
    setPayments(newPayments)
  }

  const handleFinish = async () => {
    if (totalPaid < total) {
      toast.error('Le montant total encaissé est insuffisant')
      return
    }
    setLoading(true)
    await onComplete({ 
      payments: payments.map(p => ({ ...p, amount: Number(p.amount) })), 
      notes 
    })
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-surface w-full max-w-2xl rounded-modal shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-muted-300 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-display font-bold text-navy">Encaisser la vente</h3>
            <p className="text-xs text-muted-500 mt-0.5">Détail des règlements</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Summary Banner */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-navy text-white rounded-card">
              <p className="text-[10px] text-white/50 uppercase font-bold tracking-wider">À payer</p>
              <p className="text-xl font-display font-black">{fmt(total)}</p>
            </div>
            <div className="p-4 bg-primary-50 border border-primary-100 rounded-card">
              <p className="text-[10px] text-primary-600 uppercase font-bold tracking-wider">Déjà encaissé</p>
              <p className="text-xl font-display font-black text-primary-700">{fmt(totalPaid)}</p>
            </div>
            <div className={cn(
              "p-4 rounded-card border transition-colors",
              remaining > 0 ? "bg-orange-50 border-orange-100" : "bg-green-50 border-green-100"
            )}>
              <p className={cn("text-[10px] uppercase font-bold tracking-wider", remaining > 0 ? "text-orange-600" : "text-success")}>
                {remaining > 0 ? 'Reste à percevoir' : 'Rendu monnaie'}
              </p>
              <p className={cn("text-xl font-display font-black", remaining > 0 ? "text-orange-700" : "text-success")}>
                {fmt(remaining > 0 ? remaining : change)}
              </p>
            </div>
          </div>

          {/* Payment Rows */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-muted-700 uppercase tracking-wide">Modes de paiement</label>
            <div className="max-h-[250px] overflow-y-auto pr-2 space-y-3">
              {payments.map((p, index) => (
                <div key={index} className="flex items-end gap-3 animate-in slide-in-from-top-2">
                  <div className="flex-1 space-y-1.5">
                    <select 
                      value={p.method}
                      onChange={(e) => updatePayment(index, 'method', e.target.value)}
                      className="input-field h-10 text-sm"
                    >
                      <option value="cash">Espèces</option>
                      <option value="wave">Wave</option>
                      <option value="orange_money">Orange Money</option>
                      <option value="card">Carte Bancaire</option>
                    </select>
                  </div>
                  <div className="w-32 space-y-1.5">
                    <input 
                      type="number"
                      placeholder="Montant"
                      value={p.amount}
                      onChange={(e) => updatePayment(index, 'amount', e.target.value)}
                      className="input-field h-10 text-sm text-right font-bold"
                    />
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <input 
                      type="text"
                      placeholder="Réf. (ex: ID Wave)"
                      value={p.reference}
                      onChange={(e) => updatePayment(index, 'reference', e.target.value)}
                      className="input-field h-10 text-sm"
                    />
                  </div>
                  {payments.length > 1 && (
                    <button 
                      onClick={() => handleRemovePayment(index)}
                      className="p-2.5 text-muted-400 hover:text-danger hover:bg-red-50 rounded-btn mb-0.5"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
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

        <div className="p-6 bg-muted-50 flex gap-4">
          <button onClick={onClose} className="flex-1 btn-secondary h-12">Annuler</button>
          <button 
            onClick={handleFinish}
            disabled={loading || totalPaid < total}
            className="flex-[2] btn-primary h-12 flex items-center justify-center gap-2 shadow-lg shadow-primary-500/20"
          >
            {loading ? <Loader2 className="animate-spin" size={18}/> : <CheckCircle2 size={18}/>}
            Confirmer la vente ({fmt(totalPaid)})
          </button>
        </div>
      </div>
    </div>
  )
}
