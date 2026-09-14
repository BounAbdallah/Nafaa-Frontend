import { useState, useRef } from 'react'
import { useAuthStore } from '@/store/authStore'
import { settingsService } from '@/services/settingsService'
import toast from 'react-hot-toast'
import { UserCircle, Building2, Save, Image as ImageIcon, Loader2, Printer, Wifi, CheckCircle, XCircle } from 'lucide-react'
import { printerService } from '@/services/printerService'
import { cn } from '@/utils/cn'
import { COUNTRIES, CURRENCIES } from '@/utils/currency'
import ReportFrequencyCard from '@/components/ReportFrequencyCard'

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
        {isAdmin && (
          <button
            onClick={() => setActiveTab('printer')}
            className={cn(
              'flex-shrink-0 px-4 sm:px-6 py-3 text-sm font-semibold transition-colors border-b-2',
              activeTab === 'printer' ? 'border-primary-500 text-primary-600' : 'border-transparent text-muted-500 hover:text-navy hover:border-muted-300'
            )}
          >
            <div className="flex items-center gap-2">
              <Printer size={18} />
              Imprimante
            </div>
          </button>
        )}
      </div>

      <div>
        {activeTab === 'profile' && (
          <div className="space-y-5">
            <ProfileSettings user={user} setUser={setUser} />
            {isAdmin && <ReportFrequencyCard />}
          </div>
        )}
        {activeTab === 'tenant'  && isAdmin && <TenantSettings tenant={user?.tenant} isAdmin={isAdmin} updateTenant={updateTenant} />}
        {activeTab === 'printer' && isAdmin && <PrinterSettings tenant={user?.tenant} updateTenant={updateTenant} />}
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

  const [imagePreview, setImagePreview] = useState(tenant?.logo || null)
  const [imageFile, setImageFile] = useState(null)

  const [formData, setFormData] = useState({
    name:             tenant?.name || '',
    industry:         tenant?.industry || '',
    ninea:            tenant?.settings?.ninea    || '',
    rc:               tenant?.settings?.rc       || '',
    address:          tenant?.settings?.address  || '',
    phone:            tenant?.settings?.phone    || '',
    email:            tenant?.settings?.email    || '',
    country:          tenant?.settings?.country  || 'SN',
    currency:         tenant?.settings?.currency || 'XOF',
    default_vat_rate: tenant?.default_vat_rate ?? 0,
    vat_number:       tenant?.vat_number || '',
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
      data.append('default_vat_rate', formData.default_vat_rate)
      data.append('vat_number', formData.vat_number)
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

          <div className="pt-4 border-t border-muted-100">
            <h4 className="text-sm font-display font-bold text-navy mb-4">TVA</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              <div>
                <label className="block text-sm font-semibold text-navy mb-1.5">Taux TVA par défaut (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  className="input-field"
                  placeholder="ex: 18"
                  value={formData.default_vat_rate}
                  onChange={e => setFormData({ ...formData, default_vat_rate: e.target.value })}
                  disabled={!isAdmin}
                />
                <p className="text-xs text-muted-400 mt-1">Laisser à 0 si vous n'appliquez pas de TVA.</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-navy mb-1.5">N° TVA / Identifiant fiscal</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="ex: SN-TVA-0000000"
                  value={formData.vat_number}
                  onChange={e => setFormData({ ...formData, vat_number: e.target.value })}
                  disabled={!isAdmin}
                />
                <p className="text-xs text-muted-400 mt-1">Affiché sur la facture PDF si TVA &gt; 0.</p>
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

/* ─────────────────────────────────────────────────────────── */
/*  PrinterSettings                                            */
/* ─────────────────────────────────────────────────────────── */
function PrinterSettings({ tenant, updateTenant }) {
  const existing = tenant?.settings?.printer || {}
  const [cfg, setCfg]         = useState({
    enabled:           existing.enabled           ?? false,
    ip:                existing.ip                ?? '',
    port:              existing.port              ?? 9100,
    width:             existing.width             ?? 80,
    paper_width_chars: existing.paper_width_chars ?? 42,
    timeout:           existing.timeout           ?? 3,
  })
  const [loading, setLoading] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState(null) // null | 'ok' | 'error'

  const handleSave = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await settingsService.updateTenant({
        settings: { ...tenant?.settings, printer: cfg },
      })
      updateTenant(res.data?.data?.tenant || res.data)
      toast.success('Configuration imprimante sauvegardée')
    } catch {
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setLoading(false)
    }
  }

  const handleTest = async () => {
    if (!cfg.ip) { toast.error('Entrez l\'adresse IP de l\'imprimante'); return }
    setTesting(true)
    setTestResult(null)
    try {
      // Sauvegarder d'abord pour que le backend ait la config à jour
      await settingsService.updateTenant({ settings: { ...tenant?.settings, printer: cfg } })
      await printerService.test()
      setTestResult('ok')
      toast.success('Imprimante connectée — ticket test imprimé !')
    } catch (err) {
      setTestResult('error')
      toast.error(err.response?.data?.message || 'Imprimante injoignable')
    } finally {
      setTesting(false)
    }
  }

  const set = (key, val) => setCfg(c => ({ ...c, [key]: val }))

  return (
    <form onSubmit={handleSave} className="space-y-6">

      {/* Info banner */}
      <div className="bg-primary-50 border border-primary-100 rounded-card p-4 flex gap-3">
        <Wifi size={18} className="text-primary-500 shrink-0 mt-0.5" />
        <div className="text-sm text-primary-700">
          <p className="font-bold mb-1">Imprimante thermique WiFi / LAN</p>
          <p className="text-primary-600 leading-relaxed">
            Compatible avec les imprimantes ESC/POS sur réseau local (WiFi ou Ethernet) :
            <strong className="ml-1">Xprinter XP-Q90EC, Rongta RP80USE, GOOJPRT NT-58H</strong> et tout modèle avec port TCP 9100.
          </p>
        </div>
      </div>

      {/* Activation */}
      <div className="bg-surface border border-muted-200 rounded-card p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-bold text-navy text-sm">Activer l'impression thermique</p>
            <p className="text-muted-500 text-xs mt-0.5">Affiche le bouton "Ticket" sur les commandes</p>
          </div>
          <button
            type="button"
            onClick={() => set('enabled', !cfg.enabled)}
            className={cn(
              'relative w-11 h-6 rounded-full transition-colors duration-200',
              cfg.enabled ? 'bg-primary-500' : 'bg-muted-300'
            )}
          >
            <span className={cn(
              'absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200',
              cfg.enabled ? 'translate-x-5' : 'translate-x-0.5'
            )} />
          </button>
        </div>
      </div>

      {/* Config réseau */}
      <div className="bg-surface border border-muted-200 rounded-card p-5 space-y-5">
        <h3 className="font-bold text-navy text-sm">Connexion réseau</h3>

        <div className="grid sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-semibold text-navy mb-1.5">
              Adresse IP de l'imprimante *
            </label>
            <input
              type="text"
              required={cfg.enabled}
              placeholder="ex: 192.168.1.105"
              value={cfg.ip}
              onChange={e => set('ip', e.target.value)}
              className="input-field font-mono"
            />
            <p className="text-xs text-muted-400 mt-1">
              Trouvez l'IP dans le menu de l'imprimante ou votre box WiFi.
            </p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-navy mb-1.5">Port TCP</label>
            <input
              type="number"
              value={cfg.port}
              onChange={e => set('port', Number(e.target.value))}
              className="input-field font-mono"
            />
            <p className="text-xs text-muted-400 mt-1">9100 par défaut</p>
          </div>
        </div>

        {/* Bouton test */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleTest}
            disabled={testing || !cfg.ip}
            className="btn-secondary flex items-center gap-2 text-sm disabled:opacity-50"
          >
            {testing
              ? <Loader2 size={15} className="animate-spin" />
              : <Printer size={15} />
            }
            {testing ? 'Test en cours…' : 'Tester la connexion'}
          </button>
          {testResult === 'ok' && (
            <span className="flex items-center gap-1.5 text-success text-sm font-bold">
              <CheckCircle size={15} /> Connectée
            </span>
          )}
          {testResult === 'error' && (
            <span className="flex items-center gap-1.5 text-danger text-sm font-bold">
              <XCircle size={15} /> Injoignable
            </span>
          )}
        </div>
      </div>

      {/* Format papier */}
      <div className="bg-surface border border-muted-200 rounded-card p-5 space-y-4">
        <h3 className="font-bold text-navy text-sm">Format du ticket</h3>
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-navy mb-1.5">Largeur papier</label>
            <select
              value={cfg.width}
              onChange={e => {
                const w = Number(e.target.value)
                set('width', w)
                set('paper_width_chars', w === 58 ? 32 : 42)
              }}
              className="input-field"
            >
              <option value={58}>58 mm (petit)</option>
              <option value={80}>80 mm (standard)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-navy mb-1.5">Caractères/ligne</label>
            <input
              type="number"
              min={24}
              max={56}
              value={cfg.paper_width_chars}
              onChange={e => set('paper_width_chars', Number(e.target.value))}
              className="input-field font-mono"
            />
            <p className="text-xs text-muted-400 mt-1">32 pour 58mm · 42 pour 80mm</p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-navy mb-1.5">Timeout (sec)</label>
            <input
              type="number"
              min={1}
              max={10}
              value={cfg.timeout}
              onChange={e => set('timeout', Number(e.target.value))}
              className="input-field font-mono"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-2 border-t border-muted-100">
        <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2 w-full sm:w-auto justify-center">
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Enregistrer
        </button>
      </div>
    </form>
  )
}
