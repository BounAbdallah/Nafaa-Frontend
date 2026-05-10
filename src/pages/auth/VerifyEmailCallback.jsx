import { useEffect, useState } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { authService } from '@/services/authService'
import Button from '@/components/ui/Button'

export default function VerifyEmailCallback() {
  const { id, hash } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState('loading') // loading | success | error

  useEffect(() => {
    const verify = async () => {
      try {
        const expires   = searchParams.get('expires')
        const signature = searchParams.get('signature')
        await authService.verifyEmail(id, hash, expires, signature)
        setStatus('success')
        setTimeout(() => navigate('/auth/login'), 3000)
      } catch {
        setStatus('error')
      }
    }
    verify()
  }, [id, hash, searchParams, navigate])

  if (status === 'loading') {
    return (
      <div className="space-y-6 text-center animate-slide-up">
        <div className="flex justify-center">
          <Loader2 className="w-12 h-12 text-primary-500 animate-spin" />
        </div>
        <div className="space-y-2">
          <h2 className="font-display font-bold text-2xl text-navy">Vérification en cours…</h2>
          <p className="text-muted-500 text-sm">Veuillez patienter quelques secondes.</p>
        </div>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className="space-y-6 text-center animate-slide-up">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-emerald-500" />
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="font-display font-bold text-2xl text-navy">E-mail vérifié !</h2>
          <p className="text-muted-500 text-sm">Votre compte est maintenant actif. Vous allez être redirigé vers la connexion…</p>
        </div>
        <Button variant="primary" size="lg" className="w-full" onClick={() => navigate('/auth/login')}>
          Se connecter
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 text-center animate-slide-up">
      <div className="flex justify-center">
        <div className="w-16 h-16 rounded-full bg-red-50 border border-red-100 flex items-center justify-center">
          <XCircle className="w-8 h-8 text-red-500" />
        </div>
      </div>
      <div className="space-y-2">
        <h2 className="font-display font-bold text-2xl text-navy">Lien invalide ou expiré</h2>
        <p className="text-muted-500 text-sm">Ce lien de vérification est expiré ou déjà utilisé.</p>
      </div>
      <Button variant="primary" size="lg" className="w-full" onClick={() => navigate('/auth/login')}>
        Retour à la connexion
      </Button>
    </div>
  )
}
