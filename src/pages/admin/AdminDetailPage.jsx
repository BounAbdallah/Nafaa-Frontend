import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { adminService } from '@/services/adminService'
import { COUNTRIES } from '@/utils/currency'
import { confirmDialog } from '@/utils/confirm'
import toast from 'react-hot-toast'
import {
  ShieldCheck, ChevronLeft, Loader2, Globe, Mail, Phone,
  Calendar, Clock, Lock, Unlock, Trash2, Monitor, Smartphone,
  BarChart2, Activity,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { cn } from '@/utils/cn'

const countryLabel = (code) =>
  COUNTRIES.find(c => c.code === code)?.label ?? code ?? '—'

const fmtDateTime = (iso) =>
  iso ? new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'

const deviceFromUA = (ua) => {
  if (!ua) return { icon: Globe, label: 'Inconnu' }
  if (/mobile|android|iphone|ipad/i.test(ua)) return { icon: Smartphone, label: 'Mobile' }
  return { icon: Monitor, label: 'Ordinateur' }
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-muted-100 last:border-0">
      <Icon size={15} className="text-muted-400 shrink-0" />
      <span className="text-xs font-sans font-semibold text-muted-500 uppercase tracking-wide w-36 shrink-0">{label}</span>
      <span className="text-sm font-sans text-navy">{value ?? '—'}</span>
    </div>
  )
}

export default function AdminDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData]       = useState(null)
  const [freq, setFreq]       = useState(null)
  const [days, setDays]       = useState(30)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy]       = useState(false)

  const load = () => {
    setLoading(true)
    adminService.getAdmin(id)
      .then(r => setData(r))
      .catch(() => { toast.error('Admin introuvable.'); navigate('/admin/admins') })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [id])

  useEffect(() => {
    adminService.getLoginFrequency(id, { days })
      .then(r => setFreq(r.data))
      .catch(() => {})
  }, [id, days])

  const admin = data?.admin

  const handleBlockToggle = async () => {
    if (!admin) return
    setBusy(true)
    try {
      if (admin.is_active) {
        const reason = window.prompt('Raison du blocage (optionnel) :')
        if (reason === null) { setBusy(false); return }
        const r = await adminService.blockAdmin(admin.id, reason)
        toast.success(r.message)
      } else {
        const r = await adminService.unblockAdmin(admin.id)
        toast.success(r.message)
      }
      load()
    } catch { toast.error('Erreur.') }
    finally { setBusy(false) }
  }

  const handleDelete = async () => {
    if (!(await confirmDialog({
      title: `Supprimer le compte de ${admin.name} ?`,
      text: 'Cette action est irréversible.',
      confirmText: 'Supprimer',
    }))) return
    try {
      const r = await adminService.deleteAdmin(admin.id)
      toast.success(r.message)
      navigate('/admin/admins')
    } catch { toast.error('Erreur lors de la suppression.') }
  }

  if (loading || !admin) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={24} className="animate-spin text-primary-500" />
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Breadcrumb + header */}
      <div>
        <Link to="/admin/admins" className="inline-flex items-center gap-1.5 text-xs font-sans text-muted-500 hover:text-navy transition-colors">
          <ChevronLeft size={14} />Administrateurs
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary-500 flex items-center justify-center text-white font-display font-bold text-lg">
              {admin.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-display font-bold text-navy flex items-center gap-2">
                {admin.name}
                <span className={cn(
                  'text-xs font-sans font-bold px-2 py-0.5 rounded-badge',
                  admin.is_active ? 'bg-green-50 text-success' : 'bg-red-50 text-danger'
                )}>
                  {admin.is_active ? 'Actif' : 'Bloqué'}
                </span>
              </h1>
              <p className="text-sm font-sans text-muted-500 flex items-center gap-1.5">
                <ShieldCheck size={13} className="text-primary-500" />
                Admin pays — {countryLabel(admin.country_code)}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleBlockToggle}
              disabled={busy}
              className={cn(
                'flex items-center gap-1.5 text-xs font-sans font-semibold px-3 py-2 rounded-btn border transition-colors disabled:opacity-50',
                admin.is_active
                  ? 'border-amber-200 text-amber-600 hover:bg-amber-50'
                  : 'border-green-200 text-success hover:bg-green-50'
              )}
            >
              {admin.is_active ? <Lock size={13} /> : <Unlock size={13} />}
              {admin.is_active ? 'Bloquer' : 'Débloquer'}
            </button>
            <button
              onClick={handleDelete}
              className="flex items-center gap-1.5 text-xs font-sans font-semibold px-3 py-2 rounded-btn border border-red-200 text-danger hover:bg-red-50 transition-colors"
            >
              <Trash2 size={13} />
              Supprimer
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Infos complètes */}
        <div className="card p-4 sm:p-5">
          <h2 className="font-display font-semibold text-navy mb-3">Informations</h2>
          <InfoRow icon={Mail}     label="E-mail"        value={admin.email} />
          <InfoRow icon={Phone}    label="Téléphone"     value={admin.phone} />
          <InfoRow icon={Globe}    label="Pays géré"     value={countryLabel(admin.country_code)} />
          <InfoRow icon={Calendar} label="Créé le"       value={fmtDateTime(admin.created_at)} />
          <InfoRow icon={Clock}    label="Dernière connexion" value={admin.last_login_at ? fmtDateTime(admin.last_login_at) : 'Jamais connecté'} />
          <InfoRow icon={Activity} label="Connexions"    value={`${data.total_logins ?? 0} au total`} />
          {!admin.is_active && admin.block_reason && (
            <div className="mt-3 bg-red-50/60 border border-red-200 rounded-card p-3">
              <p className="text-xs font-sans font-semibold text-danger">Raison du blocage</p>
              <p className="text-xs text-muted-600 mt-0.5">{admin.block_reason}</p>
            </div>
          )}
        </div>

        {/* Fréquence de connexion */}
        <div className="card p-4 sm:p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-semibold text-navy flex items-center gap-2">
              <BarChart2 size={15} className="text-muted-400" />Fréquence de connexion
            </h2>
            <div className="flex gap-1.5">
              {[7, 30, 90].map(d => (
                <button
                  key={d}
                  onClick={() => setDays(d)}
                  className={cn(
                    'px-2.5 py-1 rounded-btn text-xs font-sans font-semibold border transition-colors',
                    days === d ? 'bg-primary-500 text-white border-primary-500' : 'border-muted-200 text-muted-600 hover:border-primary-300'
                  )}
                >
                  {d} j
                </button>
              ))}
            </div>
          </div>

          {freq ? (
            <>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-muted-50 rounded-card p-2.5 text-center">
                  <p className="text-lg font-display font-bold text-navy">{freq.total_period}</p>
                  <p className="text-[10px] text-muted-500">Connexions ({freq.days} j)</p>
                </div>
                <div className="bg-muted-50 rounded-card p-2.5 text-center">
                  <p className="text-lg font-display font-bold text-navy">{freq.active_days}</p>
                  <p className="text-[10px] text-muted-500">Jours actifs</p>
                </div>
                <div className="bg-muted-50 rounded-card p-2.5 text-center">
                  <p className="text-lg font-display font-bold text-navy">{freq.avg_per_week}</p>
                  <p className="text-[10px] text-muted-500">Moy. / semaine</p>
                </div>
              </div>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                  <BarChart data={freq.series} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#64748b' }} interval="preserveStartEnd" />
                    <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                    <Tooltip
                      formatter={(v) => [`${v} connexion${v > 1 ? 's' : ''}`]}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: 12 }}
                    />
                    <Bar dataKey="count" fill="#3AA0D8" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-44">
              <Loader2 size={20} className="animate-spin text-muted-300" />
            </div>
          )}
        </div>
      </div>

      {/* Historique des connexions */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-muted-200">
          <h2 className="font-display font-semibold text-navy">Dernières connexions</h2>
        </div>
        {(data.logins ?? []).length === 0 ? (
          <div className="py-10 text-center text-muted-400 text-sm">Aucune connexion enregistrée.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-muted-300 bg-muted-100/50">
                  <th className="text-left py-2.5 px-4 text-xs font-sans font-semibold text-muted-700 uppercase tracking-wide">Date</th>
                  <th className="text-left py-2.5 px-4 text-xs font-sans font-semibold text-muted-700 uppercase tracking-wide">IP</th>
                  <th className="text-left py-2.5 px-4 text-xs font-sans font-semibold text-muted-700 uppercase tracking-wide hidden sm:table-cell">Appareil</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-muted-100">
                {data.logins.map(log => {
                  const device = deviceFromUA(log.user_agent)
                  const DeviceIcon = device.icon
                  return (
                    <tr key={log.id} className="hover:bg-muted-50/60">
                      <td className="py-2.5 px-4 text-sm font-sans text-navy whitespace-nowrap">{fmtDateTime(log.created_at)}</td>
                      <td className="py-2.5 px-4 text-xs font-mono text-muted-600">{log.ip_address ?? '—'}</td>
                      <td className="py-2.5 px-4 hidden sm:table-cell">
                        <span className="inline-flex items-center gap-1.5 text-xs text-muted-600" title={log.user_agent ?? ''}>
                          <DeviceIcon size={13} className="text-muted-400" />
                          {device.label}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
