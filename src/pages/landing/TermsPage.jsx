import LegalLayout from './LegalLayout'

function Section({ title, children }) {
  return (
    <section className="mb-10">
      <h2 className="text-lg font-black text-[#0F1E30] mb-4 pb-2 border-b border-[#E8EFF5]">{title}</h2>
      <div className="space-y-3 text-[#3D5268] text-sm leading-relaxed">{children}</div>
    </section>
  )
}

export default function TermsPage() {
  return (
    <LegalLayout title="Conditions Générales d'Utilisation">
      <p className="text-[#7A90A4] text-xs mb-8">Dernière mise à jour : juin 2026</p>

      <Section title="1. Objet">
        <p>
          Les présentes Conditions Générales d'Utilisation (CGU) régissent l'accès et l'utilisation de la plateforme
          <strong className="text-[#0F1E30]"> Qiwam ERP</strong>, éditée par <strong className="text-[#0F1E30]">Noor Web Services</strong> (ci-après "l'Éditeur"),
          par tout utilisateur (ci-après "l'Utilisateur").
        </p>
        <p>L'accès au service implique l'acceptation pleine et entière des présentes CGU.</p>
      </Section>

      <Section title="2. Description du service">
        <p>
          Qiwam ERP est une application SaaS (Software as a Service) de gestion d'entreprise destinée aux PME d'Afrique francophone,
          proposant notamment : gestion de caisse (POS), inventaire, facturation, CRM, rapports et assistant IA Waxal.
        </p>
        <p>Le service est accessible via navigateur web et application mobile (PWA).</p>
      </Section>

      <Section title="3. Accès au service">
        <p>L'accès au service nécessite la création d'un compte avec une adresse e-mail valide et un mot de passe sécurisé.</p>
        <p>L'Utilisateur est responsable de la confidentialité de ses identifiants. Tout accès effectué depuis son compte est réputé effectué par lui.</p>
        <p>L'Éditeur se réserve le droit de suspendre ou supprimer tout compte en cas de violation des présentes CGU.</p>
      </Section>

      <Section title="4. Abonnements et tarifs">
        <p>Qiwam ERP est proposé selon trois formules d'abonnement mensuel :</p>
        <ul className="list-disc list-inside space-y-1.5 pl-2">
          <li><strong className="text-[#0F1E30]">Starter :</strong> 15 000 FCFA/mois — 1 utilisateur</li>
          <li><strong className="text-[#0F1E30]">Business :</strong> 35 000 FCFA/mois — jusqu'à 5 utilisateurs</li>
          <li><strong className="text-[#0F1E30]">Pro :</strong> 65 000 FCFA/mois — utilisateurs illimités</li>
        </ul>
        <p>Une période d'essai gratuite de 14 jours est proposée sans engagement ni carte bancaire.</p>
        <p>Les tarifs peuvent évoluer. L'Utilisateur en sera informé 30 jours à l'avance.</p>
      </Section>

      <Section title="5. Obligations de l'Utilisateur">
        <p>L'Utilisateur s'engage à :</p>
        <ul className="list-disc list-inside space-y-1.5 pl-2">
          <li>Utiliser le service conformément à la législation en vigueur</li>
          <li>Ne pas tenter de contourner les mécanismes de sécurité</li>
          <li>Ne pas utiliser le service à des fins frauduleuses</li>
          <li>S'assurer de la licéité des données saisies dans l'application</li>
          <li>Informer l'Éditeur de toute utilisation non autorisée de son compte</li>
        </ul>
      </Section>

      <Section title="6. Propriété intellectuelle">
        <p>
          L'ensemble des éléments composant Qiwam ERP (logo, interface, code source, marques, textes) sont la propriété exclusive de Noor Web Services
          et sont protégés par les lois applicables sur la propriété intellectuelle.
        </p>
        <p>Les données saisies par l'Utilisateur restent sa propriété exclusive.</p>
      </Section>

      <Section title="7. Disponibilité et maintenance">
        <p>
          L'Éditeur s'engage à fournir un service disponible 24h/24, 7j/7, avec un objectif de disponibilité de 99,5%.
          Des opérations de maintenance peuvent occasionner des interruptions temporaires, planifiées si possible en heures creuses.
        </p>
      </Section>

      <Section title="8. Limitation de responsabilité">
        <p>
          L'Éditeur ne saurait être tenu responsable des dommages indirects résultant de l'utilisation du service,
          notamment les pertes de données, interruptions d'activité ou manque à gagner.
        </p>
        <p>
          La responsabilité de l'Éditeur est en tout état de cause limitée au montant des sommes versées par l'Utilisateur
          au cours des 3 derniers mois.
        </p>
      </Section>

      <Section title="9. Résiliation">
        <p>
          L'Utilisateur peut résilier son abonnement à tout moment depuis son espace de paramètres.
          La résiliation prend effet à la fin de la période d'abonnement en cours.
        </p>
        <p>
          En cas de résiliation, les données de l'Utilisateur sont conservées 12 mois puis définitivement supprimées.
          L'export des données reste possible avant suppression.
        </p>
      </Section>

      <Section title="10. Droit applicable">
        <p>
          Les présentes CGU sont soumises au droit sénégalais. En cas de litige, les parties rechercheront en priorité
          une solution amiable. À défaut, les tribunaux compétents de Dakar seront saisis.
        </p>
      </Section>
    </LegalLayout>
  )
}
