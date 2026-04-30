import { Outlet, Link } from 'react-router-dom'
import Logo from '@/components/ui/Logo'

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-bg flex">

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

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: '2 000+', label: 'Entreprises' },
                { value: '15+',    label: 'Pays' },
                { value: '99.9%',  label: 'Disponibilité' },
              ].map((s) => (
                <div key={s.label} className="bg-white/[0.06] border border-white/[0.08] rounded-card p-4 text-center">
                  <div className="font-display font-bold text-xl text-primary-300">{s.value}</div>
                  <div className="text-xs text-white/40 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Testimonial */}
            <div className="bg-white/[0.05] border border-white/[0.08] rounded-card p-5 space-y-3">
              <p className="text-white/70 text-sm italic leading-relaxed">
                "Qiwam a transformé la gestion de notre commerce. Ce qui prenait des jours ne prend plus que quelques minutes."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-xs font-display font-bold text-white shrink-0">
                  KD
                </div>
                <div>
                  <p className="text-white/80 text-sm font-medium">Kofi Diallo</p>
                  <p className="text-white/35 text-xs">Fondateur, Diallo Commerce — Abidjan</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer links */}
          <div className="flex items-center gap-4 text-xs text-white/25">
            <span>© 2026 Qiwam ERP</span>
            <span>·</span>
            <a href="#" className="hover:text-white/50 transition-colors">Confidentialité</a>
            <span>·</span>
            <a href="#" className="hover:text-white/50 transition-colors">Conditions</a>
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

    </div>
  )
}
