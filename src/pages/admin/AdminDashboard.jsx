import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { adminService } from '@/services/adminService'
import {
  Users,
  Building2,
  ShieldAlert,
  UserCheck,
  UserX,
  HardDrive,
  ArrowRight,
  TrendingUp,
  Activity,
  LayoutGrid,
  Filter,
  Clock
} from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'
import { cn } from '@/utils/cn'

const COLORS = ['#3AA0D8', '#E8A020', '#0F1E30', '#7EC3E8', '#FF7A6A', '#34D399'];

const INDUSTRY_LABELS = {
  agriculture:   'Agriculture',
  commerce:      'Commerce',
  construction:  'BTP',
  education:     'Éducation',
  energie:       'Énergie',
  finance:       'Finance',
  health:        'Santé',
  hospitality:   'Hôtellerie',
  ict:           'Technologie',
  manufacturing: 'Industrie',
  retail:        'Détail',
  services:      'Services',
  transport:     'Transport',
  other:         'Autre',
};

function StatCard({ icon: Icon, label, value, color = 'primary', sub, to }) {
  const colors = {
    primary: 'bg-primary-50 text-primary-500',
    gold:    'bg-amber-50 text-amber-500',
    danger:  'bg-red-50 text-danger',
    success: 'bg-green-50 text-success',
    navy:    'bg-navy/5 text-navy',
  }

  const Content = (
    <>
      <div className={cn("w-10 h-10 sm:w-12 sm:h-12 rounded-card flex items-center justify-center flex-shrink-0", colors[color])}>
        <Icon size={20} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs sm:text-sm font-sans font-medium text-muted-500">{label}</p>
        <div className="flex items-baseline gap-2">
          <p className="text-xl sm:text-2xl font-display font-bold text-navy truncate">{value ?? '—'}</p>
          {sub && <span className="text-[10px] font-sans font-bold text-success flex items-center gap-0.5">
            <TrendingUp size={10} /> {sub}
          </span>}
        </div>
      </div>
    </>
  )

  if (to) {
    return (
      <Link to={to} className="card p-4 sm:p-5 flex items-start gap-3 sm:gap-4 hover:shadow-md transition-all hover:border-primary-300">
        {Content}
      </Link>
    )
  }

  return (
    <div className="card p-4 sm:p-5 flex items-start gap-3 sm:gap-4 hover:shadow-md transition-shadow">
      {Content}
    </div>
  )
}

export default function AdminDashboard() {
  const { user } = useAuthStore()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminService.getStats()
      .then(res => setStats(res.data.stats))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Prepare graph data
  const chartData = stats?.graph_data?.map(item => ({
    date: new Date(item.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
    count: item.count
  })) || [];

  const pieData = stats?.tenants_by_type ? Object.entries(stats.tenants_by_type).map(([key, value]) => ({
    name: INDUSTRY_LABELS[key] || key,
    value: value
  })).sort((a, b) => b.value - a.value).slice(0, 5) : [];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-bold text-navy">
            Console de Gestion Qiwam 👋
          </h1>
          <p className="text-sm font-sans text-muted-500 mt-1">
            Bienvenue {user?.name}, voici l'état actuel de votre plateforme.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-surface border border-muted-200 px-2 sm:px-3 py-2 rounded-btn flex items-center gap-2">
            <Activity size={16} className="text-success" />
            <span className="hidden sm:inline text-xs font-sans font-bold text-navy uppercase tracking-wider">Plateforme Opérationnelle</span>
          </div>
        </div>
      </div>

      {/* Primary Stats grid — 2 cols on mobile, 4 on lg */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {loading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="card p-4 sm:p-5 animate-pulse h-20 sm:h-24" />
          ))
        ) : (
          <>
            <StatCard
              icon={Building2}
              label="Espaces Actifs"
              value={stats?.total_tenants}
              color="primary"
              sub="+12%"
              to="/admin/users"
            />
            <StatCard
              icon={Users}
              label="Utilisateurs"
              value={stats?.total_users}
              color="navy"
              to="/admin/users"
            />
            <StatCard
              icon={HardDrive}
              label="Volume Données"
              value={`${stats?.db_size_mb} MB`}
              color="gold"
            />
            <StatCard
              icon={Clock}
              label="En attente"
              value={stats?.pending_approvals}
              color={stats?.pending_approvals > 0 ? 'danger' : 'success'}
              to="/admin/users?tenant_status=pending"
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Charts Section */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Main Chart */}
          <div className="card p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <div>
                <h3 className="font-display font-bold text-navy">Nouveaux Espaces</h3>
                <p className="text-xs text-muted-500 mt-0.5">Inscriptions sur les 30 derniers jours</p>
              </div>
              <TrendingUp size={20} className="text-primary-500" />
            </div>

            <div className="h-[250px] sm:h-[300px] w-full">
              {chartData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-muted-300 text-sm">
                  <Activity size={32} className="mr-2 opacity-40" />
                  Aucune donnée disponible
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: '#64748b' }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: '#64748b' }}
                    />
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#3AA0D8"
                      strokeWidth={3}
                      dot={{ r: 4, fill: '#3AA0D8', strokeWidth: 2, stroke: '#fff' }}
                      activeDot={{ r: 6, strokeWidth: 0 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* User management quick links */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <Link
              to="/admin/users"
              className="card p-4 sm:p-5 flex items-center gap-3 sm:gap-4 hover:border-primary-300 hover:shadow-blue transition-all group"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-card bg-primary-50 flex items-center justify-center text-primary-500 shrink-0">
                <UserCheck size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-sans font-semibold text-navy text-sm">Contrôle des Accès</p>
                <p className="text-xs text-muted-500 mt-0.5 truncate">Activer/suspendre les propriétaires</p>
              </div>
              <ArrowRight size={16} className="text-muted-300 group-hover:text-primary-500 transition-colors shrink-0" />
            </Link>

            <Link
              to="/admin/users"
              className="card p-4 sm:p-5 flex items-center gap-3 sm:gap-4 hover:border-primary-300 hover:shadow-blue transition-all group"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-card bg-amber-50 flex items-center justify-center text-amber-500 shrink-0">
                <LayoutGrid size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-sans font-semibold text-navy text-sm">Gestion des Modules</p>
                <p className="text-xs text-muted-500 mt-0.5 truncate">Configurer les fonctionnalités</p>
              </div>
              <ArrowRight size={16} className="text-muted-300 group-hover:text-primary-500 transition-colors shrink-0" />
            </Link>
          </div>
        </div>

        {/* Industry Distribution Section */}
        <div className="lg:col-span-1 space-y-4 sm:space-y-6">
          <div className="card p-4 sm:p-6 flex flex-col">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="font-display font-bold text-navy">Par Secteur</h3>
              <Filter size={18} className="text-muted-400" />
            </div>

            <div className="min-h-[220px]">
              {pieData.length === 0 ? (
                <div className="h-full min-h-[220px] flex items-center justify-center text-muted-300 text-sm">
                  Aucun espace enregistré
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220} minWidth={1} minHeight={1}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      innerRadius={55}
                      outerRadius={75}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="mt-4 space-y-2.5">
              {pieData.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="text-xs font-sans text-muted-600">{item.name}</span>
                  </div>
                  <span className="text-xs font-bold text-navy">{item.value} boutiques</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Platform info banner */}
      <div className="card p-4 sm:p-5 border-primary-100" style={{ background: 'linear-gradient(135deg, #EEF7FC 0%, #FAFCFE 100%)' }}>
        <div className="flex items-start gap-3">
          <ShieldAlert size={20} className="text-primary-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-sans font-semibold text-navy">
              Sécurité du système
            </p>
            <p className="text-xs font-sans text-muted-500 mt-0.5">
              Le blocage d'un administrateur boutique suspend immédiatement l'accès à tout son espace de travail.
              Cette action est réversible mais affecte tous les membres associés.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
