import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { productionService } from '@/services/productionService'
import { bomService } from '@/services/bomService'
import toast from 'react-hot-toast'
import { 
  Play, Save, X, Loader2, ArrowLeft, Activity, 
  AlertTriangle, CheckCircle2, Info, ShoppingCart
} from 'lucide-react'
import { cn } from '@/utils/cn'

export default function ProductionNewPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [meta, setMeta] = useState({ boms: [] })
  
  const [formData, setFormData] = useState({
    product_id: '',
    bom_id: '',
    planned_quantity: 1,
    batch_number: ''
  })

  const [availability, setAvailability] = useState(null)
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const res = await bomService.getAll()
        setMeta({ boms: res.data || [] })
      } catch (err) {
        toast.error('Erreur lors du chargement des recettes')
      } finally {
        setLoading(false)
      }
    }
    fetchMeta()
  }, [])

  const handleBomChange = (bomId) => {
    const bom = meta.boms.find(b => b.id === Number(bomId))
    setFormData({
      ...formData,
      bom_id: bomId,
      product_id: bom ? bom.product_id : '',
      planned_quantity: bom ? bom.quantity : 1
    })
    setAvailability(null)
  }

  const checkStock = async () => {
    if (!formData.bom_id || !formData.planned_quantity) return
    setChecking(true)
    try {
      const res = await productionService.checkAvailability(formData.bom_id, formData.planned_quantity)
      setAvailability(res.data)
    } catch (err) {
      toast.error('Erreur lors de la vérification des stocks')
    } finally {
      setChecking(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.bom_id || !formData.planned_quantity) return
    
    setSubmitting(true)
    try {
      const res = await productionService.create(formData)
      toast.success('Ordre de production créé')
      navigate(`/production/${res.data.id}`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la création')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="flex justify-center py-24"><Loader2 className="w-10 h-10 animate-spin text-primary-500" /></div>
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-12">
      <div className="flex items-center gap-4">
        <Link to="/production" className="p-2 text-muted-500 hover:text-navy hover:bg-surface rounded-btn border border-transparent hover:border-muted-300 transition-all">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-display font-black text-navy tracking-tight">Lancer une Production</h1>
          <p className="text-muted-500 text-sm">Sélectionnez un produit et vérifiez la disponibilité des matières.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Formulaire */}
        <div className="bg-surface rounded-card shadow-card border border-muted-300 p-6 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-700 uppercase tracking-wide">Recette de Fabrication (BOM) *</label>
              <select 
                value={formData.bom_id}
                onChange={(e) => handleBomChange(e.target.value)}
                className="input-field appearance-none"
                required
              >
                <option value="">Sélectionner une recette</option>
                {meta.boms.filter(b => b.is_active).map(b => (
                  <option key={b.id} value={b.id}>{b.product?.name} ({b.name || 'Standard'})</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-700 uppercase tracking-wide">Quantité à produire *</label>
              <input 
                type="number" 
                step="0.001"
                value={formData.planned_quantity}
                onChange={(e) => { setFormData({ ...formData, planned_quantity: e.target.value }); setAvailability(null); }}
                className="input-field font-bold text-navy"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-700 uppercase tracking-wide">Numéro de lot (Optionnel)</label>
              <input 
                placeholder="Ex: LOT-2026-001"
                value={formData.batch_number}
                onChange={(e) => setFormData({ ...formData, batch_number: e.target.value })}
                className="input-field"
              />
              <p className="text-[10px] text-muted-500 italic">Si vide, un numéro sera généré automatiquement.</p>
            </div>

            <div className="pt-4 flex flex-col gap-3">
              <button 
                type="button" 
                onClick={checkStock}
                disabled={!formData.bom_id || checking}
                className="w-full btn-secondary py-3 flex items-center justify-center gap-2"
              >
                {checking ? <Loader2 className="w-5 h-5 animate-spin" /> : <Activity size={18} />}
                <span>Vérifier la disponibilité des stocks</span>
              </button>

              <button 
                type="submit" 
                disabled={submitting || (availability && !availability.can_produce)}
                className="w-full btn-primary py-3 flex items-center justify-center gap-2"
              >
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play size={18} />}
                <span>Créer l'ordre de fabrication</span>
              </button>
            </div>
          </form>
        </div>

        {/* Résultat Disponibilité */}
        <div className="space-y-4">
          {availability ? (
            <div className={cn(
              "p-6 rounded-card border shadow-card animate-in zoom-in-95 duration-200",
              availability.can_produce ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
            )}>
              <div className="flex items-center gap-3 mb-6">
                {availability.can_produce ? (
                  <div className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center">
                    <CheckCircle2 size={24} />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-red-500 text-white flex items-center justify-center">
                    <AlertTriangle size={24} />
                  </div>
                )}
                <div>
                  <h3 className={cn("font-bold text-sm uppercase tracking-wider", availability.can_produce ? "text-green-800" : "text-red-800")}>
                    {availability.can_produce ? 'Stock Suffisant' : 'Stock Insuffisant'}
                  </h3>
                  <p className="text-xs text-muted-600">
                    {availability.can_produce 
                      ? 'Toutes les matières sont disponibles pour cette quantité.' 
                      : 'Certains ingrédients manquent pour réaliser cette production.'}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-[11px] font-bold text-muted-500 uppercase mb-2">Détails des besoins :</div>
                {availability.details.map((item, i) => (
                  <div key={i} className="flex items-center justify-between bg-surface/50 p-2.5 rounded border border-white/50 text-xs">
                    <div>
                      <div className="font-bold text-navy">{item.name}</div>
                      <div className="text-[10px] text-muted-500">Requis: {item.required} {item.unit}</div>
                    </div>
                    <div className="text-right">
                      <div className={cn("font-bold", item.sufficient ? "text-green-600" : "text-red-600")}>
                        {item.available} {item.unit} dispos
                      </div>
                      {!item.sufficient && (
                        <div className="text-[9px] text-red-500 font-medium">Manque: {(item.required - item.available).toFixed(3)}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-3 bg-white/40 rounded border border-white/60 text-center">
                <span className="text-xs font-bold text-navy">Maximum produisible actuellement : </span>
                <span className="text-sm font-black text-primary-600">{availability.max_possible} UNITÉS</span>
              </div>
            </div>
          ) : (
            <div className="bg-surface rounded-card border border-muted-300 border-dashed p-12 text-center text-muted-400">
              <ShoppingCart size={48} className="mx-auto mb-4 opacity-10" />
              <p className="text-sm">Sélectionnez une recette et une quantité pour vérifier la faisabilité.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
