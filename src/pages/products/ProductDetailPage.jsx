import { useEffect, useState } from 'react'
import { confirmDialog } from '@/utils/confirm'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { productService } from '@/services/productService'
import { printProduct } from '@/utils/printDocument'
import toast from 'react-hot-toast'
import {
  ChevronLeft, Package, Zap, Edit2, Trash2, Loader2,
  AlertTriangle, TrendingUp, Tag, Layers, Hash,
  Calendar, RefreshCw, CheckCircle2, XCircle,
  BarChart2, ShoppingCart, Printer, Truck, Factory,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { cn } from '@/utils/cn'
import ProductModal from './ProductModal'
import { useCurrency } from '@/utils/currency'

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
      <p className={cn('text-xl sm:text-2xl font-display font-bold', color ?? 'text-navy')}>{value}</p>
      {sub && <p className="text-[11px] text-muted-400 font-sans">{sub}</p>}
      <p className="text-xs text-muted-500 font-sans">{label}</p>
    </div>
  )
}

export default function ProductDetailPage() {
  const { id }    = useParams()
  const navigate  = useNavigate()
  const { can }   = useAuthStore()
  const { format: fmt } = useCurrency()
  const [product, setProduct] = useState(null)
  const [stats, setStats]     = useState(null)
  const [chartReady, setChartReady] = useState(false)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [meta, setMeta]       = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const productRes = await productService.getOne(id)
      setProduct(productRes.data.product)
    } catch {
      toast.error('Produit introuvable.')
      navigate('/products')
      setLoading(false)
      return
    }
    setLoading(false)
    // Stats chargées séparément — une erreur ici ne redirige pas
    productService.getStats(id)
      .then(statsRes => setStats(statsRes.data))
      .catch(() => {})
  }

  useEffect(() => {
    load()
    productService.getMeta()
      .then(r => setMeta(r.data))
      .catch(() => {})
  }, [id])

  // Différer le rendu du chart d'un tick pour que le DOM soit peint avant
  // que ResizeObserver mesure le conteneur (évite le warning width/height -1)
  useEffect(() => {
    if (!stats?.chart_data) return
    setChartReady(false)
    const t = setTimeout(() => setChartReady(true), 0)
    return () => clearTimeout(t)
  }, [stats])

  const handleDelete = async () => {
    if (!(await confirmDialog({ title: `Supprimer "${product.name}" ?`, text: 'Cette action est irréversible.', confirmText: 'Supprimer' }))) return
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
    <div className="space-y-4 sm:space-y-5">

      {/* Breadcrumb + header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="space-y-1 min-w-0">
          <Link
            to="/products"
            className="inline-flex items-center gap-1.5 text-xs font-sans text-muted-500 hover:text-navy transition-colors print:hidden"
          >
            <ChevronLeft size={14} />Produits
          </Link>
          <div className="flex items-center gap-3 flex-wrap">
            <div className={cn(
              'w-10 h-10 rounded-card flex items-center justify-center flex-shrink-0 overflow-hidden',
              isService ? 'bg-violet-100 text-violet-500' : 'bg-primary-50 text-primary-500'
            )}>
              {product.image ? (
                <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                isService ? <Zap size={20} /> :
                product.type === 'material' ? <Package size={20} className="text-orange-500" /> :
                <Package size={20} />
              )}
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-display font-bold text-navy leading-tight">{product.name}</h1>
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
                  {product.type === 'material' ? 'Matière Première' : product.type_label}
                </span>
                <span className={cn(
                  'inline-flex items-center gap-1 text-xs font-sans font-semibold px-2 py-0.5 rounded-badge',
                  product.is_active ? 'bg-green-50 text-success' : 'bg-muted-100 text-muted-500'
                )}>
                  {product.is_active ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
                  {product.is_active ? 'Actif' : 'Inactif'}
                </span>
                {product.stock_quantity <= 0 && product.type !== 'service' && (
                  <span className="inline-flex items-center gap-1 text-xs font-sans font-semibold px-2 py-0.5 rounded-badge bg-red-100 text-red-700">
                    <AlertTriangle size={10} />Rupture de stock
                  </span>
                )}
                {product.stock_quantity > 0 && product.is_low_stock && (
                  <span className="inline-flex items-center gap-1 text-xs font-sans font-semibold px-2 py-0.5 rounded-badge bg-amber-100 text-amber-700">
                    <AlertTriangle size={10} />Stock bas
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons — always visible, icon-only on mobile */}
        <div className="flex gap-2 flex-shrink-0 print:hidden">
          <button onClick={() => load()} className="btn-secondary p-2.5" title="Rafraîchir">
            <RefreshCw size={15} />
          </button>
          <button
            onClick={() => printProduct(product, { fmt })}
            className="btn-secondary p-2.5 sm:px-3 sm:gap-2 flex items-center"
            title="Exporter / Imprimer en PDF"
          >
            <Printer size={14} />
            <span className="hidden sm:inline">PDF</span>
          </button>
          {can('products', 'edit') && (
            <button onClick={() => setEditing(true)} className="btn-secondary p-2.5 sm:px-3 sm:gap-2 flex items-center">
              <Edit2 size={14} />
              <span className="hidden sm:inline">Modifier</span>
            </button>
          )}
          {can('products', 'delete') && (
            <button onClick={handleDelete} className="btn-danger p-2.5 sm:px-3 sm:gap-2 flex items-center">
              <Trash2 size={14} />
              <span className="hidden sm:inline">Supprimer</span>
            </button>
          )}
        </div>
      </div>

      {/* Stats financières */}
      <div className={cn('grid gap-3 sm:gap-4', isService ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6')}>
        <StatBox
          label="Prix de vente"
          value={fmt(product.selling_price)}
          sub={`/ ${product.unit}`}
          color="text-navy"
        />
        <StatBox
          label="Prix de revient"
          value={fmt(product.cost_price)}
          sub={`/ ${product.unit}`}
          color="text-muted-600"
        />
        {(product.type === 'product' || product.type === 'material') && (
          <StatBox
            label="Stock actuel"
            value={`${product.stock_quantity} ${product.unit}`}
            sub={`Alerte à ${product.stock_alert} ${product.unit}`}
            color={product.stock_quantity <= 0 ? 'text-red-600' : product.is_low_stock ? 'text-amber-600' : 'text-success'}
          />
        )}
        <StatBox
          label="Chiffre d'affaires"
          value={stats ? fmt(stats.total_revenue) : '...'}
          sub={stats ? `${stats.total_qty_sold ?? 0} ${product.unit} vendus` : 'Ventes globales'}
          color="text-primary-600"
        />
        <StatBox
          label="Coût des ventes"
          value={stats ? fmt(stats.total_expenses) : '...'}
          sub={`Prix revient × qté vendue`}
          color="text-amber-600"
        />
        <StatBox
          label="Bénéfice brut"
          value={stats ? fmt(stats.profit) : '...'}
          sub="CA − Coût des ventes"
          color={!stats ? 'text-navy' : stats.profit >= 0 ? 'text-success' : 'text-danger'}
        />
      </div>

      {/* Corps principal */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Informations */}
        <div className="md:col-span-2 space-y-4">
          <div className="card p-4 sm:p-5">
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
          <div className="card p-4 sm:p-5">
            <h2 className="font-display font-semibold text-navy mb-3 flex items-center gap-2">
              <Tag size={15} className="text-muted-400" />Description
            </h2>
            {product.description
              ? <p className="text-sm font-sans text-muted-700 leading-relaxed whitespace-pre-line">{product.description}</p>
              : <p className="text-sm font-sans text-muted-400 italic">Aucune description renseignée.</p>
            }
          </div>

          {/* Stock (produit physique ou matière) */}
          {(product.type === 'product' || product.type === 'material') && (
            <div className="card p-4 sm:p-5">
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
                      className={cn(
                        'h-full rounded-full transition-all',
                        product.stock_quantity <= 0
                          ? 'bg-red-500'
                          : product.is_low_stock
                            ? 'bg-amber-400'
                            : 'bg-success'
                      )}
                      style={{ width: `${Math.min(100, product.stock_alert > 0 ? (product.stock_quantity / (product.stock_alert * 4)) * 100 : product.stock_quantity > 0 ? 100 : 0)}%` }}
                    />
                  </div>
                </div>
                <InfoRow label="Seuil d'alerte" value={`${product.stock_alert} ${product.unit}`} />
                {product.stock_quantity <= 0 && (
                  <div className="flex items-center gap-2 p-3 rounded-card bg-red-50 border border-red-200">
                    <AlertTriangle size={14} className="text-red-600 flex-shrink-0" />
                    <p className="text-xs font-sans text-red-700 font-semibold">
                      Rupture de stock — ce produit n'est plus disponible.
                    </p>
                  </div>
                )}
                {product.stock_quantity > 0 && product.is_low_stock && (
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
          <div className="card p-4 sm:p-5">
            <h2 className="font-display font-semibold text-navy mb-3 flex items-center gap-2">
              <TrendingUp size={15} className="text-muted-400" />Rentabilité
            </h2>
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-sans">
                <span className="text-muted-500">Marge unitaire</span>
                <span className={cn('font-bold', marginColor)}>
                  {fmt((product.selling_price ?? 0) - (product.cost_price ?? 0))}
                </span>
              </div>
              <div className="h-1.5 bg-muted-100 rounded-full overflow-hidden mt-1">
                <div
                  className={cn('h-full rounded-full', product.margin >= 30 ? 'bg-success' : product.margin >= 10 ? 'bg-warning' : 'bg-danger')}
                  style={{ width: `${Math.min(100, product.margin)}%` }}
                />
              </div>
              <p className="text-[11px] text-muted-400 font-sans mt-1">
                {product.margin >= 30 ? 'Excellente marge' : product.margin >= 10 ? 'Marge correcte' : 'Marge faible — vérifiez vos coûts'} ({product.margin}%)
              </p>
            </div>
          </div>

          {/* Prix d'achat / Coût de production */}
          {(product.pricing?.last_purchase_price != null || product.pricing?.last_production_unit_cost != null || product.pricing?.has_bom) && (
            <div className="card p-4 sm:p-5">
              <h2 className="font-display font-semibold text-navy mb-3 flex items-center gap-2">
                {product.pricing?.has_bom
                  ? <><Factory size={15} className="text-muted-400" />Coût de production</>
                  : <><Truck size={15} className="text-muted-400" />Prix d'achat</>
                }
              </h2>
              <div className="space-y-2">
                {product.pricing?.has_bom ? (
                  <>
                    {product.pricing?.last_production_unit_cost != null ? (
                      <>
                        <div className="flex justify-between text-xs font-sans">
                          <span className="text-muted-500">Coût unitaire (dernière prod.)</span>
                          <span className="font-bold text-navy">
                            {fmt(product.pricing.last_production_unit_cost)}
                          </span>
                        </div>
                        {product.pricing?.last_production_date && (
                          <p className="text-[11px] text-muted-400 font-sans">
                            Production du {new Date(product.pricing.last_production_date).toLocaleDateString('fr-FR')}
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="text-xs text-muted-400 font-sans">Aucune production complétée</p>
                    )}
                  </>
                ) : (
                  <>
                    {product.pricing?.last_purchase_price != null ? (
                      <>
                        <div className="flex justify-between text-xs font-sans">
                          <span className="text-muted-500">Dernier prix d'achat</span>
                          <span className="font-bold text-navy">
                            {fmt(product.pricing.last_purchase_price)}
                          </span>
                        </div>
                        {product.pricing?.last_purchase_date && (
                          <p className="text-[11px] text-muted-400 font-sans">
                            Commande du {new Date(product.pricing.last_purchase_date).toLocaleDateString('fr-FR')}
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="text-xs text-muted-400 font-sans">Aucun achat enregistré</p>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Evolution financiere */}
          <div className="card p-4 sm:p-5 print:hidden">
            <h2 className="font-display font-semibold text-navy mb-3 flex items-center gap-2">
              <BarChart2 size={15} className="text-muted-400" />Évolution financière
            </h2>
            <div className="h-48 mt-4">
              {chartReady && stats?.chart_data ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                  <BarChart data={stats.chart_data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} tickFormatter={(val) => val > 1000 ? `${(val/1000).toFixed(1)}k` : val} />
                    <Tooltip
                      formatter={(value) => [fmt(value)]}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      labelStyle={{ fontWeight: 'bold', color: '#1E293B', marginBottom: '4px' }}
                    />
                    <Bar dataKey="Revenus" fill="#3B82F6" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="Coût" fill="#F59E0B" radius={[2, 2, 0, 0]} />
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
          <div className="card p-4 sm:p-5">
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
