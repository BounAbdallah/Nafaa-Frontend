import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Lock, CheckCircle, Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { authService } from '@/services/authService'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import toast from 'react-hot-toast'

const schema = z.object({
  password:              z.string().min(8, 'Minimum 8 caractères'),
  password_confirmation: z.string(),
}).refine((d) => d.password === d.password_confirmation, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['password_confirmation'],
})

export default function ResetPassword() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [done, setDone] = useState(false)
  const [showPwd, setShowPwd] = useState(false)

  const token = searchParams.get('token') || ''
  const email = searchParams.get('email') || ''

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema) })

  const onSubmit = async (data) => {
    try {
      await authService.resetPassword({ ...data, token, email })
      setDone(true)
    } catch {
      toast.error('Lien expiré ou invalide. Demandez un nouveau lien.')
    }
  }

  if (done) {
    return (
      <div className="space-y-6 text-center animate-slide-up">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-modal bg-[#E3F5EC] flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-success" />
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="font-display font-bold text-2xl text-navy">Mot de passe modifié !</h2>
          <p className="text-muted-500 text-sm">Votre mot de passe a été réinitialisé. Vous pouvez maintenant vous connecter.</p>
        </div>
        <Link to="/auth/login">
          <Button variant="primary" size="lg" className="w-full">Se connecter</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-7 animate-slide-up">
      <div className="space-y-1">
        <h2 className="font-display font-bold text-[28px] text-navy tracking-tight">Nouveau mot de passe</h2>
        <p className="text-muted-500 text-[15px]">Choisissez un nouveau mot de passe sécurisé</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <label className="block text-sm font-display font-semibold text-navy">Nouveau mot de passe</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-500 pointer-events-none" />
            <input
              type={showPwd ? 'text' : 'password'}
              placeholder="••••••••"
              className="w-full bg-surface border border-muted-300 rounded-btn py-[10px] pl-10 pr-10 text-navy placeholder-muted-500 text-sm focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all"
              {...register('password')}
            />
            <button type="button" onClick={() => setShowPwd(!showPwd)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-500 hover:text-navy transition-colors">
              {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-danger flex gap-1"><span>⚠</span>{errors.password.message}</p>}
        </div>

        <Input
          label="Confirmer le mot de passe"
          type="password"
          placeholder="••••••••"
          icon={Lock}
          error={errors.password_confirmation?.message}
          {...register('password_confirmation')}
        />

        <Button type="submit" variant="primary" size="lg" isLoading={isSubmitting} className="w-full mt-1">
          Réinitialiser le mot de passe
        </Button>
      </form>
    </div>
  )
}
