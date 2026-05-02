import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { productionService } from '@/services/productionService'
import toast from 'react-hot-toast'
import { 
  Play, CheckCircle2, XCircle, Loader2, ArrowLeft, Activity, 
  Tag, Calendar, Clock, User, Beaker, TrendingUp, AlertCircle,
  Package, DollarSign
} from 'lucide-react'
import { cn } from '@/utils/cn'

const fmt = (n) => new Intl.NumberFormat('fr-FR').format(n ?? 0) + ' FCFA'
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' }) : '—'

export default function ProductionDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [production, setProduction] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  
  const [completeData, setCompleteData] = useState({
    actual_quantity: '',
    waste_quantity: 0,
    expiry_date: ''
  })

  const fetchProduction = async () => {
    try {
      // Pour l'instant on réutilise getAll avec un filtre ou on attendrait un getById
      // On va faire un getAll et filtrer car j'ai oublié d'ajouter getById au service (même si c'est mieux d'en avoir un)
      // En fait, j'ai ajouté getAll(params) donc on peut faire ça.
      // Mais je vais ajouter getById au service vite fait.
      const res = await productionService.getAll({ id })
      const found = res.data.data.find(p => p.id === Number(id))
      if (!found) throw new Error('Non trouvé')
      setProduction(found)
      setCompleteData({
        actual_quantity: found.planned_quantity,
        waste_quantity: 0,
        expiry_date: ''
      })
    } catch (err) {
      toast.error('Erreur lors du chargement')
      navigate('/production')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProduction()
  }, [id])

  const handleStart = async () => {
    setSubmitting(true)
    try {
      await productionService.start(id)
      toast.success('Production lancée !')
      fetchProduction()
    } catch (err) {
      toast.error('Erreur lors du lancement')
    } finally {
      setSubmitting(false)
    }
  }

  const handleComplete = async () => {
    if (!completeData.actual_quantity) return toast.error('Saisissez la quantité réelle produite')
    setSubmitting(true)
    try {
      await productionService.complete(id, completeData)
      toast.success('Production clôturée et stocks mis à jour')
      fetchProduction()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la clôture')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancel = async () => {
    if (!confirm('Annuler cet ordre de production ?')) return
    setSubmitting(true)
    try {
      await productionService.cancel(id)
      toast.success('Production annulée')
      fetchProduction()
    } catch (err) {
      toast.error('Erreur lors de l\'annulation')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="flex justify-center py-24"><Loader2 className="w-10 h-10 animate-spin text-primary-500" /></div>

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/production" className="p-2 text-muted-500 hover:text-navy hover:bg-surface rounded-btn border border-transparent hover:border-muted-300 transition-all">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black bg-primary-100 text-primary-700 px-2 py-0.5 rounded uppercase tracking-widest">{production.reference}</span>
              <span className={cn(
                "text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider",
                production.status === 'completed' ? "bg-green-100 text-green-700" :
                production.status === 'in_progress' ? "bg-blue-100 text-blue-700" : "bg-muted-100 text-muted-600"
              )}>{production.status}</span>
            </div>
            <h1 className="text-2xl font-display font-black text-navy tracking-tight">{production.product?.name}</h1>
          </div>
        </div>

        {production.status === 'pending' && (
          <div className="flex gap-2">
             <button onClick={handleCancel} disabled={submitting} className="btn-secondary text-danger hover:bg-red-50">Annuler</button>
             <button onClick={handleStart} disabled={submitting} className="btn-primary flex items-center gap-2">
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
                Lancer la fabrication
             </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Info Card */}
          <div className="bg-surface rounded-card border border-muted-300 shadow-card p-6 grid grid-cols-2 gap-y-6">
            <div className="space-y-1">
              <div className="text-[10px] font-bold text-muted-400 uppercase">Recette utilisée</div>
              <div className="text-sm font-bold text-navy flex items-center gap-1.5"><Beaker size={14} className="text-primary-500" /> {production.bom?.name || 'Standard'}</div>
            </div>
            <div className="space-y-1">
              <div className="text-[10px] font-bold text-muted-400 uppercase">Numéro de lot</div>
              <div className="text-sm font-mono font-bold text-navy bg-muted-50 px-2 py-0.5 rounded border border-muted-200 inline-block">{production.batch_number}</div>
            </div>
            <div className="space-y-1">
              <div className="text-[10px] font-bold text-muted-400 uppercase">Quantité prévue</div>
              <div className="text-sm font-bold text-navy">{production.planned_quantity} {production.product?.unit}</div>
            </div>
            <div className="space-y-1">
              <div className="text-[10px] font-bold text-muted-400 uppercase">Opérateur</div>
              <div className="text-sm font-bold text-navy flex items-center gap-1.5"><User size={14} className="text-muted-400" /> {production.user?.name}</div>
            </div>
          </div>

          {/* Formulaire de Clôture */}
          {production.status === 'in_progress' && (
            <div className="bg-surface rounded-card border-2 border-primary-100 shadow-xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
               <div className="p-4 bg-primary-50 border-b border-primary-100 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-primary-700 uppercase tracking-wider flex items-center gap-2">
                    <Package size={16} /> Finaliser la fabrication
                  </h3>
                  <button onClick={handleCancel} className="text-[10px] text-danger font-bold hover:underline">Annuler l'ordre</button>
               </div>
               <div className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-xs font-bold text-muted-700 uppercase">Quantité réelle produite *</label>
                       <input 
                         type="number" 
                         value={completeData.actual_quantity}
                         onChange={(e) => setCompleteData({ ...completeData, actual_quantity: e.target.value })}
                         className="input-field font-black text-navy text-lg"
                       />
                       <p className="text-[10px] text-muted-500">Combien d'unités sont sorties de l'atelier ?</p>
                    </div>
                    <div className="space-y-2">
                       <label className="text-xs font-bold text-muted-700 uppercase">Pertes / Écarts (Optionnel)</label>
                       <input 
                         type="number" 
                         value={completeData.waste_quantity}
                         onChange={(e) => setCompleteData({ ...completeData, waste_quantity: e.target.value })}
                         className="input-field text-danger font-bold"
                       />
                    </div>
                  </div>
                  <div className="space-y-2">
                     <label className="text-xs font-bold text-muted-700 uppercase">Date d'expiration du lot</label>
                     <input 
                       type="date" 
                       value={completeData.expiry_date}
                       onChange={(e) => setCompleteData({ ...completeData, expiry_date: e.target.value })}
                       className="input-field"
                     />
                  </div>
                  <button 
                    onClick={handleComplete}
                    disabled={submitting}
                    className="w-full btn-primary py-3 text-sm font-bold flex items-center justify-center gap-2"
                  >
                    {submitting ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                    Valider la production et mettre à jour les stocks
                  </button>
               </div>
            </div>
          )}

          {/* Recap Coûts (si terminé) */}
          {production.status === 'completed' && (
             <div className="bg-green-50 rounded-card border border-green-200 p-6 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 rounded-full bg-green-500 text-white flex items-center justify-center shadow-lg">
                      <DollarSign size={24} />
                   </div>
                   <div>
                      <div className="text-[10px] font-bold text-green-700 uppercase tracking-widest mb-0.5">Coût total de fabrication</div>
                      <div className="text-2xl font-black text-green-900">{fmt(production.total_cost)}</div>
                   </div>
                </div>
                <div className="text-right">
                   <div className="text-[10px] font-bold text-green-700 uppercase tracking-widest mb-0.5">Coût Unitaire</div>
                   <div className="text-lg font-black text-green-900">{fmt(production.total_cost / production.actual_quantity)}</div>
                </div>
             </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-surface rounded-card border border-muted-300 shadow-card p-6">
            <h3 className="text-xs font-bold text-navy uppercase tracking-wider mb-4 flex items-center gap-2">
              <Clock size={16} className="text-muted-400" /> Historique
            </h3>
            <div className="space-y-6 relative before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-px before:bg-muted-200">
               <div className="relative pl-6">
                  <div className="absolute left-0 top-1.5 w-3.5 h-3.5 rounded-full bg-surface border-2 border-primary-500 z-10" />
                  <div className="text-[11px] font-bold text-navy">Ordre créé</div>
                  <div className="text-[10px] text-muted-500">{fmtDate(production.created_at)}</div>
               </div>
               {production.started_at && (
                 <div className="relative pl-6">
                    <div className="absolute left-0 top-1.5 w-3.5 h-3.5 rounded-full bg-surface border-2 border-blue-500 z-10" />
                    <div className="text-[11px] font-bold text-navy">Début de fabrication</div>
                    <div className="text-[10px] text-muted-500">{fmtDate(production.started_at)}</div>
                 </div>
               )}
               {production.completed_at && (
                 <div className="relative pl-6">
                    <div className="absolute left-0 top-1.5 w-3.5 h-3.5 rounded-full bg-surface border-2 border-green-500 z-10" />
                    <div className="text-[11px] font-bold text-navy">Production clôturée</div>
                    <div className="text-[10px] text-muted-500">{fmtDate(production.completed_at)}</div>
                 </div>
               )}
               {production.status === 'cancelled' && (
                 <div className="relative pl-6">
                    <div className="absolute left-0 top-1.5 w-3.5 h-3.5 rounded-full bg-surface border-2 border-red-500 z-10" />
                    <div className="text-[11px] font-bold text-navy">Production annulée</div>
                 </div>
               )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
