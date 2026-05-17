import { useState, useRef } from 'react'
import { useAuthStore } from '@/store/authStore'
import { settingsService } from '@/services/settingsService'
import toast from 'react-hot-toast'
import { UserCircle, Building2, Save, Image as ImageIcon, Loader2 } from 'lucide-react'
import { cn } from '@/utils/cn'
import { COUNTRIES, CURRENCIES } from '@/utils/currency'

export default function SettingsPage() {
  const { user, setUser, updateTenant } = useAuthStore()
  const [activeTab, setActiveTab] = useState('profile')

  const isAdmin = user?.roles?.includes('admin')

  return (
    <div className="space-y-5 sm:space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-navy">Paramètres</h1>
        <p className="text-sm font-sans text-muted-500 mt-1">Gérez votre profil et les préférences de votre espace de travail.</p>
      </div>

      {/* Tabs — scrollable on mobile */}
      <div className="flex border-b border-muted-200 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        <button
          onClick={() => setActiveTab('profile')}
          className={cn(
            'flex-shrink-0 px-4 sm:px-6 py-3 text-sm font-semibold transition-colors border-b-2',
            activeTab === 'profile' ? 'border-primary-500 text-primary-600' : 'border-transparent text-muted-500 hover:text-navy hover:border-muted-300'
          )}
        >
          <div className="flex items-center gap-2">
            <UserCircle size={18} />
            Mon Profil
          </div>
        </button>
        {isAdmin && (
          <button
            onClick={() => setActiveTab('tenant')}
            className={cn(
              'flex-shrink-0 px-4 sm:px-6 py-3 text-sm font-semibold transition-colors border-b-2',
              activeTab === 'tenant' ? 'border-primary-500 text-primary-600' : 'border-transparent text-muted-500 hover:text-navy hover:border-muted-300'
            )}
          >
            <div className="flex items-center gap-2">
              <Building2 size={18} />
              Espace de travail
            </div>
          </button>
        )}
      </div>

      <div>
        {activeTab === 'profile' && <ProfileSettings user={user} setUser={setUser} />}
        {activeTab === 'tenant' && isAdmin && <TenantSettings tenant={user?.tenant} isAdmin={isAdmin} updateTenant={updateTenant} />}
      </div>
    </div>
  )
}

function ProfileSettings({ user, setUser }) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    current_password: '',
    password: '',
    password_confirmation: '',
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await settingsService.updateProfile(formData)
      setUser(res.user)
      toast.success('Profil mis à jour avec succès.')
      setFormData(prev => ({ ...prev, current_password: '', password: '', password_confirmation: '' }))
    } catch (err) {
      const msg = err.response?.data?.errors
        ? Object.values(err.response.data.errors).flat()[0]
        : err.response?.data?.message || 'Erreur de mise à jour.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card p-4 sm:p-6 space-y-5 sm:space-y-6">
      <h3 className="text-lg font-display font-bold text-navy">Informations Personnelles</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
        <div>
          <label className="block text-sm font-semibold text-navy mb-1.5">Nom complet</label>
          <input
            required
            type="text"
            className="input-field"
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-navy mb-1.5">Adresse email</label>
          <input
            required
            type="email"
            className="input-field"
            value={formData.email}
            onChange={e => setFormData({ ...formData, email: e.target.value })}
          />
        </div>
      </div>

      <div className="pt-4 border-t border-muted-100">
        <h3 className="text-lg font-display font-bold text-navy mb-2">Sécurité (Optionnel)</h3>
        <p className="text-sm text-muted-500 mb-4">Laissez ces champs vides si vous ne souhaitez pas modifier votre mot de passe.</p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-navy mb-1.5">Mot de passe actuel</label>
            <input
              type="password"
              className="input-field"
              value={formData.current_password}
              onChange={e => setFormData({ ...formData, current_password: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            <div>
              <label className="block text-sm font-semibold text-navy mb-1.5">Nouveau mot de passe</label>
              <input
                type="password"
                className="input-field"
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-navy mb-1.5">Confirmer le nouveau mot de passe</label>
              <input
                type="password"
                className="input-field"
                value={formData.password_confirmation}
                onChange={e => setFormData({ ...formData, password_confirmation: e.target.value })}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2 w-full sm:w-auto justify-center">
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Enregistrer les modifications
        </button>
      </div>
    </form>
  )
}

function TenantSettings({ tenant, isAdmin, updateTenant }) {
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef(null)

  const [imagePreview, setImagePreview] = useState(tenant?.logo ? `${import.meta.env.VITE_API_URL.replace('/api/v1', '')}/storage/${tenant.logo}` : null)
  const [imageFile, setImageFile] = useState(null)

  const [formData, setFormData] = useState({
    name:     tenant?.name || '',
    industry: tenant?.industry || '',
    ninea:    tenant?.settings?.ninea    || '',
    rc:       tenant?.settings?.rc       || '',
    address:  tenant?.settings?.address  || '',
    phone:    tenant?.settings?.phone    || '',
    email:    tenant?.settings?.email    || '',
    country:  tenant?.settings?.country  || 'SN',
    currency: tenant?.settings?.currency || 'XOF',
  })

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => setImagePreview(reader.result)
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!isAdmin) return

    setLoading(true)
    try {
      const data = new FormData()
      data.append('name', formData.name)
      data.append('industry', formData.industry)
      data.append('ninea', formData.ninea)
      data.append('rc', formData.rc)
      data.append('address', formData.address)
      data.append('phone', formData.phone)
      data.append('email', formData.email)
      data.append('country', formData.country)
      data.append('currency', formData.currency)
      if (imageFile) {
        data.append('logo', imageFile)
      }

      const res = await settingsService.updateTenant(data)
      updateTenant(res.tenant)
      toast.success('Paramètres de l\'espace mis à jour.')
    } catch (err) {
      const msg = err.response?.data?.errors
        ? Object.values(err.response.data.errors).flat()[0]
        : err.response?.data?.message || 'Erreur de mise à jour.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card p-4 sm:p-6 space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-lg font-display font-bold text-navy">Configuration de l'Espace</h3>
        {!isAdmin && (
          <span className="self-start sm:self-auto bg-amber-50 text-amber-600 px-3 py-1 rounded-full text-xs font-semibold">
            Lecture seule (Admin requis)
          </span>
        )}
      </div>

      {/* Logo + main fields */}
      <div className="flex flex-col gap-6 sm:flex-row sm:gap-8">
        {/* Logo Upload */}
        <div className="flex flex-row sm:flex-col items-center gap-4 sm:gap-3">
          <div
            className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl border-2 border-dashed border-muted-300 flex items-center justify-center overflow-hidden bg-muted-50 relative group flex-shrink-0"
            onClick={() => isAdmin && fileInputRef.current?.click()}
          >
            {imagePreview ? (
              <img src={imagePreview} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center text-muted-400">
                <ImageIcon size={28} className="mb-1 sm:mb-2" />
                <span className="text-xs font-medium text-center">Logo (Optionnel)</span>
              </div>
            )}
            {isAdmin && (
              <div className="absolute inset-0 bg-navy/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                <span className="text-white text-xs font-semibold">Changer</span>
              </div>
            )}
          </div>
          {isAdmin && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="sm:hidden btn-secondary text-xs px-3 py-1.5"
            >
              Changer le logo
            </button>
          )}
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
            disabled={!isAdmin}
          />
        </div>

        {/* Tenant Info */}
        <div className="flex-1 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            <div>
              <label className="block text-sm font-semibold text-navy mb-1.5">Nom de l'entreprise</label>
              <input
                required
                type="text"
                className="input-field"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                disabled={!isAdmin}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-navy mb-1.5">Secteur d'activité</label>
              <select
                required
                className="input-field appearance-none"
                value={formData.industry}
                onChange={e => setFormData({ ...formData, industry: e.target.value })}
                disabled={!isAdmin}
              >
                <option value="">Sélectionnez un secteur...</option>
                <option value="retail">Vente au détail</option>
                <option value="wholesale">Vente en gros</option>
                <option value="services">Prestation de services</option>
                <option value="manufacturing">Fabrication</option>
                <option value="other">Autre</option>
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-muted-100">
            <h4 className="text-sm font-display font-bold text-navy mb-4">Localisation</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 mb-5">
              <div>
                <label className="block text-sm font-semibold text-navy mb-1.5">Pays</label>
                <select
                  className="input-field appearance-none"
                  value={formData.country}
                  onChange={e => {
                    const code = e.target.value
                    const found = COUNTRIES.find(c => c.code === code)
                    setFormData(prev => ({
                      ...prev,
                      country: code,
                      currency: found ? found.currency : prev.currency,
                    }))
                  }}
                  disabled={!isAdmin}
                >
                  <option value="">— Sélectionner —</option>
                  {COUNTRIES.map(c => (
                    <option key={c.code} value={c.code}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-navy mb-1.5">Devise</label>
                <select
                  className="input-field appearance-none"
                  value={formData.currency}
                  onChange={e => setFormData({ ...formData, currency: e.target.value })}
                  disabled={!isAdmin}
                >
                  <option value="">— Sélectionner —</option>
                  {CURRENCIES.map(c => (
                    <option key={c.code} value={c.code}>{c.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-muted-100">
            <h4 className="text-sm font-display font-bold text-navy mb-4">Informations Légales & Contact</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              <div>
                <label className="block text-sm font-semibold text-navy mb-1.5">NINEA</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="ex: 0000000 2G3"
                  value={formData.ninea}
                  onChange={e => setFormData({ ...formData, ninea: e.target.value })}
                  disabled={!isAdmin}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-navy mb-1.5">Registre de Commerce (RC)</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="ex: SN DKR 2023 B 0000"
                  value={formData.rc}
                  onChange={e => setFormData({ ...formData, rc: e.target.value })}
                  disabled={!isAdmin}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-navy mb-1.5">Adresse physique</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Adresse de l'entreprise"
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  disabled={!isAdmin}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-navy mb-1.5">Téléphone public</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="ex: +221 77 000 00 00"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  disabled={!isAdmin}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-navy mb-1.5">Email public</label>
                <input
                  type="email"
                  className="input-field"
                  placeholder="contact@entreprise.com"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  disabled={!isAdmin}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {isAdmin && (
        <div className="flex justify-end pt-4 border-t border-muted-100">
          <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2 w-full sm:w-auto justify-center">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Enregistrer les modifications
          </button>
        </div>
      )}
    </form>
  )
}
