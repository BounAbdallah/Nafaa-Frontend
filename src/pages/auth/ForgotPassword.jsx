import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react'
import { useState } from 'react'
import { authService } from '@/services/authService'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import toast from 'react-hot-toast'

const schema = z.object({
  email: z.string().email('Adresse e-mail invalide'),
})

export default function ForgotPassword() {
  const [sent, setSent] = useState(false)
  const [sentEmail, setSentEmail] = useState('')

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema) })

  const onSubmit = async ({ email }) => {
    try {
      await authService.forgotPassword(email)
      setSentEmail(email)
      setSent(true)
    } catch {
      toast.error('Une erreur est survenue. Veuillez réessayer.')
    }
  }

  if (sent) {
    return (
      <div className="space-y-6 text-center animate-slide-up">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-modal bg-[#E3F5EC] flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-success" />
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="font-display font-bold text-2xl text-navy">E-mail envoyé !</h2>
          <p className="text-muted-500 text-sm">
            Si <span className="text-primary-500 font-medium">{sentEmail}</span> est associé à un compte,
            vous recevrez un lien de réinitialisation sous peu.
          </p>
        </div>
        <div className="bg-primary-50 border border-primary-100 rounded-card p-4 text-left space-y-2">
          <p className="text-xs font-display font-semibold text-navy">Vous n'avez pas reçu l'e-mail ?</p>
          <ul className="text-xs text-muted-500 space-y-1 list-disc list-inside">
            <li>Vérifiez votre dossier spam</li>
            <li>L'e-mail peut prendre quelques minutes</li>
            <li>Assurez-vous d'avoir utilisé le bon e-mail</li>
          </ul>
        </div>
        <div className="space-y-3">
          <Button variant="secondary" size="lg" className="w-full" onClick={() => setSent(false)}>
            Renvoyer l'e-mail
          </Button>
          <Link to="/auth/login" className="flex items-center justify-center gap-2 text-sm text-muted-500 hover:text-navy transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Retour à la connexion
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-7 animate-slide-up">
      <div className="space-y-1">
        <h2 className="font-display font-bold text-[28px] text-navy tracking-tight">Mot de passe oublié</h2>
        <p className="text-muted-500 text-[15px]">Entrez votre e-mail pour recevoir un lien de réinitialisation</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Input
          label="Adresse e-mail"
          type="email"
          placeholder="vous@exemple.com"
          icon={Mail}
          error={errors.email?.message}
          {...register('email')}
        />
        <Button type="submit" variant="primary" size="lg" isLoading={isSubmitting} className="w-full">
          Envoyer le lien
        </Button>
      </form>

      <Link to="/auth/login" className="flex items-center justify-center gap-2 text-sm text-muted-500 hover:text-navy transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Retour à la connexion
      </Link>
    </div>
  )
}
