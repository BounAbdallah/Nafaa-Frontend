import { useEffect, useState } from 'react'
import { subscriptionService } from '@/services/subscriptionService'
import { useAuthStore } from '@/store/authStore'
import { useCurrency } from '@/utils/currency'
import toast from 'react-hot-toast'
import {
  CreditCard, Clock, CheckCircle2, XCircle, AlertTriangle,
  Loader2, X, ArrowRight, Sparkles, CalendarDays, BadgePercent,
} from 'lucide-react'
import { cn } from '@/utils/cn'

const MONTHS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc']

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'

export default function SubscriptionPage() {
  const { user } = useAuthStore()
  const { format: fmt } = useCurrency()
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [showChange, setShowChange] = useState(false)

  const isAdmin = user?.roles?.includes('admin')

  const load = () => {
    setLoading(true)
    subscriptionService.getMine()
      .then(r => setData(r.data))
      .catch(() => toast.error("Impossible de charger l'abonnement."))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={24} className="animate-spin text-primary-500" />
      </div>
    )
  }

  if (!data) return null

  const {
    pack, effective_price, has_discount, is_on_trial, trial_ends_at,
    trial_days_left, has_active_plan, plan_expires_at,
    current_month_paid, payments, payments_year, pending_request,
  } = data

  // Statut global
  const status = is_on_trial
    ? { label: `Période d'essai — ${trial_days_left} jour${trial_days_left > 1 ? 's' : ''} restant${trial_days_left > 1 ? 's' : ''}`,
        icon: Sparkles, cls: 'bg-violet-50 text-violet-600 border-violet-200' }
    : has_active_plan
      ? { label: 'Abonnement actif', icon: CheckCircle2, cls: 'bg-green-50 text-success border-green-200' }
      : { label: 'Abonnement expiré', icon: XCircle, cls: 'bg-red-50 text-danger border-red-200' }
  const StatusIcon = status.icon

  return (
    <div className="space-y-4 sm:space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-display font-bold text-navy flex items-center gap-2">
          <CreditCard size={22} className="text-primary-500" />
          Mon abonnement
        </h1>
        <p className="text-sm font-sans text-muted-500 mt-1">
          Détails de votre formule, paiements et période d'essai.
        </p>
      </div>

      {/* Carte principale */}
      <div className="card p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <p className="text-xs font-sans font-semibold text-muted-500 uppercase tracking-wide mb-1">Formule actuelle</p>
            <p className="text-2xl font-display font-bold text-navy">{pack?.name ?? 'Aucun pack'}</p>
            <div className="flex items-baseline gap-2 mt-1.5 flex-wrap">
              <span className="text-xl font-display font-bold text-primary-500">{fmt(effective_price)}</span>
              <span className="text-xs text-muted-500">/ {pack?.period ?? 'mois'}</span>
              {has_discount && (
                <>
                  <span className="text-sm text-muted-400 line-through">{fmt(pack?.price)}</span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-success bg-green-50 px-2 py-0.5 rounded-badge">
                    <BadgePercent size={11} />Remise appliquée
                  </span>
                </>
              )}
            </div>
          </div>

          <span className={cn('inline-flex items-center gap-1.5 text-xs font-sans font-bold px-3 py-1.5 rounded-badge border self-start', status.cls)}>
            <StatusIcon size={13} />
            {status.label}
          </span>
        </div>

        {/* Dates clés */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-muted-100">
          {is_on_trial && (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-card bg-violet-50 flex items-center justify-center text-violet-500 shrink-0">
                <Sparkles size={16} />
              </div>
              <div>
                <p className="text-[11px] text-muted-500">Fin de l'essai</p>
                <p className="text-sm font-sans font-semibold text-navy">{fmtDate(trial_ends_at)}</p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-card bg-primary-50 flex items-center justify-center text-primary-500 shrink-0">
              <CalendarDays size={16} />
            </div>
            <div>
              <p className="text-[11px] text-muted-500">Expire le</p>
              <p className="text-sm font-sans font-semibold text-navy">{fmtDate(plan_expires_at)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className={cn('w-9 h-9 rounded-card flex items-center justify-center shrink-0',
              current_month_paid ? 'bg-green-50 text-success' : 'bg-amber-50 text-amber-500')}>
              {current_month_paid ? <CheckCircle2 size={16} /> : <Clock size={16} />}
            </div>
            <div>
              <p className="text-[11px] text-muted-500">Mois en cours</p>
              <p className={cn('text-sm font-sans font-semibold', current_month_paid ? 'text-success' : 'text-amber-600')}>
                {current_month_paid ? 'Payé' : 'En attente de paiement'}
              </p>
            </div>
          </div>
        </div>

        {/* Demande en cours / bouton changement */}
        {isAdmin && (
          <div className="pt-4 border-t border-muted-100">
            {pending_request ? (
              <div className="flex items-start gap-3 bg-amber-50/60 border border-amber-200 rounded-card p-3">
                <Clock size={16} className="text-amber-500 mt-0.5 shrink-0" />
                <div className="text-sm font-sans">
                  <p className="font-semibold text-navy">
                    Demande de changement vers « {pending_request.requested_pack} » en attente
                  </p>
                  <p className="text-xs text-muted-500 mt-0.5">
                    Envoyée le {fmtDate(pending_request.created_at)} — l'équipe Qiwam vous contactera.
                  </p>
                </div>
              </div>
            ) : (
              <button onClick={() => setShowChange(true)} className="btn-secondary flex items-center gap-2 text-sm">
                Demander un changement de plan
                <ArrowRight size={14} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Historique des paiements */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-muted-200">
          <h2 className="font-display font-semibold text-navy">Paiements {payments_year}</h2>
        </div>
        {payments.length === 0 ? (
          <div className="py-12 text-center">
            <CreditCard size={28} className="mx-auto text-muted-300 mb-2" />
            <p className="text-sm text-muted-500">Aucun paiement enregistré pour {payments_year}.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-muted-300 bg-muted-100/50">
                  <th className="text-left py-2.5 px-4 text-xs font-sans font-semibold text-muted-700 uppercase tracking-wide">Mois</th>
                  <th className="text-right py-2.5 px-4 text-xs font-sans font-semibold text-muted-700 uppercase tracking-wide">Montant</th>
                  <th className="text-center py-2.5 px-4 text-xs font-sans font-semibold text-muted-700 uppercase tracking-wide">Statut</th>
                  <th className="text-right py-2.5 px-4 text-xs font-sans font-semibold text-muted-700 uppercase tracking-wide hidden sm:table-cell">Payé le</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-muted-100">
                {payments.map(p => (
                  <tr key={p.id} className="hover:bg-muted-50/60">
                    <td className="py-2.5 px-4 text-sm font-sans font-semibold text-navy">{MONTHS[p.month - 1]} {p.year}</td>
                    <td className="py-2.5 px-4 text-right text-sm font-sans text-navy whitespace-nowrap">{fmt(p.amount)}</td>
                    <td className="py-2.5 px-4 text-center">
                      <span className={cn(
                        'inline-flex items-center gap-1 text-[11px] font-sans font-bold px-2 py-0.5 rounded-badge',
                        p.status === 'paid'    ? 'bg-green-50 text-success' :
                        p.status === 'overdue' ? 'bg-red-50 text-danger'   :
                                                 'bg-amber-50 text-amber-600'
                      )}>
                        {p.status === 'paid' ? <CheckCircle2 size={11} /> : p.status === 'overdue' ? <AlertTriangle size={11} /> : <Clock size={11} />}
                        {p.status === 'paid' ? 'Payé' : p.status === 'overdue' ? 'En retard' : 'En attente'}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right text-xs text-muted-500 hidden sm:table-cell">
                      {p.paid_at ? new Date(p.paid_at).toLocaleDateString('fr-FR') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal changement de plan */}
      {showChange && (
        <PlanChangeModal
          currentPackId={pack?.id}
          onClose={() => setShowChange(false)}
          onSent={() => { setShowChange(false); load() }}
        />
      )}
    </div>
  )
}

// ── Modal : demander un changement de plan ────────────────────────────────────
function PlanChangeModal({ currentPackId, onClose, onSent }) {
  const { format: fmt } = useCurrency()
  const [packs, setPacks]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [selected, setSelected] = useState(null)
  const [note, setNote]         = useState('')
  const [sending, setSending]   = useState(false)

  useEffect(() => {
    subscriptionService.getPacks()
      .then(r => setPacks(r.packs ?? []))
      .catch(() => toast.error('Impossible de charger les packs.'))
      .finally(() => setLoading(false))
  }, [])

  const submit = async () => {
    if (!selected) { toast.error('Choisis un pack.'); return }
    setSending(true)
    try {
      const r = await subscriptionService.requestPlanChange(selected, note)
      toast.success(r.message ?? 'Demande envoyée.')
      onSent()
    } catch (err) {
      toast.error(err.response?.data?.message ?? "Erreur lors de l'envoi.")
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-surface rounded-card w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-muted-200 sticky top-0 bg-surface">
          <h3 className="font-display font-bold text-navy">Changer de plan</h3>
          <button onClick={onClose} className="p-1.5 rounded-btn text-muted-500 hover:bg-muted-100">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 size={22} className="animate-spin text-primary-500" /></div>
          ) : (
            <div className="space-y-2">
              {packs.map(p => {
                const isCurrent = p.id === currentPackId
                return (
                  <button
                    key={p.id}
                    disabled={isCurrent}
                    onClick={() => setSelected(p.id)}
                    className={cn(
                      'w-full text-left p-3.5 rounded-card border transition-all',
                      isCurrent
                        ? 'border-muted-200 bg-muted-50 opacity-60 cursor-not-allowed'
                        : selected === p.id
                          ? 'border-primary-500 bg-primary-50/60 ring-1 ring-primary-300'
                          : 'border-muted-200 hover:border-primary-300'
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-sans font-bold text-navy">
                          {p.name}
                          {isCurrent && <span className="ml-2 text-[10px] font-semibold text-muted-500">(actuel)</span>}
                        </p>
                        {p.description && <p className="text-xs text-muted-500 mt-0.5 line-clamp-2">{p.description}</p>}
                      </div>
                      <p className="text-sm font-display font-bold text-primary-500 whitespace-nowrap shrink-0">
                        {fmt(p.price)} <span className="text-[10px] text-muted-500 font-sans">/ {p.period ?? 'mois'}</span>
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-sans font-semibold text-muted-700 uppercase tracking-wide">Message (optionnel)</label>
            <textarea
              rows={3}
              className="input-field w-full resize-none"
              placeholder="Précisez votre besoin…"
              value={note}
              onChange={e => setNote(e.target.value)}
            />
          </div>

          <button
            onClick={submit}
            disabled={sending || !selected}
            className="btn-primary w-full py-2.5 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {sending ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
            Envoyer la demande
          </button>
          <p className="text-[11px] text-muted-400 text-center">
            La demande est traitée manuellement par l'équipe Qiwam — aucun changement immédiat.
          </p>
        </div>
      </div>
    </div>
  )
}
