import { useState, useRef } from 'react'
import { useAuthStore } from '@/store/authStore'
import { settingsService } from '@/services/settingsService'
import toast from 'react-hot-toast'
import { UserCircle, Building2, Save, Image as ImageIcon, Loader2 } from 'lucide-react'
import { cn } from '@/utils/cn'

export default function SettingsPage() {
  const { user, setUser, updateTenant } = useAuthStore()
  const [activeTab, setActiveTab] = useState('profile')

  const isAdmin = user?.role === 'admin'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-navy">Paramètres</h1>
        <p className="text-sm font-sans text-muted-500 mt-1">Gérez votre profil et les préférences de votre espace de travail.</p>
      </div>

      <div className="flex border-b border-muted-200">
        <button
          onClick={() => setActiveTab('profile')}
          className={cn(
            'px-6 py-3 text-sm font-semibold transition-colors border-b-2',
            activeTab === 'profile' ? 'border-primary-500 text-primary-600' : 'border-transparent text-muted-500 hover:text-navy hover:border-muted-300'
          )}
        >
          <div className="flex items-center gap-2">
            <UserCircle size={18} />
            Mon Profil
          </div>
        </button>
        <button
          onClick={() => setActiveTab('tenant')}
          className={cn(
            'px-6 py-3 text-sm font-semibold transition-colors border-b-2',
            activeTab === 'tenant' ? 'border-primary-500 text-primary-600' : 'border-transparent text-muted-500 hover:text-navy hover:border-muted-300'
          )}
        >
          <div className="flex items-center gap-2">
            <Building2 size={18} />
            Espace de travail
          </div>
        </button>
      </div>

      <div className="mt-6">
        {activeTab === 'profile' && <ProfileSettings user={user} setUser={setUser} />}
        {activeTab === 'tenant' && <TenantSettings tenant={user?.tenant} isAdmin={isAdmin} updateTenant={updateTenant} />}
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
      setUser(res.user) // Update local auth store
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
    <form onSubmit={handleSubmit} className="card p-6 space-y-6">
      <h3 className="text-lg font-display font-bold text-navy">Informations Personnelles</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
        <h3 className="text-lg font-display font-bold text-navy mb-4">Sécurité (Optionnel)</h3>
        <p className="text-sm text-muted-500 mb-4">Laissez ces champs vides si vous ne souhaitez pas modifier votre mot de passe.</p>
        
        <div className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm font-semibold text-navy mb-1.5">Mot de passe actuel</label>
            <input
              type="password"
              className="input-field"
              value={formData.current_password}
              onChange={e => setFormData({ ...formData, current_password: e.target.value })}
            />
          </div>
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

      <div className="flex justify-end pt-4">
        <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
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
    name: tenant?.name || '',
    industry: tenant?.industry || '',
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
      if (imageFile) {
        data.append('logo', imageFile)
      }

      const res = await settingsService.updateTenant(data)
      updateTenant(res.tenant) // Update local auth store
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
    <form onSubmit={handleSubmit} className="card p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-display font-bold text-navy">Configuration de l'Espace</h3>
        {!isAdmin && (
          <span className="bg-amber-50 text-amber-600 px-3 py-1 rounded-full text-xs font-semibold">
            Lecture seule (Admin requis)
          </span>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Logo Upload */}
        <div className="flex flex-col items-center gap-3">
          <div 
            className="w-32 h-32 rounded-xl border-2 border-dashed border-muted-300 flex items-center justify-center overflow-hidden bg-muted-50 relative group"
            onClick={() => isAdmin && fileInputRef.current?.click()}
          >
            {imagePreview ? (
              <img src={imagePreview} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center text-muted-400">
                <ImageIcon size={32} className="mb-2" />
                <span className="text-xs font-medium">Logo (Optionnel)</span>
              </div>
            )}
            {isAdmin && (
              <div className="absolute inset-0 bg-navy/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                <span className="text-white text-xs font-semibold">Changer</span>
              </div>
            )}
          </div>
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
          <div>
            <label className="block text-sm font-semibold text-navy mb-1.5">Nom de l'entreprise / Espace</label>
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
      </div>

      {isAdmin && (
        <div className="flex justify-end pt-4 border-t border-muted-100">
          <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Enregistrer les modifications
          </button>
        </div>
      )}
    </form>
  )
}
