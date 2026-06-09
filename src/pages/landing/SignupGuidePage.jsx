import { Link, useSearchParams } from 'react-router-dom'
import { useEffect } from 'react'
import {
  UserPlus, Building2, Layers, Rocket,
  CheckCircle, ArrowRight, ChevronRight,
  ShieldCheck, Clock, CreditCard, Zap,
} from 'lucide-react'
import Logo from '@/components/ui/Logo'

const STEPS = [
  {
    number: 1,
    icon: UserPlus,
    color: '#3AA0D8',
    bg: '#3AA0D8',
    title: 'Créez votre compte',
    duration: '1 min',
    desc: 'Renseignez votre prénom, adresse e-mail et choisissez un mot de passe sécurisé. C\'est tout — aucune carte bancaire requise.',
    details: ['Nom complet', 'Adresse e-mail', 'Mot de passe sécurisé'],
  },
  {
    number: 2,
    icon: Building2,
    color: '#1A7A45',
    bg: '#1A7A45',
    title: 'Configurez votre entreprise',
    duration: '2 min',
    desc: 'Donnez un nom à votre espace de travail, choisissez votre secteur d\'activité, pays et devise. Ces informations apparaîtront sur vos factures.',
    details: ['Nom de l\'entreprise', 'Secteur d\'activité', 'Pays & devise'],
  },
  {
    number: 3,
    icon: Layers,
    color: '#9B59B6',
    bg: '#9B59B6',
    title: 'Choisissez votre profil',
    duration: '30 sec',
    desc: 'Sélectionnez le profil qui correspond à votre activité : commerce, artisan, prestataire de services ou entrepôt. Qiwam adapte les modules affichés.',
    details: ['Commerce / Boutique', 'Artisan / Production', 'Prestataire de services'],
  },
  {
    number: 4,
    icon: CreditCard,
    color: '#E8A020',
    bg: '#E8A020',
    title: 'Activez votre plan',
    duration: '1 min',
    desc: 'Choisissez le pack adapté à vos besoins. Vous démarrez avec 30 jours gratuits — votre espace est actif immédiatement après validation.',
    details: ['30 jours offerts', 'Plan personnalisable', 'Activation immédiate'],
  },
]

function StepCard({ step, isLast }) {
  const Icon = step.icon
  return (
    <div className="flex gap-4 sm:gap-6">
      {/* Timeline */}
      <div className="flex flex-col items-center">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg"
          style={{ background: step.bg }}
        >
          <Icon size={20} className="text-white" />
        </div>
        {!isLast && (
          <div className="w-0.5 flex-1 mt-3" style={{ background: `${step.color}30` }} />
        )}
      </div>

      {/* Content */}
      <div className={`flex-1 ${isLast ? '' : 'pb-10'}`}>
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span
            className="text-xs font-black uppercase tracking-widest"
            style={{ color: step.color }}
          >
            Étape {step.number}
          </span>
          <span className="flex items-center gap-1 text-[10px] text-[#7A90A4] bg-[#F4F8FB] px-2 py-0.5 rounded-full">
            <Clock size={10} /> {step.duration}
          </span>
        </div>

        <h3 className="text-lg font-black text-[#0F1E30] mb-2">{step.title}</h3>
        <p className="text-[#7A90A4] text-sm leading-relaxed mb-4">{step.desc}</p>

        <div className="flex flex-wrap gap-2">
          {step.details.map(d => (
            <span
              key={d}
              className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border"
              style={{ color: step.color, borderColor: `${step.color}30`, background: `${step.color}08` }}
            >
              <CheckCircle size={10} />
              {d}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function SignupGuidePage() {
  const [searchParams] = useSearchParams()

  // Stocker le code ambassadeur s'il est présent dans l'URL
  useEffect(() => {
    const ref = searchParams.get('ref')
    if (ref) localStorage.setItem('qiwam_ref', ref)
  }, [searchParams])

  const refCode = searchParams.get('ref') || localStorage.getItem('qiwam_ref')

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-[#E8EFF5]">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <Logo size={32} />
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/auth/login" className="text-sm text-[#7A90A4] hover:text-[#0F1E30] font-medium transition-colors">
              Déjà un compte ?
            </Link>
            <Link
              to={refCode ? `/auth/register?ref=${refCode}` : '/auth/register'}
              className="inline-flex items-center gap-2 bg-[#0F1E30] hover:bg-[#1a3050] text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors"
            >
              Commencer <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-16">
        <div className="grid lg:grid-cols-2 gap-16 items-start">

          {/* Left — Hero + Steps */}
          <div>
            {/* Hero */}
            <div className="mb-12">
              <span className="inline-block text-xs font-black uppercase tracking-widest text-[#3AA0D8] mb-4">
                Guide d'inscription
              </span>
              <h1 className="text-4xl sm:text-5xl font-black text-[#0F1E30] leading-tight tracking-tight mb-4">
                Votre commerce en ligne<br />
                <span className="text-[#3AA0D8]">en 4 étapes simples.</span>
              </h1>
              <p className="text-[#7A90A4] text-lg leading-relaxed">
                Suivez ce guide pas à pas. De la création de compte jusqu'à votre tableau de bord opérationnel — moins de 5 minutes au total.
              </p>

              {/* Badges */}
              <div className="flex flex-wrap gap-3 mt-6">
                {[
                  { icon: Clock,       text: '~5 minutes' },
                  { icon: ShieldCheck, text: 'Sans carte bancaire' },
                  { icon: Zap,         text: '30 jours gratuits' },
                ].map(b => (
                  <div key={b.text} className="flex items-center gap-1.5 text-xs text-[#3D5268] bg-[#F4F8FB] border border-[#E8EFF5] px-3 py-1.5 rounded-full">
                    <b.icon size={12} className="text-[#3AA0D8]" />
                    {b.text}
                  </div>
                ))}
              </div>
            </div>

            {/* Steps */}
            <div>
              {STEPS.map((step, i) => (
                <StepCard key={step.number} step={step} isLast={i === STEPS.length - 1} />
              ))}
            </div>

            {/* Done */}
            <div className="mt-6 flex items-center gap-4 bg-[#0F1E30] rounded-2xl px-6 py-5">
              <div className="w-12 h-12 rounded-2xl bg-[#3AA0D8] flex items-center justify-center shrink-0">
                <Rocket size={20} className="text-white" />
              </div>
              <div>
                <p className="font-black text-white text-sm">Votre tableau de bord est prêt !</p>
                <p className="text-white/50 text-xs mt-0.5">Commencez à gérer vos ventes, stock et clients immédiatement.</p>
              </div>
            </div>
          </div>

          {/* Right — Sticky CTA card */}
          <div className="lg:sticky lg:top-24">
            <div className="bg-[#F4F8FB] border border-[#E8EFF5] rounded-3xl p-8 space-y-6">
              <div>
                <h2 className="text-xl font-black text-[#0F1E30] mb-2">Prêt à démarrer ?</h2>
                <p className="text-[#7A90A4] text-sm leading-relaxed">
                  Créez votre compte maintenant et suivez le guide pas à pas. Aucune information de paiement requise pour commencer.
                </p>
              </div>

              {/* Progress preview */}
              <div className="space-y-2">
                {STEPS.map(step => (
                  <div key={step.number} className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 border border-[#E8EFF5]">
                    <div
                      className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 text-white text-[10px] font-black"
                      style={{ background: step.bg }}
                    >
                      {step.number}
                    </div>
                    <span className="text-sm font-medium text-[#0F1E30] flex-1">{step.title}</span>
                    <span className="text-[10px] text-[#7A90A4]">{step.duration}</span>
                  </div>
                ))}
                <div className="flex items-center gap-3 bg-[#0F1E30] rounded-xl px-4 py-3">
                  <div className="w-6 h-6 rounded-lg bg-[#3AA0D8] flex items-center justify-center shrink-0">
                    <CheckCircle size={12} className="text-white" />
                  </div>
                  <span className="text-sm font-medium text-white flex-1">Tableau de bord actif</span>
                  <Rocket size={12} className="text-[#3AA0D8]" />
                </div>
              </div>

              <Link
                to={refCode ? `/auth/register?ref=${refCode}` : '/auth/register'}
                className="flex items-center justify-center gap-2 w-full bg-[#3AA0D8] hover:bg-[#2d8bbf] text-white font-black text-base py-4 rounded-2xl transition-colors shadow-lg shadow-[#3AA0D8]/20"
              >
                Commencer l'inscription <ArrowRight size={18} />
              </Link>

              <div className="flex items-center gap-2 justify-center">
                <ShieldCheck size={13} className="text-[#1A7A45]" />
                <p className="text-[11px] text-[#7A90A4] text-center">
                  Données sécurisées · Essai 30 jours · Sans engagement
                </p>
              </div>

              <div className="border-t border-[#E8EFF5] pt-4 text-center">
                <p className="text-xs text-[#7A90A4]">
                  Déjà inscrit ?{' '}
                  <Link to="/auth/login" className="text-[#3AA0D8] font-bold hover:underline">
                    Se connecter
                  </Link>
                </p>
              </div>
            </div>

            {/* FAQ rapide */}
            <div className="mt-6 space-y-3">
              {[
                { q: 'Faut-il une carte bancaire ?', a: 'Non. Les 30 premiers jours sont entièrement gratuits, sans aucune information de paiement.' },
                { q: 'Combien de temps pour tout configurer ?', a: 'Moins de 5 minutes. Le guide vous accompagne à chaque étape.' },
                { q: 'Puis-je changer de plan après ?', a: 'Oui, à tout moment depuis vos paramètres, sans frais ni engagement.' },
              ].map(f => (
                <div key={f.q} className="bg-white border border-[#E8EFF5] rounded-2xl px-5 py-4">
                  <p className="text-xs font-black text-[#0F1E30] mb-1">{f.q}</p>
                  <p className="text-xs text-[#7A90A4] leading-relaxed">{f.a}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Footer minimal */}
      <footer className="border-t border-[#E8EFF5] py-6 mt-8">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-[#7A90A4]">© 2026 Qiwam ERP · Noor Web Services</p>
          <div className="flex gap-4">
            <Link to="/legal/privacy" className="text-xs text-[#7A90A4] hover:text-[#3AA0D8]">Confidentialité</Link>
            <Link to="/legal/terms"   className="text-xs text-[#7A90A4] hover:text-[#3AA0D8]">CGU</Link>
            <Link to="/legal/contact" className="text-xs text-[#7A90A4] hover:text-[#3AA0D8]">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
