import { useEffect, useState } from 'react'
import { adminService } from '@/services/adminService'
import {
  CreditCard, CheckCircle2, XCircle, AlertCircle,
  Clock, Activity, Building, ChevronLeft, ChevronRight,
  X, Check, DollarSign,
} from 'lucide-react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { cn } from '@/utils/cn'
import toast from 'react-hot-toast'

const MONTHS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jui', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']
const MONTHS_FULL = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']
const fmt = (n) => new Intl.NumberFormat('fr-FR').format(n ?? 0)

export default function SubscriptionsManagement() {
  const [activeTab, setActiveTab]   = useState('tracking')
  const [pending, setPending]       = useState([])
  const [tracking, setTracking]     = useState([])
  const [year, setYear]             = useState(new Date().getFullYear())
  const [loading, setLoading]       = useState(true)
  const [payModal, setPayModal]     = useState(null) // { tenant, month }

  const currentMonth = new Date().getMonth() + 1
  const currentYear  = new Date().getFullYear()

  const fetchData = async () => {
    setLoading(true)
    try {
      if (activeTab === 'pending') {
        const res = await adminService.getPendingApprovals()
        setPending(res.tenants || [])
      } else {
        const res = await adminService.getSubscriptionTracking(year)
        setTracking(res.tenants || [])
      }
    } catch {
      toast.error('Erreur lors du chargement des données')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [activeTab, year])

  const handleApprove = async (tenantId) => {
    try {
      await adminService.approveTenant(tenantId)
      toast.success('Espace activé avec succès')
      fetchData()
    } catch {
      toast.error("Erreur lors de l'activation")
    }
  }

  // Stats rapides sur l'année affichée
  const totalPaid    = tracking.reduce((s, t) => s + (t.payments?.filter(p => p.status === 'paid').length ?? 0), 0)
  const totalExpected = tracking.reduce((s, t) => {
    // Mois attendus = mois passés de l'année (si année en cours) ou 12 (si passé)
    const maxMonth = year < currentYear ? 12 : currentMonth
    return s + maxMonth
  }, 0)
  const collectionRate = totalExpected > 0 ? Math.round((totalPaid / totalExpected) * 100) : 0

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-black text-navy flex items-center gap-2">
            <CreditCard className="text-primary-500" />
            Abonnements & Paiements
          </h1>
          <p className="text-sm text-muted-500 mt-1">
            Approbations, suivi mensuel des paiements et encaissements.
          </p>
        </div>
      </div>

      {/* Onglets */}
      <div className="flex gap-2 border-b border-muted-200">
        {[
          { id: 'tracking', icon: Activity,  label: 'Calendrier Annuel' },
          { id: 'pending',  icon: Clock,     label: 'En attente d\'approbation',
            badge: pending.length > 0 ? pending.length : null },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-4 py-2.5 font-semibold text-sm border-b-2 transition-colors flex items-center gap-2",
              activeTab === tab.id
                ? "border-primary-500 text-primary-600"
                : "border-transparent text-muted-500 hover:text-navy"
            )}
          >
            <tab.icon size={16} />
            {tab.label}
            {tab.badge && (
              <span className="bg-red-100 text-red-600 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Onglet : Calendrier Annuel ──────────────────────────────────────── */}
      {activeTab === 'tracking' && (
        <div className="space-y-4">
          {/* Contrôles année + stats */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Sélecteur d'année */}
            <div className="flex items-center gap-2 bg-surface border border-muted-200 rounded-card px-3 py-2 shadow-sm">
              <button
                onClick={() => setYear(y => y - 1)}
                className="p-1 rounded hover:bg-muted-100 text-muted-500 hover:text-navy transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-lg font-black text-navy min-w-[60px] text-center">{year}</span>
              <button
                onClick={() => setYear(y => y + 1)}
                disabled={year >= currentYear}
                className="p-1 rounded hover:bg-muted-100 text-muted-500 hover:text-navy transition-colors disabled:opacity-30"
              >
                <ChevronRight size={16} />
              </button>
              {year !== currentYear && (
                <button
                  onClick={() => setYear(currentYear)}
                  className="ml-2 text-[11px] text-primary-600 hover:text-primary-700 font-semibold border border-primary-200 px-2 py-0.5 rounded"
                >
                  Aujourd'hui
                </button>
              )}
            </div>

            {/* KPIs rapides */}
            <div className="flex gap-3">
              <KpiChip label="Espaces" value={tracking.length} color="text-navy" />
              <KpiChip label="Paiements reçus" value={totalPaid} color="text-green-600" />
              <KpiChip label="Taux de collecte" value={`${collectionRate}%`}
                color={collectionRate >= 80 ? 'text-green-600' : collectionRate >= 50 ? 'text-amber-600' : 'text-red-600'} />
            </div>
          </div>

          {/* Grille calendrier */}
          <div className="bg-surface rounded-card border border-muted-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left whitespace-nowrap">
                <thead>
                  <tr className="bg-muted-50 border-b border-muted-200">
                    <th className="px-5 py-3 text-[11px] font-bold text-muted-500 uppercase tracking-wider sticky left-0 bg-muted-50 z-10 min-w-[200px]">
                      Espace / Plan
                    </th>
                    {MONTHS.map((m, i) => (
                      <th key={m}
                        className={cn(
                          "px-1 py-3 text-[11px] font-bold text-center uppercase tracking-wider w-14",
                          year === currentYear && i + 1 === currentMonth
                            ? "text-primary-600 bg-primary-50"
                            : "text-muted-500"
                        )}
                      >
                        {m}
                      </th>
                    ))}
                    <th className="px-5 py-3 text-[11px] font-bold text-muted-500 uppercase tracking-wider text-right">
                      Résumé
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-muted-100">
                  {loading ? (
                    [...Array(4)].map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="px-5 py-4 sticky left-0 bg-white">
                          <div className="h-4 bg-muted-100 rounded w-32 mb-1" />
                          <div className="h-3 bg-muted-100 rounded w-20" />
                        </td>
                        {MONTHS.map((_, j) => (
                          <td key={j} className="px-1 py-4 text-center">
                            <div className="w-8 h-8 bg-muted-100 rounded-lg mx-auto" />
                          </td>
                        ))}
                        <td className="px-5 py-4" />
                      </tr>
                    ))
                  ) : tracking.length === 0 ? (
                    <tr>
                      <td colSpan={14} className="px-6 py-16 text-center text-muted-400">
                        <Activity size={32} className="mx-auto mb-3 opacity-20" />
                        <p className="text-sm">Aucun espace trouvé.</p>
                      </td>
                    </tr>
                  ) : tracking.map((tenant) => {
                    const paidCount = tenant.payments?.filter(p => p.status === 'paid').length ?? 0
                    const maxMonth  = year < currentYear ? 12 : currentMonth
                    const rate      = maxMonth > 0 ? Math.round((paidCount / maxMonth) * 100) : 0

                    return (
                      <tr key={tenant.id} className="hover:bg-muted-50/50 transition-colors group">
                        {/* Nom + plan */}
                        <td className="px-5 py-3 sticky left-0 bg-white group-hover:bg-muted-50/50 z-10 transition-colors">
                          <div className="font-semibold text-navy text-sm">{tenant.name}</div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] font-bold bg-primary-50 text-primary-700 px-1.5 py-0.5 rounded uppercase">
                              {tenant.pack?.name || tenant.plan || 'Free'}
                            </span>
                            <span className="text-[10px] text-muted-400">{tenant.owner?.email}</span>
                          </div>
                        </td>

                        {/* Cases mensuelles */}
                        {MONTHS.map((_, idx) => {
                          const monthNum  = idx + 1
                          const payment   = tenant.payments?.find(p => p.month === monthNum)
                          const isFuture  = year === currentYear && monthNum > currentMonth
                          const isCurrent = year === currentYear && monthNum === currentMonth
                          const isPaid    = payment?.status === 'paid'
                          const isOverdue = !isFuture && !isPaid

                          return (
                            <td key={idx}
                              className={cn(
                                "px-1 py-3 text-center",
                                isCurrent && "bg-primary-50/50"
                              )}
                            >
                              <button
                                onClick={() => !isFuture && !isPaid && setPayModal({ tenant, month: monthNum })}
                                disabled={isFuture || isPaid}
                                title={
                                  isPaid
                                    ? `Payé — ${fmt(payment.amount)} FCFA`
                                    : isFuture ? 'Mois futur'
                                    : `Enregistrer paiement ${MONTHS_FULL[idx]} ${year}`
                                }
                                className={cn(
                                  "w-9 h-9 mx-auto rounded-lg flex items-center justify-center transition-all",
                                  isPaid
                                    ? "bg-green-500 text-white cursor-default"
                                    : isFuture
                                    ? "bg-muted-100 text-muted-300 cursor-default"
                                    : "bg-red-100 text-red-500 hover:bg-red-500 hover:text-white cursor-pointer hover:scale-110"
                                )}
                              >
                                {isPaid
                                  ? <CheckCircle2 size={14} />
                                  : isFuture
                                  ? <span className="text-[10px]">—</span>
                                  : <AlertCircle size={14} />
                                }
                              </button>
                            </td>
                          )
                        })}

                        {/* Résumé */}
                        <td className="px-5 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="h-1.5 w-16 bg-muted-100 rounded-full overflow-hidden">
                              <div
                                className={cn(
                                  "h-full rounded-full transition-all",
                                  rate >= 80 ? "bg-green-500" : rate >= 50 ? "bg-amber-400" : "bg-red-400"
                                )}
                                style={{ width: `${rate}%` }}
                              />
                            </div>
                            <span className={cn(
                              "text-xs font-bold",
                              rate >= 80 ? "text-green-600" : rate >= 50 ? "text-amber-600" : "text-red-600"
                            )}>
                              {paidCount}/{maxMonth}
                            </span>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Légende */}
            <div className="px-5 py-3 bg-muted-50 border-t border-muted-100 flex items-center gap-5 text-[11px] text-muted-500">
              <LegendItem color="bg-green-500" label="Payé" />
              <LegendItem color="bg-red-100 border border-red-200" label="Impayé (cliquer pour encaisser)" />
              <LegendItem color="bg-muted-100" label="Mois futur" />
            </div>
          </div>
        </div>
      )}

      {/* ── Onglet : En attente d'approbation ─────────────────────────────────── */}
      {activeTab === 'pending' && (
        <Card className="!p-0 overflow-hidden">
          {loading ? (
            <div className="p-12 flex flex-col items-center justify-center text-muted-400">
              <Activity className="w-8 h-8 animate-spin mb-4 opacity-50" />
              Chargement...
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="bg-muted-50/50 text-muted-500 border-b border-muted-200 uppercase tracking-wider text-[10px] font-bold">
                <tr>
                  <th className="px-6 py-4">Espace</th>
                  <th className="px-6 py-4">Propriétaire</th>
                  <th className="px-6 py-4">Plan Demandé</th>
                  <th className="px-6 py-4 text-center">Date demande</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-muted-100">
                {pending.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center text-muted-500">
                      <CheckCircle2 size={40} className="text-green-300 mx-auto mb-3" />
                      <p className="font-semibold text-navy">Aucune demande en attente</p>
                      <p className="text-xs mt-1">Toutes les inscriptions ont été traitées.</p>
                    </td>
                  </tr>
                ) : pending.map(tenant => (
                  <tr key={tenant.id} className="hover:bg-muted-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-navy flex items-center gap-2">
                        <Building size={14} className="text-muted-400" />
                        {tenant.name}
                      </div>
                      <div className="text-xs text-muted-500 font-mono mt-0.5">{tenant.slug}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-navy">{tenant.owner?.name || 'Inconnu'}</div>
                      <div className="text-xs text-muted-500">{tenant.owner?.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-2 py-1 rounded text-[10px] font-bold bg-primary-50 text-primary-700 uppercase">
                        {tenant.plan || 'Free'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center text-muted-500">
                      {new Date(tenant.created_at).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="primary" size="sm" onClick={() => handleApprove(tenant.id)}>
                        Approuver
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      )}

      {/* ── Modal Enregistrer un paiement ──────────────────────────────────────── */}
      {payModal && (
        <PaymentModal
          tenant={payModal.tenant}
          month={payModal.month}
          year={year}
          onClose={() => setPayModal(null)}
          onSaved={() => { setPayModal(null); fetchData() }}
        />
      )}
    </div>
  )
}

// ── Sous-composants ──────────────────────────────────────────────────────────

const KpiChip = ({ label, value, color }) => (
  <div className="bg-surface border border-muted-200 rounded-lg px-4 py-2 text-center shadow-sm">
    <div className={cn("text-xl font-black", color)}>{value}</div>
    <div className="text-[10px] text-muted-400 font-medium">{label}</div>
  </div>
)

const LegendItem = ({ color, label }) => (
  <div className="flex items-center gap-1.5">
    <div className={cn("w-4 h-4 rounded", color)} />
    <span>{label}</span>
  </div>
)

// ── Modal paiement ────────────────────────────────────────────────────────────

const METHODS = [
  { value: 'cash',         label: 'Espèces' },
  { value: 'mobile_money', label: 'Mobile Money' },
  { value: 'bank_transfer',label: 'Virement bancaire' },
  { value: 'manual',       label: 'Autre / Manuel' },
]

function PaymentModal({ tenant, month, year, onClose, onSaved }) {
  const MONTHS_FULL = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']

  const [form, setForm] = useState({
    amount:         tenant.pack?.price ?? 25000,
    payment_method: 'mobile_money',
    notes:          '',
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await adminService.recordPayment(tenant.id, {
        month,
        year,
        amount:         form.amount,
        status:         'paid',
        payment_method: form.payment_method,
        notes:          form.notes || `Paiement ${MONTHS_FULL[month - 1]} ${year}`,
      })
      toast.success(`Paiement de ${MONTHS_FULL[month - 1]} ${year} enregistré ✓`)
      onSaved()
    } catch {
      toast.error("Erreur lors de l'enregistrement du paiement")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <form
        onSubmit={handleSubmit}
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-muted-100">
          <div>
            <div className="font-black text-navy">Encaisser un paiement</div>
            <div className="text-xs text-muted-500 mt-0.5">
              {tenant.name} · {MONTHS_FULL[month - 1]} {year}
            </div>
          </div>
          <button type="button" onClick={onClose}>
            <X size={20} className="text-muted-400 hover:text-muted-600" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Montant */}
          <div>
            <label className="label-field">Montant (FCFA) *</label>
            <div className="relative">
              <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-400" />
              <input
                type="number"
                className="input-field pl-9"
                value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                required min="0"
              />
            </div>
          </div>

          {/* Méthode */}
          <div>
            <label className="label-field">Méthode de paiement</label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              {METHODS.map(m => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, payment_method: m.value }))}
                  className={cn(
                    "px-3 py-2.5 rounded-btn border text-sm font-medium transition-all text-left",
                    form.payment_method === m.value
                      ? "border-primary-400 bg-primary-50 text-primary-700"
                      : "border-muted-200 text-muted-600 hover:border-muted-300"
                  )}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="label-field">Notes (optionnel)</label>
            <input
              className="input-field"
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder={`Paiement ${MONTHS_FULL[month - 1]} ${year}…`}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-muted-100 bg-muted-50">
          <button type="button" onClick={onClose} className="btn-outline">Annuler</button>
          <button type="submit" disabled={saving} className="btn-primary flex items-center gap-1.5">
            <Check size={15} />
            {saving ? 'Enregistrement…' : 'Confirmer le paiement'}
          </button>
        </div>
      </form>
    </div>
  )
}
