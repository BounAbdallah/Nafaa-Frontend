import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminService } from '@/services/adminService'
import { COUNTRIES } from '@/utils/currency'
import { confirmDialog } from '@/utils/confirm'
import toast from 'react-hot-toast'
import {
  ShieldCheck, Plus, X, Loader2, Lock, Unlock, Trash2,
  Globe, Pencil, Eye, EyeOff, Phone,
} from 'lucide-react'
import { cn } from '@/utils/cn'

const countryLabel = (code) =>
  COUNTRIES.find(c => c.code === code)?.label ?? code ?? '—'

export default function AdminsManagement() {
  const navigate = useNavigate()
  const [admins, setAdmins]   = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal]     = useState(null) // 'add' | admin object (edit)
  const [busy, setBusy]       = useState(null)

  const load = () => {
    setLoading(true)
    adminService.getAdmins()
      .then(r => setAdmins(r.admins ?? []))
      .catch(() => toast.error('Impossible de charger les administrateurs.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleBlock = async (admin) => {
    const reason = window.prompt(`Raison du blocage de ${admin.name} (optionnel) :`)
    if (reason === null) return
    setBusy(admin.id)
    try {
      const r = await adminService.blockAdmin(admin.id, reason)
      toast.success(r.message)
      load()
    } catch { toast.error('Erreur lors du blocage.') }
    finally { setBusy(null) }
  }

  const handleUnblock = async (admin) => {
    setBusy(admin.id)
    try {
      const r = await adminService.unblockAdmin(admin.id)
      toast.success(r.message)
      load()
    } catch { toast.error('Erreur.') }
    finally { setBusy(null) }
  }

  const handleDelete = async (admin) => {
    if (!(await confirmDialog({
      title: `Supprimer le compte de ${admin.name} ?`,
      text: 'Cette action est irréversible. L\'admin perdra immédiatement tout accès.',
      confirmText: 'Supprimer',
    }))) return
    setBusy(admin.id)
    try {
      const r = await adminService.deleteAdmin(admin.id)
      toast.success(r.message)
      load()
    } catch { toast.error('Erreur lors de la suppression.') }
    finally { setBusy(null) }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-bold text-navy flex items-center gap-2">
            <ShieldCheck size={22} className="text-primary-500" />
            Administrateurs plateforme
          </h1>
          <p className="text-sm font-sans text-muted-500 mt-1">
            Chaque admin pays gère uniquement les utilisateurs et abonnements de son pays.
          </p>
        </div>
        <button onClick={() => setModal('add')} className="btn-primary flex items-center gap-2 self-start sm:self-auto">
          <Plus size={16} />
          Ajouter un admin
        </button>
      </div>

      {/* Liste */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-muted-300 bg-muted-100/50">
                <th className="text-left py-3 px-4 text-xs font-sans font-semibold text-muted-700 uppercase tracking-wide">Admin</th>
                <th className="text-left py-3 px-4 text-xs font-sans font-semibold text-muted-700 uppercase tracking-wide">Pays géré</th>
                <th className="text-center py-3 px-4 text-xs font-sans font-semibold text-muted-700 uppercase tracking-wide">Statut</th>
                <th className="text-right py-3 px-4 text-xs font-sans font-semibold text-muted-700 uppercase tracking-wide hidden md:table-cell">Dernière connexion</th>
                <th className="py-3 px-4 w-32" />
              </tr>
            </thead>
            <tbody className="divide-y divide-muted-100">
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-3 px-4"><div className="h-4 w-44 bg-muted-100 rounded" /></td>
                    <td className="py-3 px-4"><div className="h-4 w-28 bg-muted-100 rounded" /></td>
                    <td className="py-3 px-4"><div className="h-5 w-16 bg-muted-100 rounded-badge mx-auto" /></td>
                    <td className="py-3 px-4 hidden md:table-cell"><div className="h-4 w-24 bg-muted-100 rounded ml-auto" /></td>
                    <td className="py-3 px-4" />
                  </tr>
                ))
              ) : admins.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center">
                    <ShieldCheck size={32} className="mx-auto text-muted-300 mb-3" />
                    <p className="text-sm font-sans text-muted-500">Aucun admin pays créé pour le moment.</p>
                    <button onClick={() => setModal('add')} className="btn-primary mt-4 mx-auto text-xs py-2 px-4">
                      Créer le premier admin
                    </button>
                  </td>
                </tr>
              ) : admins.map(admin => (
                <tr
                  key={admin.id}
                  onClick={() => navigate(`/admin/admins/${admin.id}`)}
                  className="hover:bg-primary-50/40 transition-colors cursor-pointer"
                >
                  <td className="py-3 px-4">
                    <p className="text-sm font-sans font-semibold text-navy">{admin.name}</p>
                    <p className="text-[11px] text-muted-500">{admin.email}</p>
                    {admin.phone && (
                      <p className="text-[11px] text-muted-400 flex items-center gap-1 mt-0.5">
                        <Phone size={9} />{admin.phone}
                      </p>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1.5 text-xs font-sans font-semibold text-navy">
                      <Globe size={13} className="text-primary-500" />
                      {countryLabel(admin.country_code)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={cn(
                      'inline-flex items-center gap-1 text-xs font-sans font-semibold px-2 py-0.5 rounded-badge',
                      admin.is_active ? 'bg-green-50 text-success' : 'bg-red-50 text-danger'
                    )}>
                      <span className={cn('w-1.5 h-1.5 rounded-full', admin.is_active ? 'bg-success' : 'bg-danger')} />
                      {admin.is_active ? 'Actif' : 'Bloqué'}
                    </span>
                    {!admin.is_active && admin.block_reason && (
                      <p className="text-[10px] text-muted-400 mt-0.5 max-w-[140px] mx-auto truncate" title={admin.block_reason}>
                        {admin.block_reason}
                      </p>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right hidden md:table-cell">
                    <span className="text-xs text-muted-500">
                      {admin.last_login_at
                        ? new Date(admin.last_login_at).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
                        : 'Jamais connecté'}
                    </span>
                  </td>
                  <td className="py-3 px-4" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setModal(admin)}
                        disabled={busy === admin.id}
                        className="p-1.5 rounded-btn text-muted-500 hover:text-primary-500 hover:bg-primary-50 transition-colors"
                        title="Modifier"
                      >
                        <Pencil size={14} />
                      </button>
                      {admin.is_active ? (
                        <button
                          onClick={() => handleBlock(admin)}
                          disabled={busy === admin.id}
                          className="p-1.5 rounded-btn text-muted-500 hover:text-amber-500 hover:bg-amber-50 transition-colors"
                          title="Bloquer"
                        >
                          <Lock size={14} />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUnblock(admin)}
                          disabled={busy === admin.id}
                          className="p-1.5 rounded-btn text-muted-500 hover:text-success hover:bg-green-50 transition-colors"
                          title="Débloquer"
                        >
                          <Unlock size={14} />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(admin)}
                        disabled={busy === admin.id}
                        className="p-1.5 rounded-btn text-muted-500 hover:text-danger hover:bg-danger/5 transition-colors"
                        title="Supprimer le compte"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal create / edit */}
      {modal && (
        <AdminModal
          admin={modal === 'add' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load() }}
        />
      )}
    </div>
  )
}

// ── Modal : créer / modifier un admin pays ────────────────────────────────────
function AdminModal({ admin, onClose, onSaved }) {
  const isEdit = !!admin
  const [name, setName]         = useState(admin?.name ?? '')
  const [email, setEmail]       = useState(admin?.email ?? '')
  const [phone, setPhone]       = useState(admin?.phone ?? '')
  const [password, setPassword] = useState('')
  const [country, setCountry]   = useState(admin?.country_code ?? 'GN')
  const [showPwd, setShowPwd]   = useState(false)
  const [saving, setSaving]     = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (!name.trim() || (!isEdit && !email.trim()) || (!isEdit && password.length < 8)) {
      toast.error(isEdit ? 'Nom requis.' : 'Nom, e-mail et mot de passe (8 caractères min) requis.')
      return
    }
    setSaving(true)
    try {
      if (isEdit) {
        const payload = { name, phone, country_code: country }
        if (password) payload.password = password
        const r = await adminService.updateAdmin(admin.id, payload)
        toast.success(r.message)
      } else {
        const r = await adminService.createAdmin({ name, email, phone, password, country_code: country })
        toast.success(r.message)
      }
      onSaved()
    } catch (err) {
      const msg = err.response?.data?.errors
        ? Object.values(err.response.data.errors).flat()[0]
        : err.response?.data?.message || 'Erreur.'
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-surface rounded-card w-full max-w-md shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-muted-200">
          <h3 className="font-display font-bold text-navy">
            {isEdit ? `Modifier ${admin.name}` : 'Nouvel admin pays'}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-btn text-muted-500 hover:bg-muted-100">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={submit} className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-sans font-semibold text-muted-700 uppercase tracking-wide">Nom complet</label>
            <input className="input-field w-full" value={name} onChange={e => setName(e.target.value)} placeholder="Ex : Mamadou Diallo" />
          </div>

          {!isEdit && (
            <div className="space-y-1.5">
              <label className="block text-xs font-sans font-semibold text-muted-700 uppercase tracking-wide">E-mail</label>
              <input type="email" className="input-field w-full" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin.guinee@qiwam.com" />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-sans font-semibold text-muted-700 uppercase tracking-wide">Téléphone</label>
            <input type="tel" className="input-field w-full" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+224 620 00 00 00" />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-sans font-semibold text-muted-700 uppercase tracking-wide">Pays géré</label>
            <select className="input-field w-full" value={country} onChange={e => setCountry(e.target.value)}>
              {COUNTRIES.map(c => (
                <option key={c.code} value={c.code}>{c.label}</option>
              ))}
            </select>
            <p className="text-[11px] text-muted-400">
              L'admin ne verra que les espaces, utilisateurs et abonnements de ce pays.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-sans font-semibold text-muted-700 uppercase tracking-wide">
              {isEdit ? 'Nouveau mot de passe (laisser vide pour conserver)' : 'Mot de passe'}
            </label>
            <div className="relative">
              <input
                type={showPwd ? 'text' : 'password'}
                className="input-field w-full pr-10"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="8 caractères minimum"
              />
              <button
                type="button"
                onClick={() => setShowPwd(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-400 hover:text-navy"
              >
                {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="btn-primary w-full py-2.5 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
            {isEdit ? 'Enregistrer' : 'Créer l\'admin'}
          </button>
        </form>
      </div>
    </div>
  )
}
