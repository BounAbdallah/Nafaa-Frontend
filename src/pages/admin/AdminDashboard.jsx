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
      <div className={cn("w-12 h-12 rounded-card flex items-center justify-center flex-shrink-0", colors[color])}>
        <Icon size={24} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-sans font-medium text-muted-500">{label}</p>
        <div className="flex items-baseline gap-2">
          <p className="text-2xl font-display font-bold text-navy truncate">{value ?? '—'}</p>
          {sub && <span className="text-[10px] font-sans font-bold text-success flex items-center gap-0.5">
            <TrendingUp size={10} /> {sub}
          </span>}
        </div>
      </div>
    </>
  )

  if (to) {
    return (
      <Link to={to} className="card p-5 flex items-start gap-4 hover:shadow-md transition-all hover:border-primary-300">
        {Content}
      </Link>
    )
  }

  return (
    <div className="card p-5 flex items-start gap-4 hover:shadow-md transition-shadow">
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-navy">
            Console de Gestion Qiwam 👋
          </h1>
          <p className="text-sm font-sans text-muted-500 mt-1">
            Bienvenue {user?.name}, voici l'état actuel de votre plateforme.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="bg-surface border border-muted-200 px-3 py-2 rounded-btn flex items-center gap-2">
            <Activity size={16} className="text-success" />
            <span className="text-xs font-sans font-bold text-navy uppercase tracking-wider">Plateforme Opérationnelle</span>
          </div>
        </div>
      </div>

      {/* Primary Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="card p-5 animate-pulse h-24" />
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
              label="Utilisateurs Total"
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
              label="Demandes en attente"
              value={stats?.pending_approvals}
              color={stats?.pending_approvals > 0 ? 'danger' : 'success'}
              to="/admin/users?tenant_status=pending"
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Charts Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Chart */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-display font-bold text-navy">Nouveaux Espaces</h3>
                <p className="text-xs text-muted-500 mt-0.5">Inscriptions sur les 30 derniers jours</p>
              </div>
              <TrendingUp size={20} className="text-primary-500" />
            </div>
            
            <div className="h-[300px] w-full">
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
            </div>
          </div>

          {/* User management quick links */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              to="/admin/users"
              className="card p-5 flex items-center gap-4 hover:border-primary-300 hover:shadow-blue transition-all group"
            >
              <div className="w-10 h-10 rounded-card bg-primary-50 flex items-center justify-center text-primary-500">
                <UserCheck size={20} />
              </div>
              <div className="flex-1">
                <p className="font-sans font-semibold text-navy text-sm">Contrôle des Accès</p>
                <p className="text-xs text-muted-500 mt-0.5">Activer/suspendre les propriétaires de boutiques</p>
              </div>
              <ArrowRight size={16} className="text-muted-300 group-hover:text-primary-500 transition-colors" />
            </Link>

            <Link
              to="/admin/users"
              className="card p-5 flex items-center gap-4 hover:border-primary-300 hover:shadow-blue transition-all group"
            >
              <div className="w-10 h-10 rounded-card bg-amber-50 flex items-center justify-center text-amber-500">
                <LayoutGrid size={20} />
              </div>
              <div className="flex-1">
                <p className="font-sans font-semibold text-navy text-sm">Gestion des Modules</p>
                <p className="text-xs text-muted-500 mt-0.5">Configurer les fonctionnalités par client</p>
              </div>
              <ArrowRight size={16} className="text-muted-300 group-hover:text-primary-500 transition-colors" />
            </Link>
          </div>
        </div>

        {/* Industry Distribution Section */}
        <div className="lg:col-span-1 space-y-6">
          <div className="card p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display font-bold text-navy">Par Secteur</h3>
              <Filter size={18} className="text-muted-400" />
            </div>

            <div className="flex-1 min-h-[250px]">
              <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                <PieChart>
                  <Pie
                    data={pieData}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-6 space-y-3">
              {pieData.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
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
      <div className="card p-5 border-primary-100" style={{ background: 'linear-gradient(135deg, #EEF7FC 0%, #FAFCFE 100%)' }}>
        <div className="flex items-center gap-3">
          <ShieldAlert size={20} className="text-primary-500 flex-shrink-0" />
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
