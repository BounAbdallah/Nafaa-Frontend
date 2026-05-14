import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { User, Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import Button from '@/components/ui/Button'
import toast from 'react-hot-toast'

const schema = z.object({
  name:     z.string().min(2, 'Minimum 2 caractères'),
  email:    z.string().email('Adresse e-mail invalide'),
  password: z.string().min(8, 'Minimum 8 caractères'),
})

/* ── Calcule un score 0-4 pour la barre de force ── */
function getStrength(p) {
  if (!p) return 0
  let s = 0
  if (p.length >= 8)        s++
  if (p.length >= 12)       s++
  if (/[A-Z]/.test(p))      s++
  if (/[0-9]/.test(p))      s++
  if (/[^A-Za-z0-9]/.test(p)) s++
  return Math.min(s, 4)
}

const STRENGTH_META = [
  { label: 'Trop court',  color: 'bg-danger',       text: 'text-danger' },
  { label: 'Faible',      color: 'bg-orange-400',   text: 'text-orange-500' },
  { label: 'Moyen',       color: 'bg-yellow-400',   text: 'text-yellow-600' },
  { label: 'Bon',         color: 'bg-success',      text: 'text-success' },
  { label: 'Excellent',   color: 'bg-emerald-500',  text: 'text-emerald-600' },
]

export default function Register() {
  const navigate = useNavigate()
  const { register: registerUser } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)
  const [password, setPassword]         = useState('')

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) })

  const onSubmit = async (data) => {
    try {
      await registerUser({ ...data, password_confirmation: data.password })
      toast.success('Compte créé avec succès !')
      navigate('/onboarding')
    } catch (err) {
      const apiErrors = err.response?.data?.errors
      if (apiErrors) {
        Object.entries(apiErrors).forEach(([f, msgs]) => setError(f, { message: msgs[0] }))
      } else {
        toast.error(err.response?.data?.message || "Erreur lors de l'inscription.")
      }
    }
  }

  const score    = getStrength(password)
  const meta     = STRENGTH_META[score]

  return (
    <div className="space-y-6 animate-slide-up">

      {/* ── Header ── */}
      <div className="space-y-1.5">
        <h2 className="font-display font-bold text-[26px] text-navy tracking-tight leading-tight">
          Créez votre compte 🚀
        </h2>
        <p className="text-muted-500 text-[14px] leading-relaxed">
          Gratuit, sans carte bancaire. Prêt en&nbsp;2&nbsp;minutes.
        </p>
      </div>

      {/* ── Form ── */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">

        {/* Nom */}
        <div className="space-y-1">
          <label className="block text-sm font-display font-semibold text-navy">Prénom &amp; Nom</label>
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Amadou Diallo"
              autoComplete="name"
              className={`w-full bg-surface border rounded-btn py-[10px] pl-10 pr-4 text-navy placeholder-muted-400 text-sm focus:outline-none focus:ring-2 transition-all duration-150 ${
                errors.name
                  ? 'border-danger focus:border-danger focus:ring-danger/20'
                  : 'border-muted-300 focus:border-primary-500 focus:ring-primary-100'
              }`}
              {...register('name')}
            />
          </div>
          {errors.name && (
            <p className="text-xs text-danger flex items-center gap-1">
              <span>⚠</span>{errors.name.message}
            </p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-1">
          <label className="block text-sm font-display font-semibold text-navy">Adresse e-mail</label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-400 pointer-events-none" />
            <input
              type="email"
              placeholder="vous@exemple.com"
              autoComplete="email"
              className={`w-full bg-surface border rounded-btn py-[10px] pl-10 pr-4 text-navy placeholder-muted-400 text-sm focus:outline-none focus:ring-2 transition-all duration-150 ${
                errors.email
                  ? 'border-danger focus:border-danger focus:ring-danger/20'
                  : 'border-muted-300 focus:border-primary-500 focus:ring-primary-100'
              }`}
              {...register('email')}
            />
          </div>
          {errors.email && (
            <p className="text-xs text-danger flex items-center gap-1">
              <span>⚠</span>{errors.email.message}
            </p>
          )}
        </div>

        {/* Mot de passe */}
        <div className="space-y-1">
          <label className="block text-sm font-display font-semibold text-navy">Mot de passe</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-400 pointer-events-none" />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="8 caractères minimum"
              autoComplete="new-password"
              className={`w-full bg-surface border rounded-btn py-[10px] pl-10 pr-10 text-navy placeholder-muted-400 text-sm focus:outline-none focus:ring-2 transition-all duration-150 ${
                errors.password
                  ? 'border-danger focus:border-danger focus:ring-danger/20'
                  : 'border-muted-300 focus:border-primary-500 focus:ring-primary-100'
              }`}
              {...register('password', { onChange: (e) => setPassword(e.target.value) })}
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-400 hover:text-navy transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Barre de force — s'affiche dès qu'on tape */}
          {password.length > 0 && (
            <div className="space-y-1 pt-0.5">
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                      score >= i ? meta.color : 'bg-muted-200'
                    }`}
                  />
                ))}
              </div>
              <p className={`text-[11px] font-medium ${meta.text}`}>{meta.label}</p>
            </div>
          )}

          {errors.password && (
            <p className="text-xs text-danger flex items-center gap-1">
              <span>⚠</span>{errors.password.message}
            </p>
          )}
        </div>

        {/* CTA */}
        <div className="pt-1">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isSubmitting}
            className="w-full group"
          >
            <span>Créer mon compte</span>
            <ArrowRight className="w-4 h-4 ml-1.5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </form>

      {/* ── Réassurance ── */}
      <div className="flex items-center justify-center gap-2 text-[11px] text-muted-400">
        <ShieldCheck className="w-3.5 h-3.5 text-success shrink-0" />
        <span>
          Vos données sont sécurisées · En continuant, vous acceptez nos{' '}
          <a href="#" className="text-primary-500 hover:underline">CGU</a>
        </span>
      </div>

      {/* ── Lien connexion ── */}
      <p className="text-center text-sm text-muted-500 -mt-2">
        Déjà un compte ?{' '}
        <Link
          to="/auth/login"
          className="text-primary-500 hover:text-primary-700 font-display font-semibold transition-colors"
        >
          Se connecter
        </Link>
      </p>

    </div>
  )
}
