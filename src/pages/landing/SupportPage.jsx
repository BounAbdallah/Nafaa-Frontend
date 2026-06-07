import { useState } from 'react'
import { Link } from 'react-router-dom'
import LegalLayout from './LegalLayout'
import { ChevronDown, ChevronUp, MessageCircle, BookOpen, Zap, Mail } from 'lucide-react'

const faqs = [
  {
    q: 'Comment démarrer avec Qiwam ERP ?',
    a: 'Créez votre compte sur la page d\'accueil, configurez votre espace de travail (nom du commerce, logo, informations), puis commencez à ajouter vos produits et à enregistrer vos ventes. Le processus prend moins de 10 minutes.',
  },
  {
    q: 'L\'application fonctionne-t-elle sans connexion Internet ?',
    a: 'Oui. Qiwam ERP est une PWA (Progressive Web App) installable sur votre téléphone ou ordinateur. Une fois installée et les données chargées, vous pouvez travailler hors ligne. Les données se synchronisent automatiquement dès le retour de la connexion.',
  },
  {
    q: 'Comment installer l\'application sur mon téléphone ?',
    a: 'Sur Android (Chrome) : appuyez sur les trois points en haut à droite → "Ajouter à l\'écran d\'accueil". Sur iOS (Safari) : appuyez sur le bouton Partager → "Sur l\'écran d\'accueil". L\'app apparaît ensuite comme une application native.',
  },
  {
    q: 'Qu\'est-ce que l\'IA Waxal et comment l\'utiliser ?',
    a: 'Waxal est l\'assistant IA intégré à Qiwam ERP, capable de comprendre le Wolof et le français. Vous pouvez lui poser des questions sur votre stock, vos ventes, ou lui demander de créer des produits et des dépenses par la voix ou en texte.',
  },
  {
    q: 'Comment exporter mes données ?',
    a: 'Dans la section Rapports, vous pouvez exporter vos ventes, produits et clients au format CSV ou Excel. Pour un export complet, contactez notre support à support@qiwam.sn.',
  },
  {
    q: 'Puis-je avoir plusieurs utilisateurs sur un même compte ?',
    a: 'Oui. Le plan Starter inclut 1 utilisateur, Business jusqu\'à 5, et Pro un nombre illimité. Chaque utilisateur peut avoir un rôle différent (admin, caissier, manager) avec des permissions spécifiques.',
  },
  {
    q: 'Comment changer mon abonnement ou annuler ?',
    a: 'Rendez-vous dans Paramètres → Abonnement. Vous pouvez upgrader, downgrader ou annuler à tout moment. L\'annulation prend effet à la fin de la période en cours. Vos données sont conservées 12 mois.',
  },
  {
    q: 'Mes données sont-elles sécurisées ?',
    a: 'Vos données sont chiffrées en transit (HTTPS/TLS) et au repos. Chaque espace de travail est isolé. Nous n\'avons pas accès à vos données de vente ni à vos informations clients. Voir notre politique de confidentialité pour plus de détails.',
  },
]

function FAQ({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-[#E8EFF5] rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-[#F4F8FB] transition-colors"
      >
        <span className="font-bold text-[#0F1E30] text-sm pr-4">{q}</span>
        {open
          ? <ChevronUp size={16} className="text-[#3AA0D8] shrink-0"/>
          : <ChevronDown size={16} className="text-[#7A90A4] shrink-0"/>
        }
      </button>
      {open && (
        <div className="px-5 pb-5 text-sm text-[#3D5268] leading-relaxed border-t border-[#E8EFF5] pt-4">
          {a}
        </div>
      )}
    </div>
  )
}

function QuickCard({ icon: Icon, title, desc, action, href, color }) {
  return (
    <div className="p-6 bg-[#F4F8FB] border border-[#E8EFF5] rounded-2xl hover:border-[#3AA0D8]/30 hover:bg-white transition-all">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
           style={{ background: `${color}15` }}>
        <Icon size={18} style={{ color }}/>
      </div>
      <h3 className="font-black text-[#0F1E30] text-sm mb-1">{title}</h3>
      <p className="text-[#7A90A4] text-xs leading-relaxed mb-4">{desc}</p>
      {href.startsWith('http') || href.startsWith('mailto') ? (
        <a href={href}
           className="inline-flex items-center gap-1.5 text-xs font-bold text-[#3AA0D8] hover:underline">
          {action} →
        </a>
      ) : (
        <Link to={href}
           className="inline-flex items-center gap-1.5 text-xs font-bold text-[#3AA0D8] hover:underline">
          {action} →
        </Link>
      )}
    </div>
  )
}

export default function SupportPage() {
  return (
    <LegalLayout title="Support & Aide">
      <p className="text-[#7A90A4] text-sm mb-10 -mt-2">
        Trouvez rapidement une réponse à votre question ou contactez notre équipe.
      </p>

      {/* Quick access cards */}
      <div className="grid sm:grid-cols-3 gap-4 mb-12">
        <QuickCard
          icon={MessageCircle}
          title="Chat en direct"
          desc="Discutez avec notre équipe en temps réel pendant les heures de bureau."
          action="Ouvrir le chat"
          href="mailto:support@qiwam.sn"
          color="#3AA0D8"
        />
        <QuickCard
          icon={Mail}
          title="Email support"
          desc="Réponse garantie sous 24h ouvrées. Idéal pour les questions complexes."
          action="Envoyer un email"
          href="mailto:support@qiwam.sn"
          color="#1A7A45"
        />
        <QuickCard
          icon={BookOpen}
          title="Nous contacter"
          desc="Formulaire de contact pour toute demande générale ou commerciale."
          action="Formulaire contact"
          href="/legal/contact"
          color="#E8A020"
        />
      </div>

      {/* Status banner */}
      <div className="flex items-center gap-3 bg-green-50 border border-green-100 rounded-xl px-5 py-4 mb-10">
        <span className="w-2.5 h-2.5 bg-[#1A7A45] rounded-full animate-pulse shrink-0"/>
        <div>
          <p className="text-sm font-bold text-[#1A7A45]">Tous les systèmes opérationnels</p>
          <p className="text-xs text-green-600 mt-0.5">Dernière vérification : il y a 2 minutes · Disponibilité 99.8% ce mois</p>
        </div>
      </div>

      {/* FAQ */}
      <div>
        <h2 className="text-lg font-black text-[#0F1E30] mb-6 pb-2 border-b border-[#E8EFF5]">
          Questions fréquentes
        </h2>
        <div className="space-y-3">
          {faqs.map(f => <FAQ key={f.q} q={f.q} a={f.a} />)}
        </div>
      </div>

      <div className="mt-10 p-6 bg-[#0F1E30] rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="text-white font-bold text-sm">Vous n'avez pas trouvé votre réponse ?</p>
          <p className="text-white/50 text-xs mt-0.5">Notre équipe répond en Français et en Wolof.</p>
        </div>
        <a href="mailto:support@qiwam.sn"
           className="shrink-0 inline-flex items-center gap-2 bg-[#3AA0D8] hover:bg-[#2d8bbf] text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors">
          <Mail size={14}/> Contacter le support
        </a>
      </div>
    </LegalLayout>
  )
}
