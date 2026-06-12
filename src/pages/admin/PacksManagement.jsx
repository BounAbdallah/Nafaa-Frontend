import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { adminService } from '@/services/adminService'
import { confirmDialog } from '@/utils/confirm'
import { useCurrency, COUNTRIES } from '@/utils/currency'
import { PROFILE_TYPES } from '@/utils/constants'
import { useAuthStore } from '@/store/authStore'
import {
  Package,
  Plus,
  Edit2,
  Trash2,
  Zap,
  Users,
  HardDrive,
  Box,
  ChevronRight,
  Loader2,
  Globe,
  X,
  Check
} from 'lucide-react'
import { cn } from '@/utils/cn'
import Button from '@/components/ui/Button'
import toast from 'react-hot-toast'

export default function PacksManagement() {
  const role = useAuthStore(s => s.role)
  const user = useAuthStore(s => s.user)
  const isSuper = role === 'super_admin'
  const [packs, setPacks] = useState([])
  const [loading, setLoading] = useState(true)
  const [priceModal, setPriceModal] = useState(null) // pack à tarifer par pays
  const { format: fmt } = useCurrency()

  const fetchPacks = async () => {
    setLoading(true)
    try {
      const res = await adminService.getPacks()
      setPacks(res.data.packs)
    } catch (err) {
      toast.error('Erreur lors du chargement des packs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPacks()
  }, [])

  const handleDelete = async (id) => {
    if (!(await confirmDialog({
      title: 'Supprimer ce pack ?',
      text: 'Cette action est irréversible. Les espaces utilisant ce pack seront affectés.',
      confirmText: 'Supprimer',
      type: 'danger'
    }))) return
    try {
      await adminService.deletePack(id)
      toast.success('Pack supprimé')
      fetchPacks()
    } catch (err) {
      toast.error('Erreur lors de la suppression')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-navy flex items-center gap-2">
            <Package className="w-6 h-6 text-primary-500" />
            Gestion des Packs
          </h1>
          <p className="text-sm font-sans text-muted-500 mt-1">
            {isSuper
              ? 'Configurez les offres, limites et prix par pays'
              : 'Personnalisez les prix des packs pour votre pays'}
          </p>
        </div>

        {isSuper && (
          <Link to="/admin/packs/new" className="self-start sm:self-auto">
            <Button variant="primary" className="gap-2 w-full sm:w-auto">
              <Plus size={18} />
              <span className="hidden sm:inline">Créer un nouveau Pack</span>
              <span className="sm:hidden">Nouveau Pack</span>
            </Button>
          </Link>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        </div>
      ) : packs.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] text-center gap-3">
          <Package className="w-12 h-12 text-muted-200" />
          <p className="text-muted-400 font-sans text-sm">Aucun pack configuré pour le moment.</p>
          <Link to="/admin/packs/new">
            <Button variant="primary" className="gap-2 mt-1">
              <Plus size={16} />
              <span>Créer le premier Pack</span>
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {packs.map((pack) => (
            <PackCard
              key={pack.id}
              pack={pack}
              fmt={fmt}
              isSuper={isSuper}
              onDelete={handleDelete}
              onCountryPrice={() => setPriceModal(pack)}
            />
          ))}
        </div>
      )}

      {priceModal && (
        <CountryPriceModal
          pack={priceModal}
          isSuper={isSuper}
          userCountry={user?.country_code}
          onClose={() => setPriceModal(null)}
          onSaved={() => { setPriceModal(null); fetchPacks() }}
        />
      )}
    </div>
  )
}

function PackCard({ pack, fmt, isSuper, onDelete, onCountryPrice }) {
  return (
    <div className="card group hover:border-primary-300 transition-all overflow-hidden flex flex-col">
      {/* Pack Header */}
      <div className="p-4 sm:p-5 border-b border-muted-100">
        <div className="flex items-center justify-between mb-4">
          <div className={cn(
            "w-10 h-10 rounded-card flex items-center justify-center",
            pack.price === 0 ? "bg-muted-50 text-muted-500" : "bg-primary-50 text-primary-500"
          )}>
            <Zap size={20} />
          </div>
          <div className="flex gap-1">
            <button
              onClick={onCountryPrice}
              className="p-2 hover:bg-primary-50 rounded-btn transition-colors text-muted-400 hover:text-primary-500"
              title="Prix par pays"
            >
              <Globe size={16} />
            </button>
            {isSuper && (
              <>
                <Link
                  to={`/admin/packs/${pack.id}`}
                  className="p-2 hover:bg-muted-100 rounded-btn transition-colors text-muted-400 hover:text-primary-500"
                  title="Modifier"
                >
                  <Edit2 size={16} />
                </Link>
                <button
                  onClick={() => onDelete(pack.id)}
                  className="p-2 hover:bg-red-50 rounded-btn transition-colors text-muted-400 hover:text-danger"
                  title="Supprimer"
                >
                  <Trash2 size={16} />
                </button>
              </>
            )}
          </div>
        </div>

        <h3 className="text-lg font-display font-bold text-navy">{pack.name}</h3>
        <div className="flex items-baseline gap-1 mt-1 flex-wrap">
          <span className="text-xl sm:text-2xl font-display font-black text-navy">
            {Number(pack.price).toLocaleString('fr-FR')}
          </span>
          <span className="text-xs font-sans text-muted-500 font-bold uppercase tracking-widest">
            {pack.currency === 'XOF' || !pack.currency ? 'FCFA' : pack.currency} / mois
          </span>
          {pack.is_country_price && (
            <span className="text-[9px] font-bold bg-green-50 text-green-600 px-1.5 py-0.5 rounded uppercase">Prix local</span>
          )}
        </div>
        {isSuper && (pack.country_prices?.length ?? 0) > 0 && (
          <p className="text-[10px] text-muted-400 mt-1">
            {pack.country_prices.length} prix pays défini{pack.country_prices.length > 1 ? 's' : ''}
          </p>
        )}
        <div className="flex flex-wrap gap-1 mt-1.5">
          {(pack.profile_types?.length ?? 0) === 0 ? (
            <span className="text-[9px] font-bold bg-muted-100 text-muted-500 px-1.5 py-0.5 rounded uppercase">Tous profils</span>
          ) : (
            pack.profile_types.map(pt => (
              <span key={pt} className="text-[9px] font-bold bg-violet-50 text-violet-600 px-1.5 py-0.5 rounded uppercase">
                {PROFILE_TYPES.find(p => p.value === pt)?.label?.split(' / ')[0] ?? pt}
              </span>
            ))
          )}
        </div>
      </div>

      {/* Pack Limits */}
      <div className="p-4 sm:p-5 flex-1 space-y-3 bg-muted-50/30">
        <div className="flex items-center gap-3">
          <Users size={15} className="text-muted-400 shrink-0" />
          <div className="flex-1">
            <p className="text-[10px] font-bold text-muted-400 uppercase tracking-widest">Utilisateurs</p>
            <p className="text-sm font-sans font-bold text-navy">
              {pack.limits?.users === -1 ? 'Illimité' : `${pack.limits?.users} membres`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Box size={15} className="text-muted-400 shrink-0" />
          <div className="flex-1">
            <p className="text-[10px] font-bold text-muted-400 uppercase tracking-widest">Produits</p>
            <p className="text-sm font-sans font-bold text-navy">
              {pack.limits?.products === -1 ? 'Illimité' : `${pack.limits?.products} articles`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <HardDrive size={15} className="text-muted-400 shrink-0" />
          <div className="flex-1">
            <p className="text-[10px] font-bold text-muted-400 uppercase tracking-widest">Stockage</p>
            <p className="text-sm font-sans font-bold text-navy">{pack.limits?.storage_gb} GB</p>
          </div>
        </div>
      </div>

      {/* Pack Footer */}
      <div className="p-4 bg-white border-t border-muted-100 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className={cn("w-2 h-2 rounded-full", pack.is_active ? "bg-success" : "bg-muted-300")} />
          <span className="text-[10px] font-bold text-muted-500 uppercase tracking-widest">
            {pack.is_active ? 'Actif' : 'Désactivé'}
          </span>
        </div>
        {isSuper ? (
          <Link
            to={`/admin/packs/${pack.id}`}
            className="text-xs font-bold text-primary-500 hover:underline flex items-center gap-1"
          >
            Détails <ChevronRight size={14} />
          </Link>
        ) : (
          <button
            onClick={onCountryPrice}
            className="text-xs font-bold text-primary-500 hover:underline flex items-center gap-1"
          >
            <Globe size={12} /> Prix de mon pays
          </button>
        )}
      </div>
    </div>
  )
}

// ── Modal : prix d'un pack par pays ──────────────────────────────────────────
function CountryPriceModal({ pack, isSuper, userCountry, onClose, onSaved }) {
  const defaultCountry = isSuper ? (pack.country_prices?.[0]?.country_code ?? 'GN') : userCountry
  const [country, setCountry]   = useState(defaultCountry)
  const [price, setPrice]       = useState('')
  const [currency, setCurrency] = useState('')
  const [saving, setSaving]     = useState(false)
  const [removing, setRemoving] = useState(null)

  const overrides = pack.country_prices ?? []
  const existing  = overrides.find(cp => cp.country_code === country)

  // Pré-remplir prix/devise selon le pays choisi
  useEffect(() => {
    const cp = overrides.find(o => o.country_code === country)
    if (cp) {
      setPrice(String(cp.price))
      setCurrency(cp.currency)
    } else {
      setPrice('')
      setCurrency(COUNTRIES.find(c => c.code === country)?.currency ?? 'XOF')
    }
  }, [country]) // eslint-disable-line react-hooks/exhaustive-deps

  const save = async () => {
    if (price === '' || !currency) { toast.error('Prix et devise requis.'); return }
    setSaving(true)
    try {
      const payload = { price: parseFloat(price), currency }
      if (isSuper) payload.country_code = country
      const r = await adminService.setPackCountryPrice(pack.id, payload)
      toast.success(r.message)
      onSaved()
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Erreur lors de l\'enregistrement.')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (code) => {
    setRemoving(code)
    try {
      const r = await adminService.removePackCountryPrice(pack.id, code)
      toast.success(r.message)
      onSaved()
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Erreur.')
    } finally {
      setRemoving(null)
    }
  }

  const countryLabel = (code) => COUNTRIES.find(c => c.code === code)?.label ?? code

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-surface rounded-card w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-muted-200 sticky top-0 bg-surface z-10">
          <div>
            <h3 className="font-display font-bold text-navy flex items-center gap-2">
              <Globe size={16} className="text-primary-500" />
              Prix par pays
            </h3>
            <p className="text-xs text-muted-500 mt-0.5">
              {pack.name} — prix de base : {Number(pack.base_price ?? pack.price).toLocaleString('fr-FR')} FCFA
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-btn text-muted-500 hover:bg-muted-100">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Prix existants (super admin) */}
          {isSuper && overrides.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-sans font-bold text-muted-700 uppercase tracking-wide">Prix définis</p>
              {overrides.map(cp => (
                <div key={cp.country_code} className="flex items-center justify-between bg-muted-50 rounded-btn px-3 py-2">
                  <span className="text-xs font-sans font-semibold text-navy">{countryLabel(cp.country_code)}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-primary-600">
                      {Number(cp.price).toLocaleString('fr-FR')} {cp.currency}
                    </span>
                    <button
                      onClick={() => remove(cp.country_code)}
                      disabled={removing === cp.country_code}
                      className="p-1 rounded text-muted-400 hover:text-danger"
                      title="Supprimer (retour au prix de base)"
                    >
                      {removing === cp.country_code ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pays */}
          <div className="space-y-1.5">
            <label className="block text-xs font-sans font-semibold text-muted-700 uppercase tracking-wide">Pays</label>
            {isSuper ? (
              <select className="input-field w-full" value={country} onChange={e => setCountry(e.target.value)}>
                {COUNTRIES.map(c => (
                  <option key={c.code} value={c.code}>{c.label}</option>
                ))}
              </select>
            ) : (
              <div className="input-field w-full bg-muted-50 text-muted-600 cursor-not-allowed">
                {countryLabel(userCountry)}
              </div>
            )}
          </div>

          {/* Prix + devise */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-sans font-semibold text-muted-700 uppercase tracking-wide">Prix / mois</label>
              <input
                type="number"
                min={0}
                className="input-field w-full"
                value={price}
                onChange={e => setPrice(e.target.value)}
                placeholder="Ex : 350000"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-sans font-semibold text-muted-700 uppercase tracking-wide">Devise</label>
              <select className="input-field w-full" value={currency} onChange={e => setCurrency(e.target.value)}>
                {[...new Set(COUNTRIES.map(c => c.currency))].map(cur => (
                  <option key={cur} value={cur}>{cur}</option>
                ))}
              </select>
            </div>
          </div>

          {existing && (
            <p className="text-[11px] text-amber-600 font-semibold">
              Un prix existe déjà pour ce pays — il sera remplacé.
            </p>
          )}

          <button
            onClick={save}
            disabled={saving}
            className="btn-primary w-full py-2.5 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
            Enregistrer le prix
          </button>
          <p className="text-[11px] text-muted-400 text-center">
            Ce prix sera affiché à l'inscription et sur la page Abonnement des clients de ce pays.
          </p>
        </div>
      </div>
    </div>
  )
}
