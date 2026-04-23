import { useAuthStore } from '@/store/authStore'
import { useTenantStore } from '@/store/tenantStore'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { TrendingUp, Users, Package, ShoppingCart, BarChart2, Clock, ArrowUpRight, Zap } from 'lucide-react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { cn } from '@/utils/cn'
import { productService } from '@/services/productService'
import { customerService } from '@/services/customerService'

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

function StatCard({ title, value, change, icon: Icon, iconBg, iconColor, loading }) {
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between mb-1">
        <div className={cn('w-9 h-9 rounded-card flex items-center justify-center', iconBg)}>
          <Icon className={cn('w-[18px] h-[18px]', iconColor)} />
        </div>
        <div className="flex items-center gap-1 text-xs font-medium text-success bg-[#E3F5EC] px-2 py-0.5 rounded-badge">
          <ArrowUpRight className="w-3 h-3" />{change}
        </div>
      </div>
      {loading
        ? <div className="h-7 w-16 bg-muted-100 rounded animate-pulse my-1" />
        : <div className="stat-value">{value}</div>
      }
      <div className="stat-label">{title}</div>
    </div>
  )
}

function QuickActionCard({ icon: Icon, label, description, iconBg, iconColor, to }) {
  return (
    <Link to={to}>
      <Card hover className="flex items-start gap-3 !p-4 h-full">
        <div className={cn('w-9 h-9 rounded-card flex items-center justify-center shrink-0', iconBg)}>
          <Icon className={cn('w-[18px] h-[18px]', iconColor)} />
        </div>
        <div>
          <div className="font-display font-semibold text-sm text-navy">{label}</div>
          <div className="text-xs text-muted-500 mt-0.5">{description}</div>
        </div>
      </Card>
    </Link>
  )
}

export default function Dashboard() {
  const { user } = useAuthStore()
  const { tenant, fetchTenant } = useTenantStore()
  const [counts, setCounts] = useState({ products: null, customers: null })
  const [statsLoading, setStatsLoading] = useState(true)

  useEffect(() => { if (!tenant) fetchTenant() }, [tenant, fetchTenant])

  useEffect(() => {
    Promise.all([
      productService.getAll({ per_page: 1 }).catch(() => null),
      customerService.getAll({ per_page: 1 }).catch(() => null),
    ]).then(([pr, cr]) => {
      setCounts({
        products:  pr?.data?.meta?.total  ?? 0,
        customers: cr?.data?.meta?.total  ?? 0,
      })
    }).finally(() => setStatsLoading(false))
  }, [])

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Bonjour'
    if (h < 18) return 'Bon après-midi'
    return 'Bonsoir'
  }

  const hasProducts  = counts.products  > 0
  const hasCustomers = counts.customers > 0

  const stats = [
    { title: 'Revenus ce mois',     value: '0 FCFA',             change: '+0%',    icon: TrendingUp,  iconBg: 'bg-primary-50', iconColor: 'text-primary-500' },
    { title: 'Commandes actives',   value: '0',                  change: '+0%',    icon: ShoppingCart,iconBg: 'bg-[#F3E8FF]',  iconColor: 'text-[#7C3AED]'  },
    { title: 'Produits / Services', value: counts.products ?? 0, change: 'Catalogue', icon: Package,  iconBg: 'bg-[#E8F5E9]',  iconColor: 'text-success'    },
    { title: 'Clients',             value: counts.customers ?? 0,change: 'CRM',    icon: Users,       iconBg: 'bg-[#FEF3CC]',  iconColor: 'text-gold'       },
  ]

  const quickActions = [
    { icon: Package,      label: 'Produits & Services', description: 'Gérez votre catalogue',      iconBg: 'bg-primary-50', iconColor: 'text-primary-500', to: '/products'  },
    { icon: Users,        label: 'Clients',             description: 'Gérez votre base clients',   iconBg: 'bg-[#F3E8FF]',  iconColor: 'text-[#7C3AED]',  to: '/customers' },
    { icon: ShoppingCart, label: 'Commandes',           description: 'Créez et suivez vos ventes', iconBg: 'bg-[#E8F5E9]',  iconColor: 'text-success',    to: '/orders'    },
    { icon: BarChart2,    label: 'Rapports',            description: 'Analysez vos performances',  iconBg: 'bg-[#FEF3CC]',  iconColor: 'text-gold',       to: '/reports'   },
  ]

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Page header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display font-bold text-[28px] text-navy tracking-tight leading-tight">
            {greeting()}, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-muted-500 text-sm mt-0.5">
            {tenant
              ? `${tenant.name} · ${PROFILE_LABELS[tenant.profile_type] || tenant.profile_type}`
              : 'Votre tableau de bord NAFAA'}
          </p>
        </div>
        {tenant && (
          <div className="flex items-center gap-2 bg-surface border border-muted-300 rounded-badge px-3 py-1.5 shadow-card">
            <Zap className="w-3.5 h-3.5 text-primary-500" />
            <span className="text-xs font-display font-semibold text-navy">{PLAN_LABELS[tenant.plan] || tenant.plan}</span>
          </div>
        )}
      </div>

      {/* ── Getting started banner (hidden once all steps done) ── */}
      {(!hasProducts || !hasCustomers) && (
        <div className="bg-navy rounded-modal p-6 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-64 h-64 bg-primary-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/4 pointer-events-none" />
          <div className="relative z-10 space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary-300" />
              <span className="text-xs font-display font-semibold tracking-[0.12em] uppercase text-primary-300">Démarrage rapide</span>
            </div>
            <h2 className="font-display font-bold text-xl text-white">Votre espace est prêt !</h2>
            <p className="text-white/55 text-sm max-w-md">
              Suivez ces étapes pour démarrer votre activité sur NAFAA.
            </p>
            <div className="flex items-center gap-2 flex-wrap pt-1">
              {[
                { label: 'Espace créé',        done: true },
                { label: 'Premier produit',    done: hasProducts },
                { label: 'Premier client',     done: hasCustomers },
                { label: 'Première commande',  done: false },
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
            <div className="pt-1">
              <Link to={!hasProducts ? '/products' : '/customers'}>
                <Button variant="primary" size="sm">
                  {!hasProducts ? 'Ajouter mon premier produit' : 'Ajouter mon premier client'}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── Stats ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => <StatCard key={s.title} {...s} loading={statsLoading && (s.title === 'Produits / Services' || s.title === 'Clients')} />)}
      </div>

      {/* ── Quick actions ── */}
      <div>
        <h2 className="font-display font-semibold text-[15px] text-navy mb-3">Navigation rapide</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {quickActions.map((a) => <QuickActionCard key={a.label} {...a} />)}
        </div>
      </div>

      {/* ── Activity & Orders placeholder ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <h3 className="font-display font-semibold text-[15px] text-navy mb-4">Activité récente</h3>
          <div className="text-center py-8 space-y-2">
            <BarChart2 className="w-8 h-8 text-muted-300 mx-auto" />
            <p className="text-muted-500 text-sm">Aucune activité pour l'instant</p>
            <p className="text-muted-300 text-xs">Commencez à utiliser NAFAA pour voir votre activité ici</p>
          </div>
        </Card>
        <Card>
          <h3 className="font-display font-semibold text-[15px] text-navy mb-4">Commandes récentes</h3>
          <div className="text-center py-8 space-y-2">
            <ShoppingCart className="w-8 h-8 text-muted-300 mx-auto" />
            <p className="text-muted-500 text-sm">Aucune commande</p>
            <p className="text-muted-300 text-xs">Vos commandes apparaîtront ici</p>
          </div>
        </Card>
      </div>

    </div>
  )
}
