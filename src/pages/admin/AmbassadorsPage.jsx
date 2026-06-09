import { useState, useEffect } from 'react'
import { ambassadorService } from '@/services/ambassadorService'
import {
  UserPlus, Users, TrendingUp, DollarSign, Link2,
  Copy, CheckCircle, Edit2, Trash2, ChevronDown, ChevronUp,
  Mail, Eye, EyeOff, RefreshCw, BadgePercent, X,
} from 'lucide-react'
import toast from 'react-hot-toast'

const STATUS_META = {
  active:   { label: 'Actif',   color: 'bg-green-50 text-green-700 border-green-100' },
  inactive: { label: 'Inactif', color: 'bg-gray-100 text-gray-500 border-gray-200' },
}

const REFERRAL_STATUS = {
  pending:   { label: 'En attente', color: 'text-[#E8A020]' },
  active:    { label: 'Actif',      color: 'text-[#1A7A45]' },
  cancelled: { label: 'Annulé',     color: 'text-red-500' },
}

/* ── Modal création / édition ── */
function AmbassadorModal({ existing, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: existing?.name || '',
    email: existing?.email || '',
    commission_rate: existing?.commission_rate || 10,
    notes: existing?.notes || '',
  })
  const [loading, setLoading] = useState(false)

  const isEdit = !!existing

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (isEdit) {
        await ambassadorService.update(existing.id, { commission_rate: form.commission_rate, notes: form.notes, status: existing.status })
        toast.success('Ambassadeur mis à jour')
      } else {
        await ambassadorService.create(form)
        toast.success('Compte créé — email envoyé !')
      }
      onSaved()
      onClose()
    } catch (err) {
      const msg = err?.response?.data?.message || (err?.response?.data?.errors ? Object.values(err.response.data.errors).flat().join(' ') : 'Erreur')
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#E8EFF5]">
          <h2 className="font-black text-[#0F1E30] text-lg">
            {isEdit ? 'Modifier l\'ambassadeur' : 'Créer un ambassadeur'}
          </h2>
          <button onClick={onClose} className="p-2 text-[#7A90A4] hover:text-[#0F1E30] rounded-xl hover:bg-[#F4F8FB]">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {!isEdit && (
            <>
              <div>
                <label className="block text-xs font-bold text-[#3D5268] mb-1.5">Nom complet *</label>
                <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Ibrahima Diallo" className="w-full border border-[#E8EFF5] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#3AA0D8] focus:ring-2 focus:ring-[#3AA0D8]/10 transition-all" />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#3D5268] mb-1.5">Email *</label>
                <input required type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="ambassadeur@exemple.com" className="w-full border border-[#E8EFF5] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#3AA0D8] focus:ring-2 focus:ring-[#3AA0D8]/10 transition-all" />
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-bold text-[#3D5268] mb-1.5">Commission (%) *</label>
            <div className="relative">
              <input required type="number" min="1" max="100" step="0.5"
                value={form.commission_rate} onChange={e => setForm(f => ({ ...f, commission_rate: e.target.value }))}
                className="w-full border border-[#E8EFF5] rounded-xl px-4 py-3 pr-10 text-sm focus:outline-none focus:border-[#3AA0D8] focus:ring-2 focus:ring-[#3AA0D8]/10 transition-all" />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#7A90A4] font-bold text-sm">%</span>
            </div>
            <p className="text-[10px] text-[#7A90A4] mt-1">Pourcentage reversé sur chaque abonnement activé via ce lien</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#3D5268] mb-1.5">Notes internes</label>
            <textarea rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Zone géographique, partenariat..."
              className="w-full border border-[#E8EFF5] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#3AA0D8] focus:ring-2 focus:ring-[#3AA0D8]/10 transition-all resize-none" />
          </div>

          {!isEdit && (
            <div className="bg-[#EBF6FD] border border-[#3AA0D8]/20 rounded-xl px-4 py-3 text-xs text-[#3D5268]">
              <Mail size={13} className="inline text-[#3AA0D8] mr-1.5" />
              Un email avec le <strong>mot de passe temporaire</strong> et le lien de parrainage sera envoyé automatiquement.
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 border border-[#E8EFF5] text-[#3D5268] hover:bg-[#F4F8FB] font-bold py-3 rounded-xl text-sm transition-colors">
              Annuler
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 bg-[#0F1E30] hover:bg-[#1a3050] disabled:opacity-60 text-white font-bold py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
              {loading ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Envoi…</> : isEdit ? 'Enregistrer' : 'Créer le compte'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ── Ligne ambassadeur avec expansion ── */
function AmbassadorRow({ amb, onEdit, onDelete, onRefresh }) {
  const [open, setOpen] = useState(false)
  const [detail, setDetail] = useState(null)
  const [copied, setCopied] = useState(false)
  const statusMeta = STATUS_META[amb.status]

  const copyLink = () => {
    navigator.clipboard.writeText(amb.referral_url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const loadDetail = async () => {
    if (!open && !detail) {
      const res = await ambassadorService.get(amb.id)
      setDetail(res.data.data)
    }
    setOpen(o => !o)
  }

  const handleMarkPaid = async (referralId) => {
    await ambassadorService.markPaid(amb.id, referralId)
    toast.success('Commission marquée payée')
    const res = await ambassadorService.get(amb.id)
    setDetail(res.data.data)
    onRefresh()
  }

  const handleToggleStatus = async () => {
    await ambassadorService.update(amb.id, { status: amb.status === 'active' ? 'inactive' : 'active' })
    toast.success('Statut mis à jour')
    onRefresh()
  }

  return (
    <div className="rounded-2xl border border-[#E8EFF5] overflow-hidden">
      {/* Header row */}
      <div className="flex items-center gap-3 px-5 py-4 bg-white hover:bg-[#F4F8FB] transition-colors">
        <div className="w-10 h-10 rounded-full bg-[#3AA0D8]/10 flex items-center justify-center shrink-0 font-black text-[#3AA0D8] text-sm">
          {amb.name?.[0]?.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-black text-[#0F1E30] text-sm">{amb.name}</p>
          <p className="text-xs text-[#7A90A4]">{amb.email}</p>
        </div>
        <div className="hidden sm:flex items-center gap-6 text-center">
          <div>
            <p className="text-base font-black text-[#0F1E30]">{amb.total_referrals}</p>
            <p className="text-[10px] text-[#7A90A4]">Filleuls</p>
          </div>
          <div>
            <p className="text-base font-black text-[#1A7A45]">{amb.active_referrals}</p>
            <p className="text-[10px] text-[#7A90A4]">Actifs</p>
          </div>
          <div>
            <p className="text-base font-black text-[#E8A020]">{Number(amb.total_earnings).toLocaleString('fr-FR')} F</p>
            <p className="text-[10px] text-[#7A90A4]">Gains</p>
          </div>
          <div>
            <p className="text-base font-black text-[#9B59B6]">{amb.commission_rate}%</p>
            <p className="text-[10px] text-[#7A90A4]">Commission</p>
          </div>
        </div>
        <span className={`hidden sm:inline-flex text-[10px] font-bold px-2.5 py-1 rounded-full border ${statusMeta.color}`}>
          {statusMeta.label}
        </span>
        <div className="flex items-center gap-1.5 ml-2">
          <button onClick={copyLink} title="Copier le lien" className="p-2 text-[#7A90A4] hover:text-[#3AA0D8] hover:bg-[#EBF6FD] rounded-lg transition-colors">
            {copied ? <CheckCircle size={14} className="text-[#1A7A45]" /> : <Copy size={14} />}
          </button>
          <button onClick={() => onEdit(amb)} title="Modifier" className="p-2 text-[#7A90A4] hover:text-[#0F1E30] hover:bg-[#F4F8FB] rounded-lg transition-colors">
            <Edit2 size={14} />
          </button>
          <button onClick={loadDetail} className="p-2 text-[#7A90A4] hover:text-[#0F1E30] hover:bg-[#F4F8FB] rounded-lg transition-colors">
            {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* Expanded detail */}
      {open && (
        <div className="border-t border-[#E8EFF5] bg-[#F8FBFD] px-5 py-4">
          {/* Lien */}
          <div className="flex items-center gap-2 mb-4 bg-white border border-[#E8EFF5] rounded-xl px-4 py-3">
            <Link2 size={13} className="text-[#3AA0D8] shrink-0" />
            <span className="text-xs text-[#3D5268] flex-1 truncate font-mono">{amb.referral_url}</span>
            <button onClick={copyLink} className="text-xs font-bold text-[#3AA0D8] hover:underline shrink-0">
              {copied ? '✓ Copié' : 'Copier'}
            </button>
          </div>

          {/* Filleuls */}
          {detail?.referrals?.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-black text-[#0F1E30] mb-3">Filleuls ({detail.referrals.length})</p>
              {detail.referrals.map(r => {
                const rm = REFERRAL_STATUS[r.status]
                return (
                  <div key={r.id} className="flex items-center gap-3 bg-white rounded-xl border border-[#E8EFF5] px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-[#0F1E30]">{r.client_name}</p>
                      <p className="text-[10px] text-[#7A90A4]">{r.client_email} · {r.created_at}</p>
                    </div>
                    <span className={`text-[10px] font-bold ${rm.color}`}>{rm.label}</span>
                    {r.status === 'active' && (
                      <div className="text-right shrink-0">
                        <p className="text-sm font-black text-[#1A7A45]">{Number(r.commission_amount).toLocaleString('fr-FR')} F</p>
                        <p className="text-[10px] text-[#7A90A4]">{r.commission_rate}% · {r.subscription_plan}</p>
                      </div>
                    )}
                    {r.status === 'active' && !r.commission_paid && (
                      <button onClick={() => handleMarkPaid(r.id)}
                        className="text-[10px] font-bold text-white bg-[#1A7A45] hover:bg-[#156338] px-3 py-1.5 rounded-lg transition-colors shrink-0">
                        Payé
                      </button>
                    )}
                    {r.commission_paid && (
                      <span className="text-[10px] font-bold text-[#1A7A45] bg-green-50 px-2.5 py-1 rounded-lg border border-green-100 shrink-0">✓ Payé</span>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-[#7A90A4] text-center py-4">Aucun filleul pour l'instant</p>
          )}

          {/* Actions */}
          <div className="flex gap-2 mt-4 pt-4 border-t border-[#E8EFF5]">
            <button onClick={handleToggleStatus}
              className="text-xs font-bold text-[#7A90A4] hover:text-[#0F1E30] border border-[#E8EFF5] hover:border-[#0F1E30] px-3 py-2 rounded-xl transition-colors">
              {amb.status === 'active' ? 'Désactiver' : 'Activer'}
            </button>
            <button onClick={() => onDelete(amb.id)}
              className="text-xs font-bold text-red-500 hover:bg-red-50 border border-red-100 px-3 py-2 rounded-xl transition-colors ml-auto">
              <Trash2 size={13} className="inline mr-1" />Supprimer
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function AmbassadorsPage() {
  const [ambassadors, setAmbassadors] = useState([])
  const [loading, setLoading]         = useState(true)
  const [modal, setModal]             = useState(null) // null | 'create' | ambassador obj

  const load = async () => {
    setLoading(true)
    try {
      const res = await ambassadorService.list()
      setAmbassadors(res.data.data || [])
    } catch { toast.error('Erreur de chargement') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleDelete = async (id) => {
    if (!confirm('Supprimer cet ambassadeur et son compte ? Cette action est irréversible.')) return
    await ambassadorService.remove(id)
    toast.success('Ambassadeur supprimé')
    load()
  }

  // Stats globales
  const totalEarnings   = ambassadors.reduce((s, a) => s + parseFloat(a.total_earnings || 0), 0)
  const totalReferrals  = ambassadors.reduce((s, a) => s + (a.total_referrals || 0), 0)
  const activeAmb       = ambassadors.filter(a => a.status === 'active').length

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#0F1E30] flex items-center gap-2">
            <Users size={22} className="text-[#3AA0D8]" /> Ambassadeurs
          </h1>
          <p className="text-sm text-[#7A90A4] mt-1">Gérez vos ambassadeurs et suivez leurs commissions</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="p-2 text-[#7A90A4] hover:text-[#0F1E30] hover:bg-[#F4F8FB] rounded-xl transition-colors">
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={() => setModal('create')}
            className="inline-flex items-center gap-2 bg-[#0F1E30] hover:bg-[#1a3050] text-white font-bold text-sm px-4 py-2.5 rounded-xl transition-colors">
            <UserPlus size={15} /> Nouvel ambassadeur
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { icon: Users,       label: 'Ambassadeurs', value: ambassadors.length, color: '#3AA0D8' },
          { icon: CheckCircle, label: 'Actifs',        value: activeAmb,         color: '#1A7A45' },
          { icon: TrendingUp,  label: 'Filleuls total',value: totalReferrals,    color: '#9B59B6' },
          { icon: DollarSign,  label: 'Gains versés',  value: totalEarnings.toLocaleString('fr-FR') + ' F', color: '#E8A020' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-[#E8EFF5] p-4">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: `${s.color}15` }}>
              <s.icon size={16} style={{ color: s.color }} />
            </div>
            <p className="text-xl font-black text-[#0F1E30]">{s.value}</p>
            <p className="text-xs text-[#7A90A4]">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Liste */}
      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-[#F4F8FB] rounded-2xl animate-pulse" />)}</div>
      ) : ambassadors.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-14 h-14 rounded-2xl bg-[#F4F8FB] flex items-center justify-center">
            <Users size={24} className="text-[#C4D0DC]" />
          </div>
          <p className="font-bold text-[#0F1E30]">Aucun ambassadeur</p>
          <p className="text-sm text-[#7A90A4]">Créez votre premier ambassadeur pour commencer à suivre les parrainages.</p>
          <button onClick={() => setModal('create')}
            className="mt-2 inline-flex items-center gap-2 bg-[#3AA0D8] hover:bg-[#2d8bbf] text-white font-bold text-sm px-5 py-2.5 rounded-xl transition-colors">
            <UserPlus size={14} /> Créer un ambassadeur
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {ambassadors.map(amb => (
            <AmbassadorRow key={amb.id} amb={amb} onEdit={a => setModal(a)} onDelete={handleDelete} onRefresh={load} />
          ))}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <AmbassadorModal
          existing={modal === 'create' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={load}
        />
      )}
    </div>
  )
}
