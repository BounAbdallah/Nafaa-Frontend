import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import toast from 'react-hot-toast'

const schema = z.object({
  email:    z.string().email('Adresse e-mail invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
})

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) })

  const onSubmit = async (data) => {
    try {
      const user = await login(data)
      toast.success(`Bienvenue, ${user.name.split(' ')[0]} !`)
      if (user.roles?.includes('super_admin')) navigate('/admin/dashboard')
      else navigate(user.tenant_id ? '/dashboard' : '/onboarding')
    } catch (err) {
      const apiErrors = err.response?.data?.errors
      if (apiErrors?.email) {
        setError('email', { message: apiErrors.email[0] })
      } else {
        toast.error(err.response?.data?.message || 'Identifiants incorrects.')
      }
    }
  }

  return (
    <div className="space-y-7 animate-slide-up">

      {/* Header */}
      <div className="space-y-1">
        <h2 className="font-display font-bold text-[28px] text-navy tracking-tight">Bon retour 👋</h2>
        <p className="text-muted-500 text-[15px]">Connectez-vous à votre espace Qiwam</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

        <Input
          label="Adresse e-mail"
          type="email"
          placeholder="vous@exemple.com"
          icon={Mail}
          error={errors.email?.message}
          autoComplete="email"
          {...register('email')}
        />

        <div className="space-y-1.5">
          <label className="block text-sm font-display font-semibold text-navy">Mot de passe</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-500 pointer-events-none" />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              autoComplete="current-password"
              className="w-full bg-surface border border-muted-300 rounded-btn py-[10px] pl-10 pr-10 text-navy placeholder-muted-500 text-sm focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all duration-150"
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-500 hover:text-navy transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-danger flex items-center gap-1"><span>⚠</span>{errors.password.message}</p>}
        </div>

        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center gap-2 cursor-pointer group">
            <input type="checkbox" className="w-4 h-4 rounded accent-primary-500 cursor-pointer" />
            <span className="text-sm text-muted-700">Se souvenir de moi</span>
          </label>
          <Link to="/auth/forgot-password" className="text-sm text-primary-500 hover:text-primary-700 font-medium transition-colors">
            Mot de passe oublié ?
          </Link>
        </div>

        <Button type="submit" variant="primary" size="lg" isLoading={isSubmitting} className="w-full mt-1">
          Se connecter
        </Button>
      </form>

      {/* Divider */}
      <div className="divider-row !my-0">
        <div className="divider-line" />
        <span className="divider-text">ou continuer avec</span>
        <div className="divider-line" />
      </div>

      {/* Social */}
      <div className="grid grid-cols-2 gap-3">
        {[{ name: 'Google', emoji: '🔵' }, { name: 'Facebook', emoji: '📘' }].map((p) => (
          <button
            key={p.name}
            type="button"
            className="flex items-center justify-center gap-2 py-[10px] rounded-btn border border-muted-300 bg-surface hover:bg-muted-100 text-navy text-sm font-display font-medium transition-all duration-150"
          >
            <span>{p.emoji}</span>{p.name}
          </button>
        ))}
      </div>

      <p className="text-center text-sm text-muted-500">
        Pas encore de compte ?{' '}
        <Link to="/auth/register" className="text-primary-500 hover:text-primary-700 font-display font-semibold transition-colors">
          Créer un compte
        </Link>
      </p>
    </div>
  )
}
