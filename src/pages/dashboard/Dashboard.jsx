import { useAuthStore } from '@/store/authStore'
import { useTenantStore } from '@/store/tenantStore'
import { useEffect, useState, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { 
  TrendingUp, Users, Package, ShoppingCart, BarChart2, Clock, 
  ArrowUpRight, Zap, AlertTriangle, Target, Layers, DollarSign 
} from 'lucide-react'
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, BarChart, Bar, Legend, ComposedChart, Line, Area,
  ScatterChart, Scatter, ZAxis
} from 'recharts'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { cn } from '@/utils/cn'
import { dashboardService } from '@/services/dashboardService'
import DateRangePicker from '@/components/ui/DateRangePicker'
import toast from 'react-hot-toast'

const CHART_COLORS = ['#de2a75', '#d9a518', '#7C3AED', '#10B981', '#3B82F6', '#F59E0B', '#EF4444'];

const PROFILE_LABELS = {
  manufacturer:     'Fabricant / Artisan',
  reseller:         'Revendeur',
  wholesaler:       'Grossiste / Semi-grossiste',
  service_provider: 'Prestataire de services',
}

const PLAN_LABELS = {
  demarrage:  'Démarrage',
  pro:        'Pro',
  business:   'Business',
  entreprise: 'Entreprise',
}

const fmt = (n) => new Intl.NumberFormat('fr-FR').format(n ?? 0) + ' FCFA'
const fmtShort = (n) => n >= 1000000 ? (n/1000000).toFixed(1) + 'M' : n >= 1000 ? (n/1000).toFixed(0) + 'k' : n
const fmtDate = (iso) => new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })

// ── Palette Treemap ───────────────────────────────────────────────────────────
const TREEMAP_COLORS = [
  '#3B82F6', '#de2a75', '#10B981', '#F59E0B',
  '#8B5CF6', '#06B6D4', '#EF4444', '#84CC16',
]

// ── Tooltip custom ────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label, prefix = '' }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-navy/95 backdrop-blur-md p-3 rounded-xl shadow-2xl border border-white/10 text-white animate-in fade-in zoom-in duration-200">
        <p className="text-[10px] font-bold uppercase tracking-wider opacity-60 mb-1">{label}</p>
        <p className="text-sm font-display font-black">{prefix}{payload[0].value.toLocaleString('fr-FR')}</p>
      </div>
    );
  }
  return null;
};

function StatCard({ title, value, change, icon: Icon, iconBg, iconColor, loading, to }) {
  const content = (
    <div className={cn("stat-card h-full transition-all", to && "hover:border-primary-300 hover:shadow-md cursor-pointer group")}>
      <div className="flex items-start justify-between mb-1">
        <div className={cn('w-9 h-9 rounded-card flex items-center justify-center transition-transform group-hover:scale-110', iconBg)}>
          <Icon className={cn('w-[18px] h-[18px]', iconColor)} />
        </div>
        {change && (
          <div className={cn(
            "flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-badge",
            change.type === 'danger' ? "text-danger bg-red-50" : "text-success bg-[#E3F5EC]"
          )}>
            {change.icon && <change.icon className="w-2.5 h-2.5" />}
            {change.label}
          </div>
        )}
      </div>
      {loading
        ? <div className="h-7 w-24 bg-muted-100 rounded animate-pulse my-1" />
        : <div className="stat-value text-xl">{value}</div>
      }
      <div className="stat-label text-xs">{title}</div>
    </div>
  )

  if (to) return <Link to={to}>{content}</Link>
  return content
}

function QuickActionCard({ icon: Icon, label, description, iconBg, iconColor, to }) {
  return (
    <Link to={to}>
      <Card hover className="flex items-start gap-3 !p-4 h-full group">
        <div className={cn('w-9 h-9 rounded-card flex items-center justify-center shrink-0 transition-colors group-hover:bg-primary-100', iconBg)}>
          <Icon className={cn('w-[18px] h-[18px]', iconColor)} />
        </div>
        <div>
          <div className="font-display font-semibold text-sm text-navy group-hover:text-primary-600 transition-colors">{label}</div>
          <div className="text-xs text-muted-500 mt-0.5">{description}</div>
        </div>
      </Card>
    </Link>
  )
}

export default function Dashboard() {
  const { user, isAdmin } = useAuthStore()
  const { tenant, fetchTenant } = useTenantStore()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState({ start: '', end: '', preset: 'month' })

  useEffect(() => { if (!tenant) fetchTenant() }, [tenant, fetchTenant])

  // Keep a ref to the latest range so event handlers can always access it
  const rangeRef = useRef(range)
  useEffect(() => { rangeRef.current = range }, [range])

  const fetchDashboard = useCallback(async (dateRange) => {
    setLoading(true)
    try {
      const params = {}
      if (dateRange?.start) params.start_date = dateRange.start
      if (dateRange?.end)   params.end_date = dateRange.end
      const res = await dashboardService.getStats(params)
      setData(res)
    } catch (err) {
      console.error('Dashboard error:', err)
      toast.error("Erreur lors du chargement des statistiques")
    } finally {
      setLoading(false)
    }
  }, [])

  // Re-fetch when date range changes
  useEffect(() => {
    if (range.start && range.end) {
      fetchDashboard(range)
    }
  }, [range, fetchDashboard])

  // Re-fetch when tab regains focus (user returns from another page/tab)
  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === 'visible' && rangeRef.current?.start) {
        fetchDashboard(rangeRef.current)
      }
    }
    document.addEventListener('visibilitychange', refresh)
    window.addEventListener('focus', refresh)
    return () => {
      document.removeEventListener('visibilitychange', refresh)
      window.removeEventListener('focus', refresh)
    }
  }, [fetchDashboard])

  // Re-fetch when any page signals a data mutation (order, sale, expense, etc.)
  useEffect(() => {
    const onDataChanged = () => {
      if (rangeRef.current?.start) fetchDashboard(rangeRef.current)
    }
    window.addEventListener('qiwam:data-changed', onDataChanged)
    return () => window.removeEventListener('qiwam:data-changed', onDataChanged)
  }, [fetchDashboard])

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Bonjour'
    if (h < 18) return 'Bon après-midi'
    return 'Bonsoir'
  }

  const stats = [
    {
      title: range.preset === 'month' ? 'Revenus ce mois' : 'Revenus période',
      value: fmt(data?.stats?.revenue_month),
      change: range.preset === 'month' ? {
        label: `${data?.stats?.revenue_growth >= 0 ? '+' : ''}${data?.stats?.revenue_growth}%`,
        type: data?.stats?.revenue_growth >= 0 ? 'success' : 'danger',
        icon: TrendingUp
      } : null,
      icon: DollarSign,
      iconBg: 'bg-primary-50',
      iconColor: 'text-primary-500',
      to: '/orders'
    },
    {
      title: range.preset === 'month' ? 'Commandes ce mois' : 'Commandes période',
      value: data?.stats?.orders_count_month ?? 0,
      change: range.preset === 'month' ? {
        label: `${data?.stats?.orders_growth >= 0 ? '+' : ''}${data?.stats?.orders_growth}%`,
        type: data?.stats?.orders_growth >= 0 ? 'success' : 'danger',
        icon: TrendingUp
      } : null,
      icon: ShoppingCart,
      iconBg: 'bg-[#F3E8FF]',
      iconColor: 'text-[#7C3AED]',
      to: '/orders'
    },
    ...(isAdmin() ? [
      {
        title: 'Stock Bas / Total',
        value: `${data?.stats?.low_stock_count ?? 0} / ${data?.stats?.total_products ?? 0}`,
        change: data?.stats?.low_stock_count > 0 ? { label: 'Alerte stock', type: 'danger', icon: AlertTriangle } : { label: 'Optimal', type: 'success' },
        icon: Package,
        iconBg: 'bg-[#E8F5E9]',
        iconColor: 'text-success',
        to: '/products'
      },
      {
        title: 'Total Clients',
        value: data?.stats?.total_customers ?? 0,
        change: { label: 'CRM Actif', type: 'success' },
        icon: Users,
        iconBg: 'bg-[#FEF3CC]',
        iconColor: 'text-gold',
        to: '/customers'
      },
    ] : []),
  ]

  const quickActions = [
    { icon: Package,      label: 'Produits',    description: 'Gérez votre catalogue',   iconBg: 'bg-primary-50', iconColor: 'text-primary-500', to: '/products'  },
    { icon: Users,        label: 'Clients',     description: 'Gérez votre base',        iconBg: 'bg-[#F3E8FF]',  iconColor: 'text-[#7C3AED]',  to: '/customers' },
    { icon: ShoppingCart, label: 'Caisse POS',  description: 'Encaisser une vente',     iconBg: 'bg-[#E8F5E9]',  iconColor: 'text-success',    to: '/pos'    },
    { icon: BarChart2,    label: 'Rapports',    description: 'Statistiques détaillées', iconBg: 'bg-[#FEF3CC]',  iconColor: 'text-gold',       to: '/orders'   },
  ]

  const hasProducts  = (data?.stats?.total_products ?? 0) > 0
  const hasCustomers = (data?.stats?.total_customers ?? 0) > 0
  const hasOrders    = (data?.stats?.orders_count_month ?? 0) > 0

  return (
    <div className="space-y-6 animate-fade-in pb-10">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-black text-navy tracking-tight">{greeting()}, {user?.name?.split(' ')[0]}</h1>
          <p className="text-muted-500 text-sm">
            {isAdmin()
              ? <>Voici un aperçu de l'activité de <span className="font-bold text-navy">{tenant?.name}</span></>
              : 'Voici un aperçu de votre activité personnelle'}
          </p>
        </div>
        <DateRangePicker onRangeChange={setRange} />
      </div>

      {/* ── Onboarding ── */}
      {isAdmin() && (!hasProducts || !hasCustomers || !hasOrders) && (
        <div className="bg-navy rounded-modal p-6 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-64 h-64 bg-primary-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/4 pointer-events-none" />
          <div className="relative z-10 space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary-300" />
              <span className="text-xs font-display font-semibold tracking-[0.12em] uppercase text-primary-300">Démarrage rapide</span>
            </div>
            <h2 className="font-display font-bold text-xl text-white">Votre espace est prêt !</h2>
            <p className="text-white/55 text-sm max-w-md">Suivez ces étapes pour démarrer votre activité sur Qiwam.</p>
            <div className="flex items-center gap-2 flex-wrap pt-1">
              {[
                { label: 'Espace créé',        done: true },
                { label: 'Premier produit',    done: hasProducts },
                { label: 'Premier client',     done: hasCustomers },
                { label: 'Première commande',  done: hasOrders },
              ].map((s, i) => (
                <div key={s.label} className="flex items-center gap-1.5">
                  <div className={cn(
                    'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-display font-bold',
                    s.done ? 'bg-primary-500 text-white' : 'bg-white/10 text-white/40'
                  )}>
                    {s.done ? '✓' : i + 1}
                  </div>
                  <span className={cn('text-xs', s.done ? 'text-primary-300' : 'text-white/40')}>{s.label}</span>
                  {i < 3 && <span className="text-white/20 text-xs mx-0.5">›</span>}
                </div>
              ))}
            </div>
            <div className="pt-2">
              <Link to={!hasProducts ? '/products' : !hasCustomers ? '/customers' : '/pos'}>
                <Button variant="primary" size="sm" className="h-9 px-5">
                  {!hasProducts ? 'Ajouter mon premier produit' : !hasCustomers ? 'Ajouter mon premier client' : 'Encaisser ma première vente'}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── Stats Row ── */}
      <div className={cn("grid grid-cols-1 sm:grid-cols-2 gap-4", isAdmin() ? "lg:grid-cols-4" : "lg:grid-cols-2")}>
        {stats.map((s) => <StatCard key={s.title} {...s} loading={loading} />)}
      </div>

      {/* ── Main Trend Composed Chart ── */}
      <Card className="!p-6 overflow-hidden">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="font-display font-semibold text-navy flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary-500" />
              Tendance de Performance
            </h3>
            <p className="text-xs text-muted-500">Analyse croisée du chiffre d'affaires et du volume de commandes</p>
          </div>
        </div>
        
        <div className="h-[320px] w-full -ml-4">
          <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
            <ComposedChart data={data?.sales_history || []} syncId="dashboard">
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#de2a75" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#de2a75" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} dy={10} />
              <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} tickFormatter={fmtShort} />
              <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} />
              <Tooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-navy/95 backdrop-blur-md p-3 rounded-xl shadow-2xl border border-white/10 text-white animate-in zoom-in duration-200">
                        <p className="text-[10px] font-bold uppercase opacity-60 mb-2 border-b border-white/10 pb-1">{label}</p>
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-[10px] text-primary-300">Revenu</span>
                            <span className="text-sm font-black">{fmt(payload[1]?.value)}</span>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-[10px] text-gold">Volume</span>
                            <span className="text-sm font-black">{payload[0]?.value} cmd</span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar yAxisId="right" dataKey="count" fill="#d9a518" radius={[4, 4, 0, 0]} barSize={24} opacity={0.4} animationDuration={1000} />
              <Area yAxisId="left" type="monotone" dataKey="total" stroke="#de2a75" strokeWidth={3} fill="url(#colorTotal)" animationDuration={1500} />
              <Line yAxisId="left" type="monotone" dataKey="total" stroke="#de2a75" strokeWidth={2} dot={{ r: 4, fill: '#de2a75', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* ── Quick Actions ── */}
      <div>
        <h2 className="font-display font-semibold text-[15px] text-navy mb-4 flex items-center gap-2">
          <Zap className="w-4 h-4 text-gold" />
          Raccourcis rapides
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((a) => <QuickActionCard key={a.label} {...a} />)}
        </div>
      </div>

      {/* ── Advanced Analysis Row ── */}
      {isAdmin() && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Donut Chart for Categories */}
          <Card className="!p-6 lg:col-span-1">
            <h3 className="font-display font-semibold text-navy mb-4 flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary-500" />
              Ventes par Catégorie
            </h3>
            {(data?.sales_by_category || []).length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[280px] text-muted-300">
                <Layers size={28} className="mb-2" />
                <p className="text-xs font-sans text-center">Aucune donnée</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                    <PieChart>
                      <Pie
                        data={(data?.sales_by_category || []).map(c => ({
                          name: c.category || 'Sans catégorie',
                          value: c.value,
                        }))}
                        cx="50%" cy="50%"
                        innerRadius="55%"
                        outerRadius="80%"
                        paddingAngle={2}
                        dataKey="value"
                        animationDuration={1000}
                      >
                        {(data?.sales_by_category || []).map((_, i) => (
                          <Cell key={i} fill={TREEMAP_COLORS[i % TREEMAP_COLORS.length]} stroke="none" />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => [
                          new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(value),
                          'Ventes',
                        ]}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Légende */}
                <div className="space-y-1.5">
                  {(data?.sales_by_category || []).slice(0, 5).map((c, i) => {
                    const total = (data?.sales_by_category || []).reduce((s, x) => s + Number(x.value), 0)
                    const pct   = total > 0 ? ((c.value / total) * 100).toFixed(1) : 0
                    return (
                      <div key={i} className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: TREEMAP_COLORS[i % TREEMAP_COLORS.length] }} />
                        <span className="text-xs font-sans text-muted-600 truncate flex-1">{c.category || 'Sans catégorie'}</span>
                        <span className="text-xs font-sans font-semibold text-navy flex-shrink-0">{pct}%</span>
                      </div>
                    )
                  })}
                  {(data?.sales_by_category || []).length > 5 && (
                    <p className="text-[10px] font-sans text-muted-400 pl-4">+{(data.sales_by_category.length - 5)} autres</p>
                  )}
                </div>
              </div>
            )}
          </Card>

          {/* Scatter Chart for Customers */}
          <Card className="!p-6 lg:col-span-2">
            <h3 className="font-display font-semibold text-navy mb-6 flex items-center gap-2">
              <Target className="w-4 h-4 text-gold" />
              Fidélité vs Rentabilité
            </h3>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis type="number" dataKey="count" name="Fréquence" unit=" cmd" axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                  <YAxis type="number" dataKey="total" name="Montant" unit=" FCFA" axisLine={false} tickLine={false} tick={{fontSize: 10}} tickFormatter={fmtShort} />
                  <ZAxis type="category" dataKey="name" name="Client" />
                  <Tooltip
                    cursor={{ strokeDasharray: '3 3', stroke: '#cbd5e1' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-navy/95 backdrop-blur-md p-3 rounded-xl shadow-2xl border border-white/10 text-white animate-in fade-in duration-200">
                            <p className="text-sm font-black mb-1 text-primary-300">{payload[2]?.value}</p>
                            <div className="text-[10px] space-y-0.5 opacity-80">
                              <p>Fidélité: <span className="font-bold text-white">{payload[0]?.value} commandes</span></p>
                              <p>Valeur: <span className="font-bold text-white">{fmt(payload[1]?.value)}</span></p>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Scatter name="Clients" data={data?.top_customers || []} fill="#d9a518" animationDuration={1500}>
                    {data?.top_customers?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      )}

      {/* ── Last Row: Agents & Payments ── */}
      {isAdmin() && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Agent Performance Bar Chart */}
          <Card className="!p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display font-semibold text-navy flex items-center gap-2">
                <Users className="w-4 h-4 text-[#7C3AED]" />
                Performance Équipe
              </h3>
            </div>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                <BarChart data={data?.sales_by_user || []} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{fontSize: 10}} tickFormatter={fmtShort} />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fontSize: 10}} width={80} />
                  <Tooltip content={<CustomTooltip prefix="FCFA " />} />
                  <Bar dataKey="total" radius={[0, 4, 4, 0]} barSize={24}>
                    {(data?.sales_by_user || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[(index + 2) % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Payment Methods Donut Chart */}
          <Card className="!p-6">
            <h3 className="font-display font-semibold text-navy mb-6 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-success" />
              Flux de Trésorerie
            </h3>
            <div className="h-[250px] w-full relative">
              <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                <PieChart>
                  <Pie
                    data={data?.payment_methods_dist || []}
                    cx="50%" cy="50%"
                    innerRadius={70} outerRadius={90}
                    paddingAngle={8}
                    dataKey="total"
                    nameKey="payment_method"
                    stroke="none"
                    animationDuration={1500}
                  >
                    {(data?.payment_methods_dist || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[(index + 4) % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip prefix="FCFA " />} />
                  <Legend iconType="circle" wrapperStyle={{fontSize: '10px', paddingTop: '20px'}} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
                <span className="text-[10px] uppercase font-bold text-muted-400">Total Encaissement</span>
                <span className="text-base font-display font-black text-navy">{fmtShort(data?.stats?.revenue_month)}</span>
              </div>
            </div>
          </Card>
        </div>
      )}

    </div>
  )
}
