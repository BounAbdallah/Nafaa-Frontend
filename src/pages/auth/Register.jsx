import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { User, Mail, Lock, Eye, EyeOff, Check } from 'lucide-react'
import { useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import toast from 'react-hot-toast'

const schema = z.object({
  name:                  z.string().min(2, 'Minimum 2 caractères'),
  email:                 z.string().email('Adresse e-mail invalide'),
  password:              z.string().min(8, 'Minimum 8 caractères'),
  password_confirmation: z.string(),
}).refine((d) => d.password === d.password_confirmation, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['password_confirmation'],
})

const checks = [
  { label: '8 caractères minimum', test: (p) => p.length >= 8 },
  { label: 'Une majuscule',         test: (p) => /[A-Z]/.test(p) },
  { label: 'Un chiffre',            test: (p) => /[0-9]/.test(p) },
]

export default function Register() {
  const navigate = useNavigate()
  const { register: registerUser } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)
  const [password, setPassword] = useState('')

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) })

  const onSubmit = async (data) => {
    try {
      await registerUser(data)
      toast.success('Compte créé ! Vérifiez votre e-mail.')
      navigate('/onboarding')
    } catch (err) {
      const apiErrors = err.response?.data?.errors
      if (apiErrors) {
        Object.entries(apiErrors).forEach(([f, msgs]) => setError(f, { message: msgs[0] }))
      } else {
        toast.error(err.response?.data?.message || 'Erreur lors de l\'inscription.')
      }
    }
  }

  return (
    <div className="space-y-7 animate-slide-up">

      <div className="space-y-1">
        <h2 className="font-display font-bold text-[28px] text-navy tracking-tight">Créer un compte</h2>
        <p className="text-muted-500 text-[15px]">Rejoignez des milliers d'entreprises africaines</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

        <Input
          label="Nom complet"
          type="text"
          placeholder="Amadou Diallo"
          icon={User}
          error={errors.name?.message}
          autoComplete="name"
          {...register('name')}
        />

        <Input
          label="Adresse e-mail"
          type="email"
          placeholder="vous@exemple.com"
          icon={Mail}
          error={errors.email?.message}
          autoComplete="email"
          {...register('email')}
        />

        {/* Password with strength */}
        <div className="space-y-1.5">
          <label className="block text-sm font-display font-semibold text-navy">Mot de passe</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-500 pointer-events-none" />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              autoComplete="new-password"
              className="w-full bg-surface border border-muted-300 rounded-btn py-[10px] pl-10 pr-10 text-navy placeholder-muted-500 text-sm focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all duration-150"
              {...register('password', { onChange: (e) => setPassword(e.target.value) })}
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-500 hover:text-navy transition-colors">
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-danger flex items-center gap-1"><span>⚠</span>{errors.password.message}</p>}

          {password.length > 0 && (
            <div className="flex gap-3 pt-1 flex-wrap">
              {checks.map((c) => (
                <div key={c.label} className="flex items-center gap-1.5">
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${c.test(password) ? 'bg-[#E3F5EC] text-success' : 'bg-muted-100 text-muted-300'}`}>
                    <Check className="w-2.5 h-2.5" />
                  </div>
                  <span className={`text-xs ${c.test(password) ? 'text-success' : 'text-muted-500'}`}>{c.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <Input
          label="Confirmer le mot de passe"
          type="password"
          placeholder="••••••••"
          icon={Lock}
          error={errors.password_confirmation?.message}
          autoComplete="new-password"
          {...register('password_confirmation')}
        />

        <Button type="submit" variant="primary" size="lg" isLoading={isSubmitting} className="w-full mt-1">
          Créer mon compte
        </Button>
      </form>

      <p className="text-center text-[12px] text-muted-500">
        En créant un compte, vous acceptez nos{' '}
        <a href="#" className="text-primary-500 hover:text-primary-700 transition-colors">Conditions d'utilisation</a>
        {' '}et notre{' '}
        <a href="#" className="text-primary-500 hover:text-primary-700 transition-colors">Politique de confidentialité</a>.
      </p>

      <p className="text-center text-sm text-muted-500">
        Déjà un compte ?{' '}
        <Link to="/auth/login" className="text-primary-500 hover:text-primary-700 font-display font-semibold transition-colors">
          Se connecter
        </Link>
      </p>
    </div>
  )
}
