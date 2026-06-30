import { useEffect, useState, useCallback } from 'react'
import { financeService } from '@/services/financeService'
import { useCurrency } from '@/utils/currency'
import toast from 'react-hot-toast'
import {
  Calculator, TrendingUp, TrendingDown, Wallet, AlertTriangle, Loader2, RefreshCw,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell,
} from 'recharts'
import { cn } from '@/utils/cn'

const COLORS = ['#3AA0D8', '#E8A020', '#FF7A6A', '#34D399', '#7EC3E8', '#A78BFA', '#F472B6']
const todayISO = () => new Date().toISOString().slice(0, 10)
const monthStartISO = () => { const d = new Date(); d.setDate(1); return d.toISOString().slice(0, 10) }

function StatCard({ icon: Icon, label, value, color, sub }) {
  return (
    <div className="card p-4 sm:p-5">
      <div className="flex items-center gap-3">
        <div className={cn('w-10 h-10 rounded-card flex items-center justify-center shrink-0', color)}>
          <Icon size={18} />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-sans text-muted-500">{label}</p>
          <p className="text-lg sm:text-xl font-display font-bold text-navy truncate">{value}</p>
          {sub && <p className="text-[11px] text-muted-400">{sub}</p>}
        </div>
      </div>
    </div>
  )
}

export default function AccountingPage() {
  const { format: fmt } = useCurrency()
  const [from, setFrom] = useState(monthStartISO())
  const [to, setTo]     = useState(todayISO())
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await financeService.getSummary({ from, to })
      setData(r.data)
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Impossible de charger la comptabilité.')
    } finally {
      setLoading(false)
    }
  }, [from, to])

  useEffect(() => { load() }, [load])

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-bold text-navy flex items-center gap-2">
            <Calculator size={22} className="text-primary-500" />
            Comptabilité
          </h1>
          <p className="text-sm font-sans text-muted-500 mt-1">L'argent qui entre et qui sort de votre entreprise.</p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="input-field h-10 text-sm" />
          <span className="text-muted-400 text-xs">→</span>
          <input type="date" value={to} onChange={e => setTo(e.target.value)} className="input-field h-10 text-sm" />
          <button onClick={load} className="btn-secondary p-2.5" title="Actualiser"><RefreshCw size={15} /></button>
        </div>
      </div>

      {loading || !data ? (
        <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin text-primary-500" /></div>
      ) : (
        <>
          {/* Cartes clés */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <StatCard icon={TrendingUp}   label="Entrées (encaissé)" value={fmt(data.money_in)} color="bg-green-50 text-success"
              sub={`Ventes ${fmt(data.sales_paid)}`} />
            <StatCard icon={TrendingDown} label="Sorties (dépenses)" value={fmt(data.expenses)} color="bg-red-50 text-danger" />
            <StatCard icon={Wallet}       label="Solde net" value={fmt(data.net)}
              color={data.net >= 0 ? 'bg-primary-50 text-primary-500' : 'bg-red-50 text-danger'}
              sub={data.net >= 0 ? 'Bénéfice de caisse' : 'Déficit de caisse'} />
            <StatCard icon={AlertTriangle} label="Créances clients" value={fmt(data.outstanding_debt)} color="bg-amber-50 text-amber-500"
              sub="Dettes en cours" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Évolution mensuelle */}
            <div className="card p-4 sm:p-6 lg:col-span-2">
              <h3 className="font-display font-bold text-navy mb-4">Entrées vs Sorties (6 mois)</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                  <BarChart data={data.monthly} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }}
                      tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
                    <Tooltip formatter={(v) => fmt(v)} contentStyle={{ borderRadius: 8, border: 'none', fontSize: 12, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="entrees" name="Entrées" fill="#34D399" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="sorties" name="Sorties" fill="#FF7A6A" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Dépenses par catégorie */}
            <div className="card p-4 sm:p-6">
              <h3 className="font-display font-bold text-navy mb-4">Dépenses par catégorie</h3>
              {data.by_category.length === 0 ? (
                <p className="text-sm text-muted-400 text-center py-10">Aucune dépense sur la période.</p>
              ) : (
                <>
                  <div className="h-44">
                    <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                      <PieChart>
                        <Pie data={data.by_category} dataKey="total" nameKey="category" innerRadius={45} outerRadius={70} paddingAngle={4}>
                          {data.by_category.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip formatter={(v) => fmt(v)} contentStyle={{ borderRadius: 8, border: 'none', fontSize: 12 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-3 space-y-1.5">
                    {data.by_category.slice(0, 6).map((c, i) => (
                      <div key={c.category} className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-2 text-muted-600">
                          <span className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                          {c.category}
                        </span>
                        <span className="font-bold text-navy">{fmt(c.total)}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Détail des entrées */}
          <div className="card p-4 sm:p-5">
            <h3 className="font-display font-bold text-navy mb-3">Détail des entrées</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-muted-50 rounded-card p-3">
                <p className="text-xs text-muted-500">Ventes encaissées</p>
                <p className="text-base font-display font-bold text-navy">{fmt(data.sales_paid)}</p>
              </div>
              <div className="bg-muted-50 rounded-card p-3">
                <p className="text-xs text-muted-500">Remboursements de dettes</p>
                <p className="text-base font-display font-bold text-navy">{fmt(data.repayments)}</p>
              </div>
              <div className="bg-muted-50 rounded-card p-3">
                <p className="text-xs text-muted-500">Dépôts d'avance reçus</p>
                <p className="text-base font-display font-bold text-navy">{fmt(data.deposits)}</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
