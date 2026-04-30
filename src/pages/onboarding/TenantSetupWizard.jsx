import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ChevronRight, ChevronLeft, Check, Building2, Briefcase, Zap } from 'lucide-react'
import { tenantService } from '@/services/tenantService'
import { useAuthStore } from '@/store/authStore'
import { PROFILE_TYPES, PLANS } from '@/utils/constants'
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
const step3Schema = z.object({ plan: z.string().min(1, 'Plan requis') })

// ── Step indicator ──────────────────────────────────────────────────────────
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

// ── Step 1 : Entreprise ─────────────────────────────────────────────────────
function Step1({ onNext }) {
  const [industries, setIndustries] = useState([])
  const [selected, setSelected] = useState('')

  const { register, handleSubmit, setValue, formState: { errors } } = useForm({ resolver: zodResolver(step1Schema) })

  useEffect(() => {
    tenantService.getIndustries().then((res) => setIndustries(res.data.industries)).catch(() => {})
  }, [])

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-5">
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
                'text-left p-3 rounded-btn border text-sm font-[400] transition-all duration-150',
                selected === ind.value
                  ? 'border-primary-500 bg-primary-50 text-primary-700 font-medium'
                  : 'border-muted-300 bg-surface text-muted-700 hover:border-primary-300 hover:bg-primary-50'
              )}
            >
              {ind.label}
            </button>
          ))}
        </div>
        <input type="hidden" {...register('industry')} />
        {errors.industry && <p className="text-xs text-danger flex gap-1"><span>⚠</span>{errors.industry.message}</p>}
      </div>

      <Button type="submit" variant="primary" size="lg" className="w-full">
        Continuer <ChevronRight className="w-4 h-4" />
      </Button>
    </form>
  )
}

// ── Step 2 : Profil ─────────────────────────────────────────────────────────
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
    <form onSubmit={handleSubmit(onNext)} className="space-y-5">
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
                ? 'border-navy bg-navy/[0.03] shadow-card'
                : 'border-muted-300 bg-surface hover:border-primary-300 hover:bg-primary-50'
            )}
          >
            <div className={cn('w-10 h-10 rounded-card border flex items-center justify-center text-xl shrink-0', profileColors[profile.value])}>
              {profile.icon}
            </div>
            <div className="flex-1">
              <div className={cn('font-display font-semibold text-sm', selected === profile.value ? 'text-navy' : 'text-navy')}>
                {profile.label}
              </div>
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
      {errors.profile_type && <p className="text-xs text-danger text-center">⚠ {errors.profile_type.message}</p>}

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

// ── Step 3 : Plan ───────────────────────────────────────────────────────────
function Step3({ onSubmit: onFinish, onBack, isLoading }) {
  const [selected, setSelected] = useState('demarrage')
  const { register, handleSubmit, setValue } = useForm({
    resolver: zodResolver(step3Schema),
    defaultValues: { plan: 'demarrage' },
  })

  return (
    <form onSubmit={handleSubmit(onFinish)} className="space-y-5">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-modal bg-[#FEF3CC] border border-[#F0A500]/30 flex items-center justify-center mx-auto">
          <Zap className="w-6 h-6 text-gold" />
        </div>
        <h3 className="font-display font-bold text-xl text-navy">Choisissez votre plan</h3>
        <p className="text-muted-500 text-sm">Commencez gratuitement, évoluez quand vous êtes prêt</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {PLANS.map((plan) => (
          <button
            key={plan.value}
            type="button"
            onClick={() => { setSelected(plan.value); setValue('plan', plan.value) }}
            className={cn(
              'relative flex flex-col p-4 rounded-card border text-left transition-all duration-150',
              selected === plan.value
                ? 'border-navy bg-navy/[0.02] shadow-card'
                : 'border-muted-300 bg-surface hover:border-primary-300 hover:bg-primary-50'
            )}
          >
            {plan.popular && (
              <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-primary-500 text-white text-[10px] font-display font-semibold px-3 py-0.5 rounded-badge">
                Populaire
              </span>
            )}
            <div className="flex items-center justify-between mb-2">
              <span className="font-display font-bold text-navy">{plan.name}</span>
              {selected === plan.value && (
                <div className="w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
            </div>
            <div className="mb-3">
              <span className="font-display font-bold text-lg text-navy">{plan.price}</span>
              <span className="text-xs text-muted-500 ml-1">{plan.period}</span>
            </div>
            <ul className="space-y-1.5">
              {plan.features.slice(0, 3).map((f) => (
                <li key={f} className="flex items-center gap-2 text-xs text-muted-700">
                  <Check className="w-3 h-3 text-primary-500 shrink-0" />{f}
                </li>
              ))}
              {plan.features.length > 3 && (
                <li className="text-xs text-muted-500">+{plan.features.length - 3} autres...</li>
              )}
            </ul>
          </button>
        ))}
      </div>

      <input type="hidden" {...register('plan')} />

      <div className="flex gap-3">
        <Button type="button" variant="ghost" size="lg" onClick={onBack} className="flex-1">
          <ChevronLeft className="w-4 h-4" /> Retour
        </Button>
        <Button type="submit" variant="primary" size="lg" isLoading={isLoading} className="flex-1">
          Créer mon espace <Check className="w-4 h-4" />
        </Button>
      </div>
    </form>
  )
}

// ── Main wizard ─────────────────────────────────────────────────────────────
export default function TenantSetupWizard() {
  const [step, setStep] = useState(1)
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
      toast.success('Votre espace de travail est prêt !')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la création.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Top gradient band */}
      <div className="gradient-band" />

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-lg">

          {/* Header */}
          <div className="text-center mb-8 space-y-4">
            <div className="flex items-center justify-center gap-3">
              <svg width="40" height="40" viewBox="0 0 52 52" fill="none">
                <rect x="0"  y="0"  width="22" height="22" rx="4" fill="#3AA0D8"/>
                <rect x="26" y="0"  width="22" height="22" rx="4" fill="#3AA0D8" opacity="0.65"/>
                <rect x="0"  y="26" width="22" height="22" rx="4" fill="#3AA0D8" opacity="0.4"/>
                <rect x="26" y="26" width="22" height="22" rx="4" fill="#3AA0D8" opacity="0.2"/>
                <circle cx="48" cy="48" r="4" fill="#F0A500"/>
              </svg>
              <span className="font-display font-extrabold text-xl text-navy tracking-tight">QIWAM</span>
            </div>
            <div>
              <StepIndicator current={step} total={TOTAL_STEPS} />
              <p className="text-xs text-muted-500 mt-2">Étape {step} sur {TOTAL_STEPS}</p>
            </div>
          </div>

          {/* Card */}
          <div className="bg-surface border border-muted-300 rounded-modal shadow-modal p-8 animate-slide-up">
            {step === 1 && <Step1 onNext={handleStep1} />}
            {step === 2 && <Step2 onNext={handleStep2} onBack={() => setStep(1)} />}
            {step === 3 && <Step3 onSubmit={handleStep3} onBack={() => setStep(2)} isLoading={isSubmitting} />}
          </div>

          <div className="text-center mt-5">
            <button
              onClick={async () => { await logout(); navigate('/auth/login') }}
              className="text-xs text-muted-500 hover:text-muted-700 transition-colors"
            >
              Utiliser un autre compte
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
