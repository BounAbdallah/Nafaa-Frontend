import { useEffect, useState } from 'react'
import { confirmDialog } from '@/utils/confirm'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { bomService } from '@/services/bomService'
import { printBom } from '@/utils/printDocument'
import toast from 'react-hot-toast'
import {
  ChevronLeft, Beaker, Edit2, Trash2, Loader2,
  ClipboardList, Package, Info, CheckCircle2,
  XCircle, ArrowRight, Layers, DollarSign, Activity, Printer
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { useCurrency } from '@/utils/currency'

function InfoRow({ label, value, className }) {
  return (
    <div className="flex items-start justify-between py-3 border-b border-muted-100 last:border-0 gap-3">
      <span className="text-xs font-sans font-semibold text-muted-500 uppercase tracking-wide shrink-0">{label}</span>
      <span className={cn('text-sm font-sans text-navy text-right', className)}>{value ?? '—'}</span>
    </div>
  )
}

export default function BomDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAdmin } = useAuthStore()
  const { format: fmt, currency } = useCurrency()
  const [bom, setBom] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const res = await bomService.getById(id)
      setBom(res.data)
    } catch {
      toast.error('Recette introuvable.')
      navigate('/production/boms')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id])

  const computedTotalCost = (() => {
    if (!bom?.items?.length) return 0
    const raw = bom.items.reduce((sum, it) => {
      const ing = it.ingredient ?? it.material ?? {}
      const cost = Number(ing.cost_price) || 0
      return sum + (Number(it.quantity) || 0) * cost
    }, 0)
    const waste = Number(bom.waste_percentage) || 0
    return raw * (1 + waste / 100)
  })()

  const computedUnitCost = bom?.quantity > 0
    ? computedTotalCost / Number(bom.quantity)
    : 0

  const sellingPrice = Number(bom?.product?.selling_price) || 0
  const unitMargin = sellingPrice - computedUnitCost
  const marginPct = sellingPrice > 0 ? (unitMargin / sellingPrice) * 100 : 0

  const handleDelete = async () => {
    if (!(await confirmDialog({ title: 'Supprimer cette recette ?', text: 'Cette action est irréversible.', confirmText: 'Supprimer' }))) return
    try {
      await bomService.remove(bom.id)
      toast.success('Recette supprimée.')
      navigate('/production/boms')
    } catch { toast.error('Erreur lors de la suppression.') }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={24} className="animate-spin text-primary-500" />
      </div>
    )
  }

  if (!bom) return null

  return (
    <div className="space-y-5 sm:space-y-6 animate-fade-in">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="space-y-1 min-w-0">
          <Link
            to="/production/boms"
            className="inline-flex items-center gap-1.5 text-xs font-sans text-muted-500 hover:text-navy transition-colors print:hidden"
          >
            <ChevronLeft size={14} />Recettes (BOM)
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center shadow-sm shrink-0">
              <Beaker size={22} />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-display font-black text-navy leading-tight truncate">{bom.product?.name}</h1>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="text-xs font-sans text-muted-500">{bom.name || 'Recette standard'}</span>
                <span className={cn(
                  'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider',
                  bom.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                )}>
                  {bom.is_active ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
                  {bom.is_active ? 'Actif' : 'Inactif'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 print:hidden flex-wrap shrink-0">
          <button
            onClick={() => printBom(bom, { computedTotalCost, computedUnitCost, sellingPrice, unitMargin, marginPct, currency })}
            className="btn-secondary flex items-center gap-2 text-sm"
            title="Exporter / Imprimer en PDF"
          >
            <Printer size={14} />
            <span className="hidden sm:inline">PDF</span>
          </button>
          {isAdmin() && (
            <>
              <Link to={`/production/boms/${bom.id}/edit`} className="btn-secondary flex items-center gap-2 text-sm">
                <Edit2 size={14} />
                <span className="hidden sm:inline">Modifier</span>
              </Link>
              <button onClick={handleDelete} className="btn-danger flex items-center gap-2 text-sm">
                <Trash2 size={14} />
                <span className="hidden sm:inline">Supprimer</span>
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-5 sm:space-y-6">

          {/* Fiche Technique */}
          <div className="bg-surface rounded-card border border-muted-300 shadow-sm p-4 sm:p-5">
            <h2 className="font-display font-bold text-navy mb-4 flex items-center gap-2">
              <Info size={18} className="text-primary-500" /> Fiche Technique
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
              <InfoRow label="Produit fini" value={bom.product?.name} />
              <InfoRow label="Quantité de base" value={`${bom.quantity} ${bom.product?.unit}`} />
              <InfoRow label="Taux de perte" value={`${bom.waste_percentage}%`} className="text-danger font-bold" />
              <InfoRow label="Coût de revient théorique" value={fmt(bom.total_cost)} className="text-primary-600 font-bold" />
            </div>
          </div>

          {/* Ingrédients — table on sm+, cards on xs */}
          <div className="bg-surface rounded-card border border-muted-300 shadow-sm overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-muted-300 flex items-center justify-between">
              <h2 className="font-display font-bold text-navy flex items-center gap-2">
                <Layers size={18} className="text-primary-500" /> Ingrédients & Composants
              </h2>
              <span className="text-xs font-bold bg-muted-100 text-muted-600 px-2 py-1 rounded-full">
                {bom.items?.length || 0} éléments
              </span>
            </div>

            {/* Table sm+ */}
            <div className="overflow-x-auto hidden sm:block">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-muted-50/50 border-b border-muted-300">
                    <th className="px-6 py-3 text-[10px] font-bold text-muted-500 uppercase tracking-widest">Matière / Ingrédient</th>
                    <th className="px-6 py-3 text-[10px] font-bold text-muted-500 uppercase tracking-widest text-center">Quantité</th>
                    <th className="px-6 py-3 text-[10px] font-bold text-muted-500 uppercase tracking-widest text-right hidden sm:table-cell">Coût Unit.</th>
                    <th className="px-6 py-3 text-[10px] font-bold text-muted-500 uppercase tracking-widest text-right">Sous-total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-muted-100">
                  {bom.items?.map((item) => {
                    const ing = item.ingredient ?? item.material ?? {}
                    const ingId = item.ingredient_id ?? item.material_id
                    const cost = Number(ing.cost_price) || 0
                    return (
                      <tr key={item.id} className="hover:bg-muted-50/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded bg-muted-100 flex items-center justify-center text-muted-500 text-xs font-bold shrink-0">
                              {ing.name?.[0]}
                            </div>
                            <div>
                              <Link to={`/products/${ingId}`} className="font-bold text-navy hover:text-primary-600 transition-colors">
                                {ing.name ?? '—'}
                              </Link>
                              <div className="text-[10px] text-muted-500">
                                Type : {ing.type_label ?? ing.type ?? '—'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center font-medium text-navy text-sm">
                          {item.quantity} {ing.unit}
                        </td>
                        <td className="px-6 py-4 text-right text-xs text-muted-500 hidden sm:table-cell">
                          {fmt(cost)}
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-navy text-sm">
                          {fmt(item.quantity * cost)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-muted-50/50">
                    <td colSpan="3" className="px-6 py-4 text-right text-xs font-bold uppercase text-muted-500">Total Ingrédients</td>
                    <td className="px-6 py-4 text-right font-black text-primary-600">{fmt(computedTotalCost)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Mobile card list */}
            <div className="sm:hidden divide-y divide-muted-100">
              {bom.items?.map((item) => {
                const ing = item.ingredient ?? item.material ?? {}
                const ingId = item.ingredient_id ?? item.material_id
                const cost = Number(ing.cost_price) || 0
                return (
                  <div key={item.id} className="p-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded bg-muted-100 flex items-center justify-center text-muted-500 text-xs font-bold shrink-0">
                        {ing.name?.[0]}
                      </div>
                      <div className="min-w-0">
                        <Link to={`/products/${ingId}`} className="font-bold text-navy hover:text-primary-600 transition-colors truncate block">
                          {ing.name ?? '—'}
                        </Link>
                        <div className="text-[10px] text-muted-500">{item.quantity} {ing.unit}</div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-bold text-navy text-sm">{fmt(item.quantity * cost)}</div>
                      <div className="text-[10px] text-muted-400">{fmt(cost)}/{ing.unit}</div>
                    </div>
                  </div>
                )
              })}
              <div className="p-4 bg-muted-50/50 flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-muted-500">Total Ingrédients</span>
                <span className="font-black text-primary-600">{fmt(computedTotalCost)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-5 sm:space-y-6">
          {/* Rentabilité */}
          <div className="bg-surface rounded-card border border-muted-300 shadow-sm p-4 sm:p-5">
            <h2 className="font-display font-bold text-navy mb-4 flex items-center gap-2">
              <DollarSign size={18} className="text-primary-500" /> Rentabilité
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <div className="text-xs text-muted-500">Prix de vente cible</div>
                <div className="text-lg font-black text-navy">{fmt(sellingPrice)}</div>
              </div>
              <div className="flex justify-between items-end">
                <div className="text-xs text-muted-500">
                  Coût de fabrication{bom?.waste_percentage > 0 && (
                    <span className="text-[10px] text-muted-400"> (perte {bom.waste_percentage}% incluse)</span>
                  )}
                </div>
                <div className="text-lg font-bold text-danger">{fmt(computedTotalCost)}</div>
              </div>
              <div className="flex justify-between items-end">
                <div className="text-xs text-muted-500">
                  Coût unitaire <span className="text-[10px] text-muted-400">/ {bom.product?.unit ?? 'u'}</span>
                </div>
                <div className="text-sm font-bold text-navy">{fmt(computedUnitCost)}</div>
              </div>
              <div className="pt-4 border-t border-muted-100 flex justify-between items-end">
                <div className="text-xs font-bold text-navy uppercase">
                  Marge brute
                  {sellingPrice > 0 && (
                    <span className={cn(
                      'ml-2 text-[10px] font-bold',
                      marginPct >= 30 ? 'text-success' : marginPct >= 10 ? 'text-warning' : 'text-danger',
                    )}>
                      {marginPct.toFixed(0)} %
                    </span>
                  )}
                </div>
                <div className={cn(
                  'text-xl font-black',
                  unitMargin >= 0 ? 'text-success' : 'text-danger',
                )}>
                  {fmt(unitMargin)}
                </div>
              </div>
            </div>
          </div>

          {/* Actions rapides */}
          <div className="bg-surface rounded-card border border-muted-300 shadow-sm p-4 sm:p-5 print:hidden">
            <h2 className="font-display font-bold text-navy mb-4 flex items-center gap-2">
              <Activity size={18} className="text-primary-500" /> Actions rapides
            </h2>
            <Link
              to="/production/new"
              state={{ productId: bom.product_id }}
              className="w-full btn-primary flex items-center justify-center gap-2 py-3"
            >
              <Package size={18} />
              Lancer une production
            </Link>
            <p className="mt-3 text-[10px] text-muted-500 text-center italic">
              Cette action utilisera cette recette par défaut pour calculer les besoins.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
