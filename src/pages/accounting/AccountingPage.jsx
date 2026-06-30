import { useEffect, useState, useCallback } from 'react'
import { financeService, cashMovementService, expenseCategoryService } from '@/services/financeService'
import { useCurrency } from '@/utils/currency'
import toast from 'react-hot-toast'
import {
  Calculator, TrendingUp, TrendingDown, Wallet, AlertTriangle, Loader2,
  RefreshCw, FileDown, FileSpreadsheet, Plus, Trash2, Tag, ArrowUpCircle,
  ArrowDownCircle, Banknote, X, ChevronRight,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell,
} from 'recharts'
import { cn } from '@/utils/cn'

const COLORS = ['#3AA0D8', '#E8A020', '#FF7A6A', '#34D399', '#7EC3E8', '#A78BFA', '#F472B6']
const todayISO      = () => new Date().toISOString().slice(0, 10)
const monthStartISO = () => { const d = new Date(); d.setDate(1); return d.toISOString().slice(0, 10) }

const MOVEMENT_TYPES = {
  income:       { label: 'Autre recette',   icon: ArrowUpCircle,   color: 'text-success bg-green-50' },
  withdrawal:   { label: 'Retrait patron',  icon: ArrowDownCircle, color: 'text-danger bg-red-50' },
  contribution: { label: 'Apport / Capital', icon: Banknote,        color: 'text-primary-500 bg-primary-50' },
}

const PAYMENT_METHODS = ['cash','wave','orange_money','mtn_momo','bank_transfer','cheque']
const PAYMENT_LABELS  = { cash:'Espèces', wave:'Wave', orange_money:'Orange Money', mtn_momo:'MTN MoMo', bank_transfer:'Virement', cheque:'Chèque' }

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

// ── Onglet Dashboard ─────────────────────────────────────────────────────────

function DashboardTab({ from, to, onExport, exporting }) {
  const { format: fmt } = useCurrency()
  const [data, setData]     = useState(null)
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

  if (loading || !data) {
    return <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin text-primary-500" /></div>
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Export buttons */}
      <div className="flex items-center gap-2 justify-end">
        <button
          onClick={() => onExport('pdf')}
          disabled={exporting}
          className="btn-secondary flex items-center gap-2 text-sm"
        >
          {exporting === 'pdf' ? <Loader2 size={14} className="animate-spin" /> : <FileDown size={14} />}
          PDF
        </button>
        <button
          onClick={() => onExport('excel')}
          disabled={exporting}
          className="btn-secondary flex items-center gap-2 text-sm"
        >
          {exporting === 'excel' ? <Loader2 size={14} className="animate-spin" /> : <FileSpreadsheet size={14} />}
          Excel
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard icon={TrendingUp}    label="Entrées (encaissé)"  value={fmt(data.money_in)}
          color="bg-green-50 text-success"
          sub={`Ventes ${fmt(data.sales_paid)}`} />
        <StatCard icon={TrendingDown}  label="Sorties (dépenses + retraits)" value={fmt(data.total_out ?? data.expenses)}
          color="bg-red-50 text-danger" />
        <StatCard icon={Wallet}        label="Solde net" value={fmt(data.net)}
          color={data.net >= 0 ? 'bg-primary-50 text-primary-500' : 'bg-red-50 text-danger'}
          sub={data.net >= 0 ? 'Bénéfice de caisse' : 'Déficit de caisse'} />
        <StatCard icon={AlertTriangle} label="Créances clients" value={fmt(data.outstanding_debt)}
          color="bg-amber-50 text-amber-500" sub="Dettes en cours" />
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-muted-50 rounded-card p-3">
            <p className="text-xs text-muted-500">Ventes encaissées</p>
            <p className="text-base font-display font-bold text-navy">{fmt(data.sales_paid)}</p>
          </div>
          <div className="bg-muted-50 rounded-card p-3">
            <p className="text-xs text-muted-500">Remboursements dettes</p>
            <p className="text-base font-display font-bold text-navy">{fmt(data.repayments)}</p>
          </div>
          <div className="bg-muted-50 rounded-card p-3">
            <p className="text-xs text-muted-500">Dépôts d'avance</p>
            <p className="text-base font-display font-bold text-navy">{fmt(data.deposits)}</p>
          </div>
          {data.manual_income > 0 && (
            <div className="bg-muted-50 rounded-card p-3">
              <p className="text-xs text-muted-500">Autres recettes manuelles</p>
              <p className="text-base font-display font-bold text-navy">{fmt(data.manual_income)}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Onglet Mouvements manuels ────────────────────────────────────────────────

function MovementsTab({ from, to }) {
  const { format: fmt } = useCurrency()
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving]   = useState(false)
  const [form, setForm]       = useState({
    type: 'income', label: '', amount: '', payment_method: 'cash',
    movement_date: todayISO(), notes: '',
  })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await cashMovementService.getAll({ from, to })
      setData(r.data)
    } catch { toast.error('Impossible de charger les mouvements.') }
    finally   { setLoading(false) }
  }, [from, to])

  useEffect(() => { load() }, [load])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await cashMovementService.create({ ...form, amount: parseFloat(form.amount) })
      toast.success('Mouvement enregistré.')
      setShowForm(false)
      setForm({ type: 'income', label: '', amount: '', payment_method: 'cash', movement_date: todayISO(), notes: '' })
      load()
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Erreur lors de l\'enregistrement.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Supprimer ce mouvement ?')) return
    try {
      await cashMovementService.remove(id)
      toast.success('Mouvement supprimé.')
      load()
    } catch { toast.error('Impossible de supprimer.') }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-500">Recettes hors ventes, retraits patron, apports de capital.</p>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={15} /> Nouveau mouvement
        </button>
      </div>

      {/* Formulaire */}
      {showForm && (
        <div className="card p-4 sm:p-6 border border-primary-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-navy">Nouveau mouvement</h3>
            <button onClick={() => setShowForm(false)} className="text-muted-400 hover:text-navy"><X size={16} /></button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label-field">Type</label>
              <select className="input-field" value={form.type} onChange={e => setForm(f => ({...f, type: e.target.value}))}>
                {Object.entries(MOVEMENT_TYPES).map(([v, {label}]) => (
                  <option key={v} value={v}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-field">Libellé *</label>
              <input className="input-field" required placeholder="ex : Recette marché, Retrait semaine…"
                value={form.label} onChange={e => setForm(f => ({...f, label: e.target.value}))} />
            </div>
            <div>
              <label className="label-field">Montant *</label>
              <input className="input-field" type="number" min="0.01" step="any" required
                value={form.amount} onChange={e => setForm(f => ({...f, amount: e.target.value}))} />
            </div>
            <div>
              <label className="label-field">Date *</label>
              <input className="input-field" type="date" required
                value={form.movement_date} onChange={e => setForm(f => ({...f, movement_date: e.target.value}))} />
            </div>
            <div>
              <label className="label-field">Mode de paiement</label>
              <select className="input-field" value={form.payment_method} onChange={e => setForm(f => ({...f, payment_method: e.target.value}))}>
                {PAYMENT_METHODS.map(m => <option key={m} value={m}>{PAYMENT_LABELS[m]}</option>)}
              </select>
            </div>
            <div>
              <label className="label-field">Notes</label>
              <input className="input-field" placeholder="Optionnel"
                value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} />
            </div>
            <div className="sm:col-span-2 flex gap-3 justify-end pt-2">
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary text-sm">Annuler</button>
              <button type="submit" disabled={saving} className="btn-primary text-sm flex items-center gap-2">
                {saving && <Loader2 size={14} className="animate-spin" />} Enregistrer
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Totaux */}
      {data && (
        <div className="grid grid-cols-3 gap-3">
          <div className="card p-3 text-center">
            <p className="text-xs text-muted-500 mb-1">Entrées manuelles</p>
            <p className="font-display font-bold text-success">{fmt(data.total_in)}</p>
          </div>
          <div className="card p-3 text-center">
            <p className="text-xs text-muted-500 mb-1">Retraits</p>
            <p className="font-display font-bold text-danger">{fmt(data.total_out)}</p>
          </div>
          <div className="card p-3 text-center">
            <p className="text-xs text-muted-500 mb-1">Net</p>
            <p className={cn('font-display font-bold', data.net >= 0 ? 'text-primary-500' : 'text-danger')}>{fmt(data.net)}</p>
          </div>
        </div>
      )}

      {/* Liste */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-primary-500" /></div>
      ) : !data || data.movements.length === 0 ? (
        <div className="card p-8 text-center text-muted-400 text-sm">Aucun mouvement sur la période.</div>
      ) : (
        <div className="card divide-y divide-muted-100">
          {data.movements.map(mv => {
            const T = MOVEMENT_TYPES[mv.type] ?? MOVEMENT_TYPES.income
            const Icon = T.icon
            return (
              <div key={mv.id} className="flex items-center gap-3 p-3 hover:bg-muted-50">
                <div className={cn('w-8 h-8 rounded-full flex items-center justify-center shrink-0', T.color)}>
                  <Icon size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-navy truncate">{mv.label}</p>
                  <p className="text-xs text-muted-400">{mv.movement_date} · {mv.type_label} · {PAYMENT_LABELS[mv.payment_method] ?? mv.payment_method}</p>
                </div>
                <p className={cn('text-sm font-bold shrink-0', mv.is_income ? 'text-success' : 'text-danger')}>
                  {mv.is_income ? '+' : '-'}{fmt(mv.amount)}
                </p>
                <button onClick={() => handleDelete(mv.id)} className="text-muted-300 hover:text-danger ml-1">
                  <Trash2 size={13} />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Onglet Catégories ────────────────────────────────────────────────────────

function CategoriesTab() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading]       = useState(true)
  const [newLabel, setNewLabel]     = useState('')
  const [saving, setSaving]         = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await expenseCategoryService.getAll()
      setCategories(r.data.categories)
    } catch { toast.error('Impossible de charger les catégories.') }
    finally   { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!newLabel.trim()) return
    setSaving(true)
    try {
      await expenseCategoryService.create({ label: newLabel.trim() })
      toast.success('Catégorie ajoutée.')
      setNewLabel('')
      load()
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Erreur.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Supprimer cette catégorie ?')) return
    try {
      await expenseCategoryService.remove(id)
      toast.success('Catégorie supprimée.')
      load()
    } catch { toast.error('Impossible de supprimer.') }
  }

  return (
    <div className="space-y-4 max-w-xl">
      <p className="text-sm text-muted-500">
        Ajoutez des catégories de dépenses spécifiques à votre activité. Les catégories système ne peuvent pas être supprimées.
      </p>

      {/* Ajouter */}
      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          className="input-field flex-1"
          placeholder="Nom de la catégorie, ex : Emballages, Frais bancaires…"
          value={newLabel}
          onChange={e => setNewLabel(e.target.value)}
        />
        <button type="submit" disabled={saving || !newLabel.trim()} className="btn-primary flex items-center gap-1.5 text-sm">
          {saving ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
          Ajouter
        </button>
      </form>

      {/* Liste */}
      {loading ? (
        <div className="flex justify-center py-8"><Loader2 size={20} className="animate-spin text-primary-500" /></div>
      ) : (
        <div className="card divide-y divide-muted-100">
          {categories.map(cat => (
            <div key={cat.value} className="flex items-center justify-between px-4 py-2.5">
              <div className="flex items-center gap-2">
                <Tag size={13} className="text-muted-400" />
                <span className="text-sm text-navy">{cat.label}</span>
                {cat.custom && <span className="text-[10px] bg-primary-50 text-primary-500 px-1.5 py-0.5 rounded font-medium">Personnalisée</span>}
              </div>
              {cat.custom && (
                <button onClick={() => handleDelete(cat.id)} className="text-muted-300 hover:text-danger">
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Page principale ──────────────────────────────────────────────────────────

const TABS = [
  { id: 'dashboard',   label: 'Tableau de bord' },
  { id: 'movements',   label: 'Mouvements manuels' },
  { id: 'categories',  label: 'Catégories' },
]

export default function AccountingPage() {
  const [from, setFrom]       = useState(monthStartISO())
  const [to, setTo]           = useState(todayISO())
  const [tab, setTab]         = useState('dashboard')
  const [exporting, setExporting] = useState(null)

  const handleExport = async (format) => {
    setExporting(format)
    try {
      const blob = format === 'pdf'
        ? await financeService.exportPdf({ from, to })
        : await financeService.exportExcel({ from, to })

      const url  = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href     = url
      link.download = `rapport-financier-${from}-${to}.${format === 'pdf' ? 'pdf' : 'xlsx'}`
      link.click()
      URL.revokeObjectURL(url)
    } catch {
      toast.error('Impossible de générer l\'export.')
    } finally {
      setExporting(null)
    }
  }

  const showDateFilter = tab !== 'categories'

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
        {showDateFilter && (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="input-field h-10 text-sm" />
            <span className="text-muted-400 text-xs">→</span>
            <input type="date" value={to}   onChange={e => setTo(e.target.value)}   className="input-field h-10 text-sm" />
          </div>
        )}
      </div>

      {/* Onglets */}
      <div className="flex gap-1 border-b border-muted-100">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px',
              tab === t.id
                ? 'border-primary-500 text-primary-500'
                : 'border-transparent text-muted-500 hover:text-navy'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Contenu */}
      {tab === 'dashboard'  && <DashboardTab  from={from} to={to} onExport={handleExport} exporting={exporting} />}
      {tab === 'movements'  && <MovementsTab  from={from} to={to} />}
      {tab === 'categories' && <CategoriesTab />}
    </div>
  )
}
