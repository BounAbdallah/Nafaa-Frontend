import { useEffect, useState, useCallback } from 'react'
import { adminService } from '@/services/adminService'
import {
  CreditCard, CheckCircle2, XCircle, AlertCircle, Clock, Activity,
  Building, ChevronLeft, ChevronRight, X, Check, DollarSign,
  TrendingUp, Users, Filter, RefreshCw, BarChart2, Shield,
  Zap, Eye, ArrowUpRight, ArrowDownRight,
} from 'lucide-react'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { cn } from '@/utils/cn'
import toast from 'react-hot-toast'

// ── Constantes ─────────────────────────────────────────────────────────────────
const MONTHS     = ['Jan','Fév','Mar','Avr','Mai','Jui','Jul','Aoû','Sep','Oct','Nov','Déc']
const MONTHS_FULL = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']
const fmtNum  = (n) => new Intl.NumberFormat('fr-FR').format(n ?? 0)
const fmtFcfa = (n) => new Intl.NumberFormat('fr-FR').format(n ?? 0) + ' FCFA'
const PIE_COLORS = ['#3AA0D8','#E8A020','#34D399','#FF7A6A','#8B5CF6','#F59E0B','#10B981']

const currentYear  = new Date().getFullYear()
const currentMonth = new Date().getMonth() + 1

// ── Helpers ────────────────────────────────────────────────────────────────────
function getStartMonth(tenant, forYear) {
  if (!tenant.created_at) return 1
  const d = new Date(tenant.created_at)
  const sy = d.getFullYear()
  const sm = d.getMonth() + 1
  if (forYear < sy) return 0
  if (forYear > sy) return 1
  return sm
}

// ══════════════════════════════════════════════════════════════════════════════
export default function SubscriptionsManagement() {
  const [activeTab, setActiveTab] = useState('overview')
  const [year,  setYear]  = useState(currentYear)
  const [loading, setLoading] = useState(true)

  // Data
  const [stats,    setStats]    = useState(null)
  const [tracking, setTracking] = useState([])
  const [pending,  setPending]  = useState([])
  const [packs,    setPacks]    = useState([])

  // Filters (Calendrier tab)
  const [filterPack,   setFilterPack]   = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  // Modal
  const [payModal, setPayModal] = useState(null)

  // ── Fetch ────────────────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [statsRes, packsRes, pendingRes] = await Promise.all([
        adminService.getSubscriptionStats({ year }),
        adminService.getPacks(),
        adminService.getPendingApprovals(),
      ])
      setStats(statsRes.stats)
      setPacks(packsRes.data?.packs ?? [])
      setPending(pendingRes.tenants ?? [])
    } catch {
      toast.error('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }, [year])

  const fetchTracking = useCallback(async () => {
    try {
      const res = await adminService.getSubscriptionTracking(year, {
        pack_id: filterPack  || undefined,
        status:  filterStatus || undefined,
      })
      setTracking(res.tenants ?? [])
    } catch {
      toast.error('Erreur lors du chargement du calendrier')
    }
  }, [year, filterPack, filterStatus])

  useEffect(() => { fetchAll() },    [fetchAll])
  useEffect(() => { if (activeTab === 'tracking') fetchTracking() }, [activeTab, fetchTracking])

  const handleApprove = async (tenantId) => {
    try {
      await adminService.approveTenant(tenantId)
      toast.success('Espace activé avec succès')
      fetchAll()
    } catch {
      toast.error("Erreur lors de l'activation")
    }
  }

  // ── Tabs ─────────────────────────────────────────────────────────────────────
  const TABS = [
    { id: 'overview',  icon: BarChart2, label: 'Vue d\'ensemble' },
    { id: 'tracking',  icon: Activity,  label: 'Calendrier' },
    { id: 'pending',   icon: Clock,     label: 'Approbations', badge: pending.length },
    { id: 'monitoring',icon: Shield,    label: 'Monitoring' },
  ]

  return (
    <div className="space-y-6 animate-in fade-in duration-300">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-black text-navy flex items-center gap-2">
            <CreditCard className="text-primary-500" size={24} />
            Abonnements & Revenus
          </h1>
          <p className="text-sm text-muted-500 mt-1">
            Suivi financier, approbations et monitoring de la plateforme.
          </p>
        </div>
        {/* Sélecteur d'année global */}
        <div className="flex items-center gap-2 bg-surface border border-muted-200 rounded-card px-3 py-2 shadow-sm">
          <button onClick={() => setYear(y => y - 1)} className="p-1 rounded hover:bg-muted-100 text-muted-500 hover:text-navy">
            <ChevronLeft size={16} />
          </button>
          <span className="text-base font-black text-navy min-w-[52px] text-center">{year}</span>
          <button onClick={() => setYear(y => y + 1)} disabled={year >= currentYear}
            className="p-1 rounded hover:bg-muted-100 text-muted-500 hover:text-navy disabled:opacity-30">
            <ChevronRight size={16} />
          </button>
          {year !== currentYear && (
            <button onClick={() => setYear(currentYear)}
              className="ml-1 text-[11px] text-primary-600 font-bold border border-primary-200 px-2 py-0.5 rounded hover:bg-primary-50">
              Actuel
            </button>
          )}
          <button onClick={fetchAll} className="ml-2 p-1 text-muted-400 hover:text-primary-500 rounded">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-muted-200 overflow-x-auto whitespace-nowrap pb-1">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={cn(
              'px-4 py-2.5 font-semibold text-sm border-b-2 transition-colors flex items-center gap-2',
              activeTab === tab.id
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-muted-500 hover:text-navy'
            )}>
            <tab.icon size={15} />
            {tab.label}
            {tab.badge > 0 && (
              <span className="bg-red-100 text-red-600 text-[10px] px-1.5 py-0.5 rounded-full font-bold min-w-[18px] text-center">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ══ ONGLET : VUE D'ENSEMBLE ══════════════════════════════════════════════ */}
      {activeTab === 'overview' && (
        <OverviewTab stats={stats} loading={loading} year={year} packs={packs} />
      )}

      {/* ══ ONGLET : CALENDRIER ══════════════════════════════════════════════════ */}
      {activeTab === 'tracking' && (
        <CalendarTab
          tracking={tracking}
          loading={loading}
          year={year}
          packs={packs}
          filterPack={filterPack}    setFilterPack={setFilterPack}
          filterStatus={filterStatus} setFilterStatus={setFilterStatus}
          onPayModal={setPayModal}
        />
      )}

      {/* ══ ONGLET : APPROBATIONS ════════════════════════════════════════════════ */}
      {activeTab === 'pending' && (
        <PendingTab pending={pending} loading={loading} onApprove={handleApprove} />
      )}

      {/* ══ ONGLET : MONITORING ══════════════════════════════════════════════════ */}
      {activeTab === 'monitoring' && (
        <MonitoringTab stats={stats} loading={loading} />
      )}

      {/* Modal paiement */}
      {payModal && (
        <PaymentModal
          tenant={payModal.tenant}
          month={payModal.month}
          year={year}
          onClose={() => setPayModal(null)}
          onSaved={() => { setPayModal(null); fetchTracking() }}
        />
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB : VUE D'ENSEMBLE
// ══════════════════════════════════════════════════════════════════════════════
function OverviewTab({ stats, loading, year, packs }) {
  if (loading || !stats) return <LoadingGrid />

  const kpis = [
    {
      label: 'CA Année ' + year,
      value: fmtFcfa(stats.revenue_year),
      icon: TrendingUp,
      color: 'text-primary-600',
      bg:   'bg-primary-50',
      sub:  `${stats.collection_rate}% collecté`,
      trend: stats.collection_rate >= 80 ? 'up' : 'down',
    },
    {
      label: 'CA Ce Mois',
      value: fmtFcfa(stats.revenue_month),
      icon: DollarSign,
      color: 'text-green-600',
      bg:   'bg-green-50',
      sub:  'Paiements encaissés',
    },
    {
      label: 'Espaces Actifs',
      value: stats.active_count,
      icon: Building,
      color: 'text-navy',
      bg:   'bg-muted-50',
      sub:  `+${stats.new_this_month} ce mois`,
      trend: stats.new_this_month > 0 ? 'up' : null,
    },
    {
      label: 'En Attente',
      value: stats.pending_count,
      icon: Clock,
      color: stats.pending_count > 0 ? 'text-amber-600' : 'text-muted-400',
      bg:   stats.pending_count > 0 ? 'bg-amber-50' : 'bg-muted-50',
      sub:  'Inscriptions à approuver',
    },
    {
      label: 'Impayés',
      value: fmtFcfa(stats.overdue_revenue),
      icon: AlertCircle,
      color: 'text-red-600',
      bg:   'bg-red-50',
      sub:  'Tous temps confondus',
    },
    {
      label: 'Taux de Collecte',
      value: `${stats.collection_rate}%`,
      icon: CheckCircle2,
      color: stats.collection_rate >= 80 ? 'text-green-600'
           : stats.collection_rate >= 50 ? 'text-amber-600' : 'text-red-600',
      bg:   stats.collection_rate >= 80 ? 'bg-green-50'
           : stats.collection_rate >= 50 ? 'bg-amber-50' : 'bg-red-50',
      sub:  `Sur ${year}`,
    },
  ]

  // Données graphique revenus
  const revenueData = (stats.revenue_by_month ?? []).map((d, i) => ({
    name: MONTHS[i],
    Encaissé: d.paid,
    Impayé:   d.overdue,
  }))

  // Pie chart répartition par pack
  const packData = (stats.tenants_by_pack ?? []).filter(p => p.count > 0)

  // CA par pack (bar)
  const packRevData = (stats.revenue_by_pack ?? []).map(p => ({
    name:     p.name,
    Revenus:  p.total,
    Clients:  p.clients,
  }))

  // Croissance mensuelle
  const growthData = (stats.growth_by_month ?? []).map((d, i) => ({
    name:  MONTHS[i],
    Nouveaux: d.count,
  }))

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpis.map((k, i) => (
          <div key={i} className="bg-surface border border-muted-200 rounded-card p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', k.bg)}>
                <k.icon size={18} className={k.color} />
              </div>
              {k.trend === 'up'   && <ArrowUpRight   size={14} className="text-green-500" />}
              {k.trend === 'down' && <ArrowDownRight  size={14} className="text-red-500" />}
            </div>
            <div className={cn('text-xl font-black', k.color)}>{k.value}</div>
            <div className="text-[10px] font-bold text-muted-500 uppercase tracking-wider mt-0.5">{k.label}</div>
            {k.sub && <div className="text-[10px] text-muted-400 mt-1">{k.sub}</div>}
          </div>
        ))}
      </div>

      {/* Charts row 1 : Revenus mensuels + Répartition par pack */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Revenus mensuels — 2/3 */}
        <div className="lg:col-span-2 bg-surface border border-muted-200 rounded-card p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display font-bold text-navy text-sm">Revenus Mensuels {year}</h3>
              <p className="text-[11px] text-muted-400">Encaissé vs Impayé (FCFA)</p>
            </div>
            <span className="text-xs font-bold text-primary-600 bg-primary-50 px-2 py-1 rounded">
              Total : {fmtFcfa(stats.revenue_year)}
            </span>
          </div>
          <ResponsiveContainer width="100%" height={220} minWidth={1} minHeight={1}>
            <BarChart data={revenueData} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }}
                tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
              <Tooltip
                formatter={(v, name) => [fmtFcfa(v), name]}
                contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Encaissé" fill="#3AA0D8" radius={[4,4,0,0]} />
              <Bar dataKey="Impayé"   fill="#FF7A6A" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Répartition par pack — 1/3 */}
        <div className="bg-surface border border-muted-200 rounded-card p-5 shadow-sm">
          <h3 className="font-display font-bold text-navy text-sm mb-1">Clients par Pack</h3>
          <p className="text-[11px] text-muted-400 mb-4">Espaces actifs</p>
          {packData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[220px] text-muted-300">
              <PieChart size={32} className="mb-2 opacity-30" />
              <p className="text-xs">Aucune donnée</p>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160} minWidth={1} minHeight={1}>
                <PieChart>
                  <Pie data={packData} dataKey="count" nameKey="name"
                    cx="50%" cy="50%" outerRadius={65} innerRadius={35}
                    paddingAngle={3}>
                    {packData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v, name) => [v + ' espaces', name]}
                    contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {packData.map((p, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="font-medium text-navy truncate">{p.name}</span>
                    </div>
                    <span className="font-bold text-muted-600">{p.count}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Charts row 2 : CA par pack + Croissance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* CA par pack */}
        <div className="bg-surface border border-muted-200 rounded-card p-5 shadow-sm">
          <h3 className="font-display font-bold text-navy text-sm mb-1">CA par Pack — {year}</h3>
          <p className="text-[11px] text-muted-400 mb-4">Revenus encaissés par offre</p>
          {packRevData.length === 0 ? (
            <div className="h-[180px] flex items-center justify-center text-muted-300 text-sm">
              Aucune donnée pour {year}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180} minWidth={1} minHeight={1}>
              <BarChart data={packRevData} layout="vertical" barCategoryGap="25%">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }}
                  tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#64748b' }} width={80} />
                <Tooltip formatter={(v, name) => [name === 'Revenus' ? fmtFcfa(v) : v + ' clients', name]}
                  contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="Revenus" fill="#3AA0D8" radius={[0,4,4,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Croissance mensuelle */}
        <div className="bg-surface border border-muted-200 rounded-card p-5 shadow-sm">
          <h3 className="font-display font-bold text-navy text-sm mb-1">Nouveaux Espaces — {year}</h3>
          <p className="text-[11px] text-muted-400 mb-4">Inscriptions par mois</p>
          <ResponsiveContainer width="100%" height={180} minWidth={1} minHeight={1}>
            <LineChart data={growthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
              <Line type="monotone" dataKey="Nouveaux" stroke="#34D399"
                strokeWidth={2} dot={{ r: 3, fill: '#34D399' }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tableau par pack */}
      {packRevData.length > 0 && (
        <div className="bg-surface border border-muted-200 rounded-card shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-muted-100">
            <h3 className="font-display font-bold text-navy text-sm">Détail Revenus par Pack — {year}</h3>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-muted-50">
              <tr>
                {['Pack','Clients actifs','CA Encaissé','Prix/mois','CA Potentiel','Taux réel'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-[11px] font-bold text-muted-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-muted-100">
              {(stats.revenue_by_pack ?? []).map((p, i) => {
                const potential = p.price * p.clients * 12
                const rate = potential > 0 ? Math.round((p.total / potential) * 100) : 0
                return (
                  <tr key={i} className="hover:bg-muted-50/50">
                    <td className="px-5 py-3 font-bold text-navy">{p.name}</td>
                    <td className="px-5 py-3 text-muted-600">{p.clients}</td>
                    <td className="px-5 py-3 font-bold text-green-600">{fmtFcfa(p.total)}</td>
                    <td className="px-5 py-3 text-muted-600">{fmtFcfa(p.price)}</td>
                    <td className="px-5 py-3 text-muted-600">{fmtFcfa(potential)}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-muted-100 rounded-full overflow-hidden max-w-[80px]">
                          <div className={cn('h-full rounded-full', rate>=80?'bg-green-500':rate>=50?'bg-amber-400':'bg-red-400')}
                            style={{ width: `${rate}%` }} />
                        </div>
                        <span className={cn('text-xs font-bold', rate>=80?'text-green-600':rate>=50?'text-amber-600':'text-red-600')}>
                          {rate}%
                        </span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB : CALENDRIER
// ══════════════════════════════════════════════════════════════════════════════
function CalendarTab({ tracking, loading, year, packs, filterPack, setFilterPack, filterStatus, setFilterStatus, onPayModal }) {

  // Stats locales sur les données filtrées
  const totalPaid = tracking.reduce((s, t) =>
    s + (t.payments?.filter(p => p.status === 'paid').length ?? 0), 0)

  const totalExpected = tracking.reduce((s, t) => {
    const startM = getStartMonth(t, year)
    if (startM === 0) return s
    const maxM = year < currentYear ? 12 : currentMonth
    return s + Math.max(0, maxM - startM + 1)
  }, 0)

  const rate = totalExpected > 0 ? Math.round((totalPaid / totalExpected) * 100) : 0

  return (
    <div className="space-y-4">
      {/* Filtres */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-xs font-bold text-muted-500 uppercase tracking-wider">
          <Filter size={13} /> Filtres
        </div>

        {/* Filtre pack */}
        <select
          value={filterPack}
          onChange={e => setFilterPack(e.target.value)}
          className="input-field h-9 text-sm w-44"
        >
          <option value="">Tous les packs</option>
          {packs.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        {/* Filtre statut */}
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="input-field h-9 text-sm w-40"
        >
          <option value="">Tous les statuts</option>
          <option value="active">Actifs</option>
          <option value="pending">En attente</option>
        </select>

        {(filterPack || filterStatus) && (
          <button
            onClick={() => { setFilterPack(''); setFilterStatus('') }}
            className="text-xs text-primary-600 hover:text-primary-800 font-bold flex items-center gap-1"
          >
            <X size={12} /> Réinitialiser
          </button>
        )}

        {/* KPIs rapides */}
        <div className="ml-auto flex gap-3">
          <KpiChip label="Espaces"        value={tracking.length}   color="text-navy" />
          <KpiChip label="Paiements reçus" value={totalPaid}         color="text-green-600" />
          <KpiChip label="Collecte"        value={`${rate}%`}
            color={rate >= 80 ? 'text-green-600' : rate >= 50 ? 'text-amber-600' : 'text-red-600'} />
        </div>
      </div>

      {/* Grille */}
      <div className="bg-surface rounded-card border border-muted-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead>
              <tr className="bg-muted-50 border-b border-muted-200">
                <th className="px-5 py-3 text-[11px] font-bold text-muted-500 uppercase tracking-wider sticky left-0 bg-muted-50 z-10 min-w-[210px]">
                  Espace / Pack
                </th>
                {MONTHS.map((m, i) => (
                  <th key={m} className={cn(
                    'px-1 py-3 text-[11px] font-bold text-center uppercase tracking-wider w-12',
                    year === currentYear && i + 1 === currentMonth
                      ? 'text-primary-600 bg-primary-50' : 'text-muted-500'
                  )}>{m}</th>
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
                    <p className="text-sm">Aucun espace trouvé pour ces filtres.</p>
                  </td>
                </tr>
              ) : tracking.map(tenant => {
                const startM    = getStartMonth(tenant, year)
                const paidCount = tenant.payments?.filter(p => p.status === 'paid').length ?? 0
                const maxMonth  = year < currentYear ? 12 : currentMonth
                const eligible  = startM === 0 ? 0 : Math.max(0, maxMonth - startM + 1)
                const rowRate   = eligible > 0 ? Math.round((paidCount / eligible) * 100) : 0

                return (
                  <tr key={tenant.id} className="hover:bg-muted-50/50 transition-colors group">
                    <td className="px-5 py-3 sticky left-0 bg-white group-hover:bg-muted-50/50 z-10 transition-colors">
                      <div className="font-semibold text-navy text-sm">{tenant.name}</div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] font-bold bg-primary-50 text-primary-700 px-1.5 py-0.5 rounded uppercase">
                          {tenant.pack?.name || tenant.plan || 'Free'}
                        </span>
                        <span className="text-[10px] text-muted-400">{tenant.owner?.email}</span>
                      </div>
                    </td>

                    {MONTHS.map((_, idx) => {
                      const monthNum      = idx + 1
                      const payment       = tenant.payments?.find(p => p.month === monthNum)
                      const isFuture      = year === currentYear && monthNum > currentMonth
                      const isCurrent     = year === currentYear && monthNum === currentMonth
                      const isBeforeStart = startM === 0 || monthNum < startM
                      const isPaid        = payment?.status === 'paid'
                      const isDisabled    = isFuture || isPaid || isBeforeStart

                      return (
                        <td key={idx} className={cn(
                          'px-1 py-3 text-center',
                          isCurrent && !isBeforeStart && 'bg-primary-50/50'
                        )}>
                          <button
                            onClick={() => !isDisabled && onPayModal({ tenant, month: monthNum })}
                            disabled={isDisabled}
                            title={
                              isBeforeStart ? 'Avant le début de l\'abonnement'
                              : isPaid       ? `Payé — ${fmtFcfa(payment.amount)}`
                              : isFuture     ? 'Mois futur'
                              : `Encaisser ${MONTHS_FULL[idx]} ${year}`
                            }
                            className={cn(
                              'w-9 h-9 mx-auto rounded-lg flex items-center justify-center transition-all',
                              isBeforeStart  ? 'bg-transparent cursor-not-allowed'
                              : isPaid       ? 'bg-green-500 text-white cursor-default'
                              : isFuture     ? 'bg-muted-100 text-muted-300 cursor-default'
                              : 'bg-red-100 text-red-500 hover:bg-red-500 hover:text-white cursor-pointer hover:scale-110'
                            )}
                          >
                            {isBeforeStart  ? <span className="text-muted-200">·</span>
                            : isPaid        ? <CheckCircle2 size={14} />
                            : isFuture      ? <span className="text-[10px]">—</span>
                            : <AlertCircle size={14} />}
                          </button>
                        </td>
                      )
                    })}

                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="h-1.5 w-16 bg-muted-100 rounded-full overflow-hidden">
                          <div
                            className={cn('h-full rounded-full', rowRate>=80?'bg-green-500':rowRate>=50?'bg-amber-400':'bg-red-400')}
                            style={{ width: `${rowRate}%` }}
                          />
                        </div>
                        <span className={cn('text-xs font-bold tabular-nums',
                          rowRate>=80?'text-green-600':rowRate>=50?'text-amber-600':'text-red-600')}>
                          {paidCount}/{eligible}
                        </span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 bg-muted-50 border-t border-muted-100 flex items-center gap-5 text-[11px] text-muted-500">
          <LegendItem color="bg-green-500"                              label="Payé" />
          <LegendItem color="bg-red-100 border border-red-200"          label="Impayé" />
          <LegendItem color="bg-muted-100"                              label="Futur" />
          <LegendItem color="bg-transparent border border-muted-100"   label="Avant inscription" />
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB : APPROBATIONS
// ══════════════════════════════════════════════════════════════════════════════
function PendingTab({ pending, loading, onApprove }) {
  return (
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
              <th className="px-6 py-4">Pack / Plan</th>
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
                    {tenant.pack?.name || tenant.plan || 'Free'}
                  </span>
                </td>
                <td className="px-6 py-4 text-center text-muted-500">
                  {new Date(tenant.created_at).toLocaleDateString('fr-FR')}
                </td>
                <td className="px-6 py-4 text-right">
                  <Button variant="primary" size="sm" onClick={() => onApprove(tenant.id)}>
                    Approuver
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB : MONITORING
// ══════════════════════════════════════════════════════════════════════════════
function MonitoringTab({ stats, loading }) {
  if (loading || !stats) return <LoadingGrid />

  const loginData = (stats.login_activity ?? []).map(d => ({
    date:       new Date(d.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
    Connexions: d.count,
  }))

  const moduleData = (stats.module_usage ?? []).map(m => ({
    name:  m.name,
    Actions: m.count,
  }))

  const healthItems = [
    {
      label:  'Espaces actifs',
      value:  stats.active_count,
      total:  stats.active_count + stats.pending_count,
      color:  'bg-green-500',
      icon:   Building,
    },
    {
      label:  'Utilisateurs connectés (24h)',
      value:  stats.active_users_24h,
      total:  stats.total_users,
      color:  'bg-primary-500',
      icon:   Users,
    },
    {
      label:  'Taux de collecte',
      value:  stats.collection_rate,
      total:  100,
      color:  stats.collection_rate >= 80 ? 'bg-green-500' : stats.collection_rate >= 50 ? 'bg-amber-400' : 'bg-red-400',
      icon:   CreditCard,
      fmt:    v => `${v}%`,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Santé de la plateforme */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {healthItems.map((item, i) => {
          const pct = item.total > 0 ? Math.round((item.value / item.total) * 100) : 0
          const display = item.fmt ? item.fmt(item.value) : item.value
          return (
            <div key={i} className="bg-surface border border-muted-200 rounded-card p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-muted-500 uppercase tracking-wider">{item.label}</span>
                <item.icon size={16} className="text-muted-400" />
              </div>
              <div className="text-2xl font-black text-navy mb-3">{display}
                <span className="text-sm text-muted-400 font-normal ml-2">/ {item.total}</span>
              </div>
              <div className="h-2 bg-muted-100 rounded-full overflow-hidden">
                <div className={cn('h-full rounded-full transition-all', item.color)}
                  style={{ width: `${pct}%` }} />
              </div>
              <div className="text-[11px] text-muted-400 mt-1.5">{pct}% du total</div>
            </div>
          )
        })}
      </div>

      {/* Charts monitoring */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Activité de connexion (30 jours) */}
        <div className="bg-surface border border-muted-200 rounded-card p-5 shadow-sm">
          <h3 className="font-display font-bold text-navy text-sm mb-1">Connexions (30 derniers jours)</h3>
          <p className="text-[11px] text-muted-400 mb-4">
            Total : {fmtNum(stats.total_logins)} connexions enregistrées
          </p>
          {loginData.length === 0 ? (
            <div className="h-[200px] flex items-center justify-center text-muted-300 text-sm">
              Aucune activité enregistrée
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200} minWidth={1} minHeight={1}>
              <LineChart data={loginData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} interval={4} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Line type="monotone" dataKey="Connexions" stroke="#3AA0D8"
                  strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Usage des modules */}
        <div className="bg-surface border border-muted-200 rounded-card p-5 shadow-sm">
          <h3 className="font-display font-bold text-navy text-sm mb-1">Modules les plus utilisés</h3>
          <p className="text-[11px] text-muted-400 mb-4">Par nombre d'actions enregistrées</p>
          {moduleData.length === 0 ? (
            <div className="h-[200px] flex items-center justify-center text-muted-300 text-sm">
              Aucune activité enregistrée
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200} minWidth={1} minHeight={1}>
              <BarChart data={moduleData} layout="vertical" barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: '#64748b' }} width={110} />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="Actions" fill="#8B5CF6" radius={[0,4,4,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Tableau module usage détail */}
      {moduleData.length > 0 && (
        <div className="bg-surface border border-muted-200 rounded-card shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-muted-100">
            <h3 className="font-display font-bold text-navy text-sm">Utilisation détaillée des modules</h3>
          </div>
          <div className="divide-y divide-muted-100">
            {(stats.module_usage ?? []).map((m, i) => {
              const max = stats.module_usage[0]?.count ?? 1
              const pct = Math.round((m.count / max) * 100)
              return (
                <div key={i} className="px-5 py-3 flex items-center gap-4">
                  <div className="w-5 h-5 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center text-[10px] font-bold shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-navy">{m.name}</span>
                      <span className="text-xs font-bold text-muted-600">{fmtNum(m.count)} actions</span>
                    </div>
                    <div className="h-1.5 bg-muted-100 rounded-full overflow-hidden">
                      <div className="h-full bg-violet-400 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// SOUS-COMPOSANTS
// ══════════════════════════════════════════════════════════════════════════════

const KpiChip = ({ label, value, color }) => (
  <div className="bg-surface border border-muted-200 rounded-lg px-4 py-2 text-center shadow-sm">
    <div className={cn('text-lg font-black', color)}>{value}</div>
    <div className="text-[10px] text-muted-400 font-medium">{label}</div>
  </div>
)

const LegendItem = ({ color, label }) => (
  <div className="flex items-center gap-1.5">
    <div className={cn('w-3.5 h-3.5 rounded', color)} />
    <span>{label}</span>
  </div>
)

const LoadingGrid = () => (
  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 animate-pulse">
    {[...Array(6)].map((_, i) => (
      <div key={i} className="h-24 bg-muted-100 rounded-card" />
    ))}
  </div>
)

// ══════════════════════════════════════════════════════════════════════════════
// MODAL PAIEMENT
// ══════════════════════════════════════════════════════════════════════════════
const METHODS = [
  { value: 'cash',          label: 'Espèces' },
  { value: 'mobile_money',  label: 'Mobile Money' },
  { value: 'bank_transfer', label: 'Virement' },
  { value: 'manual',        label: 'Manuel' },
]

function PaymentModal({ tenant, month, year, onClose, onSaved }) {
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
      toast.success(`Paiement ${MONTHS_FULL[month - 1]} ${year} enregistré ✓`)
      onSaved()
    } catch (err) {
      toast.error(err?.response?.data?.message || "Erreur lors de l'enregistrement")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <form onSubmit={handleSubmit} onClick={e => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
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
          <div>
            <label className="label-field">Montant (FCFA) *</label>
            <div className="relative">
              <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-400" />
              <input type="number" className="input-field pl-9" value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                required min="0" />
            </div>
          </div>

          <div>
            <label className="label-field">Méthode de paiement</label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              {METHODS.map(m => (
                <button key={m.value} type="button"
                  onClick={() => setForm(f => ({ ...f, payment_method: m.value }))}
                  className={cn(
                    'px-3 py-2.5 rounded-btn border text-sm font-medium transition-all text-left',
                    form.payment_method === m.value
                      ? 'border-primary-400 bg-primary-50 text-primary-700'
                      : 'border-muted-200 text-muted-600 hover:border-muted-300'
                  )}>
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label-field">Notes (optionnel)</label>
            <input className="input-field" value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder={`Paiement ${MONTHS_FULL[month - 1]} ${year}…`} />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-muted-100 bg-muted-50">
          <button type="button" onClick={onClose} className="btn-outline">Annuler</button>
          <button type="submit" disabled={saving} className="btn-primary flex items-center gap-1.5">
            <Check size={15} />
            {saving ? 'Enregistrement…' : 'Confirmer'}
          </button>
        </div>
      </form>
    </div>
  )
}
