import { useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { authService } from '@/services/authService'
import { COUNTRIES } from '@/utils/currency'
import toast from 'react-hot-toast'
import {
  UserCircle2, Loader2, Check, Mail, Globe, ShieldCheck,
  Eye, EyeOff, KeyRound,
} from 'lucide-react'

const countryLabel = (code) =>
  COUNTRIES.find(c => c.code === code)?.label ?? code

export default function AdminProfilePage() {
  const { user, role } = useAuthStore()
  const [name, setName]   = useState(user?.name ?? '')
  const [phone, setPhone] = useState(user?.phone ?? '')
  const [savingInfo, setSavingInfo] = useState(false)

  const [currentPwd, setCurrentPwd] = useState('')
  const [newPwd, setNewPwd]         = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [showPwd, setShowPwd]       = useState(false)
  const [savingPwd, setSavingPwd]   = useState(false)

  const refreshUser = async () => {
    // Recharge le store avec les données fraîches
    try { await useAuthStore.getState().initAuth() } catch { /* ignore */ }
  }

  const saveInfo = async (e) => {
    e.preventDefault()
    if (!name.trim()) { toast.error('Le nom est requis.'); return }
    setSavingInfo(true)
    try {
      const r = await authService.updateProfile({ name, phone })
      toast.success(r.message ?? 'Profil mis à jour.')
      refreshUser()
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Erreur lors de la mise à jour.')
    } finally {
      setSavingInfo(false)
    }
  }

  const savePassword = async (e) => {
    e.preventDefault()
    if (newPwd.length < 8)        { toast.error('8 caractères minimum.'); return }
    if (newPwd !== confirmPwd)    { toast.error('Les mots de passe ne correspondent pas.'); return }
    if (!currentPwd)              { toast.error('Mot de passe actuel requis.'); return }
    setSavingPwd(true)
    try {
      const r = await authService.updateProfile({
        current_password: currentPwd,
        password: newPwd,
        password_confirmation: confirmPwd,
      })
      toast.success(r.message ?? 'Mot de passe modifié.')
      setCurrentPwd(''); setNewPwd(''); setConfirmPwd('')
    } catch (err) {
      const msg = err.response?.data?.errors
        ? Object.values(err.response.data.errors).flat()[0]
        : err.response?.data?.message || 'Erreur.'
      toast.error(msg)
    } finally {
      setSavingPwd(false)
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-primary-500 flex items-center justify-center text-white font-display font-bold text-xl">
          {user?.name?.[0]?.toUpperCase() ?? 'A'}
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-bold text-navy">Mon profil</h1>
          <p className="text-sm font-sans text-muted-500 flex items-center gap-1.5 flex-wrap">
            <ShieldCheck size={13} className="text-primary-500" />
            {role === 'super_admin' ? 'Super administrateur' : 'Administrateur pays'}
            {role === 'country_admin' && user?.country_code && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-navy bg-primary-50 px-2 py-0.5 rounded-badge">
                <Globe size={11} className="text-primary-500" />
                {countryLabel(user.country_code)}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Infos personnelles */}
      <form onSubmit={saveInfo} className="card p-4 sm:p-5 space-y-4">
        <h2 className="font-display font-semibold text-navy flex items-center gap-2">
          <UserCircle2 size={16} className="text-muted-400" />
          Informations personnelles
        </h2>

        <div className="space-y-1.5">
          <label className="block text-xs font-sans font-semibold text-muted-700 uppercase tracking-wide">Nom complet</label>
          <input className="input-field w-full" value={name} onChange={e => setName(e.target.value)} />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-sans font-semibold text-muted-700 uppercase tracking-wide">E-mail</label>
          <div className="input-field w-full bg-muted-50 text-muted-500 cursor-not-allowed flex items-center gap-2">
            <Mail size={14} />
            {user?.email}
          </div>
          <p className="text-[11px] text-muted-400">L'e-mail de connexion ne peut pas être modifié ici.</p>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-sans font-semibold text-muted-700 uppercase tracking-wide">Téléphone</label>
          <input type="tel" className="input-field w-full" value={phone ?? ''} onChange={e => setPhone(e.target.value)} placeholder="+224 620 00 00 00" />
        </div>

        <button type="submit" disabled={savingInfo} className="btn-primary py-2.5 px-4 flex items-center gap-2 disabled:opacity-50">
          {savingInfo ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
          Enregistrer
        </button>
      </form>

      {/* Mot de passe */}
      <form onSubmit={savePassword} className="card p-4 sm:p-5 space-y-4">
        <h2 className="font-display font-semibold text-navy flex items-center gap-2">
          <KeyRound size={16} className="text-muted-400" />
          Changer le mot de passe
        </h2>

        <div className="space-y-1.5">
          <label className="block text-xs font-sans font-semibold text-muted-700 uppercase tracking-wide">Mot de passe actuel</label>
          <input type="password" className="input-field w-full" value={currentPwd} onChange={e => setCurrentPwd(e.target.value)} autoComplete="current-password" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="block text-xs font-sans font-semibold text-muted-700 uppercase tracking-wide">Nouveau mot de passe</label>
            <div className="relative">
              <input
                type={showPwd ? 'text' : 'password'}
                className="input-field w-full pr-10"
                value={newPwd}
                onChange={e => setNewPwd(e.target.value)}
                placeholder="8 caractères min."
                autoComplete="new-password"
              />
              <button type="button" onClick={() => setShowPwd(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-400 hover:text-navy">
                {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-sans font-semibold text-muted-700 uppercase tracking-wide">Confirmer</label>
            <input
              type={showPwd ? 'text' : 'password'}
              className="input-field w-full"
              value={confirmPwd}
              onChange={e => setConfirmPwd(e.target.value)}
              autoComplete="new-password"
            />
          </div>
        </div>

        <button type="submit" disabled={savingPwd} className="btn-primary py-2.5 px-4 flex items-center gap-2 disabled:opacity-50">
          {savingPwd ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
          Modifier le mot de passe
        </button>
      </form>
    </div>
  )
}
