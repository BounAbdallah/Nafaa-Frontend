import { useEffect, useState, useCallback } from 'react'
import { accountingService } from '@/services/financeService'
import { useCurrency } from '@/utils/currency'
import toast from 'react-hot-toast'
import { BarChart2, Loader2, TrendingUp, TrendingDown, Wallet } from 'lucide-react'
import { cn } from '@/utils/cn'

const todayISO      = () => new Date().toISOString().slice(0, 10)
const yearStartISO  = () => new Date().getFullYear() + '-01-01'

function Section({ title, rows, total, color }) {
  const { format: fmt } = useCurrency()
  return (
    <div className="card overflow-hidden">
      <div className={cn('px-4 py-3 border-b border-muted-100', color)}>
        <p className="font-display font-bold">{title}</p>
      </div>
      <table className="w-full text-sm">
        <tbody>
          {rows.map(r => (
            <tr key={r.number} className="border-b border-muted-50 hover:bg-muted-50">
              <td className="px-4 py-2 font-mono text-xs text-muted-400 w-16">{r.number}</td>
              <td className="px-4 py-2 text-navy">{r.label}</td>
              <td className="px-4 py-2 text-right font-medium text-navy">{fmt(r.total)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-muted-200 bg-muted-50 font-bold">
            <td colSpan={2} className="px-4 py-2 text-muted-600">Total</td>
            <td className="px-4 py-2 text-right">{fmt(total)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

function BilanSection({ title, items, total, color }) {
  const { format: fmt } = useCurrency()
  return (
    <div className="card overflow-hidden">
      <div className={cn('px-4 py-3 border-b border-muted-100', color)}>
        <p className="font-display font-bold">{title}</p>
      </div>
      <table className="w-full text-sm">
        <tbody>
          {Object.entries(items).map(([label, value]) => (
            <tr key={label} className="border-b border-muted-50 hover:bg-muted-50">
              <td className="px-4 py-2 text-navy">{label}</td>
              <td className="px-4 py-2 text-right font-medium text-navy">{fmt(Math.abs(value))}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-muted-200 bg-muted-50 font-bold">
            <td className="px-4 py-2 text-muted-600">Total</td>
            <td className="px-4 py-2 text-right">{fmt(Math.abs(total))}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

export default function StatementsPage() {
  const { format: fmt } = useCurrency()
  const [tab, setTab]   = useState('resultat')
  const [from, setFrom] = useState(yearStartISO())
  const [to, setTo]     = useState(todayISO())
  const [resultat, setResultat] = useState(null)
  const [bilan, setBilan]       = useState(null)
  const [loading, setLoading]   = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [rRes, bRes] = await Promise.all([
        accountingService.getResultat({ from, to }),
        accountingService.getBilan({ to }),
      ])
      setResultat(rRes.data)
      setBilan(bRes.data)
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Impossible de charger les états financiers.')
    } finally {
      setLoading(false)
    }
  }, [from, to])

  useEffect(() => { load() }, [load])

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-display font-bold text-navy flex items-center gap-2">
            <BarChart2 size={18} className="text-primary-500" /> États financiers
          </h2>
          <p className="text-xs text-muted-400 mt-0.5">Compte de résultat et bilan simpliifié SYSCOHADA.</p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="input-field h-9 text-sm" />
          <span className="text-muted-400 text-xs">→</span>
          <input type="date" value={to}   onChange={e => setTo(e.target.value)}   className="input-field h-9 text-sm" />
        </div>
      </div>

      {/* Sous-onglets */}
      <div className="flex gap-1 border-b border-muted-100">
        {[
          { id: 'resultat', label: 'Compte de résultat' },
          { id: 'bilan',    label: 'Bilan' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={cn('px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px',
              tab === t.id ? 'border-primary-500 text-primary-500' : 'border-transparent text-muted-500 hover:text-navy')}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-primary-500" /></div>
      ) : tab === 'resultat' && resultat ? (
        <div className="space-y-4">
          {/* Résumé */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="card p-4 text-center">
              <div className="flex justify-center mb-2"><TrendingUp size={20} className="text-success" /></div>
              <p className="text-xs text-muted-500">Total Produits</p>
              <p className="text-xl font-display font-bold text-success">{fmt(resultat.total_produits)}</p>
            </div>
            <div className="card p-4 text-center">
              <div className="flex justify-center mb-2"><TrendingDown size={20} className="text-danger" /></div>
              <p className="text-xs text-muted-500">Total Charges</p>
              <p className="text-xl font-display font-bold text-danger">{fmt(resultat.total_charges)}</p>
            </div>
            <div className={cn('card p-4 text-center', resultat.resultat_net >= 0 ? 'border-2 border-success' : 'border-2 border-danger')}>
              <div className="flex justify-center mb-2"><Wallet size={20} className={resultat.resultat_net >= 0 ? 'text-success' : 'text-danger'} /></div>
              <p className="text-xs text-muted-500">Résultat net</p>
              <p className={cn('text-xl font-display font-bold', resultat.resultat_net >= 0 ? 'text-success' : 'text-danger')}>
                {resultat.resultat_net >= 0 ? '+' : ''}{fmt(resultat.resultat_net)}
              </p>
              <p className="text-xs text-muted-400 mt-1">{resultat.resultat_net >= 0 ? 'Bénéfice' : 'Déficit'}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {resultat.produits.length > 0 && (
              <Section title="Produits (Classe 7)" rows={resultat.produits} total={resultat.total_produits}
                color="bg-emerald-50 text-emerald-800" />
            )}
            {resultat.charges.length > 0 && (
              <Section title="Charges (Classe 6)" rows={resultat.charges}  total={resultat.total_charges}
                color="bg-red-50 text-red-800" />
            )}
          </div>

          {resultat.produits.length === 0 && resultat.charges.length === 0 && (
            <div className="card p-10 text-center text-muted-400 text-sm">
              Aucune écriture de produits ou charges sur la période.
            </div>
          )}
        </div>
      ) : tab === 'bilan' && bilan ? (
        <div className="space-y-4">
          {/* Check équilibre */}
          <div className={cn('flex items-center gap-2 text-sm px-4 py-2.5 rounded-card',
            Math.abs(bilan.total_actif - bilan.total_passif) < 1
              ? 'bg-green-50 text-success'
              : 'bg-amber-50 text-amber-700')}>
            {Math.abs(bilan.total_actif - bilan.total_passif) < 1
              ? `✓ Bilan équilibré — Actif = Passif = ${fmt(bilan.total_actif)}`
              : `⚠ Bilan provisoire — Actif ${fmt(bilan.total_actif)} / Passif ${fmt(bilan.total_passif)}`
            }
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <BilanSection title="ACTIF" items={bilan.actif} total={bilan.total_actif}
              color="bg-blue-50 text-blue-800" />
            <BilanSection title="PASSIF & CAPITAUX" items={bilan.passif} total={bilan.total_passif}
              color="bg-purple-50 text-purple-800" />
          </div>
        </div>
      ) : null}
    </div>
  )
}
