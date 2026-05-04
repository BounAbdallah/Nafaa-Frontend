import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { appointmentService, quoteService, invoiceService, contractService } from '@/services/prestateurService'
import {
  Calendar, FileText, Receipt, FilePenLine,
  TrendingUp, Clock, CheckCircle, AlertTriangle,
  Plus, ArrowRight, Users,
} from 'lucide-react'
import { cn } from '@/utils/cn'

const fmt = (n) => new Intl.NumberFormat('fr-FR').format(n ?? 0) + ' FCFA'

const STATUS_QUOTE = {
  draft:    { label: 'Brouillon', color: 'bg-muted-100 text-muted-600' },
  sent:     { label: 'Envoyé',    color: 'bg-blue-100 text-blue-700'   },
  accepted: { label: 'Accepté',   color: 'bg-green-100 text-green-700' },
  rejected: { label: 'Refusé',    color: 'bg-red-100 text-red-700'     },
  expired:  { label: 'Expiré',    color: 'bg-amber-100 text-amber-700' },
}

const STATUS_INVOICE = {
  draft:     { label: 'Brouillon', color: 'bg-muted-100 text-muted-600' },
  sent:      { label: 'Envoyée',   color: 'bg-blue-100 text-blue-700'   },
  paid:      { label: 'Payée',     color: 'bg-green-100 text-green-700' },
  overdue:   { label: 'En retard', color: 'bg-red-100 text-red-700'     },
  cancelled: { label: 'Annulée',   color: 'bg-muted-100 text-muted-600' },
}

export default function PrestateurDashboard() {
  const [appointments, setAppointments] = useState([])
  const [quotes, setQuotes]             = useState({ data: [] })
  const [invoices, setInvoices]         = useState({ data: [] })
  const [contracts, setContracts]       = useState({ data: [] })
  const [loading, setLoading]           = useState(true)

  useEffect(() => {
    const today = new Date()
    const month = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
    Promise.all([
      appointmentService.getAll({ month }),
      quoteService.getAll({ per_page: 5 }),
      invoiceService.getAll({ per_page: 5 }),
      contractService.getAll({ per_page: 5 }),
    ]).then(([a, q, inv, c]) => {
      setAppointments(a.data)
      setQuotes(q.data)
      setInvoices(inv.data)
      setContracts(c.data)
    }).finally(() => setLoading(false))
  }, [])

  // KPIs
  const totalPaid      = invoices.data?.filter(i => i.status === 'paid').reduce((s, i) => s + parseFloat(i.total), 0) ?? 0
  const pendingInvoices = invoices.data?.filter(i => ['sent','overdue'].includes(i.status)).length ?? 0
  const overdueInvoices = invoices.data?.filter(i => i.status === 'overdue').length ?? 0
  const todayAppts     = appointments.filter(a => {
    const d = new Date(a.start_at)
    const t = new Date()
    return d.toDateString() === t.toDateString()
  })

  const kpis = [
    { icon: TrendingUp,    label: 'CA Encaissé (mois)',    value: fmt(totalPaid),         color: 'text-green-600',  bg: 'bg-green-50'  },
    { icon: Clock,         label: 'Factures en attente',   value: pendingInvoices,         color: 'text-blue-600',   bg: 'bg-blue-50'   },
    { icon: AlertTriangle, label: 'Factures en retard',    value: overdueInvoices,         color: 'text-red-600',    bg: 'bg-red-50'    },
    { icon: Calendar,      label: "RDV aujourd'hui",       value: todayAppts.length,       color: 'text-primary-600',bg: 'bg-primary-50' },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-black text-navy tracking-tight">Espace Prestateur</h1>
          <p className="text-sm text-muted-500 mt-1">Gérez vos RDV, devis, factures et contrats.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/prestateur/quotes/new"    className="btn-primary flex items-center gap-2"><Plus size={16} />Nouveau devis</Link>
          <Link to="/prestateur/contracts/new" className="btn-outline flex items-center gap-2"><Plus size={16} />Contrat</Link>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k, i) => (
          <div key={i} className="bg-surface rounded-card border border-muted-200 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className={cn('p-2.5 rounded-lg', k.bg)}>
                <k.icon size={20} className={k.color} />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-navy">{k.value}</div>
              <div className="text-xs text-muted-500 mt-0.5">{k.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Grille principale */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* RDV du mois */}
        <Section
          icon={Calendar} title="Prochains RDV" color="text-primary-600"
          href="/prestateur/calendar" label="Voir le calendrier"
        >
          {loading ? <Skeleton /> : appointments.slice(0, 5).length === 0 ? (
            <Empty text="Aucun RDV ce mois-ci" />
          ) : appointments.slice(0, 5).map(a => (
            <div key={a.id} className="flex items-center gap-3 py-2.5 border-b border-muted-100 last:border-0">
              <div className="w-1.5 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: a.color || '#3AA0D8' }} />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-navy truncate">{a.title}</div>
                <div className="text-xs text-muted-500">{a.customer?.name || '—'} · {fmtDate(a.start_at)}</div>
              </div>
              <StatusBadge status={a.status} map={{
                scheduled: { label: 'Prévu',     color: 'bg-blue-100 text-blue-700'    },
                confirmed:  { label: 'Confirmé',  color: 'bg-green-100 text-green-700'  },
                completed:  { label: 'Terminé',   color: 'bg-muted-100 text-muted-600'  },
                cancelled:  { label: 'Annulé',    color: 'bg-red-100 text-red-700'      },
              }} />
            </div>
          ))}
        </Section>

        {/* Devis récents */}
        <Section
          icon={FileText} title="Derniers devis" color="text-amber-600"
          href="/prestateur/quotes" label="Tous les devis"
        >
          {loading ? <Skeleton /> : quotes.data?.length === 0 ? (
            <Empty text="Aucun devis" />
          ) : quotes.data?.slice(0, 5).map(q => (
            <Link key={q.id} to={`/prestateur/quotes/${q.id}`}
              className="flex items-center gap-3 py-2.5 border-b border-muted-100 last:border-0 hover:bg-muted-50 -mx-1 px-1 rounded transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-navy truncate">{q.title}</div>
                <div className="text-xs text-muted-500">{q.reference} · {q.customer?.name || '—'}</div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-sm font-bold text-navy">{fmt(q.total)}</div>
                <StatusBadge status={q.status} map={STATUS_QUOTE} />
              </div>
            </Link>
          ))}
        </Section>

        {/* Factures récentes */}
        <Section
          icon={Receipt} title="Dernières factures" color="text-green-600"
          href="/prestateur/invoices" label="Toutes les factures"
        >
          {loading ? <Skeleton /> : invoices.data?.length === 0 ? (
            <Empty text="Aucune facture" />
          ) : invoices.data?.slice(0, 5).map(inv => (
            <Link key={inv.id} to={`/prestateur/invoices/${inv.id}`}
              className="flex items-center gap-3 py-2.5 border-b border-muted-100 last:border-0 hover:bg-muted-50 -mx-1 px-1 rounded transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-navy truncate">{inv.title}</div>
                <div className="text-xs text-muted-500">{inv.reference} · Échéance {fmtDate(inv.due_at)}</div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-sm font-bold text-navy">{fmt(inv.total)}</div>
                <StatusBadge status={inv.status} map={STATUS_INVOICE} />
              </div>
            </Link>
          ))}
        </Section>

        {/* Contrats récents */}
        <Section
          icon={FilePenLine} title="Contrats actifs" color="text-purple-600"
          href="/prestateur/contracts" label="Tous les contrats"
        >
          {loading ? <Skeleton /> : contracts.data?.length === 0 ? (
            <Empty text="Aucun contrat" />
          ) : contracts.data?.slice(0, 5).map(c => (
            <Link key={c.id} to={`/prestateur/contracts/${c.id}`}
              className="flex items-center gap-3 py-2.5 border-b border-muted-100 last:border-0 hover:bg-muted-50 -mx-1 px-1 rounded transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-navy truncate">{c.title}</div>
                <div className="text-xs text-muted-500">{c.reference} · {c.customer?.name || '—'}</div>
              </div>
              <div className="text-right flex-shrink-0">
                {c.value && <div className="text-sm font-bold text-navy">{fmt(c.value)}</div>}
                <StatusBadge status={c.status} map={{
                  draft:     { label: 'Brouillon', color: 'bg-muted-100 text-muted-600'     },
                  sent:      { label: 'Envoyé',    color: 'bg-blue-100 text-blue-700'       },
                  signed:    { label: 'Signé',     color: 'bg-green-100 text-green-700'     },
                  expired:   { label: 'Expiré',    color: 'bg-amber-100 text-amber-700'     },
                  cancelled: { label: 'Annulé',    color: 'bg-red-100 text-red-700'         },
                }} />
              </div>
            </Link>
          ))}
        </Section>
      </div>
    </div>
  )
}

// ── Sous-composants ──────────────────────────────────────────────────────────

const Section = ({ icon: Icon, title, color, href, label, children }) => (
  <div className="bg-surface rounded-card border border-muted-200 shadow-sm overflow-hidden">
    <div className="flex items-center justify-between px-5 py-4 border-b border-muted-100">
      <div className="flex items-center gap-2.5">
        <Icon size={18} className={color} />
        <h2 className="font-bold text-navy text-sm">{title}</h2>
      </div>
      <Link to={href} className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 font-medium">
        {label} <ArrowRight size={13} />
      </Link>
    </div>
    <div className="px-5 py-2">{children}</div>
  </div>
)

const StatusBadge = ({ status, map }) => {
  const s = map[status] ?? { label: status, color: 'bg-muted-100 text-muted-600' }
  return <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', s.color)}>{s.label}</span>
}

const Skeleton = () => (
  <div className="space-y-2 py-2">
    {[...Array(3)].map((_, i) => <div key={i} className="h-10 bg-muted-100 rounded animate-pulse" />)}
  </div>
)

const Empty = ({ text }) => (
  <div className="py-8 text-center text-sm text-muted-400">{text}</div>
)

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) : '—'
