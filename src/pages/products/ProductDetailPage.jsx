import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { productService } from '@/services/productService'
import toast from 'react-hot-toast'
import {
  ChevronLeft, Package, Zap, Edit2, Trash2, Loader2,
  AlertTriangle, TrendingUp, Tag, Layers, Hash,
  Calendar, RefreshCw, CheckCircle2, XCircle,
  BarChart2, ShoppingCart,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { cn } from '@/utils/cn'
import ProductModal from './ProductModal'

const fmt     = (n) => new Intl.NumberFormat('fr-FR').format(n ?? 0) + ' FCFA'
const fmtDate = (iso) => new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })

function InfoRow({ label, value, className }) {
  return (
    <div className="flex items-start justify-between py-3 border-b border-muted-100 last:border-0">
      <span className="text-xs font-sans font-semibold text-muted-500 uppercase tracking-wide">{label}</span>
      <span className={cn('text-sm font-sans text-navy text-right max-w-[60%]', className)}>{value ?? '—'}</span>
    </div>
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

export default function ProductDetailPage() {
  const { id }    = useParams()
  const navigate  = useNavigate()
  const [product, setProduct] = useState(null)
  const [stats, setStats]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [meta, setMeta]       = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const [productRes, statsRes] = await Promise.all([
        productService.getOne(id),
        productService.getStats(id)
      ])
      setProduct(productRes.data.product)
      setStats(statsRes.data)
    } catch {
      toast.error('Produit introuvable.')
      navigate('/products')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    productService.getMeta()
      .then(r => setMeta(r.data))
      .catch(() => {})
  }, [id])

  const handleDelete = async () => {
    if (!window.confirm(`Supprimer "${product.name}" définitivement ?`)) return
    try {
      await productService.remove(product.id)
      toast.success('Produit supprimé.')
      navigate('/products')
    } catch { toast.error('Erreur lors de la suppression.') }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={24} className="animate-spin text-primary-500" />
      </div>
    )
  }

  if (!product) return null

  const isService = product.type === 'service'
  const marginColor = product.margin >= 30 ? 'text-success' : product.margin >= 10 ? 'text-warning' : 'text-danger'

  return (
    <div className="space-y-5">

      {/* Breadcrumb + header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <Link
            to="/products"
            className="inline-flex items-center gap-1.5 text-xs font-sans text-muted-500 hover:text-navy transition-colors"
          >
            <ChevronLeft size={14} />Produits & Services
          </Link>
          <div className="flex items-center gap-3 flex-wrap">
            <div className={cn(
              'w-10 h-10 rounded-card flex items-center justify-center flex-shrink-0 overflow-hidden',
              isService ? 'bg-violet-100 text-violet-500' : 'bg-primary-50 text-primary-500'
            )}>
              {product.image ? (
                <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                isService ? <Zap size={20} /> : <Package size={20} />
              )}
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-navy leading-tight">{product.name}</h1>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                {product.sku && (
                  <span className="text-xs font-sans text-muted-500 flex items-center gap-1">
                    <Hash size={10} />SKU: {product.sku}
                  </span>
                )}
                <span className={cn(
                  'inline-flex items-center gap-1 text-xs font-sans font-semibold px-2 py-0.5 rounded-badge',
                  isService ? 'bg-violet-100 text-violet-600' : 'bg-primary-50 text-primary-600'
                )}>
                  {isService ? <Zap size={10} /> : <Package size={10} />}
                  {product.type_label}
                </span>
                <span className={cn(
                  'inline-flex items-center gap-1 text-xs font-sans font-semibold px-2 py-0.5 rounded-badge',
                  product.is_active ? 'bg-green-50 text-success' : 'bg-muted-100 text-muted-500'
                )}>
                  {product.is_active ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
                  {product.is_active ? 'Actif' : 'Inactif'}
                </span>
                {product.is_low_stock && (
                  <span className="inline-flex items-center gap-1 text-xs font-sans font-semibold px-2 py-0.5 rounded-badge bg-amber-50 text-amber-700">
                    <AlertTriangle size={10} />Stock bas
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button onClick={() => load()} className="btn-secondary p-2.5" title="Rafraîchir">
            <RefreshCw size={15} />
          </button>
          <button onClick={() => setEditing(true)} className="btn-secondary flex items-center gap-2">
            <Edit2 size={14} />Modifier
          </button>
          <button onClick={handleDelete} className="btn-danger flex items-center gap-2">
            <Trash2 size={14} />Supprimer
          </button>
        </div>
      </div>

      {/* Stats financières */}
      <div className={cn('grid gap-4', isService ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-2 sm:grid-cols-5')}>
        <StatBox
          label="Prix de vente"
          value={fmt(product.selling_price)}
          sub={`/ ${product.unit}`}
          color="text-navy"
        />
        {!isService && (
          <StatBox
            label="Stock actuel"
            value={`${product.stock_quantity} ${product.unit}`}
            sub={`Alerte à ${product.stock_alert} ${product.unit}`}
            color={product.is_low_stock ? 'text-amber-600' : 'text-success'}
          />
        )}
        <StatBox
          label="Chiffre d'affaires"
          value={stats ? fmt(stats.total_revenue) : '...'}
          sub="Ventes globales"
          color="text-primary-600"
        />
        <StatBox
          label="Dépenses totales"
          value={stats ? fmt(stats.total_expenses) : '...'}
          sub="Achats fournisseurs"
          color="text-danger"
        />
        <StatBox
          label="Bénéfice net"
          value={stats ? fmt(stats.profit) : '...'}
          sub="CA - Dépenses"
          color={stats?.profit >= 0 ? 'text-success' : 'text-danger'}
        />
      </div>

      {/* Corps principal */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Informations */}
        <div className="md:col-span-2 space-y-4">
          <div className="card p-5">
            <h2 className="font-display font-semibold text-navy mb-1 flex items-center gap-2">
              <Layers size={15} className="text-muted-400" />Informations générales
            </h2>
            <div className="mt-3">
              <InfoRow label="Nom"        value={product.name} />
              <InfoRow label="Type"       value={product.type_label} />
              <InfoRow label="Catégorie"  value={product.category_label || '—'} />
              <InfoRow label="Unité"      value={product.unit} />
              {product.sku && <InfoRow label="SKU / Référence" value={product.sku} />}
            </div>
          </div>

          {/* Description */}
          <div className="card p-5">
            <h2 className="font-display font-semibold text-navy mb-3 flex items-center gap-2">
              <Tag size={15} className="text-muted-400" />Description
            </h2>
            {product.description
              ? <p className="text-sm font-sans text-muted-700 leading-relaxed whitespace-pre-line">{product.description}</p>
              : <p className="text-sm font-sans text-muted-400 italic">Aucune description renseignée.</p>
            }
          </div>

          {/* Stock (produit physique uniquement) */}
          {!isService && (
            <div className="card p-5">
              <h2 className="font-display font-semibold text-navy mb-3 flex items-center gap-2">
                <BarChart2 size={15} className="text-muted-400" />Gestion du stock
              </h2>
              <div className="space-y-3">
                {/* Barre de stock */}
                <div>
                  <div className="flex justify-between text-xs font-sans text-muted-500 mb-1.5">
                    <span>Stock disponible</span>
                    <span className="font-semibold text-navy">{product.stock_quantity} {product.unit}</span>
                  </div>
                  <div className="h-2 bg-muted-100 rounded-full overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all', product.is_low_stock ? 'bg-amber-400' : 'bg-success')}
                      style={{ width: `${Math.min(100, product.stock_alert > 0 ? (product.stock_quantity / (product.stock_alert * 4)) * 100 : 100)}%` }}
                    />
                  </div>
                </div>
                <InfoRow label="Seuil d'alerte" value={`${product.stock_alert} ${product.unit}`} />
                {product.is_low_stock && (
                  <div className="flex items-center gap-2 p-3 rounded-card bg-amber-50 border border-amber-200">
                    <AlertTriangle size={14} className="text-amber-600 flex-shrink-0" />
                    <p className="text-xs font-sans text-amber-700">
                      Stock en dessous du seuil d'alerte. Pensez à réapprovisionner.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">

          {/* Rentabilité */}
          <div className="card p-5">
            <h2 className="font-display font-semibold text-navy mb-3 flex items-center gap-2">
              <TrendingUp size={15} className="text-muted-400" />Rentabilité
            </h2>
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-sans">
                <span className="text-muted-500">Marge</span>
                <span className={cn('font-bold', marginColor)}>{product.margin}%</span>
              </div>
              <div className="h-1.5 bg-muted-100 rounded-full overflow-hidden">
                <div
                  className={cn('h-full rounded-full', product.margin >= 30 ? 'bg-success' : product.margin >= 10 ? 'bg-warning' : 'bg-danger')}
                  style={{ width: `${Math.min(100, product.margin)}%` }}
                />
              </div>
              <p className="text-[11px] text-muted-400 font-sans mt-1">
                {product.margin >= 30 ? 'Excellente marge' : product.margin >= 10 ? 'Marge correcte' : 'Marge faible — vérifiez vos coûts'}
              </p>
            </div>
          </div>

          {/* Evolution financiere */}
          <div className="card p-5">
            <h2 className="font-display font-semibold text-navy mb-3 flex items-center gap-2">
              <BarChart2 size={15} className="text-muted-400" />Évolution financière
            </h2>
            <div className="h-48 mt-4">
              {stats?.chart_data ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.chart_data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} tickFormatter={(val) => val > 1000 ? `${(val/1000).toFixed(1)}k` : val} />
                    <Tooltip 
                      formatter={(value) => [`${value} FCFA`]}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      labelStyle={{ fontWeight: 'bold', color: '#1E293B', marginBottom: '4px' }}
                    />
                    <Bar dataKey="Revenus" fill="#3B82F6" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="Dépenses" fill="#EF4444" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <Loader2 size={24} className="animate-spin text-muted-300" />
                </div>
              )}
            </div>
          </div>

          {/* Métadonnées */}
          <div className="card p-5">
            <h2 className="font-display font-semibold text-navy mb-3 flex items-center gap-2">
              <Calendar size={15} className="text-muted-400" />Métadonnées
            </h2>
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-sans">
                <span className="text-muted-500">Créé le</span>
                <span className="text-navy">{fmtDate(product.created_at)}</span>
              </div>
              <div className="flex justify-between text-xs font-sans">
                <span className="text-muted-500">Modifié le</span>
                <span className="text-navy">{fmtDate(product.updated_at)}</span>
              </div>
              <div className="flex justify-between text-xs font-sans">
                <span className="text-muted-500">ID interne</span>
                <span className="text-muted-400 font-mono">#{product.id}</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Modal edit */}
      {editing && (
        <ProductModal
          product={product}
          meta={meta}
          onClose={() => setEditing(false)}
          onSaved={() => { setEditing(false); load() }}
        />
      )}
    </div>
  )
}
