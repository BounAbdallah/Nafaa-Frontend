import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { COUNTRIES } from '@/utils/currency'
import { PROFILE_TYPES } from '@/utils/constants'
import {
  CheckCircle, ArrowLeft, Loader2, Globe, Users, Package, HardDrive, Sparkles,
} from 'lucide-react'

function QiwamLogo() {
  return (
    <Link to="/" className="flex items-center gap-3">
      <svg width={32} height={32} viewBox="0 0 52 52" fill="none">
        <rect x="0"  y="0"  width="22" height="22" rx="4" fill="#3AA0D8"/>
        <rect x="26" y="0"  width="22" height="22" rx="4" fill="#3AA0D8" opacity=".7"/>
        <rect x="0"  y="26" width="22" height="22" rx="4" fill="#3AA0D8" opacity=".45"/>
        <rect x="26" y="26" width="22" height="22" rx="4" fill="#3AA0D8" opacity=".25"/>
        <circle cx="48" cy="48" r="4" fill="#E8A020"/>
      </svg>
      <span className="font-black text-lg tracking-tight text-[#0F1E30]">
        Qiwam <span className="text-[#3AA0D8]">ERP</span>
      </span>
    </Link>
  )
}

const PROFILE_TABS = [
  { value: '', label: 'Tous les profils' },
  ...PROFILE_TYPES.map(p => ({ value: p.value, label: p.label })),
]

const currencyLabel = (c) => (c === 'XOF' || !c ? 'FCFA' : c)

export default function PricingPage() {
  const [country, setCountry]   = useState(() => localStorage.getItem('qiwam_pricing_country') || 'SN')
  const [profile, setProfile]   = useState('')
  const [packs, setPacks]       = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    localStorage.setItem('qiwam_pricing_country', country)
    setLoading(true)
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8001/api/v1'
    const params = new URLSearchParams({ country })
    if (profile) params.set('profile_type', profile)

    fetch(`${apiUrl}/packs?${params}`)
      .then(r => r.ok ? r.json() : null)
      .then(json => setPacks((json?.data?.packs ?? []).filter(p => p.is_active)))
      .catch(() => setPacks([]))
      .finally(() => setLoading(false))
  }, [country, profile])

  const selectedCountry = COUNTRIES.find(c => c.code === country)

  return (
    <div className="min-h-screen bg-[#F4F8FB]">
      {/* Header */}
      <header className="bg-white border-b border-[#E8EFF5] sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <QiwamLogo />
          <Link to="/"
            className="flex items-center gap-2 text-sm text-[#7A90A4] hover:text-[#0F1E30] transition-colors">
            <ArrowLeft size={15}/>
            Retour au portail
          </Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 lg:py-16">
        {/* Titre */}
        <div className="text-center mb-10">
          <span className="text-[#3AA0D8] text-sm font-bold uppercase tracking-widest">Tarifs</span>
          <h1 className="text-3xl sm:text-5xl font-black text-[#0F1E30] mt-3 tracking-tight">
            Des offres adaptées à <span className="text-[#3AA0D8]">votre activité</span>
          </h1>
          <p className="text-[#7A90A4] text-lg mt-4 max-w-2xl mx-auto">
            Choisissez votre pays et votre profil pour voir les packs qui vous correspondent,
            dans votre devise. Essai gratuit, sans engagement.
          </p>
        </div>

        {/* Filtres : pays + profil */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10">
          <div className="relative">
            <Globe size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#3AA0D8]" />
            <select
              value={country}
              onChange={e => setCountry(e.target.value)}
              className="pl-9 pr-8 py-2.5 rounded-xl border border-[#E8EFF5] bg-white text-sm font-bold text-[#0F1E30] focus:border-[#3AA0D8] focus:outline-none appearance-none cursor-pointer"
            >
              {COUNTRIES.map(c => (
                <option key={c.code} value={c.code}>{c.label} ({currencyLabel(c.currency)})</option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap justify-center gap-1.5 bg-white border border-[#E8EFF5] rounded-xl p-1.5">
            {PROFILE_TABS.map(tab => (
              <button
                key={tab.value}
                onClick={() => setProfile(tab.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  profile === tab.value
                    ? 'bg-[#0F1E30] text-white'
                    : 'text-[#7A90A4] hover:text-[#0F1E30] hover:bg-[#F4F8FB]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Grille de packs */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 size={32} className="animate-spin text-[#3AA0D8]" />
          </div>
        ) : packs.length === 0 ? (
          <div className="text-center py-20">
            <Package size={40} className="mx-auto text-[#7A90A4]/40 mb-4" />
            <p className="text-[#7A90A4]">
              Aucun pack disponible pour ce profil pour le moment.
            </p>
            <Link to="/legal/contact" className="text-[#3AA0D8] font-bold text-sm hover:underline mt-2 inline-block">
              Contactez-nous pour une offre sur mesure →
            </Link>
          </div>
        ) : (
          <div className={`grid gap-6 items-start ${
            packs.length === 1 ? 'max-w-md mx-auto' :
            packs.length === 2 ? 'md:grid-cols-2 max-w-3xl mx-auto' :
            'md:grid-cols-2 lg:grid-cols-3'
          }`}>
            {packs.map((pack, i) => {
              const highlight = packs.length >= 2 && i === Math.min(1, packs.length - 1)
              return (
                <div key={pack.id}
                  className={`relative rounded-3xl p-8 transition-all ${
                    highlight
                      ? 'bg-[#0F1E30] shadow-2xl shadow-[#0F1E30]/30 lg:scale-105'
                      : 'bg-white border border-[#E8EFF5] hover:shadow-lg'
                  }`}>
                  {highlight && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#E8A020] text-[#0F1E30] text-xs font-black px-4 py-1 rounded-full whitespace-nowrap">
                      ⭐ Populaire
                    </div>
                  )}

                  <div className="mb-6">
                    <p className={`text-sm font-bold uppercase tracking-widest mb-1 ${highlight ? 'text-[#3AA0D8]' : 'text-[#7A90A4]'}`}>
                      {pack.name}
                    </p>
                    <div className="flex items-end gap-1 flex-wrap">
                      <span className={`text-4xl font-black ${highlight ? 'text-white' : 'text-[#0F1E30]'}`}>
                        {Number(pack.price) === 0 ? 'Gratuit' : Number(pack.price).toLocaleString('fr-FR')}
                      </span>
                      {Number(pack.price) > 0 && (
                        <span className={`text-sm mb-1 ${highlight ? 'text-white/50' : 'text-[#7A90A4]'}`}>
                          {currencyLabel(pack.currency)}/mois
                        </span>
                      )}
                    </div>
                    {pack.is_country_price && (
                      <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-bold bg-[#3AA0D8]/10 text-[#3AA0D8] px-2 py-0.5 rounded-full">
                        <Sparkles size={9} />Prix {selectedCountry?.label?.replace(/^\S+\s/, '') ?? country}
                      </span>
                    )}
                    {pack.description && (
                      <p className={`text-sm mt-2 ${highlight ? 'text-white/50' : 'text-[#7A90A4]'}`}>
                        {pack.description}
                      </p>
                    )}
                  </div>

                  <ul className="space-y-3 mb-8">
                    {[
                      { icon: Users,     text: pack.limits?.users === -1 ? 'Utilisateurs illimités' : `${pack.limits?.users ?? 2} utilisateur${(pack.limits?.users ?? 2) > 1 ? 's' : ''}` },
                      { icon: Package,   text: pack.limits?.products === -1 ? 'Produits illimités' : `${pack.limits?.products ?? 50} produits` },
                      { icon: HardDrive, text: `${pack.limits?.storage_gb ?? 1} GB de stockage` },
                      { icon: CheckCircle, text: `${(pack.features ?? []).length || 'Tous les'} modules inclus` },
                    ].map(({ icon: Icon, text }) => (
                      <li key={text} className="flex items-center gap-3">
                        <Icon size={15} className={highlight ? 'text-[#3AA0D8]' : 'text-[#1A7A45]'} />
                        <span className={`text-sm ${highlight ? 'text-white/80' : 'text-[#3D5268]'}`}>{text}</span>
                      </li>
                    ))}
                  </ul>

                  <Link to="/auth/register"
                    className={`block text-center font-bold py-3.5 rounded-xl text-sm transition-all ${
                      highlight
                        ? 'bg-[#3AA0D8] hover:bg-[#2d8bbf] text-white'
                        : 'bg-[#0F1E30] hover:bg-[#1a3050] text-white'
                    }`}>
                    Commencer l'essai gratuit
                  </Link>
                </div>
              )
            })}
          </div>
        )}

        {/* Note bas de page */}
        <p className="text-center text-xs text-[#7A90A4] mt-12">
          Les prix sont affichés dans la devise de votre pays. Besoin d'une offre personnalisée ?{' '}
          <Link to="/legal/contact" className="text-[#3AA0D8] font-bold hover:underline">Contactez-nous</Link>.
        </p>
      </div>
    </div>
  )
}
