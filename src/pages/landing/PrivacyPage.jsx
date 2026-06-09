import LegalLayout from './LegalLayout'

function Section({ title, children }) {
  return (
    <section className="mb-10">
      <h2 className="text-lg font-black text-[#0F1E30] mb-4 pb-2 border-b border-[#E8EFF5]">{title}</h2>
      <div className="space-y-3 text-[#3D5268] text-sm leading-relaxed">{children}</div>
    </section>
  )
}

export default function PrivacyPage() {
  return (
    <LegalLayout title="Politique de confidentialité">
      <p className="text-[#7A90A4] text-xs mb-8">Dernière mise à jour : juin 2026</p>

      <Section title="1. Qui sommes-nous ?">
        <p>
          Qiwam ERP est édité par <strong className="text-[#0F1E30]">Noor Web Services</strong>, société basée à Dakar, Sénégal.
          Notre application SaaS permet aux PME africaines de gérer leur activité commerciale (caisse, stock, facturation, etc.).
        </p>
        <p>Contact : <a href="mailto:contact@noorwebservice.com" className="text-[#3AA0D8] hover:underline">contact@noorwebservice.com</a></p>
      </Section>

      <Section title="2. Données collectées">
        <p>Nous collectons uniquement les données nécessaires au fonctionnement du service :</p>
        <ul className="list-disc list-inside space-y-1.5 pl-2">
          <li><strong className="text-[#0F1E30]">Données de compte :</strong> nom, adresse e-mail, mot de passe (haché), numéro de téléphone.</li>
          <li><strong className="text-[#0F1E30]">Données de l'entreprise :</strong> nom commercial, logo, adresse, NINEA, RC.</li>
          <li><strong className="text-[#0F1E30]">Données d'activité :</strong> produits, clients, ventes, dépenses, fournisseurs — saisies par vos soins.</li>
          <li><strong className="text-[#0F1E30]">Données techniques :</strong> adresse IP, navigateur, logs d'accès (à des fins de sécurité).</li>
        </ul>
      </Section>

      <Section title="3. Finalités du traitement">
        <ul className="list-disc list-inside space-y-1.5 pl-2">
          <li>Fourniture et amélioration du service Qiwam ERP</li>
          <li>Authentification et sécurité des comptes</li>
          <li>Facturation et gestion des abonnements</li>
          <li>Support technique et assistance</li>
          <li>Envoi de notifications liées au service (alertes stock, rapports)</li>
        </ul>
        <p>Nous n'utilisons pas vos données à des fins publicitaires ni ne les revendons à des tiers.</p>
      </Section>

      <Section title="4. Hébergement et transfert de données">
        <p>
          Vos données sont hébergées sur des serveurs sécurisés. Toutes les communications sont chiffrées via HTTPS/TLS.
        </p>
      </Section>

      <Section title="5. Durée de conservation">
        <p>
          Vos données sont conservées pendant la durée de votre abonnement, plus <strong className="text-[#0F1E30]">12 mois</strong> après résiliation (pour permettre la réactivation).
          Passé ce délai, elles sont supprimées de façon permanente.
        </p>
      </Section>

      <Section title="6. Vos droits">
        <p>Conformément aux lois applicables sur la protection des données, vous disposez des droits suivants :</p>
        <ul className="list-disc list-inside space-y-1.5 pl-2">
          <li><strong className="text-[#0F1E30]">Accès :</strong> obtenir une copie de vos données personnelles</li>
          <li><strong className="text-[#0F1E30]">Rectification :</strong> corriger des données inexactes</li>
          <li><strong className="text-[#0F1E30]">Suppression :</strong> demander l'effacement de vos données</li>
          <li><strong className="text-[#0F1E30]">Portabilité :</strong> exporter vos données au format CSV/JSON</li>
          <li><strong className="text-[#0F1E30]">Opposition :</strong> vous opposer à certains traitements</li>
        </ul>
        <p>Pour exercer ces droits : <a href="mailto:contact@noorwebservice.com" className="text-[#3AA0D8] hover:underline">contact@noorwebservice.com</a></p>
      </Section>

      <Section title="7. Cookies">
        <p>
          Qiwam ERP utilise uniquement des cookies strictement nécessaires au fonctionnement du service (session, authentification).
          Aucun cookie publicitaire ou de tracking tiers n'est utilisé.
        </p>
      </Section>

      <Section title="8. Modifications">
        <p>
          Cette politique peut être mise à jour. En cas de modification substantielle, vous en serez informé par e-mail ou via l'interface de l'application.
        </p>
      </Section>
    </LegalLayout>
  )
}
