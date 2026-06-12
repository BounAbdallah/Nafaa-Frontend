import { Outlet, Link, useLocation } from 'react-router-dom'
import Logo from '@/components/ui/Logo'
import SignupProgress from '@/components/ui/SignupProgress'
import { CheckCircle2 } from 'lucide-react'

export default function AuthLayout() {
  const location = useLocation()
  const isRegister = location.pathname === '/auth/register'

  return (
    <div className="min-h-screen bg-bg flex flex-col">

      {/* ── Signup progress banner (register only) ── */}
      {isRegister && <SignupProgress currentStep={1} />}

      {/* ── Main row ── */}
      <div className="flex flex-1">

      {/* ── Left panel — brand & social proof ── */}
      <div className="hidden lg:flex lg:w-[52%] bg-navy relative overflow-hidden flex-col">

        {/* Gradient band top */}
        <div className="gradient-band" />

        {/* Subtle background pattern */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(58,160,216,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(58,160,216,0.4) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        {/* Soft glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[480px] rounded-full bg-primary-500/10 blur-[120px] pointer-events-none" />

        <div className="relative z-10 flex flex-col justify-between p-12 h-full">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group w-fit">
            <Logo size={48} variant="dark" />
          </Link>

          {/* Hero text */}
          <div className="space-y-8 max-w-md">
            <div className="space-y-4">
              <span className="inline-block text-[11px] font-display font-semibold tracking-[0.16em] uppercase text-primary-300">
                Gestion d'entreprise
              </span>
              <h1 className="font-display font-bold text-4xl text-white leading-tight tracking-tight text-balance">
                Gérez votre activité,{' '}
                <span className="text-primary-300">simplement.</span>
              </h1>
              <p className="text-white/55 text-base leading-relaxed">
                Stock, ventes, facturation et clients réunis dans une seule plateforme conçue pour les artisans, commerçants et prestataires d'Afrique.
              </p>
            </div>

            {/* Fonctionnalités clés */}
            <div className="space-y-3">
              {[
                'Point de vente, stock et facturation',
                'Scan de codes-barres avec votre téléphone',
                'Assistant intelligent et rapports détaillés',
              ].map((text) => (
                <div key={text} className="flex items-center gap-3">
                  <CheckCircle2 size={16} className="text-primary-300 shrink-0" />
                  <p className="text-white/70 text-sm">{text}</p>
                </div>
              ))}
            </div>

            {/* Bandeau essai gratuit */}
            <p className="text-white/45 text-xs">
              <span className="font-bold text-white/80">Essai gratuit, sans engagement</span> — aucune carte bancaire requise.
            </p>
          </div>

          {/* Footer links */}
          <div className="flex items-center gap-4 text-xs text-white/25">
            <span>© 2026 Qiwam ERP</span>
            <span>·</span>
            <Link to="/legal/privacy" className="hover:text-white/50 transition-colors">Confidentialité</Link>
            <span>·</span>
            <Link to="/legal/terms" className="hover:text-white/50 transition-colors">Conditions</Link>
            <span>·</span>
            <Link to="/tarifs" className="hover:text-white/50 transition-colors">Tarifs</Link>
          </div>
        </div>
      </div>

      {/* ── Right panel — form ── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-bg">
        <div className="w-full max-w-md animate-fade-in">

          {/* Mobile logo */}
          <div className="lg:hidden mb-8 flex items-center gap-3">
            <Logo size={40} variant="light" />
          </div>

          <Outlet />
        </div>
      </div>

      </div>{/* end main row */}
    </div>
  )
}
