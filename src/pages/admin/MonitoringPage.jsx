import { useEffect, useState, useCallback } from 'react'
import { adminService } from '@/services/adminService'
import {
  Activity, Search, X, Loader2, Monitor, Smartphone,
  Globe, ChevronLeft, ChevronRight, BarChart2, CalendarDays, RefreshCw,
  Wifi, LogOut, Radio,
} from 'lucide-react'
import { confirmDialog } from '@/utils/confirm'
import toast from 'react-hot-toast'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ComposedChart, Line, Legend,
} from 'recharts'
import { cn } from '@/utils/cn'
import CountryFilter from '@/components/admin/CountryFilter'

const fmtDateTime = (iso) =>
  new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

const timeAgo = (iso) => {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)  return "à l'instant"
  if (mins < 60) return `il y a ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `il y a ${hours} h`
  const days = Math.floor(hours / 24)
  return `il y a ${days} j`
}

const deviceFromUA = (ua) => {
  if (!ua) return { icon: Globe, label: 'Inconnu' }
  if (/mobile|android|iphone|ipad/i.test(ua)) return { icon: Smartphone, label: 'Mobile' }
  return { icon: Monitor, label: 'Ordinateur' }
}

export default function MonitoringPage() {
  const [logins, setLogins]   = useState([])
  const [meta, setMeta]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage]       = useState(1)
  const [search, setSearch]   = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo]     = useState('')
  const [country, setCountry]   = useState('')
  const [freqUser, setFreqUser] = useState(null) // utilisateur sélectionné pour la fréquence

  const fetchLogins = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, per_page: 20 }
      if (search)   params.search    = search
      if (dateFrom) params.date_from = dateFrom
      if (dateTo)   params.date_to   = dateTo
      if (country)  params.country   = country
      const r = await adminService.getLogins(params)
      setLogins(r.data.logins)
      setMeta(r.data.meta)
    } catch { /* erreurs gérées par l'interceptor */ }
    finally { setLoading(false) }
  }, [page, search, dateFrom, dateTo, country])

  useEffect(() => {
    const t = setTimeout(fetchLogins, search ? 350 : 0) // debounce sur la recherche
    return () => clearTimeout(t)
  }, [fetchLogins])

  const resetFilters = () => { setSearch(''); setDateFrom(''); setDateTo(''); setPage(1) }
  const hasFilters = search || dateFrom || dateTo

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-bold text-navy flex items-center gap-2">
            <Activity size={22} className="text-primary-500" />
            Monitoring des connexions
          </h1>
          <p className="text-sm font-sans text-muted-500 mt-1">
            Dernières connexions des utilisateurs de la plateforme.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <CountryFilter value={country} onChange={(c) => { setCountry(c); setPage(1) }} className="w-44" />
          <button onClick={fetchLogins} className="btn-secondary p-2.5" title="Rafraîchir">
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* Sessions en cours */}
      <ActiveSessionsCard country={country} />

      {/* Fréquence globale */}
      <GlobalFrequencyCard country={country} />

      {/* Filtres */}
      <div className="card p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-500" />
            <input
              type="text"
              placeholder="Rechercher par nom ou e-mail…"
              className="input-field pl-10 w-full"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="date"
              className="input-field text-sm"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setPage(1) }}
              title="Date début"
            />
            <span className="text-muted-400 text-xs">→</span>
            <input
              type="date"
              className="input-field text-sm"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setPage(1) }}
              title="Date fin"
            />
            {hasFilters && (
              <button onClick={resetFilters} className="p-2 rounded-btn text-muted-500 hover:bg-muted-100" title="Réinitialiser">
                <X size={15} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tableau */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-muted-300 bg-muted-100/50">
                <th className="text-left py-3 px-4 text-xs font-sans font-semibold text-muted-700 uppercase tracking-wide">Utilisateur</th>
                <th className="text-left py-3 px-4 text-xs font-sans font-semibold text-muted-700 uppercase tracking-wide hidden md:table-cell">Espace</th>
                <th className="text-left py-3 px-4 text-xs font-sans font-semibold text-muted-700 uppercase tracking-wide hidden lg:table-cell">IP</th>
                <th className="text-center py-3 px-4 text-xs font-sans font-semibold text-muted-700 uppercase tracking-wide hidden sm:table-cell">Appareil</th>
                <th className="text-right py-3 px-4 text-xs font-sans font-semibold text-muted-700 uppercase tracking-wide">Connexion</th>
                <th className="py-3 px-4 w-16" />
              </tr>
            </thead>
            <tbody className="divide-y divide-muted-100">
              {loading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-3 px-4"><div className="h-4 w-44 bg-muted-100 rounded" /></td>
                    <td className="py-3 px-4 hidden md:table-cell"><div className="h-4 w-28 bg-muted-100 rounded" /></td>
                    <td className="py-3 px-4 hidden lg:table-cell"><div className="h-4 w-24 bg-muted-100 rounded" /></td>
                    <td className="py-3 px-4 hidden sm:table-cell"><div className="h-4 w-16 bg-muted-100 rounded mx-auto" /></td>
                    <td className="py-3 px-4"><div className="h-4 w-28 bg-muted-100 rounded ml-auto" /></td>
                    <td className="py-3 px-4" />
                  </tr>
                ))
              ) : logins.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <Activity size={32} className="mx-auto text-muted-300 mb-3" />
                    <p className="text-sm font-sans text-muted-500">Aucune connexion trouvée.</p>
                  </td>
                </tr>
              ) : (
                logins.map((log) => {
                  const device = deviceFromUA(log.user_agent)
                  const DeviceIcon = device.icon
                  return (
                    <tr key={log.id} className="hover:bg-primary-50/40 transition-colors">
                      <td className="py-3 px-4">
                        <p className="text-sm font-sans font-semibold text-navy">{log.user?.name ?? '—'}</p>
                        <p className="text-[11px] text-muted-500">{log.user?.email}</p>
                      </td>
                      <td className="py-3 px-4 hidden md:table-cell">
                        <span className="text-xs font-sans text-muted-700">{log.tenant?.name ?? '—'}</span>
                      </td>
                      <td className="py-3 px-4 hidden lg:table-cell">
                        <span className="text-xs font-mono text-muted-600">{log.ip_address ?? '—'}</span>
                      </td>
                      <td className="py-3 px-4 text-center hidden sm:table-cell">
                        <span className="inline-flex items-center gap-1.5 text-xs text-muted-600" title={log.user_agent ?? ''}>
                          <DeviceIcon size={13} className="text-muted-400" />
                          {device.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <p className="text-xs font-sans font-semibold text-navy whitespace-nowrap">{timeAgo(log.created_at)}</p>
                        <p className="text-[11px] text-muted-500 whitespace-nowrap">{fmtDateTime(log.created_at)}</p>
                      </td>
                      <td className="py-3 px-4">
                        {log.user && (
                          <button
                            onClick={() => setFreqUser(log.user)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-btn border border-muted-200 text-xs font-sans font-semibold text-muted-600 hover:text-primary-600 hover:border-primary-300 hover:bg-primary-50 transition-colors whitespace-nowrap"
                            title="Voir la fréquence de connexion de cet utilisateur"
                          >
                            <BarChart2 size={13} />
                            <span className="hidden xl:inline">Fréquence</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta && meta.last_page > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-muted-200">
            <p className="text-xs text-muted-500">
              {meta.total} connexions — page {meta.current_page}/{meta.last_page}
            </p>
            <div className="flex gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                className="p-1.5 rounded-btn border border-muted-200 text-muted-600 disabled:opacity-40 hover:bg-muted-50"
              >
                <ChevronLeft size={15} />
              </button>
              <button
                disabled={page >= meta.last_page}
                onClick={() => setPage(p => p + 1)}
                className="p-1.5 rounded-btn border border-muted-200 text-muted-600 disabled:opacity-40 hover:bg-muted-50"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal fréquence */}
      {freqUser && (
        <FrequencyModal user={freqUser} onClose={() => setFreqUser(null)} />
      )}
    </div>
  )
}

// ── Carte : sessions en cours (utilisateurs connectés en temps réel) ─────────
function ActiveSessionsCard({ country = '' }) {
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy]     = useState(null)

  const fetch = useCallback(async () => {
    try {
      const r = await adminService.getActiveSessions({ country: country || undefined, per_page: 50 })
      setData(r.data)
    } catch { /* géré par l'interceptor */ }
    finally { setLoading(false) }
  }, [country])

  // Rafraîchissement automatique toutes les 30 s
  useEffect(() => {
    fetch()
    const t = setInterval(fetch, 30000)
    return () => clearInterval(t)
  }, [fetch])

  const revoke = async (s) => {
    if (!(await confirmDialog({
      title: `Déconnecter ${s.user.name} ?`,
      text: 'Sa session active sera fermée immédiatement.',
      confirmText: 'Déconnecter',
    }))) return
    setBusy(s.id)
    try {
      const r = await adminService.revokeSession(s.id)
      toast.success(r.message)
      fetch()
    } catch { toast.error('Erreur.') }
    finally { setBusy(null) }
  }

  const sessions = data?.sessions ?? []

  return (
    <div className="card p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-display font-bold text-navy flex items-center gap-2">
            <Radio size={17} className="text-primary-500" />
            Sessions en cours
          </h3>
          <p className="text-xs text-muted-500 mt-0.5">Utilisateurs actuellement connectés (actualisé toutes les 30 s).</p>
        </div>
        {data && (
          <span className="inline-flex items-center gap-1.5 text-sm font-display font-bold text-success bg-green-50 px-3 py-1.5 rounded-badge">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            {data.online_count} en ligne
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 size={22} className="animate-spin text-primary-500" /></div>
      ) : sessions.length === 0 ? (
        <p className="text-sm text-muted-500 text-center py-8">Aucune session active pour le moment.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-muted-200">
                <th className="text-left py-2 px-3 text-[11px] font-sans font-semibold text-muted-500 uppercase tracking-wide">Utilisateur</th>
                <th className="text-left py-2 px-3 text-[11px] font-sans font-semibold text-muted-500 uppercase tracking-wide hidden md:table-cell">Espace</th>
                <th className="text-center py-2 px-3 text-[11px] font-sans font-semibold text-muted-500 uppercase tracking-wide">État</th>
                <th className="text-right py-2 px-3 text-[11px] font-sans font-semibold text-muted-500 uppercase tracking-wide">Dernière activité</th>
                <th className="py-2 px-3 w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-muted-100">
              {sessions.map(s => (
                <tr key={s.id} className="hover:bg-muted-50/60">
                  <td className="py-2.5 px-3">
                    <p className="text-sm font-sans font-semibold text-navy">{s.user.name}</p>
                    <p className="text-[11px] text-muted-500">{s.user.email}</p>
                  </td>
                  <td className="py-2.5 px-3 hidden md:table-cell">
                    <span className="text-xs text-muted-700">{s.tenant ?? '—'}</span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {s.is_online ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-success">
                        <Wifi size={11} />En ligne
                      </span>
                    ) : (
                      <span className="text-[11px] text-muted-400">Inactif</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <span className="text-xs text-muted-500 whitespace-nowrap">{timeAgo(s.last_activity)}</span>
                  </td>
                  <td className="py-2.5 px-3">
                    <button
                      onClick={() => revoke(s)}
                      disabled={busy === s.id}
                      className="p-1.5 rounded-btn text-muted-400 hover:text-danger hover:bg-danger/5 transition-colors disabled:opacity-50"
                      title="Déconnecter cette session"
                    >
                      {busy === s.id ? <Loader2 size={14} className="animate-spin" /> : <LogOut size={14} />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── Carte : fréquence globale de connexion (tous utilisateurs) ───────────────
function GlobalFrequencyCard({ country = '' }) {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [days, setDays]       = useState(30)

  useEffect(() => {
    setLoading(true)
    adminService.getGlobalLoginFrequency({ days, country: country || undefined })
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [days, country])

  return (
    <div className="card p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="font-display font-bold text-navy flex items-center gap-2">
            <BarChart2 size={17} className="text-primary-500" />
            Fréquence globale de connexion
          </h3>
          <p className="text-xs text-muted-500 mt-0.5">Connexions et utilisateurs actifs par jour, tous utilisateurs confondus.</p>
        </div>
        <div className="flex gap-2">
          {[7, 30, 90].map(d => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={cn(
                'px-3 py-1.5 rounded-btn text-xs font-sans font-semibold border transition-colors',
                days === d
                  ? 'bg-primary-500 text-white border-primary-500'
                  : 'border-muted-200 text-muted-600 hover:border-primary-300'
              )}
            >
              {d} j
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 size={24} className="animate-spin text-primary-500" />
        </div>
      ) : !data ? (
        <p className="text-sm text-muted-500 text-center py-10">Données indisponibles.</p>
      ) : (
        <>
          {/* Stats globales */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <div className="bg-muted-50 rounded-card p-3 text-center">
              <p className="text-xl font-display font-bold text-navy">{data.total_logins}</p>
              <p className="text-[11px] text-muted-500">Connexions ({data.days} j)</p>
            </div>
            <div className="bg-muted-50 rounded-card p-3 text-center">
              <p className="text-xl font-display font-bold text-navy">{data.unique_users}</p>
              <p className="text-[11px] text-muted-500">Utilisateurs actifs</p>
            </div>
            <div className="bg-muted-50 rounded-card p-3 text-center">
              <p className="text-xl font-display font-bold text-navy">{data.avg_per_day}</p>
              <p className="text-[11px] text-muted-500">Moy. / jour</p>
            </div>
            <div className="bg-muted-50 rounded-card p-3 text-center">
              <p className="text-xl font-display font-bold text-navy">{data.peak_day?.logins ?? 0}</p>
              <p className="text-[11px] text-muted-500">Pic ({data.peak_day?.label ?? '—'})</p>
            </div>
          </div>

          {/* Chart combiné : barres = connexions, ligne = utilisateurs uniques */}
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
              <ComposedChart data={data.series} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 9, fill: '#64748b' }}
                  interval={days <= 7 ? 0 : 'preserveStartEnd'}
                />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: 12 }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="logins" name="Connexions" fill="#3AA0D8" radius={[3, 3, 0, 0]} />
                <Line type="monotone" dataKey="users" name="Utilisateurs uniques" stroke="#E8A020" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  )
}

// ── Modal : fréquence de connexion d'un utilisateur ──────────────────────────
function FrequencyModal({ user, onClose }) {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [days, setDays]       = useState(30)

  useEffect(() => {
    setLoading(true)
    adminService.getLoginFrequency(user.id, { days })
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user.id, days])

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-surface rounded-card w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-muted-200 sticky top-0 bg-surface">
          <div>
            <h3 className="font-display font-bold text-navy flex items-center gap-2">
              <CalendarDays size={17} className="text-primary-500" />
              Fréquence de connexion
            </h3>
            <p className="text-xs text-muted-500 mt-0.5">{user.name} — {user.email}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-btn text-muted-500 hover:bg-muted-100">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Période */}
          <div className="flex gap-2">
            {[7, 30, 90].map(d => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={cn(
                  'px-3 py-1.5 rounded-btn text-xs font-sans font-semibold border transition-colors',
                  days === d
                    ? 'bg-primary-500 text-white border-primary-500'
                    : 'border-muted-200 text-muted-600 hover:border-primary-300'
                )}
              >
                {d} jours
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-56">
              <Loader2 size={24} className="animate-spin text-primary-500" />
            </div>
          ) : !data ? (
            <p className="text-sm text-muted-500 text-center py-10">Données indisponibles.</p>
          ) : (
            <>
              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="card p-3 text-center">
                  <p className="text-xl font-display font-bold text-navy">{data.total_period}</p>
                  <p className="text-[11px] text-muted-500">Connexions ({data.days} j)</p>
                </div>
                <div className="card p-3 text-center">
                  <p className="text-xl font-display font-bold text-navy">{data.active_days}</p>
                  <p className="text-[11px] text-muted-500">Jours actifs</p>
                </div>
                <div className="card p-3 text-center">
                  <p className="text-xl font-display font-bold text-navy">{data.avg_per_week}</p>
                  <p className="text-[11px] text-muted-500">Moy. / semaine</p>
                </div>
                <div className="card p-3 text-center">
                  <p className="text-xl font-display font-bold text-navy">{data.total_all}</p>
                  <p className="text-[11px] text-muted-500">Total historique</p>
                </div>
              </div>

              {/* Chart */}
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                  <BarChart data={data.series} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="label"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 9, fill: '#64748b' }}
                      interval={days <= 7 ? 0 : 'preserveStartEnd'}
                    />
                    <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                    <Tooltip
                      formatter={(v) => [`${v} connexion${v > 1 ? 's' : ''}`]}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: 12 }}
                    />
                    <Bar dataKey="count" fill="#3AA0D8" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {data.user.last_login_at && (
                <p className="text-xs text-muted-500 text-center">
                  Dernière connexion : {fmtDateTime(data.user.last_login_at)}
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
