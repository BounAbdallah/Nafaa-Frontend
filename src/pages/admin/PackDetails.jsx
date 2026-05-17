import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { adminService } from '@/services/adminService'
import { MODULE_IDS } from '@/utils/modulePermissions'
import { useCurrency } from '@/utils/currency'
import {
  ArrowLeft,
  Save,
  Zap,
  Settings,
  Users,
  Box,
  HardDrive,
  CheckCircle2,
  XCircle,
  Loader2,
  Info
} from 'lucide-react'
import { cn } from '@/utils/cn'
import Button from '@/components/ui/Button'
import toast from 'react-hot-toast'

export default function PackDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { format: fmt } = useCurrency()
  const isNew = id === 'new'

  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    period: 'monthly',
    is_active: true,
    order: 0,
    features: [],
    limits: {
      users: 5,
      products: 100,
      storage_gb: 5
    }
  })

  useEffect(() => {
    if (!isNew) {
      adminService.getPack(id)
        .then(res => setFormData(res.data.pack))
        .catch(() => {
          toast.error('Pack introuvable')
          navigate('/admin/packs')
        })
        .finally(() => setLoading(false))
    }
  }, [id, isNew, navigate])

  const buildPayload = () => ({
    name:        formData.name,
    description: formData.description || null,
    price:       parseFloat(formData.price) || 0,
    period:      formData.period,
    is_active:   formData.is_active,
    order:       parseInt(formData.order, 10) || 0,
    features:    Array.isArray(formData.features) ? formData.features : [],
    limits: {
      users:      parseInt(formData.limits?.users, 10) || 0,
      products:   parseInt(formData.limits?.products, 10) || 0,
      storage_gb: parseInt(formData.limits?.storage_gb, 10) || 1,
    },
  })

  const handleSave = async (e) => {
    e.preventDefault()
    if (!formData.name?.trim()) {
      toast.error('Le nom du pack est obligatoire')
      return
    }
    setSaving(true)
    try {
      const payload = buildPayload()
      if (isNew) {
        await adminService.createPack(payload)
        toast.success('Pack créé avec succès')
      } else {
        await adminService.updatePack(id, payload)
        toast.success('Pack mis à jour')
      }
      navigate('/admin/packs')
    } catch (err) {
      const errors = err.response?.data?.errors
      if (errors) {
        Object.values(errors).flat().forEach(msg => toast.error(msg))
      } else {
        toast.error(err.response?.data?.message || 'Une erreur est survenue')
      }
    } finally {
      setSaving(false)
    }
  }

  const toggleFeature = (modId) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.includes(modId)
        ? prev.features.filter(f => f !== modId)
        : [...prev.features, modId]
    }))
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
    </div>
  )

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => navigate('/admin/packs')}
            className="flex items-center gap-2 text-muted-500 hover:text-navy transition-colors font-sans text-xs uppercase font-bold tracking-widest"
          >
            <ArrowLeft size={14} />
            Retour aux packs
          </button>
          <h1 className="text-xl sm:text-2xl font-display font-bold text-navy">
            {isNew ? 'Créer un nouveau Pack' : `Modifier : ${formData.name}`}
          </h1>
        </div>

        <div className="flex gap-3 shrink-0 self-start sm:self-auto">
          <Button type="submit" disabled={saving} variant="primary" className="gap-2 sm:px-8">
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            <span className="hidden sm:inline">Enregistrer</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* General Info Card */}
          <div className="card p-4 sm:p-6 space-y-5 sm:space-y-6">
            <h3 className="font-display font-bold text-navy flex items-center gap-2 border-b border-muted-100 pb-4">
              <Info size={18} className="text-primary-500" />
              Informations Générales
            </h3>

            {/* Name + Price */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-500 uppercase tracking-wider">Nom du Pack</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-bg border border-muted-200 rounded-btn px-4 py-2.5 text-navy font-sans focus:outline-none focus:border-primary-500 transition-all"
                  placeholder="Ex: Plan Business"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-500 uppercase tracking-wider">
                  Prix <span className="normal-case text-muted-400 font-normal">({fmt(0).replace('0', '…')})</span>
                </label>
                <input
                  type="number"
                  required
                  value={formData.price}
                  onChange={e => setFormData({ ...formData, price: e.target.value })}
                  className="w-full bg-bg border border-muted-200 rounded-btn px-4 py-2.5 text-navy font-sans focus:outline-none focus:border-primary-500 transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-500 uppercase tracking-wider">Description</label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-bg border border-muted-200 rounded-btn px-4 py-2.5 text-navy font-sans focus:outline-none focus:border-primary-500 transition-all"
                placeholder="Décrivez les avantages de ce pack..."
              />
            </div>

            {/* Period + Order + Status */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-500 uppercase tracking-wider">Période</label>
                <select
                  value={formData.period}
                  onChange={e => setFormData({ ...formData, period: e.target.value })}
                  className="w-full bg-bg border border-muted-200 rounded-btn px-4 py-2.5 text-navy font-sans focus:outline-none focus:border-primary-500 transition-all"
                >
                  <option value="monthly">Mensuel</option>
                  <option value="yearly">Annuel</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-500 uppercase tracking-wider">Ordre d'affichage</label>
                <input
                  type="number"
                  value={formData.order}
                  onChange={e => setFormData({ ...formData, order: e.target.value })}
                  className="w-full bg-bg border border-muted-200 rounded-btn px-4 py-2.5 text-navy font-sans focus:outline-none focus:border-primary-500 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-500 uppercase tracking-wider">Statut</label>
                <div className="flex items-center h-[46px]">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-btn border-2 transition-all w-full",
                      formData.is_active
                        ? "bg-green-50 border-success text-success"
                        : "bg-muted-50 border-muted-200 text-muted-400"
                    )}
                  >
                    {formData.is_active ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                    <span className="text-xs font-bold uppercase">
                      {formData.is_active ? 'Pack Actif' : 'Désactivé'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Features Selection */}
          <div className="card p-4 sm:p-6 space-y-5 sm:space-y-6">
            <h3 className="font-display font-bold text-navy flex items-center gap-2 border-b border-muted-100 pb-4">
              <Settings size={18} className="text-primary-500" />
              Fonctionnalités incluses (Modules)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(MODULE_IDS).map(([key, modId]) => {
                const isActive = formData.features.includes(modId)
                return (
                  <button
                    key={modId}
                    type="button"
                    onClick={() => toggleFeature(modId)}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-btn border text-sm font-medium transition-all text-left",
                      isActive
                        ? "bg-primary-50 border-primary-200 text-primary-700 shadow-sm"
                        : "bg-white border-muted-100 text-muted-400 opacity-60 hover:opacity-100"
                    )}
                  >
                    <div className={cn(
                      "w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all shrink-0",
                      isActive ? "bg-primary-500 border-primary-500" : "bg-white border-muted-200"
                    )}>
                      {isActive && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                    </div>
                    <span className="truncate">{key.toLowerCase().replace('_', ' ')}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Limits + Tip sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="card p-4 sm:p-5 space-y-5">
            <h3 className="font-display font-bold text-navy flex items-center gap-2 border-b border-muted-100 pb-4">
              <Zap size={18} className="text-primary-500" />
              Limites de ressources
            </h3>

            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-500 mb-1">
                  <Users size={14} />
                  <label className="text-[10px] font-bold uppercase tracking-wider">Utilisateurs Max</label>
                </div>
                <input
                  type="number"
                  value={formData.limits.users}
                  onChange={e => setFormData({
                    ...formData,
                    limits: { ...formData.limits, users: parseInt(e.target.value) }
                  })}
                  className="w-full bg-bg border border-muted-200 rounded-btn px-4 py-2 text-navy font-sans focus:outline-none focus:border-primary-500 transition-all"
                />
                <p className="text-[10px] text-muted-400 italic">Entrez -1 pour illimité</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-500 mb-1">
                  <Box size={14} />
                  <label className="text-[10px] font-bold uppercase tracking-wider">Produits Max</label>
                </div>
                <input
                  type="number"
                  value={formData.limits.products}
                  onChange={e => setFormData({
                    ...formData,
                    limits: { ...formData.limits, products: parseInt(e.target.value) }
                  })}
                  className="w-full bg-bg border border-muted-200 rounded-btn px-4 py-2 text-navy font-sans focus:outline-none focus:border-primary-500 transition-all"
                />
                <p className="text-[10px] text-muted-400 italic">Entrez -1 pour illimité</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-500 mb-1">
                  <HardDrive size={14} />
                  <label className="text-[10px] font-bold uppercase tracking-wider">Stockage (GB)</label>
                </div>
                <input
                  type="number"
                  value={formData.limits.storage_gb}
                  onChange={e => setFormData({
                    ...formData,
                    limits: { ...formData.limits, storage_gb: parseInt(e.target.value) }
                  })}
                  className="w-full bg-bg border border-muted-200 rounded-btn px-4 py-2 text-navy font-sans focus:outline-none focus:border-primary-500 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Tip card */}
          <div className="p-4 sm:p-5 bg-navy rounded-card text-white">
            <h4 className="text-sm font-bold flex items-center gap-2 mb-2">
              <Zap size={16} className="text-gold" />
              Conseil Super Admin
            </h4>
            <p className="text-xs text-white/70 leading-relaxed">
              Les limites définies ici seront appliquées automatiquement à tous les espaces de travail utilisant ce pack.
              Toute modification prendra effet lors du prochain cycle de vérification des quotas.
            </p>
          </div>

          {/* Mobile sticky save — only shows below lg breakpoint */}
          <div className="lg:hidden">
            <Button
              type="submit"
              disabled={saving}
              variant="primary"
              className="w-full gap-2 justify-center"
            >
              {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              Enregistrer
            </Button>
          </div>
        </div>
      </div>
    </form>
  )
}
