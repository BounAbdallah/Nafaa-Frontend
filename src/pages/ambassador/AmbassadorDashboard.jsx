import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { ambassadorService } from '@/services/ambassadorService'
import {
  Link2, Copy, CheckCircle, Users, TrendingUp, DollarSign,
  Clock, LogOut, Lock, Eye, EyeOff, ArrowRight, Star,
} from 'lucide-react'
import toast from 'react-hot-toast'
import Logo from '@/components/ui/Logo'

const REFERRAL_STATUS = {
  pending:   { label: 'En attente', cls: 'bg-[#FFF8E8] text-[#E8A020] border-[#E8A020]/20' },
  active:    { label: 'Actif',      cls: 'bg-green-50 text-green-700 border-green-100' },
  cancelled: { label: 'Annulé',     cls: 'bg-red-50 text-red-600 border-red-100' },
}

/* ── Forcer changement de mot de passe ── */
function ChangePasswordBanner({ onChanged }) {
  const [form, setForm]   = useState({ password: '', password_confirmation: '' })
  const [show, setShow]   = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password !== form.password_confirmation) {
      toast.error('Les mots de passe ne correspondent pas')
      return
    }
    setLoading(true)
    try {
      await ambassadorService.changePassword(form)
      toast.success('Mot de passe mis à jour !')
      onChanged()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-[#0F1E30] rounded-2xl p-6 mb-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-[#E8A020]/20 flex items-center justify-center shrink-0">
          <Lock size={18} className="text-[#E8A020]" />
        </div>
        <div>
          <p className="font-black text-white text-sm">Changez votre mot de passe</p>
          <p className="text-white/50 text-xs">Vous utilisez un mot de passe temporaire. Choisissez-en un personnel.</p>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative">
          <input type={show ? 'text' : 'password'} required placeholder="Nouveau mot de passe (8 car. min.)"
            value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            className="w-full bg-white/10 border border-white/10 text-white placeholder:text-white/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#3AA0D8] pr-10" />
          <button type="button" onClick={() => setShow(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40">
            {show ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
        <input type={show ? 'text' : 'password'} required placeholder="Confirmer le mot de passe"
          value={form.password_confirmation} onChange={e => setForm(f => ({ ...f, password_confirmation: e.target.value }))}
          className="w-full bg-white/10 border border-white/10 text-white placeholder:text-white/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#3AA0D8]" />
        <button type="submit" disabled={loading}
          className="w-full bg-[#3AA0D8] hover:bg-[#2d8bbf] disabled:opacity-60 text-white font-bold py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
          {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Lock size={14} /> Définir mon mot de passe</>}
        </button>
      </form>
    </div>
  )
}

export default function AmbassadorDashboard() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  const load = async () => {
    try {
      const res = await ambassadorService.dashboard()
      setData(res.data.data)
    } catch {
      toast.error('Impossible de charger le tableau de bord')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const copyLink = () => {
    if (!data) return
    navigator.clipboard.writeText(data.referral_url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
    toast.success('Lien copié !')
  }

  const handleLogout = async () => {
    await logout()
    navigate('/auth/login')
  }

  if (loading) return (
    <div className="min-h-screen bg-[#F4F8FB] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#3AA0D8]/30 border-t-[#3AA0D8] rounded-full animate-spin" />
    </div>
  )

  const stats = [
    { icon: Users,      label: 'Filleuls total',   value: data?.total_referrals || 0,                                      color: '#3AA0D8' },
    { icon: CheckCircle,label: 'Filleuls actifs',   value: data?.active_referrals || 0,                                     color: '#1A7A45' },
    { icon: DollarSign, label: 'Gains totaux',      value: Number(data?.total_earnings || 0).toLocaleString('fr-FR') + ' F', color: '#E8A020' },
    { icon: Clock,      label: 'En attente paiement',value: Number(data?.pending_earnings || 0).toLocaleString('fr-FR') + ' F', color: '#9B59B6' },
  ]

  return (
    <div className="min-h-screen bg-[#F4F8FB]">
      {/* Header */}
      <header className="bg-[#0F1E30] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo size={32} variant="dark" />
          <div>
            <p className="text-white font-black text-sm">{data?.name}</p>
            <p className="text-[#3AA0D8] text-[10px] font-bold uppercase tracking-widest">Espace Ambassadeur</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden sm:flex items-center gap-1.5 bg-[#E8A020]/15 border border-[#E8A020]/20 text-[#E8A020] text-xs font-black px-3 py-1.5 rounded-full">
            <Star size={11} /> {data?.commission_rate}% commission
          </span>
          <button onClick={handleLogout} className="p-2 text-white/50 hover:text-white transition-colors">
            <LogOut size={16} />
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

        {/* Forcer changement de mdp */}
        {data?.force_password_change && <ChangePasswordBanner onChanged={load} />}

        {/* Lien de parrainage */}
        <div className="bg-white rounded-2xl border border-[#E8EFF5] p-6">
          <p className="text-xs font-black uppercase tracking-widest text-[#3AA0D8] mb-3">Votre lien de parrainage</p>
          <p className="text-[#7A90A4] text-sm mb-4">Partagez ce lien. Chaque personne qui s'inscrit via ce lien vous rapporte <strong className="text-[#0F1E30]">{data?.commission_rate}%</strong> de leur abonnement mensuel.</p>
          <div className="flex items-center gap-2 bg-[#F4F8FB] border border-[#E8EFF5] rounded-xl px-4 py-3">
            <Link2 size={14} className="text-[#3AA0D8] shrink-0" />
            <span className="text-sm text-[#0F1E30] flex-1 truncate font-mono text-xs sm:text-sm">{data?.referral_url}</span>
            <button onClick={copyLink}
              className="shrink-0 inline-flex items-center gap-1.5 bg-[#0F1E30] hover:bg-[#1a3050] text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors">
              {copied ? <><CheckCircle size={12} /> Copié</> : <><Copy size={12} /> Copier</>}
            </button>
          </div>
          <div className="flex gap-3 mt-3">
            <a href={`https://wa.me/?text=Inscrivez-vous sur Qiwam ERP via mon lien : ${encodeURIComponent(data?.referral_url || '')}`}
               target="_blank" rel="noopener noreferrer"
               className="flex-1 text-center text-xs font-bold bg-green-500 hover:bg-green-600 text-white py-2.5 rounded-xl transition-colors">
              Partager WhatsApp
            </a>
            <a href={`mailto:?subject=Invitation Qiwam ERP&body=Inscrivez-vous via mon lien : ${data?.referral_url}`}
               className="flex-1 text-center text-xs font-bold border border-[#E8EFF5] hover:bg-[#F4F8FB] text-[#3D5268] py-2.5 rounded-xl transition-colors">
              Envoyer par email
            </a>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {stats.map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-[#E8EFF5] p-4">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: `${s.color}15` }}>
                <s.icon size={16} style={{ color: s.color }} />
              </div>
              <p className="text-xl font-black text-[#0F1E30]">{s.value}</p>
              <p className="text-xs text-[#7A90A4] leading-tight">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Liste filleuls */}
        <div className="bg-white rounded-2xl border border-[#E8EFF5] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#E8EFF5]">
            <h2 className="font-black text-[#0F1E30] text-base flex items-center gap-2">
              <Users size={16} className="text-[#3AA0D8]" /> Mes filleuls
            </h2>
          </div>

          {!data?.referrals?.length ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-6">
              <div className="w-14 h-14 rounded-2xl bg-[#F4F8FB] flex items-center justify-center">
                <Users size={24} className="text-[#C4D0DC]" />
              </div>
              <p className="font-bold text-[#0F1E30]">Aucun filleul pour l'instant</p>
              <p className="text-sm text-[#7A90A4] max-w-xs">Partagez votre lien de parrainage pour que vos contacts s'inscrivent. Chaque inscription active vous rapporte une commission.</p>
            </div>
          ) : (
            <div className="divide-y divide-[#F4F8FB]">
              {data.referrals.map(r => {
                const rm = REFERRAL_STATUS[r.status]
                return (
                  <div key={r.id} className="flex items-center gap-3 px-6 py-4">
                    <div className="w-9 h-9 rounded-full bg-[#F4F8FB] flex items-center justify-center font-black text-[#3D5268] text-sm shrink-0">
                      {r.client_name?.[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-[#0F1E30] text-sm">{r.client_name}</p>
                      <p className="text-[10px] text-[#7A90A4]">{r.client_email} · Inscrit le {r.created_at}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full border hidden sm:block ${rm.cls}`}>{rm.label}</span>
                    {r.status === 'active' && (
                      <div className="text-right shrink-0">
                        <p className="font-black text-[#1A7A45] text-sm">{Number(r.commission_amount).toLocaleString('fr-FR')} F</p>
                        <p className="text-[10px] text-[#7A90A4]">
                          {r.commission_paid
                            ? <span className="text-[#1A7A45]">✓ Payé</span>
                            : 'En attente paiement'}
                        </p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Comment ça marche */}
        <div className="bg-[#0F1E30] rounded-2xl p-6">
          <p className="text-white font-black text-sm mb-4">Comment ça marche ?</p>
          <div className="space-y-3">
            {[
              { n: '1', text: 'Copiez votre lien et partagez-le à vos contacts.' },
              { n: '2', text: 'Ils s\'inscrivent et configurent leur espace Qiwam.' },
              { n: '3', text: `Dès qu'un abonnement est activé, vous gagnez ${data?.commission_rate}% de son montant mensuel.` },
              { n: '4', text: 'Le paiement de votre commission est géré par Noor Web Services.' },
            ].map(s => (
              <div key={s.n} className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-[#3AA0D8] text-white text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">{s.n}</span>
                <p className="text-white/60 text-sm leading-relaxed">{s.text}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
