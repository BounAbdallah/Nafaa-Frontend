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
  MailWarning,
  ArrowRight,
  TrendingUp,
} from 'lucide-react'

function StatCard({ icon: Icon, label, value, color = 'primary', sub }) {
  const colors = {
    primary: 'bg-primary-50 text-primary-500',
    gold:    'bg-amber-50 text-amber-500',
    danger:  'bg-red-50 text-danger',
    success: 'bg-green-50 text-success',
  }

  return (
    <div className="card p-5 flex items-start gap-4">
      <div className={`w-10 h-10 rounded-card flex items-center justify-center flex-shrink-0 ${colors[color]}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-2xl font-display font-bold text-navy">{value ?? '—'}</p>
        <p className="text-sm font-sans text-muted-500 mt-0.5">{label}</p>
        {sub && <p className="text-xs text-muted-500 mt-1">{sub}</p>}
      </div>
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold text-navy">
          Bonjour, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-sm font-sans text-muted-500 mt-1">
          Vue d'ensemble de la plateforme Qiwam
        </p>
      </div>

      {/* Stats grid */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="h-10 w-10 rounded-card bg-muted-100 mb-3" />
              <div className="h-6 w-16 bg-muted-100 rounded mb-2" />
              <div className="h-4 w-24 bg-muted-100 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={Users}
            label="Utilisateurs total"
            value={stats?.total_users}
            color="primary"
          />
          <StatCard
            icon={UserCheck}
            label="Utilisateurs actifs"
            value={stats?.active_users}
            color="success"
          />
          <StatCard
            icon={UserX}
            label="Utilisateurs bloqués"
            value={stats?.blocked_users}
            color="danger"
          />
          <StatCard
            icon={MailWarning}
            label="Non vérifiés"
            value={stats?.unverified}
            color="gold"
          />
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          to="/admin/users"
          className="card p-5 flex items-center gap-4 hover:border-primary-300 hover:shadow-blue transition-all group"
        >
          <div className="w-10 h-10 rounded-card bg-primary-50 flex items-center justify-center text-primary-500">
            <Users size={20} />
          </div>
          <div className="flex-1">
            <p className="font-sans font-semibold text-navy text-sm">Gérer les utilisateurs</p>
            <p className="text-xs text-muted-500 mt-0.5">
              Bloquer, débloquer, consulter les profils
            </p>
          </div>
          <ArrowRight size={16} className="text-muted-300 group-hover:text-primary-500 transition-colors" />
        </Link>

        <Link
          to="/admin/tenants"
          className="card p-5 flex items-center gap-4 hover:border-primary-300 hover:shadow-blue transition-all group"
        >
          <div className="w-10 h-10 rounded-card bg-amber-50 flex items-center justify-center text-amber-500">
            <Building2 size={20} />
          </div>
          <div className="flex-1">
            <p className="font-sans font-semibold text-navy text-sm">Espaces de travail</p>
            <p className="text-xs text-muted-500 mt-0.5">
              Voir et gérer tous les tenants
            </p>
          </div>
          <ArrowRight size={16} className="text-muted-300 group-hover:text-primary-500 transition-colors" />
        </Link>
      </div>

      {/* Platform info banner */}
      <div className="card p-5 border-primary-100" style={{ background: 'linear-gradient(135deg, #EEF7FC 0%, #FAFCFE 100%)' }}>
        <div className="flex items-center gap-3">
          <ShieldAlert size={20} className="text-primary-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-sans font-semibold text-navy">
              Accès super administrateur
            </p>
            <p className="text-xs font-sans text-muted-500 mt-0.5">
              Vous avez un accès complet à toutes les fonctionnalités de la plateforme.
              Agissez avec précaution.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
