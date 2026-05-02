import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { 
  ChevronRight, 
  ChevronLeft, 
  Check, 
  Building2, 
  Briefcase, 
  Zap, 
  Clock, 
  CheckCircle2,
  Loader2
} from 'lucide-react'
import { tenantService } from '@/services/tenantService'
import { useAuthStore } from '@/store/authStore'
import { PROFILE_TYPES } from '@/utils/constants'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { cn } from '@/utils/cn'
import toast from 'react-hot-toast'

const TOTAL_STEPS = 3

const step1Schema = z.object({
  name:     z.string().min(2, 'Nom requis (2 caractères minimum)'),
  industry: z.string().min(1, 'Secteur requis'),
})
const step2Schema = z.object({ profile_type: z.string().min(1, 'Profil requis') })
const step3Schema = z.object({ pack_id: z.string().min(1, 'Pack requis') })

function StepIndicator({ current, total }) {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center text-xs font-display font-semibold transition-all duration-300',
            i + 1 < current  && 'bg-primary-500 text-white',
            i + 1 === current && 'bg-navy text-white shadow-nav',
            i + 1 > current  && 'bg-muted-100 text-muted-500 border border-muted-300',
          )}>
            {i + 1 < current ? <Check className="w-4 h-4" /> : i + 1}
          </div>
          {i < total - 1 && (
            <div className={cn('w-10 h-px transition-all duration-500', i + 1 < current ? 'bg-primary-500' : 'bg-muted-300')} />
          )}
        </div>
      ))}
    </div>
  )
}

function Step1({ onNext }) {
  const [industries, setIndustries] = useState([])
  const [selected, setSelected] = useState('')
  const { register, handleSubmit, setValue, formState: { errors } } = useForm({ resolver: zodResolver(step1Schema) })

  useEffect(() => {
    tenantService.getIndustries().then((res) => setIndustries(res.data.industries)).catch(() => {})
  }, [])

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-modal bg-primary-50 border border-primary-100 flex items-center justify-center mx-auto">
          <Building2 className="w-6 h-6 text-primary-500" />
        </div>
        <h3 className="font-display font-bold text-xl text-navy">Votre entreprise</h3>
        <p className="text-muted-500 text-sm">Parlez-nous de votre organisation</p>
      </div>

      <Input
        label="Nom de l'entreprise"
        placeholder="ex: Bakari Commerce SARL"
        error={errors.name?.message}
        {...register('name')}
      />

      <div className="space-y-1.5">
        <label className="block text-sm font-display font-semibold text-navy">Secteur d'activité</label>
        <div className="grid grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
          {industries.map((ind) => (
            <button
              key={ind.value}
              type="button"
              onClick={() => { setSelected(ind.value); setValue('industry', ind.value, { shouldValidate: true }) }}
              className={cn(
                'text-left p-3 rounded-btn border text-sm transition-all duration-150',
                selected === ind.value
                  ? 'border-primary-500 bg-primary-50 text-primary-700 font-bold'
                  : 'border-muted-300 bg-surface text-muted-700 hover:border-primary-300 hover:bg-primary-50'
              )}
            >
              {ind.label}
            </button>
          ))}
        </div>
        <input type="hidden" {...register('industry')} />
        {errors.industry && <p className="text-xs text-danger flex gap-1 mt-1"><span>⚠</span>{errors.industry.message}</p>}
      </div>

      <Button type="submit" variant="primary" size="lg" className="w-full">
        Continuer <ChevronRight className="w-4 h-4" />
      </Button>
    </form>
  )
}

function Step2({ onNext, onBack }) {
  const [selected, setSelected] = useState('')
  const { register, handleSubmit, setValue, formState: { errors } } = useForm({ resolver: zodResolver(step2Schema) })

  const profileColors = {
    manufacturer:     'bg-[#FFF3E0] border-[#FFB74D] text-[#E65100]',
    reseller:         'bg-[#E3F2FD] border-[#64B5F6] text-[#1565C0]',
    wholesaler:       'bg-[#E8F5E9] border-[#81C784] text-[#2E7D32]',
    service_provider: 'bg-primary-50 border-primary-300 text-primary-700',
  }

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-modal bg-[#F3E8FF] border border-[#DDD6FE] flex items-center justify-center mx-auto">
          <Briefcase className="w-6 h-6 text-[#7C3AED]" />
        </div>
        <h3 className="font-display font-bold text-xl text-navy">Votre activité</h3>
        <p className="text-muted-500 text-sm">Comment décrivez-vous votre activité principale ?</p>
      </div>

      <div className="space-y-2.5">
        {PROFILE_TYPES.map((profile) => (
          <button
            key={profile.value}
            type="button"
            onClick={() => { setSelected(profile.value); setValue('profile_type', profile.value, { shouldValidate: true }) }}
            className={cn(
              'w-full flex items-center gap-4 p-4 rounded-card border text-left transition-all duration-150',
              selected === profile.value
                ? 'border-navy bg-navy/[0.03] shadow-card ring-1 ring-navy/10'
                : 'border-muted-300 bg-surface hover:border-primary-300 hover:bg-primary-50'
            )}
          >
            <div className={cn('w-10 h-10 rounded-card border flex items-center justify-center text-xl shrink-0', profileColors[profile.value])}>
              {profile.icon}
            </div>
            <div className="flex-1">
              <div className="font-display font-bold text-sm text-navy">{profile.label}</div>
              <div className="text-xs text-muted-500">{profile.description}</div>
            </div>
            {selected === profile.value && (
              <div className="w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center shrink-0">
                <Check className="w-3 h-3 text-white" />
              </div>
            )}
          </button>
        ))}
      </div>

      <input type="hidden" {...register('profile_type')} />
      {errors.profile_type && <p className="text-xs text-danger text-center mt-1">⚠ {errors.profile_type.message}</p>}

      <div className="flex gap-3">
        <Button type="button" variant="ghost" size="lg" onClick={onBack} className="flex-1">
          <ChevronLeft className="w-4 h-4" /> Retour
        </Button>
        <Button type="submit" variant="primary" size="lg" className="flex-1">
          Continuer <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </form>
  )
}

function Step3({ onSubmit: onFinish, onBack, isLoading }) {
  const [packs, setPacks] = useState([])
  const [selected, setSelected] = useState(null)
  const [loadingPacks, setLoadingPacks] = useState(true)
  
  const { register, handleSubmit, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(step3Schema)
  })

  useEffect(() => {
    tenantService.getPacks()
      .then(res => {
        const activePacks = res.data.packs.filter(p => p.is_active)
        setPacks(activePacks)
        if (activePacks.length > 0) {
          const defaultPack = activePacks[0]
          setSelected(defaultPack.id)
          setValue('pack_id', String(defaultPack.id))
        }
      })
      .finally(() => setLoadingPacks(false))
  }, [setValue])

  if (loadingPacks) return (
    <div className="py-12 flex flex-col items-center justify-center gap-4">
      <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      <p className="text-sm font-sans text-muted-500">Chargement des offres...</p>
    </div>
  )

  return (
    <form onSubmit={handleSubmit(onFinish)} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-modal bg-[#FEF3CC] border border-[#F0A500]/30 flex items-center justify-center mx-auto">
          <Zap className="w-6 h-6 text-gold" />
        </div>
        <h3 className="font-display font-bold text-xl text-navy">Choisissez votre plan</h3>
        <p className="text-muted-500 text-sm">Démarrez votre transformation numérique dès aujourd'hui</p>
      </div>

      <div className="grid grid-cols-1 gap-3 max-h-[40vh] overflow-y-auto px-1">
        {packs.map((pack) => (
          <button
            key={pack.id}
            type="button"
            onClick={() => { setSelected(pack.id); setValue('pack_id', String(pack.id)) }}
            className={cn(
              'relative flex flex-col p-4 rounded-card border text-left transition-all duration-150',
              selected === pack.id
                ? 'border-primary-500 bg-primary-50/30 shadow-sm ring-1 ring-primary-500/10'
                : 'border-muted-300 bg-surface hover:border-primary-300 hover:bg-primary-50'
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-display font-bold text-navy">{pack.name}</span>
              {selected === pack.id && (
                <div className="w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
            </div>
            <div className="mb-3">
              <span className="font-display font-black text-xl text-navy">{Number(pack.price).toLocaleString()}</span>
              <span className="text-[10px] font-bold text-muted-500 uppercase tracking-widest ml-1">FCFA / mois</span>
            </div>
            <p className="text-[11px] text-muted-600 line-clamp-1 mb-2">{pack.description}</p>
            <div className="flex gap-4">
              <div className="text-[10px] font-bold text-muted-500 flex items-center gap-1">
                <Briefcase size={10} /> {pack.limits?.users === -1 ? 'Illimité' : `${pack.limits?.users} utilisateurs`}
              </div>
              <div className="text-[10px] font-bold text-muted-500 flex items-center gap-1">
                <Zap size={10} /> {pack.features?.length} modules inclus
              </div>
            </div>
          </button>
        ))}
      </div>

      <input type="hidden" {...register('pack_id')} />
      {errors.pack_id && <p className="text-xs text-danger text-center">⚠ {errors.pack_id.message}</p>}

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="ghost" size="lg" onClick={onBack} className="flex-1">
          <ChevronLeft className="w-4 h-4" /> Retour
        </Button>
        <Button type="submit" variant="primary" size="lg" isLoading={isLoading} className="flex-1">
          Confirmer <Check className="w-4 h-4" />
        </Button>
      </div>
    </form>
  )
}

function PendingApproval({ onLogout }) {
  return (
    <div className="text-center space-y-6 py-4 animate-in zoom-in-95 duration-500">
      <div className="w-20 h-20 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto shadow-sm">
        <Clock className="w-10 h-10 text-amber-500 animate-pulse" />
      </div>
      
      <div className="space-y-3">
        <h3 className="font-display font-bold text-2xl text-navy">Demande en cours d'examen</h3>
        <p className="text-muted-500 text-sm leading-relaxed max-w-sm mx-auto">
          Votre espace de travail a été créé avec succès ! 
          Un administrateur Qiwam doit maintenant approuver votre inscription avant que vous ne puissiez accéder à votre tableau de bord.
        </p>
      </div>

      <div className="p-4 bg-primary-50 rounded-card border border-primary-100 flex items-center gap-3 text-left">
        <CheckCircle2 className="text-primary-500 shrink-0" size={20} />
        <p className="text-xs text-primary-800 font-medium">
          Vous recevrez un email dès que votre accès sera activé. Cela prend généralement moins de 24 heures.
        </p>
      </div>

      <Button onClick={onLogout} variant="ghost" className="w-full text-muted-500 mt-4">
        Se déconnecter et attendre
      </Button>
    </div>
  )
}

export default function TenantSetupWizard() {
  const [step, setStep] = useState(1)
  const [isPending, setIsPending] = useState(false)
  const [formData, setFormData] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { updateTenant, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleStep1 = (data) => { setFormData((p) => ({ ...p, ...data })); setStep(2) }
  const handleStep2 = (data) => { setFormData((p) => ({ ...p, ...data })); setStep(3) }

  const handleStep3 = async (data) => {
    setIsSubmitting(true)
    try {
      const res = await tenantService.create({ ...formData, ...data })
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

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <div className="gradient-band" />

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-lg">

          {/* Header */}
          {!isPending && (
            <div className="text-center mb-8 space-y-4">
              <div className="flex items-center justify-center gap-3">
                <svg width="40" height="40" viewBox="0 0 52 52" fill="none">
                  <rect x="0"  y="0"  width="22" height="22" rx="4" fill="#3AA0D8"/>
                  <rect x="26" y="0"  width="22" height="22" rx="4" fill="#3AA0D8" opacity="0.65"/>
                  <rect x="0"  y="26" width="22" height="22" rx="4" fill="#3AA0D8" opacity="0.4"/>
                  <rect x="26" y="26" width="22" height="22" rx="4" fill="#3AA0D8" opacity="0.2"/>
                  <circle cx="48" cy="48" r="4" fill="#F0A500"/>
                </svg>
                <span className="font-display font-extrabold text-xl text-navy tracking-tight uppercase">Qiwam ERP</span>
              </div>
              <div>
                <StepIndicator current={step} total={TOTAL_STEPS} />
                <p className="text-xs text-muted-500 mt-2 font-sans font-bold uppercase tracking-widest">Étape {step} sur {TOTAL_STEPS}</p>
              </div>
            </div>
          )}

          {/* Card */}
          <div className="bg-surface border border-muted-300 rounded-modal shadow-modal p-8 animate-slide-up relative overflow-hidden">
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
            <div className="text-center mt-6">
              <button
                onClick={handleLogout}
                className="text-xs font-bold text-muted-400 hover:text-navy transition-colors uppercase tracking-widest"
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
