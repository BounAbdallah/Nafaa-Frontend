import { useState, useEffect, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  ShoppingCart, Users, Package, TrendingUp, FileText,
  Truck, DollarSign, BarChart2, Cpu, Shield,
  CheckCircle, ChevronRight, Menu, X, Star,
  Zap, Globe, Smartphone, ArrowRight, Play,
  MessageCircle, Lock, RefreshCw,
  Mic, FileBarChart2, FileInput,
  PiggyBank as PiggyBankIcon, Tag as TagIcon,
} from 'lucide-react'

/* ─────────────────────────── Logo SVG ─────────────────────────── */
function QiwamLogo({ size = 36, dark = false }) {
  const c = dark ? '#3AA0D8' : '#3AA0D8'
  return (
    <div className="flex items-center gap-3">
      <svg width={size} height={size} viewBox="0 0 52 52" fill="none">
        <rect x="0"  y="0"  width="22" height="22" rx="4" fill={c}/>
        <rect x="26" y="0"  width="22" height="22" rx="4" fill={c} opacity=".7"/>
        <rect x="0"  y="26" width="22" height="22" rx="4" fill={c} opacity=".45"/>
        <rect x="26" y="26" width="22" height="22" rx="4" fill={c} opacity=".25"/>
        <circle cx="48" cy="48" r="4" fill="#E8A020"/>
      </svg>
      <span className={`font-black text-xl tracking-tight ${dark ? 'text-white' : 'text-[#0F1E30]'}`}>
        Qiwam <span className="text-[#3AA0D8]">ERP</span>
      </span>
    </div>
  )
}

/* ─────────────────────────── Navbar ─────────────────────────── */
function Navbar() {
  const [open, setOpen]       = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [searchParams] = useSearchParams()

  // Capture le code parrainage depuis l'URL (ex: /?ref=ABC123)
  useEffect(() => {
    const ref = searchParams.get('ref')
    if (ref) localStorage.setItem('qiwam_ref', ref)
  }, [])

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  const links = [
    { label: 'Fonctionnalités', href: '#features' },
    { label: 'Modules',         href: '#modules'  },
    { label: 'Tarifs',          href: '#pricing'  },
    { label: 'Assistant IA',        href: '#ai'       },
  ]

  return (
    <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-[#0F1E30]/95 backdrop-blur-md shadow-lg shadow-black/20' : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <QiwamLogo dark />

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          {links.map(l => (
            <a key={l.label} href={l.href}
               className="text-white/70 hover:text-white text-sm font-medium transition-colors">
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Link to="/auth/login"
            className="text-white/70 hover:text-white text-sm font-medium transition-colors px-4 py-2">
            Connexion
          </Link>
          <Link to="/inscription"
            className="bg-[#3AA0D8] hover:bg-[#2d8bbf] text-white text-sm font-bold px-5 py-2 rounded-xl transition-colors">
            Essai gratuit →
          </Link>
        </div>

        {/* Mobile burger */}
        <button onClick={() => setOpen(o => !o)} className="md:hidden text-white p-2">
          {open ? <X size={22}/> : <Menu size={22}/>}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-[#0F1E30] border-t border-white/10 px-6 py-4 space-y-3">
          {links.map(l => (
            <a key={l.label} href={l.href} onClick={() => setOpen(false)}
               className="block text-white/70 hover:text-white py-2 text-sm font-medium">
              {l.label}
            </a>
          ))}
          <Link to="/inscription"
            className="block bg-[#3AA0D8] text-white text-sm font-bold px-5 py-3 rounded-xl text-center mt-2">
            Essai gratuit →
          </Link>
        </div>
      )}
    </header>
  )
}

/* ─────────────────────────── Hero ─────────────────────────── */
function Hero() {
  return (
    <section className="relative min-h-screen bg-[#0F1E30] flex items-center overflow-hidden pt-16">
      {/* Grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(58,160,216,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(58,160,216,0.04)_1px,transparent_1px)] bg-[size:48px_48px]" />

      {/* Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#3AA0D8]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-[#E8A020]/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-0">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* Left */}
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 bg-[#3AA0D8]/10 border border-[#3AA0D8]/20 rounded-full px-4 py-2">
              <span className="w-2 h-2 bg-[#3AA0D8] rounded-full animate-pulse"/>
              <span className="text-[#3AA0D8] text-xs font-bold tracking-wide uppercase">
                Votre commerce en poche
              </span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white leading-[1.05] tracking-tight">
              Gérez votre
              <br/>
              <span className="text-[#3AA0D8]">commerce</span>
              <br/>
              simplement.
            </h1>

            <p className="text-white/60 text-lg leading-relaxed max-w-lg">
              Caisse, stock, factures, fournisseurs — tout ce dont votre commerce a besoin, dans une seule application simple et rapide.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/inscription"
                className="inline-flex items-center justify-center gap-2 bg-[#3AA0D8] hover:bg-[#2d8bbf] text-white font-bold px-8 py-4 rounded-2xl text-base transition-all hover:shadow-lg hover:shadow-[#3AA0D8]/25 hover:-translate-y-0.5">
                Démarrer gratuitement
                <ArrowRight size={18}/>
              </Link>
              <a href="#features"
                className="inline-flex items-center justify-center gap-2 border border-white/15 hover:border-white/30 text-white/70 hover:text-white font-medium px-8 py-4 rounded-2xl text-base transition-all">
                <Play size={16} className="text-[#E8A020]"/>
                Voir la démo
              </a>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 pt-4 border-t border-white/10">
              {[
                { v: '100%', l: 'Cloud & Offline' },
                { v: 'IA', l: 'Assistant intégré' },
                { v: 'PWA', l: 'Installable mobile' },
              ].map(s => (
                <div key={s.l}>
                  <div className="text-2xl font-black text-white">{s.v}</div>
                  <div className="text-xs text-white/40 mt-0.5">{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — Dashboard mockup */}
          <div className="relative hidden lg:block">
            <div className="relative">
              {/* Outer glow ring */}
              <div className="absolute -inset-4 bg-gradient-to-br from-[#3AA0D8]/20 to-[#E8A020]/10 rounded-3xl blur-2xl"/>

              {/* App window */}
              <div className="relative bg-[#0F1E30] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                {/* Window bar */}
                <div className="bg-[#0a1624] px-4 py-3 flex items-center gap-2 border-b border-white/10">
                  <span className="w-3 h-3 rounded-full bg-red-400/70"/>
                  <span className="w-3 h-3 rounded-full bg-yellow-400/70"/>
                  <span className="w-3 h-3 rounded-full bg-green-400/70"/>
                  <div className="flex-1 mx-4 bg-white/5 rounded-lg h-6 flex items-center px-3">
                    <span className="text-white/30 text-[11px]">app.qiwam.sn</span>
                  </div>
                </div>

                {/* Dashboard UI */}
                <div className="p-5 space-y-4">
                  {/* KPI row */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Ventes du jour', value: '847 500', unit: 'FCFA', color: '#3AA0D8', up: '+12%' },
                      { label: 'Commandes',      value: '24',       unit: 'cmd',  color: '#E8A020', up: '+3'   },
                      { label: 'Stock',          value: '1 284',    unit: 'art',  color: '#1A7A45', up: 'OK'   },
                    ].map(k => (
                      <div key={k.label} className="bg-white/[0.04] border border-white/[0.06] rounded-xl p-3">
                        <p className="text-white/40 text-[10px] mb-1">{k.label}</p>
                        <p className="text-white font-black text-base">{k.value}</p>
                        <p className="text-white/30 text-[10px]">{k.unit}</p>
                        <span className="text-[10px] font-bold" style={{ color: k.color }}>{k.up}</span>
                      </div>
                    ))}
                  </div>

                  {/* Chart mock */}
                  <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
                    <p className="text-white/50 text-xs mb-3">Chiffre d'affaires — 7 derniers jours</p>
                    <div className="flex items-end gap-2 h-16">
                      {[45, 72, 55, 88, 63, 95, 80].map((h, i) => (
                        <div key={i} className="flex-1 rounded-t-md transition-all"
                             style={{ height: `${h}%`, background: i === 5 ? '#3AA0D8' : `rgba(58,160,216,${0.15 + i*0.05})` }}/>
                      ))}
                    </div>
                    <div className="flex justify-between mt-2">
                      {['L','M','M','J','V','S','D'].map(d => (
                        <span key={d} className="text-white/20 text-[10px] flex-1 text-center">{d}</span>
                      ))}
                    </div>
                  </div>

                  {/* Recent orders */}
                  <div className="space-y-2">
                    {[
                      { ref: 'ORD-20260607-A1B2', client: 'Aminata Diallo', amt: '125 000', ok: true  },
                      { ref: 'ORD-20260607-C3D4', client: 'Modou Faye',     amt:  '87 500', ok: true  },
                      { ref: 'ORD-20260607-E5F6', client: 'Client de passage', amt: '34 000', ok: false },
                    ].map(o => (
                      <div key={o.ref} className="flex items-center justify-between bg-white/[0.03] border border-white/[0.05] rounded-xl px-3 py-2.5">
                        <div>
                          <p className="text-white text-xs font-bold">{o.ref}</p>
                          <p className="text-white/40 text-[10px]">{o.client}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-white text-xs font-black">{o.amt} F</p>
                          <span className={`text-[10px] font-bold ${o.ok ? 'text-green-400' : 'text-orange-400'}`}>
                            {o.ok ? '✓ Payée' : '⏳ En attente'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Floating badges */}
              <div className="absolute -right-6 top-16 bg-[#1A7A45] text-white text-xs font-bold px-3 py-2 rounded-xl shadow-xl flex items-center gap-2 animate-bounce" style={{animationDuration:'3s'}}>
                <CheckCircle size={13}/> Vente enregistrée !
              </div>
              <div className="absolute -left-6 bottom-20 bg-[#3AA0D8] text-white text-xs font-bold px-3 py-2 rounded-xl shadow-xl flex items-center gap-2">
                <Zap size={13}/> PWA installable
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/30">
        <span className="text-xs">Découvrir</span>
        <div className="w-px h-8 bg-gradient-to-b from-white/20 to-transparent"/>
      </div>
    </section>
  )
}

/* ─────────────────────────── Features ─────────────────────────── */
function Features() {
  const feats = [
    { icon: Smartphone, title: 'Mobile & PWA',        desc: 'Installez l\'app sur votre téléphone. Fonctionne hors ligne, synchronisation automatique au retour du réseau.',        color: '#3AA0D8' },
    { icon: Zap,        title: 'Ultra rapide',         desc: 'Interface fluide optimisée pour les connexions lentes. Chaque action est immédiate, même sur 3G.',                     color: '#E8A020' },
    { icon: Shield,     title: 'Sécurisé',             desc: 'Données chiffrées, isolation par espace de travail, authentification sécurisée. Vos données vous appartiennent.',     color: '#1A7A45' },
    { icon: Globe,      title: 'Multi-langue',         desc: 'Interface en français, assistant IA intégré. Conçu pour l\'entrepreneur.',                                            color: '#9B59B6' },
    { icon: RefreshCw,  title: 'Sync temps réel',      desc: 'Plusieurs caissiers, un seul stock. Toutes vos ventes se synchronisent en temps réel entre tous les appareils.',      color: '#E05A2B' },
    { icon: BarChart2,  title: 'Rapports détaillés',   desc: 'Tableau de bord, CA, marges, bénéfice net, valorisation du stock. Toutes vos données en un coup d\'œil.',           color: '#3AA0D8' },
  ]

  return (
    <section id="features" className="py-24 bg-[#F4F8FB]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="text-[#3AA0D8] text-sm font-bold uppercase tracking-widest">Pourquoi Qiwam ?</span>
          <h2 className="text-4xl sm:text-5xl font-black text-[#0F1E30] mt-3 tracking-tight">
            Conçu pour <span className="text-[#3AA0D8]">votre réalité</span>
          </h2>
          <p className="text-[#7A90A4] text-lg mt-4 max-w-2xl mx-auto">
            Un ERP qui comprend les défis des entrepreneurs africains : coupures réseau, paiements mobiles, langues locales.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {feats.map(f => (
            <div key={f.title}
                 className="group bg-white border border-[#E8EFF5] rounded-2xl p-6 hover:shadow-xl hover:shadow-[#0F1E30]/5 hover:-translate-y-1 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                   style={{ background: `${f.color}15` }}>
                <f.icon size={22} style={{ color: f.color }}/>
              </div>
              <h3 className="font-black text-[#0F1E30] text-base mb-2">{f.title}</h3>
              <p className="text-[#7A90A4] text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────── Modules ─────────────────────────── */
function Modules() {
  const mods = [
    { icon: ShoppingCart, label: 'POS & Caisse',           desc: 'Vente rapide, reçus, Wave, Orange Money, espèces',            color: '#3AA0D8' },
    { icon: Package,      label: 'Stock & Inventaire',     desc: 'Alertes rupture, mouvements, valorisation',                   color: '#E8A020' },
    { icon: Users,        label: 'Clients & CRM',          desc: 'Fiches, historique, meilleurs clients',                       color: '#1A7A45' },
    { icon: Truck,        label: 'Fournisseurs',            desc: 'Bons de commande, réception, suivi',                         color: '#9B59B6' },
    { icon: DollarSign,   label: 'Dépenses',                desc: 'Catégorisation, rapports mensuels',                          color: '#E05A2B' },
    { icon: TrendingUp,   label: 'Rapports & BI',          desc: 'CA, marges, bénéfice net, export PDF/Excel',                 color: '#3AA0D8' },
    { icon: FileText,     label: 'Prestateur',              desc: 'Devis, factures pro, suivi paiements',                       color: '#E8A020' },
    { icon: Cpu,          label: 'Production (BOM)',        desc: 'Recettes, fabrication, matières premières',                  color: '#1A7A45' },
    { icon: Shield,       label: 'Admin multi-tenant',      desc: 'Gestion abonnements, équipes, permissions',                  color: '#7A90A4' },
    { icon: BarChart2,    label: 'Comptabilité SYSCOHADA', desc: 'Journal, grand livre, balance, bilan, compte de résultat',   color: '#3AA0D8', isNew: true },
    { icon: PiggyBankIcon,label: 'Avance & Crédit client', desc: 'Vente à crédit, dépôt d'avance, suivi des ardoises',        color: '#1A7A45', isNew: true },
    { icon: TagIcon,      label: 'Prix flexible & Remises', desc: 'Prix minimal par produit, remise % ou montant par commande', color: '#E8A020', isNew: true },
  ]

  return (
    <section id="modules" className="py-24 bg-[#0F1E30] relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(58,160,216,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(58,160,216,0.03)_1px,transparent_1px)] bg-[size:48px_48px]"/>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#3AA0D8]/8 blur-[80px] pointer-events-none"/>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="text-[#3AA0D8] text-sm font-bold uppercase tracking-widest">Modules intégrés</span>
          <h2 className="text-4xl sm:text-5xl font-black text-white mt-3 tracking-tight">
            Tout ce dont vous <span className="text-[#3AA0D8]">avez besoin</span>
          </h2>
          <p className="text-white/50 text-lg mt-4 max-w-xl mx-auto">
            Chaque module communique avec les autres. Une vente met à jour le stock, les rapports et la caisse automatiquement.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {mods.map(m => (
            <div key={m.label}
                 className={`group relative flex items-start gap-4 bg-white/[0.04] hover:bg-white/[0.07] border rounded-2xl p-5 transition-all duration-200 cursor-default ${
                   m.isNew
                     ? 'border-[#3AA0D8]/30 hover:border-[#3AA0D8]/60 shadow-[0_0_16px_rgba(58,160,216,0.08)]'
                     : 'border-white/[0.07] hover:border-white/15'
                 }`}>
              {m.isNew && (
                <span className="absolute -top-2.5 right-4 flex items-center gap-1 bg-[#3AA0D8] text-white text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full shadow-lg">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping absolute left-1.5" />
                  <span className="w-1.5 h-1.5 rounded-full bg-white relative" />
                  Nouveau
                </span>
              )}
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                   style={{ background: `${m.color}20` }}>
                <m.icon size={18} style={{ color: m.color }}/>
              </div>
              <div>
                <h3 className="text-white font-bold text-sm mb-1">{m.label}</h3>
                <p className="text-white/40 text-xs leading-relaxed">{m.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────── AI Section ─────────────────────────── */
function AISection() {
  const [msg, setMsg] = useState(0)
  const msgs = [
    { text: '"Quel est mon chiffre d\'affaires aujourd\'hui ?"' },
    { text: '"Combien de produits sont en rupture de stock ?"' },
    { text: '"Ajoute un produit : Savon de marseille, 500 FCFA"' },
  ]

  useEffect(() => {
    const t = setInterval(() => setMsg(m => (m + 1) % msgs.length), 3000)
    return () => clearInterval(t)
  }, [])

  return (
    <section id="ai" className="py-24 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* Left — Chat mockup */}
          <div className="relative">
            <div className="bg-[#0F1E30] rounded-3xl p-6 shadow-2xl">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#3AA0D8] to-[#1A7A45] flex items-center justify-center">
                  <MessageCircle size={18} className="text-white"/>
                </div>
                <div>
                  <p className="text-white font-bold text-sm">Assistant IA</p>
                  <p className="text-[#3AA0D8] text-xs">● En ligne · Assistant IA</p>
                </div>
              </div>

              <div className="space-y-4 min-h-[200px]">
                <div className="flex justify-end">
                  <div className="bg-[#3AA0D8] text-white text-sm px-4 py-3 rounded-2xl rounded-tr-sm max-w-[80%] transition-all duration-500">
                      {msgs[msg].text}
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="bg-white/[0.07] border border-white/10 text-white text-sm px-4 py-3 rounded-2xl rounded-tl-sm max-w-[85%]">
                    <p className="text-[10px] text-[#3AA0D8] mb-1">Assistant IA</p>
                    Aujourd'hui vous avez réalisé <strong className="text-[#E8A020]">847 500 FCFA</strong> de ventes sur <strong>24 commandes</strong>. Votre meilleur article : <em>Riz 25kg</em> × 18 unités.
                  </div>
                </div>
                <div className="flex justify-end">
                  <div className="bg-[#3AA0D8]/20 border border-[#3AA0D8]/30 text-white/60 text-sm px-4 py-3 rounded-2xl rounded-tr-sm">
                    <span className="italic">"Ajoute un produit : Savon Kirène, 500 FCFA"</span>
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="bg-white/[0.07] border border-white/10 text-white text-sm px-4 py-3 rounded-2xl rounded-tl-sm">
                    <p className="text-[10px] text-[#3AA0D8] mb-1">Assistant IA</p>
                    ✅ Produit <strong>"Savon Kirène"</strong> créé à <strong className="text-[#E8A020]">500 FCFA</strong>.
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                <span className="text-white/30 text-sm flex-1">Tapez votre question…</span>
                <div className="w-8 h-8 rounded-full bg-[#3AA0D8] flex items-center justify-center">
                  <MessageCircle size={14} className="text-white"/>
                </div>
              </div>
            </div>

          </div>

          {/* Right */}
          <div className="space-y-6">
            <span className="text-[#3AA0D8] text-sm font-bold uppercase tracking-widest">Assistant IA intégré</span>
            <h2 className="text-4xl sm:text-5xl font-black text-[#0F1E30] leading-tight tracking-tight">
              Votre assistant<br/>
              <span className="text-[#3AA0D8]">intelligent.</span>
            </h2>
            <p className="text-[#7A90A4] text-lg leading-relaxed">
              Posez vos questions en français. Créez des produits, interrogez votre stock, obtenez vos chiffres — sans naviguer dans les menus.
            </p>

            <div className="space-y-4">
              {[
                { icon: Mic,          color: '#3AA0D8', title: 'Commandes vocales',   desc: 'Créez produits, dépenses, clients par la voix' },
                { icon: FileBarChart2, color: '#1A7A45', title: 'Interrogation rapide', desc: 'Demandez votre CA, stock, marges instantanément' },
                { icon: FileInput,     color: '#E8A020', title: 'Import intelligent',   desc: 'Importez vos catalogues CSV/XLSX automatiquement' },
              ].map(f => {
                const Icon = f.icon
                return (
                <div key={f.title} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${f.color}15` }}>
                    <Icon size={18} style={{ color: f.color }} />
                  </div>
                  <div>
                    <p className="font-bold text-[#0F1E30] text-sm">{f.title}</p>
                    <p className="text-[#7A90A4] text-sm mt-0.5">{f.desc}</p>
                  </div>
                </div>
              )})}
            </div>

            <Link to="/inscription"
              className="inline-flex items-center gap-2 bg-[#0F1E30] hover:bg-[#1a3050] text-white font-bold px-6 py-3.5 rounded-xl text-sm transition-colors">
              Essayer gratuitement <ArrowRight size={16}/>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────── Pricing ─────────────────────────── */
function Pricing() {
  const [apiPacks, setApiPacks] = useState(null)

  // Charger les vrais packs depuis l'API (fallback : plans statiques)
  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8001/api/v1'
    fetch(`${apiUrl}/packs`)
      .then(r => r.ok ? r.json() : null)
      .then(json => {
        const packs = (json?.data?.packs ?? []).filter(p => p.is_active).slice(0, 3)
        if (packs.length > 0) setApiPacks(packs)
      })
      .catch(() => {})
  }, [])

  const staticPlans = [
    {
      name: 'Starter',
      price: '12 500',
      period: '/mois',
      desc: 'Pour les petits commerces',
      highlight: false,
      features: [
        'POS & Caisse',
        'Gestion du stock',
        '1 utilisateur',
        'Rapports basiques',
        'Support email',
      ],
    },
    {
      name: 'Business',
      price: 'Sur mesure',
      period: '',
      desc: 'Pour les PME en croissance',
      highlight: true,
      badge: '⭐ Populaire',
      features: [
        'Tout Starter +',
        'Clients & CRM',
        'Fournisseurs & BDC',
        'Assistant IA intégré',
        'Plusieurs utilisateurs',
        'Rapports avancés',
        'Support prioritaire',
      ],
    },
    {
      name: 'Pro',
      price: 'Sur mesure',
      period: '',
      desc: 'Pour les entreprises établies',
      highlight: false,
      features: [
        'Tout Business +',
        'Module Production (BOM)',
        'Module Prestateur',
        'Utilisateurs illimités',
        'Multi-points de vente',
        'API & intégrations',
        'Support dédié 24/7',
      ],
    },
  ]

  const plans = apiPacks
    ? apiPacks.map((pack, i) => ({
        name: pack.name,
        price: Number(pack.price) === 0 ? 'Gratuit' : Number(pack.price).toLocaleString('fr-FR'),
        period: Number(pack.price) > 0 ? '/mois' : '',
        currency: pack.currency === 'XOF' || !pack.currency ? 'FCFA' : pack.currency,
        desc: pack.description ?? '',
        highlight: i === 1,
        badge: i === 1 ? '⭐ Populaire' : undefined,
        features: [
          pack.limits?.users === -1 ? 'Utilisateurs illimités' : `${pack.limits?.users ?? 2} utilisateur${(pack.limits?.users ?? 2) > 1 ? 's' : ''}`,
          pack.limits?.products === -1 ? 'Produits illimités' : `${pack.limits?.products ?? 50} produits`,
          `${pack.limits?.storage_gb ?? 1} GB de stockage`,
          `${(pack.features ?? []).length || 'Tous les'} modules inclus`,
          'Support Qiwam',
        ],
      }))
    : staticPlans

  return (
    <section id="pricing" className="py-24 bg-[#F4F8FB]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="text-[#3AA0D8] text-sm font-bold uppercase tracking-widest">Tarifs</span>
          <h2 className="text-4xl sm:text-5xl font-black text-[#0F1E30] mt-3 tracking-tight">
            Simple et <span className="text-[#3AA0D8]">transparent</span>
          </h2>
          <p className="text-[#7A90A4] text-lg mt-4">
            À partir de <strong className="text-[#0F1E30]">12 500 FCFA/mois</strong>. Plans personnalisables selon vos besoins, essai gratuit 30 jours sans engagements.
          </p>
          <Link to="/tarifs"
            className="inline-flex items-center gap-2 mt-5 text-sm font-bold text-[#3AA0D8] hover:text-[#2d8bbf] transition-colors">
            Voir tous les tarifs par pays et par profil
            <ArrowRight size={15} />
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-6 items-start">
          {plans.map(p => (
            <div key={p.name}
                 className={`relative rounded-3xl p-8 transition-all ${
                   p.highlight
                     ? 'bg-[#0F1E30] shadow-2xl shadow-[#0F1E30]/30 scale-105'
                     : 'bg-white border border-[#E8EFF5] hover:shadow-lg'
                 }`}>
              {p.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#E8A020] text-[#0F1E30] text-xs font-black px-4 py-1 rounded-full whitespace-nowrap">
                  {p.badge}
                </div>
              )}

              <div className="mb-6">
                <p className={`text-sm font-bold uppercase tracking-widest mb-1 ${p.highlight ? 'text-[#3AA0D8]' : 'text-[#7A90A4]'}`}>
                  {p.name}
                </p>
                <div className="flex items-end gap-1">
                  <span className={`text-4xl font-black ${p.highlight ? 'text-white' : 'text-[#0F1E30]'}`}>
                    {p.price}
                  </span>
                  {p.period && (
                    <span className={`text-sm mb-1 ${p.highlight ? 'text-white/50' : 'text-[#7A90A4]'}`}>
                      {p.currency ?? 'FCFA'}{p.period}
                    </span>
                  )}
                </div>
                <p className={`text-sm mt-1 ${p.highlight ? 'text-white/50' : 'text-[#7A90A4]'}`}>{p.desc}</p>
              </div>

              <ul className="space-y-3 mb-8">
                {p.features.map(f => (
                  <li key={f} className="flex items-center gap-3">
                    <CheckCircle size={15} className={p.highlight ? 'text-[#3AA0D8]' : 'text-[#1A7A45]'} />
                    <span className={`text-sm ${p.highlight ? 'text-white/80' : 'text-[#3D5268]'}`}>{f}</span>
                  </li>
                ))}
              </ul>

              <Link to="/inscription"
                className={`block text-center font-bold py-3.5 rounded-xl text-sm transition-all ${
                  p.highlight
                    ? 'bg-[#3AA0D8] hover:bg-[#2d8bbf] text-white'
                    : 'bg-[#0F1E30] hover:bg-[#1a3050] text-white'
                }`}>
                Commencer →
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────── CTA ─────────────────────────── */
function CTA() {
  return (
    <section className="py-24 bg-[#0F1E30] relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(58,160,216,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(58,160,216,0.05)_1px,transparent_1px)] bg-[size:48px_48px]"/>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-[#3AA0D8]/10 blur-[100px] rounded-full pointer-events-none"/>

      <div className="relative max-w-3xl mx-auto px-4 text-center space-y-8">
        <h2 className="text-4xl sm:text-5xl font-black text-white leading-tight tracking-tight">
          Prêt à moderniser<br/>
          <span className="text-[#3AA0D8]">votre gestion ?</span>
        </h2>
        <p className="text-white/60 text-lg">
          Rejoignez les commerçants qui gèrent leur activité avec Qiwam ERP. 30 jours gratuits, sans engagement.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/inscription"
            className="inline-flex items-center justify-center gap-2 bg-[#3AA0D8] hover:bg-[#2d8bbf] text-white font-bold px-10 py-4 rounded-2xl text-base transition-all hover:shadow-lg hover:shadow-[#3AA0D8]/30 hover:-translate-y-0.5">
            Démarrer gratuitement <ArrowRight size={18}/>
          </Link>
        </div>
        <p className="text-white/30 text-sm">Aucune carte bancaire requise · Annulation à tout moment</p>
      </div>
    </section>
  )
}

/* ─────────────────────────── Footer ─────────────────────────── */
function Footer() {
  return (
    <footer className="bg-[#080f1a] py-12 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          <div className="lg:col-span-2 space-y-4">
            <QiwamLogo dark />
            <p className="text-white/40 text-sm leading-relaxed max-w-xs">
              Le système de gestion ERP SaaS conçu pour les PME d'Afrique francophone. Dakar, Sénégal.
            </p>
            <p className="text-white/25 text-xs">Noor Web Services · Dakar, Sénégal</p>
          </div>

          <div>
            <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-4">Produit</p>
            <ul className="space-y-2">
              {['Fonctionnalités', 'Modules', 'Tarifs', 'Assistant IA', 'PWA Mobile'].map(l => (
                <li key={l}><a href="#" className="text-white/40 hover:text-white/70 text-sm transition-colors">{l}</a></li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-4">Légal</p>
            <ul className="space-y-2">
              {[
                { label: 'Confidentialité', path: '/legal/privacy' },
                { label: 'CGU',             path: '/legal/terms'   },
                { label: 'Contact',         path: '/legal/contact' },
                { label: 'Support',         path: '/legal/support' },
              ].map(l => (
                <li key={l.label}>
                  <Link to={l.path} className="text-white/40 hover:text-white/70 text-sm transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-white/25 text-xs">© 2026 Qiwam ERP · Noor Web Services. Tous droits réservés.</p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-[#1A7A45] rounded-full animate-pulse"/>
            <span className="text-white/25 text-xs">Tous les systèmes opérationnels</span>
          </div>
        </div>
      </div>
    </footer>
  )
}

/* ─────────────────────────── Page ─────────────────────────── */
export default function LandingPage() {
  return (
    <div className="antialiased">
      <Navbar />
      <Hero />
      <Features />
      <Modules />
      <AISection />
      <Pricing />
      <CTA />
      <Footer />
    </div>
  )
}
