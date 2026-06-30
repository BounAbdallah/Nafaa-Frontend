import { useEffect, useState, useCallback } from 'react'
import { accountingService } from '@/services/financeService'
import { useCurrency } from '@/utils/currency'
import toast from 'react-hot-toast'
import { Scale, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { cn } from '@/utils/cn'

const monthStartISO = () => { const d = new Date(); d.setDate(1); return d.toISOString().slice(0, 10) }
const todayISO      = () => new Date().toISOString().slice(0, 10)

const CLASS_COLORS = {
  1: 'bg-purple-50 text-purple-700',
  2: 'bg-blue-50 text-blue-700',
  3: 'bg-amber-50 text-amber-700',
  4: 'bg-teal-50 text-teal-700',
  5: 'bg-green-50 text-green-700',
  6: 'bg-red-50 text-red-700',
  7: 'bg-emerald-50 text-emerald-700',
}

export default function BalancePage() {
  const { format: fmt } = useCurrency()
  const [from, setFrom] = useState(monthStartISO())
  const [to, setTo]     = useState(todayISO())
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await accountingService.getBalance({ from, to })
      setData(r.data)
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Impossible de charger la balance.')
    } finally {
      setLoading(false)
    }
  }, [from, to])

  useEffect(() => { load() }, [load])

  // Grouper par classe
  const grouped = data
    ? data.rows.reduce((acc, row) => {
        const key = row.class
        if (!acc[key]) acc[key] = { label: row.class_label, rows: [] }
        acc[key].rows.push(row)
        return acc
      }, {})
    : {}

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-display font-bold text-navy flex items-center gap-2">
            <Scale size={18} className="text-primary-500" /> Balance des comptes
          </h2>
          <p className="text-xs text-muted-400 mt-0.5">Totaux débit / crédit / solde par compte sur la période.</p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="input-field h-9 text-sm" />
          <span className="text-muted-400 text-xs">→</span>
          <input type="date" value={to}   onChange={e => setTo(e.target.value)}   className="input-field h-9 text-sm" />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-primary-500" /></div>
      ) : !data || data.rows.length === 0 ? (
        <div className="card p-10 text-center text-muted-400 text-sm">Aucune écriture sur la période.</div>
      ) : (
        <>
          {/* Indicateur équilibre */}
          <div className={cn('flex items-center gap-2 text-sm px-4 py-2.5 rounded-card',
            data.is_balanced ? 'bg-green-50 text-success' : 'bg-red-50 text-danger')}>
            {data.is_balanced
              ? <><CheckCircle size={15} /> Balance équilibrée — Σ Débits = Σ Crédits = {fmt(data.total_debit)}</>
              : <><AlertCircle size={15} /> Balance déséquilibrée — Débits {fmt(data.total_debit)} ≠ Crédits {fmt(data.total_credit)}</>}
          </div>

          {/* Tableau par classe */}
          {Object.entries(grouped).map(([cls, group]) => (
            <div key={cls} className="card overflow-hidden">
              <div className="px-4 py-2.5 bg-muted-50 border-b border-muted-100 flex items-center gap-2">
                <span className={cn('text-xs font-bold px-2 py-0.5 rounded', CLASS_COLORS[cls] ?? 'bg-muted-100 text-muted-600')}>
                  Classe {cls}
                </span>
                <span className="text-sm font-medium text-navy">{group.label}</span>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-muted-400 border-b border-muted-100">
                    <th className="text-left px-4 py-2 font-medium">N° Compte</th>
                    <th className="text-left px-4 py-2 font-medium">Libellé</th>
                    <th className="text-right px-4 py-2 font-medium">Débit</th>
                    <th className="text-right px-4 py-2 font-medium">Crédit</th>
                    <th className="text-right px-4 py-2 font-medium">Solde D</th>
                    <th className="text-right px-4 py-2 font-medium">Solde C</th>
                  </tr>
                </thead>
                <tbody>
                  {group.rows.map(row => (
                    <tr key={row.number} className="border-b border-muted-50 hover:bg-muted-50">
                      <td className="px-4 py-2 font-mono text-xs text-muted-600">{row.number}</td>
                      <td className="px-4 py-2 text-navy">{row.label}</td>
                      <td className="px-4 py-2 text-right">{row.total_debit > 0 ? fmt(row.total_debit) : '—'}</td>
                      <td className="px-4 py-2 text-right">{row.total_credit > 0 ? fmt(row.total_credit) : '—'}</td>
                      <td className="px-4 py-2 text-right font-medium text-navy">{row.solde_debit > 0 ? fmt(row.solde_debit) : '—'}</td>
                      <td className="px-4 py-2 text-right font-medium text-navy">{row.solde_credit > 0 ? fmt(row.solde_credit) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}

          {/* Total général */}
          <div className="card p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total Débits',  value: data.total_debit,  color: 'text-navy' },
              { label: 'Total Crédits', value: data.total_credit, color: 'text-navy' },
              { label: 'Soldes Débiteurs',  value: data.rows.reduce((s,r)=>s+r.solde_debit,0),  color: 'text-success' },
              { label: 'Soldes Créditeurs', value: data.rows.reduce((s,r)=>s+r.solde_credit,0), color: 'text-primary-500' },
            ].map(({ label, value, color }) => (
              <div key={label} className="text-center">
                <p className="text-xs text-muted-500">{label}</p>
                <p className={cn('text-base font-display font-bold', color)}>{fmt(value)}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
