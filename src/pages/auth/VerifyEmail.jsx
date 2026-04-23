import { useAuthStore } from '@/store/authStore'
import { authService } from '@/services/authService'
import { Mail, RefreshCw, LogOut } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '@/components/ui/Button'
import toast from 'react-hot-toast'

export default function VerifyEmail() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [resending, setResending] = useState(false)

  const handleResend = async () => {
    setResending(true)
    try {
      await authService.resendVerification()
      toast.success('E-mail de vérification renvoyé !')
    } catch {
      toast.error('Erreur. Veuillez réessayer.')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="space-y-7 text-center animate-slide-up">

      <div className="flex justify-center">
        <div className="relative">
          <div className="w-16 h-16 rounded-modal bg-primary-50 border border-primary-100 flex items-center justify-center">
            <Mail className="w-8 h-8 text-primary-500" />
          </div>
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-gold rounded-full flex items-center justify-center shadow-sm">
            <span className="text-white text-xs font-bold">!</span>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="font-display font-bold text-2xl text-navy">Vérifiez votre e-mail</h2>
        <p className="text-muted-500 text-sm">Nous avons envoyé un lien de vérification à</p>
        <p className="text-primary-500 font-display font-semibold">{user?.email}</p>
        <p className="text-muted-500 text-sm">Cliquez sur le lien dans l'e-mail pour activer votre compte.</p>
      </div>

      <div className="bg-primary-50 border border-primary-100 rounded-card p-4 text-left space-y-1.5">
        <p className="text-xs font-display font-semibold text-navy">Vous n'avez pas reçu l'e-mail ?</p>
        <ul className="text-xs text-muted-500 space-y-1 list-disc list-inside">
          <li>Vérifiez votre dossier spam</li>
          <li>L'e-mail peut prendre quelques minutes</li>
        </ul>
      </div>

      <div className="space-y-3">
        <Button variant="primary" size="lg" isLoading={resending} onClick={handleResend} className="w-full">
          <RefreshCw className="w-4 h-4" />
          Renvoyer l'e-mail
        </Button>
        <button
          onClick={async () => { await logout(); navigate('/auth/login') }}
          className="w-full flex items-center justify-center gap-2 text-sm text-muted-500 hover:text-navy transition-colors py-2"
        >
          <LogOut className="w-4 h-4" />
          Se déconnecter
        </button>
      </div>
    </div>
  )
}
