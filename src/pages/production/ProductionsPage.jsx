import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { productionService } from '@/services/productionService'
import toast from 'react-hot-toast'
import {
  Plus, Search, Activity, Play, CheckCircle2, XCircle, 
  Loader2, RefreshCw, Clock, Tag, User, ChevronRight,
  TrendingUp, Calendar, ArrowRight, AlertTriangle
} from 'lucide-react'
import { cn } from '@/utils/cn'

const fmt = (n) => new Intl.NumberFormat('fr-FR').format(n ?? 0) + ' FCFA'
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'

const STATUS_MAP = {
  pending:     { label: 'En attente', color: 'bg-muted-100 text-muted-600', icon: Clock },
  in_progress: { label: 'En cours',   color: 'bg-blue-50 text-blue-600 animate-pulse', icon: Play },
  completed:   { label: 'Terminé',    color: 'bg-green-50 text-success', icon: CheckCircle2 },
  cancelled:   { label: 'Annulé',     color: 'bg-red-50 text-danger', icon: XCircle },
}

export default function ProductionsPage() {
  const [productions, setProductions] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState(null)

  const fetchProductions = useCallback(async () => {
    setLoading(true)
    try {
      const res = await productionService.getAll({ page })
      setProductions(res.data.data || [])
      setMeta(res.data)
    } catch (err) {
      toast.error('Erreur lors du chargement des productions')
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    fetchProductions()
  }, [fetchProductions])

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-black text-navy tracking-tight">Suivi de Production</h1>
          <p className="text-muted-500 text-sm">Gérez vos ordres de fabrication et la traçabilité des lots.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/production/new" className="btn-primary flex items-center gap-2">
            <Plus size={18} />
            <span>Lancer une Production</span>
          </Link>
          <button onClick={fetchProductions} className="p-2.5 text-muted-500 hover:text-primary-500 bg-surface border border-muted-300 rounded-btn hover:border-primary-300 transition-all">
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-surface p-4 rounded-card border border-muted-300 shadow-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center">
              <Activity size={18} />
            </div>
            <span className="text-xs font-bold text-muted-500 uppercase">Total Productions</span>
          </div>
          <div className="text-2xl font-black text-navy">{meta?.total || 0}</div>
        </div>
        {/* On pourrait ajouter d'autres stats ici */}
      </div>

      <div className="bg-surface rounded-card shadow-card border border-muted-300 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted-50/50 border-b border-muted-300">
                <th className="px-6 py-4 text-[11px] font-bold text-muted-500 uppercase tracking-wider">Référence & Produit</th>
                <th className="px-6 py-4 text-[11px] font-bold text-muted-500 uppercase tracking-wider">Lot / Exp.</th>
                <th className="px-6 py-4 text-[11px] font-bold text-muted-500 uppercase tracking-wider">Quantité</th>
                <th className="px-6 py-4 text-[11px] font-bold text-muted-500 uppercase tracking-wider text-center">Statut</th>
                <th className="px-6 py-4 text-[11px] font-bold text-muted-500 uppercase tracking-wider">Dates</th>
                <th className="px-6 py-4 text-[11px] font-bold text-muted-500 uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-muted-200">
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan="6" className="px-6 py-8 bg-muted-50/20" />
                  </tr>
                ))
              ) : productions.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-muted-500">
                    <Activity className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>Aucun ordre de fabrication en cours.</p>
                  </td>
                </tr>
              ) : productions.map((prod) => {
                const st = STATUS_MAP[prod.status] || STATUS_MAP.pending
                return (
                  <tr key={prod.id} className="hover:bg-muted-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-black text-primary-600 text-xs tracking-wider mb-0.5">{prod.reference}</div>
                        <div className="font-bold text-navy">{prod.product?.name}</div>
                        <div className="text-[10px] text-muted-500 flex items-center gap-1">
                           <Tag size={10} /> Recette : {prod.bom?.name || 'Standard'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {prod.batch_number ? (
                        <div className="space-y-1">
                          <div className="text-xs font-mono font-bold bg-muted-100 px-1.5 py-0.5 rounded inline-block">{prod.batch_number}</div>
                          {prod.expiry_date && (
                            <div className="text-[10px] text-danger font-bold flex items-center gap-1">
                              <Calendar size={10} /> Exp: {new Date(prod.expiry_date).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      ) : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-navy">{prod.actual_quantity || prod.planned_quantity} <span className="text-[10px] text-muted-400 font-normal">{prod.product?.unit}</span></span>
                        <span className="text-[10px] text-muted-400 italic">Prévu: {prod.planned_quantity}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider", st.color)}>
                        <st.icon size={12} /> {st.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-[11px] text-muted-500 space-y-0.5">
                        <div className="flex items-center gap-1"><Clock size={10} /> Début: {fmtDate(prod.started_at || prod.created_at)}</div>
                        {prod.completed_at && <div className="flex items-center gap-1 text-success font-medium"><CheckCircle2 size={10} /> Fin: {fmtDate(prod.completed_at)}</div>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link 
                        to={`/production/${prod.id}`}
                        className="btn-secondary py-1.5 px-3 text-xs inline-flex items-center gap-1"
                      >
                        Gérer <ChevronRight size={14} />
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
