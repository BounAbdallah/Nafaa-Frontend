import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  ChevronRight, ChevronLeft, Check,
  Building2, Briefcase, Zap, Clock,
  CheckCircle2, Loader2, ArrowRight,
  Hammer, ShoppingBag, Warehouse, BriefcaseBusiness,
  Users, Package, Phone,
} from 'lucide-react'
import { tenantService } from '@/services/tenantService'
import { useAuthStore } from '@/store/authStore'
import { PROFILE_TYPES } from '@/utils/constants'
import { COUNTRIES, CURRENCIES, getDialCode } from '@/utils/currency'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import SignupProgress from '@/components/ui/SignupProgress'
import { cn } from '@/utils/cn'
import toast from 'react-hot-toast'

const TOTAL_STEPS = 3

/* ── Lucide icon lookup pour les profils ── */
const PROFILE_ICONS = { Hammer, ShoppingBag, Warehouse, BriefcaseBusiness }

const step1Schema = z.object({
  name:     z.string().min(2, 'Nom requis (2 caractères minimum)'),
  industry: z.string().min(1, 'Secteur requis'),
  country:  z.string().min(1, 'Pays requis'),
  currency: z.string().min(1, 'Devise requise'),
  phone:    z.string().optional(),
})
const step2Schema = z.object({ profile_type: z.string().min(1, 'Profil requis') })
const step3Schema = z.object({ pack_id: z.string().min(1, 'Pack requis') })

/* ── Barre de progression ── */
function ProgressBar({ current, total }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        {Array.from({ length: total }).map((_, i) => {
          const done    = i + 1 < current
          const active  = i + 1 === current
          return (
            <div key={i} className="flex items-center gap-2 flex-1 last:flex-none">
              <div className={cn(
                'w-7 h-7 rounded-full flex items-center justify-center text-xs font-display font-bold transition-all duration-300 shrink-0',
                done   && 'bg-primary-500 text-white',
                active && 'bg-navy text-white ring-4 ring-navy/10',
                !done && !active && 'bg-muted-100 text-muted-400 border border-muted-300',
              )}>
                {done ? <Check className="w-3.5 h-3.5" /> : i + 1}
              </div>
              {i < total - 1 && (
                <div className="flex-1 h-[2px] rounded-full overflow-hidden bg-muted-200 mx-1">
                  <div
                    className="h-full bg-primary-500 transition-all duration-500"
                    style={{ width: done ? '100%' : '0%' }}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
      <p className="text-center text-[11px] font-sans font-semibold text-muted-400 uppercase tracking-widest">
        Étape {current} sur {total}
      </p>
    </div>
  )
}

/* ══════════════════════════════════════
   ÉTAPE 1 — Votre entreprise
══════════════════════════════════════ */
function Step1({ onNext }) {
  const [industries, setIndustries] = useState([])
  const [dialCode, setDialCode]     = useState('+221')

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    resolver: zodResolver(step1Schema),
    defaultValues: { country: 'SN', currency: 'XOF' },
  })

  useEffect(() => {
    tenantService.getIndustries()
      .then(res => setIndustries(res.data.industries))
      .catch(() => {})
  }, [])

  const handleCountryChange = (e) => {
    const code = e.target.value
    setValue('country', code, { shouldValidate: true })
    const found = COUNTRIES.find(c => c.code === code)
    if (found) {
      setValue('currency', found.currency, { shouldValidate: true })
      const dc = found.dialCode ?? ''
      setDialCode(dc)
      // Pré-remplir le téléphone avec le nouvel indicatif si le champ est vide ou contient l'ancien indicatif
      const currentPhone = watch('phone') ?? ''
      if (!currentPhone || currentPhone === dialCode) {
        setValue('phone', dc)
      }
    }
  }

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">

      {/* Header */}
      <div className="text-center space-y-1.5">
        <div className="w-11 h-11 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center mx-auto">
          <Building2 className="w-5 h-5 text-primary-500" />
        </div>
        <h3 className="font-display font-bold text-xl text-navy">Votre entreprise</h3>
        <p className="text-muted-500 text-[13px]">Quelques infos pour personnaliser votre espace</p>
      </div>

      {/* Nom */}
      <Input
        label="Nom de l'entreprise"
        placeholder="ex : Bakari Commerce SARL"
        error={errors.name?.message}
        {...register('name')}
      />

      {/* Secteur */}
      <div className="space-y-1.5">
        <label className="block text-sm font-display font-semibold text-navy">Secteur d'activité</label>
        <select
          className={cn(
            'w-full bg-surface border rounded-btn py-[10px] px-3.5 text-sm text-navy appearance-none focus:outline-none focus:ring-2 transition-all duration-150',
            errors.industry
              ? 'border-danger focus:border-danger focus:ring-danger/20'
              : 'border-muted-300 focus:border-primary-500 focus:ring-primary-100'
          )}
          defaultValue=""
          {...register('industry')}
        >
          <option value="" disabled>— Choisir un secteur —</option>
          {industries.map(ind => (
            <option key={ind.value} value={ind.value}>{ind.label}</option>
          ))}
        </select>
        {errors.industry && (
          <p className="text-xs text-danger flex items-center gap-1"><span>⚠</span>{errors.industry.message}</p>
        )}
      </div>

      {/* Téléphone */}
      <div className="space-y-1.5">
        <label className="block text-sm font-display font-semibold text-navy">
          Téléphone <span className="text-muted-400 font-normal text-xs">(optionnel)</span>
        </label>
        <div className="flex gap-2">
          {/* Badge indicatif */}
          <div className="flex items-center gap-1.5 px-3 bg-muted-50 border border-muted-300 rounded-btn shrink-0 text-sm font-bold text-navy min-w-[72px] justify-center">
            <Phone className="w-3.5 h-3.5 text-muted-400 shrink-0" />
            <span>{dialCode}</span>
          </div>
          {/* Numéro */}
          <input
            type="tel"
            placeholder="77 123 45 67"
            className={cn(
              'flex-1 bg-surface border rounded-btn py-[10px] px-3.5 text-sm text-navy placeholder-muted-400 focus:outline-none focus:ring-2 transition-all duration-150',
              errors.phone
                ? 'border-danger focus:border-danger focus:ring-danger/20'
                : 'border-muted-300 focus:border-primary-500 focus:ring-primary-100'
            )}
            {...register('phone', {
              onChange: (e) => {
                // S'assurer que la valeur soumise contient l'indicatif
                const raw = e.target.value.replace(/\s/g, '')
                if (raw && !raw.startsWith('+')) {
                  setValue('phone', dialCode + raw)
                }
              }
            })}
          />
        </div>
        {errors.phone && (
          <p className="text-xs text-danger flex items-center gap-1"><span>⚠</span>{errors.phone.message}</p>
        )}
      </div>

      {/* Pays + Devise */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="block text-sm font-display font-semibold text-navy">Pays</label>
          <select
            className={cn(
              'w-full bg-surface border rounded-btn py-[10px] px-3.5 text-sm text-navy appearance-none focus:outline-none focus:ring-2 transition-all duration-150',
              errors.country
                ? 'border-danger focus:border-danger focus:ring-danger/20'
                : 'border-muted-300 focus:border-primary-500 focus:ring-primary-100'
            )}
            {...register('country')}
            onChange={handleCountryChange}
          >
            <option value="">— Pays —</option>
            {COUNTRIES.map(c => (
              <option key={c.code} value={c.code}>{c.label}</option>
            ))}
          </select>
          {errors.country && (
            <p className="text-xs text-danger flex items-center gap-1"><span>⚠</span>{errors.country.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-display font-semibold text-navy">Devise</label>
          <select
            className={cn(
              'w-full bg-surface border rounded-btn py-[10px] px-3.5 text-sm text-navy appearance-none focus:outline-none focus:ring-2 transition-all duration-150',
              errors.currency
                ? 'border-danger focus:border-danger focus:ring-danger/20'
                : 'border-muted-300 focus:border-primary-500 focus:ring-primary-100'
            )}
            {...register('currency')}
          >
            <option value="">— Devise —</option>
            {CURRENCIES.map(c => (
              <option key={c.code} value={c.code}>{c.code} – {c.symbol}</option>
            ))}
          </select>
          {errors.currency && (
            <p className="text-xs text-danger flex items-center gap-1"><span>⚠</span>{errors.currency.message}</p>
          )}
        </div>
      </div>

      <Button type="submit" variant="primary" size="lg" className="w-full group mt-1">
        Continuer
        <ArrowRight className="w-4 h-4 ml-1.5 group-hover:translate-x-1 transition-transform" />
      </Button>
    </form>
  )
}

/* ══════════════════════════════════════
   ÉTAPE 2 — Votre activité
══════════════════════════════════════ */
function Step2({ onNext, onBack }) {
  const [selected, setSelected] = useState('')
  const { register, handleSubmit, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(step2Schema),
  })

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">

      {/* Header */}
      <div className="text-center space-y-1.5">
        <div className="w-11 h-11 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center mx-auto">
          <Briefcase className="w-5 h-5 text-violet-500" />
        </div>
        <h3 className="font-display font-bold text-xl text-navy">Votre activité</h3>
        <p className="text-muted-500 text-[13px]">Comment décrivez-vous votre activité principale ?</p>
      </div>

      {/* Grille 2×2 */}
      <div className="grid grid-cols-2 gap-3">
        {PROFILE_TYPES.map((profile) => {
          const IconComponent = PROFILE_ICONS[profile.icon]
          const isSelected = selected === profile.value
          return (
            <button
              key={profile.value}
              type="button"
              onClick={() => {
                setSelected(profile.value)
                setValue('profile_type', profile.value, { shouldValidate: true })
              }}
              className={cn(
                'relative flex flex-col items-start gap-3 p-4 rounded-xl border text-left transition-all duration-200',
                isSelected
                  ? 'border-navy bg-navy/[0.03] shadow-sm ring-2 ring-navy/10'
                  : 'border-muted-200 bg-surface hover:border-primary-300 hover:bg-primary-50/50 hover:shadow-sm'
              )}
            >
              {/* Checkmark */}
              {isSelected && (
                <div className="absolute top-3 right-3 w-4 h-4 rounded-full bg-primary-500 flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 text-white" />
                </div>
              )}

              {/* Icône */}
              <div className={cn(
                'w-9 h-9 rounded-lg border flex items-center justify-center shrink-0',
                profile.iconBg
              )}>
                {IconComponent && (
                  <IconComponent className={cn('w-4.5 h-4.5', profile.iconColor)} size={18} />
                )}
              </div>

              {/* Texte */}
              <div>
                <p className="font-display font-bold text-sm text-navy leading-snug">{profile.label}</p>
                <p className="text-[11px] text-muted-500 mt-0.5 leading-snug">{profile.description}</p>
              </div>
            </button>
          )
        })}
      </div>

      <input type="hidden" {...register('profile_type')} />
      {errors.profile_type && (
        <p className="text-xs text-danger text-center">⚠ {errors.profile_type.message}</p>
      )}

      <div className="flex gap-3">
        <Button type="button" variant="ghost" size="lg" onClick={onBack} className="flex-1">
          <ChevronLeft className="w-4 h-4 mr-1" /> Retour
        </Button>
        <Button type="submit" variant="primary" size="lg" className="flex-1 group">
          Continuer
          <ArrowRight className="w-4 h-4 ml-1.5 group-hover:translate-x-1 transition-transform" />
        </Button>
      </div>
    </form>
  )
}

/* ══════════════════════════════════════
   ÉTAPE 3 — Choisir un plan
══════════════════════════════════════ */
function Step3({ onSubmit: onFinish, onBack, isLoading }) {
  const [packs, setPacks]           = useState([])
  const [selected, setSelected]     = useState(null)
  const [loadingPacks, setLoadingPacks] = useState(true)

  const { register, handleSubmit, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(step3Schema),
  })

  useEffect(() => {
    tenantService.getPacks()
      .then(res => {
        const activePacks = res.data.packs.filter(p => p.is_active)
        setPacks(activePacks)
        if (activePacks.length > 0) {
          setSelected(activePacks[0].id)
          setValue('pack_id', String(activePacks[0].id))
        }
      })
      .finally(() => setLoadingPacks(false))
  }, [setValue])

  if (loadingPacks) return (
    <div className="py-16 flex flex-col items-center justify-center gap-3">
      <Loader2 className="w-7 h-7 animate-spin text-primary-500" />
      <p className="text-sm text-muted-500">Chargement des offres…</p>
    </div>
  )

  return (
    <form onSubmit={handleSubmit(onFinish)} className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">

      {/* Header */}
      <div className="text-center space-y-1.5">
        <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center mx-auto">
          <Zap className="w-5 h-5 text-gold" />
        </div>
        <h3 className="font-display font-bold text-xl text-navy">Choisissez votre plan</h3>
        <p className="text-muted-500 text-[13px]">Vous pourrez changer d'offre à tout moment</p>
      </div>

      <div className="space-y-2.5 max-h-[38vh] overflow-y-auto pr-1">
        {packs.map((pack) => {
          const isSelected = selected === pack.id
          return (
            <button
              key={pack.id}
              type="button"
              onClick={() => { setSelected(pack.id); setValue('pack_id', String(pack.id)) }}
              className={cn(
                'relative w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all duration-200',
                isSelected
                  ? 'border-primary-500 bg-primary-50/40 shadow-sm ring-1 ring-primary-500/15'
                  : 'border-muted-200 bg-surface hover:border-primary-300 hover:bg-primary-50/30 hover:shadow-sm'
              )}
            >
              {/* Checkmark */}
              {isSelected && (
                <div className="absolute top-3.5 right-3.5 w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}

              {/* Infos prix */}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-1.5 mb-0.5">
                  <span className="font-display font-bold text-navy">{pack.name}</span>
                </div>
                <p className="text-[11px] text-muted-500 truncate mb-2">{pack.description}</p>
                <div className="flex items-center gap-3 text-[10px] font-bold text-muted-500">
                  <span className="flex items-center gap-1">
                    <Users size={10} />
                    {pack.limits?.users === -1 ? 'Illimité' : `${pack.limits?.users} utilisateurs`}
                  </span>
                  <span className="flex items-center gap-1">
                    <Package size={10} />
                    {pack.limits?.products === -1 ? 'Illimité' : `${pack.limits?.products} produits`}
                  </span>
                </div>
              </div>

              {/* Prix */}
              <div className="text-right shrink-0 pr-6">
                <div className="font-display font-black text-lg text-navy leading-none">
                  {Number(pack.price) === 0 ? 'Gratuit' : Number(pack.price).toLocaleString('fr-FR')}
                </div>
                {Number(pack.price) > 0 && (
                  <div className="text-[10px] text-muted-400 font-semibold mt-0.5">FCFA / mois</div>
                )}
              </div>
            </button>
          )
        })}
      </div>

      <input type="hidden" {...register('pack_id')} />
      {errors.pack_id && (
        <p className="text-xs text-danger text-center">⚠ {errors.pack_id.message}</p>
      )}

      <div className="flex gap-3">
        <Button type="button" variant="ghost" size="lg" onClick={onBack} className="flex-1">
          <ChevronLeft className="w-4 h-4 mr-1" /> Retour
        </Button>
        <Button type="submit" variant="primary" size="lg" isLoading={isLoading} className="flex-1 group">
          Confirmer
          <Check className="w-4 h-4 ml-1.5" />
        </Button>
      </div>
    </form>
  )
}

/* ══════════════════════════════════════
   EN ATTENTE D'APPROBATION
══════════════════════════════════════ */
function PendingApproval({ onLogout }) {
  return (
    <div className="text-center space-y-6 py-4 animate-in zoom-in-95 duration-500">
      <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto shadow-sm">
        <Clock className="w-8 h-8 text-amber-500 animate-pulse" />
      </div>

      <div className="space-y-2">
        <h3 className="font-display font-bold text-2xl text-navy">Demande en cours d'examen</h3>
        <p className="text-muted-500 text-sm leading-relaxed max-w-sm mx-auto">
          Votre espace a été créé. Un administrateur Qiwam doit approuver votre accès avant que vous ne puissiez vous connecter.
        </p>
      </div>

      <div className="p-4 bg-primary-50 rounded-xl border border-primary-100 flex items-start gap-3 text-left">
        <CheckCircle2 className="text-primary-500 shrink-0 mt-0.5" size={18} />
        <p className="text-xs text-primary-800 font-medium leading-relaxed">
          Vous recevrez un e-mail dès que votre accès sera activé. Cela prend généralement moins de 24 heures.
        </p>
      </div>

      <Button onClick={onLogout} variant="ghost" className="w-full text-muted-500">
        Se déconnecter et attendre
      </Button>
    </div>
  )
}

/* ══════════════════════════════════════
   WIZARD PRINCIPAL
══════════════════════════════════════ */
export default function TenantSetupWizard() {
  const [step, setStep]           = useState(1)
  const [isPending, setIsPending] = useState(false)
  const [formData, setFormData]   = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { updateTenant, logout }  = useAuthStore()
  const navigate = useNavigate()

  const handleStep1 = (data) => {
    // Normaliser le téléphone : préfixer avec l'indicatif si non déjà présent
    let phone = (data.phone ?? '').replace(/\s/g, '')
    if (phone && !phone.startsWith('+')) {
      const dc = getDialCode(data.country)
      phone = dc + phone
    }
    setFormData(p => ({ ...p, ...data, phone: phone || null }))
    setStep(2)
  }
  const handleStep2 = (data) => { setFormData(p => ({ ...p, ...data })); setStep(3) }

  const handleStep3 = async (data) => {
    setIsSubmitting(true)
    try {
      const refCode = localStorage.getItem('qiwam_ref') || null
      const res = await tenantService.create({ ...formData, ...data, referral_code: refCode })
      if (refCode) localStorage.removeItem('qiwam_ref')
      updateTenant(res.data.tenant)
      setIsPending(true)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la création.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate('/auth/login')
  }

  // Map wizard step (1-3) → global signup step (2-4)
  const globalStep = isPending ? 5 : step + 1

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Global signup progress */}
      {!isPending && <SignupProgress currentStep={globalStep} />}
      <div className="gradient-band" />

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-[480px]">

          {/* Header */}
          {!isPending && (
            <div className="text-center mb-7 space-y-4">
              <div className="flex items-center justify-center gap-2.5">
                <svg width="36" height="36" viewBox="0 0 52 52" fill="none">
                  <rect x="0"  y="0"  width="22" height="22" rx="4" fill="#3AA0D8"/>
                  <rect x="26" y="0"  width="22" height="22" rx="4" fill="#3AA0D8" opacity="0.65"/>
                  <rect x="0"  y="26" width="22" height="22" rx="4" fill="#3AA0D8" opacity="0.4"/>
                  <rect x="26" y="26" width="22" height="22" rx="4" fill="#3AA0D8" opacity="0.2"/>
                  <circle cx="48" cy="48" r="4" fill="#F0A500"/>
                </svg>
                <span className="font-display font-extrabold text-lg text-navy tracking-tight uppercase">Qiwam ERP</span>
              </div>
              <ProgressBar current={step} total={TOTAL_STEPS} />
            </div>
          )}

          {/* Carte */}
          <div className="bg-surface border border-muted-200 rounded-2xl shadow-modal p-7 animate-slide-up">
            {isPending ? (
              <PendingApproval onLogout={handleLogout} />
            ) : (
              <>
                {step === 1 && <Step1 onNext={handleStep1} />}
                {step === 2 && <Step2 onNext={handleStep2} onBack={() => setStep(1)} />}
                {step === 3 && <Step3 onSubmit={handleStep3} onBack={() => setStep(2)} isLoading={isSubmitting} />}
              </>
            )}
          </div>

          {!isPending && (
            <div className="text-center mt-5">
              <button
                onClick={handleLogout}
                className="text-[11px] font-semibold text-muted-400 hover:text-navy transition-colors uppercase tracking-widest"
              >
                Utiliser un autre compte
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
