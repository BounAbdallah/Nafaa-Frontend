import { useEffect, useState, useCallback } from 'react'
import { accountingService } from '@/services/financeService'
import { useCurrency } from '@/utils/currency'
import toast from 'react-hot-toast'
import { Library, Loader2, Search } from 'lucide-react'
import { cn } from '@/utils/cn'

const monthStartISO = () => { const d = new Date(); d.setDate(1); return d.toISOString().slice(0, 10) }
const todayISO      = () => new Date().toISOString().slice(0, 10)

export default function LedgerPage() {
  const { format: fmt } = useCurrency()
  const [from, setFrom]         = useState(monthStartISO())
  const [to, setTo]             = useState(todayISO())
  const [accounts, setAccounts] = useState([])
  const [selected, setSelected] = useState('')
  const [data, setData]         = useState(null)
  const [loading, setLoading]   = useState(false)
  const [loadingAcc, setLoadingAcc] = useState(true)

  useEffect(() => {
    accountingService.getAccounts()
      .then(r => setAccounts(r.data.accounts))
      .catch(() => toast.error('Impossible de charger les comptes.'))
      .finally(() => setLoadingAcc(false))
  }, [])

  const load = useCallback(async () => {
    if (!selected) return
    setLoading(true)
    try {
      const r = await accountingService.getLedger({ account: selected, from, to })
      setData(r.data)
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Impossible de charger le grand livre.')
    } finally {
      setLoading(false)
    }
  }, [selected, from, to])

  useEffect(() => { load() }, [load])

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-display font-bold text-navy flex items-center gap-2">
          <Library size={18} className="text-primary-500" /> Grand livre
        </h2>
        <p className="text-xs text-muted-400 mt-0.5">Historique chronologique des mouvements par compte.</p>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap items-center gap-2">
        <select
          className="input-field h-9 text-sm min-w-[200px]"
          value={selected}
          onChange={e => setSelected(e.target.value)}
          disabled={loadingAcc}
        >
          <option value="">— Choisir un compte —</option>
          {accounts.map(a => (
            <option key={a.number} value={a.number}>{a.number} — {a.label}</option>
          ))}
        </select>
        <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="input-field h-9 text-sm" />
        <span className="text-muted-400 text-xs">→</span>
        <input type="date" value={to}   onChange={e => setTo(e.target.value)}   className="input-field h-9 text-sm" />
      </div>

      {!selected ? (
        <div className="card p-10 text-center text-muted-400 text-sm">Sélectionnez un compte pour afficher ses mouvements.</div>
      ) : loading ? (
        <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-primary-500" /></div>
      ) : !data || data.lines.length === 0 ? (
        <div className="card p-10 text-center text-muted-400 text-sm">Aucun mouvement sur ce compte pour la période.</div>
      ) : (
        <>
          <div className="card overflow-hidden">
            <div className="px-4 py-3 bg-muted-50 border-b border-muted-100">
              <p className="font-display font-bold text-navy">
                {data.account.number} — {data.account.label}
              </p>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-muted-400 border-b border-muted-100">
                  <th className="text-left px-4 py-2 font-medium">Date</th>
                  <th className="text-left px-4 py-2 font-medium">Référence</th>
                  <th className="text-left px-4 py-2 font-medium">Description</th>
                  <th className="text-right px-4 py-2 font-medium">Débit</th>
                  <th className="text-right px-4 py-2 font-medium">Crédit</th>
                  <th className="text-right px-4 py-2 font-medium">Solde</th>
                </tr>
              </thead>
              <tbody>
                {data.lines.map((l, i) => (
                  <tr key={i} className="border-b border-muted-50 hover:bg-muted-50">
                    <td className="px-4 py-2 text-xs text-muted-500">{l.date}</td>
                    <td className="px-4 py-2 text-xs font-mono text-muted-400">{l.reference ?? '—'}</td>
                    <td className="px-4 py-2">{l.description}</td>
                    <td className="px-4 py-2 text-right">{l.debit > 0 ? fmt(l.debit) : '—'}</td>
                    <td className="px-4 py-2 text-right">{l.credit > 0 ? fmt(l.credit) : '—'}</td>
                    <td className={cn('px-4 py-2 text-right font-medium', l.solde >= 0 ? 'text-success' : 'text-danger')}>
                      {fmt(Math.abs(l.solde))}{l.solde < 0 ? ' C' : ' D'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-muted-200 bg-muted-50 font-bold text-sm">
                  <td colSpan={3} className="px-4 py-2 text-muted-500">Totaux</td>
                  <td className="px-4 py-2 text-right">{fmt(data.total_debit)}</td>
                  <td className="px-4 py-2 text-right">{fmt(data.total_credit)}</td>
                  <td className="px-4 py-2 text-right text-navy">{fmt(Math.abs(data.total_debit - data.total_credit))}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
