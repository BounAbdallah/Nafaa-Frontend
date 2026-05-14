import { useCallback } from 'react'
import { useAuthStore } from '@/store/authStore'

export const CURRENCIES = [
  { code: 'XOF', label: 'Franc CFA Ouest-Africain (FCFA)', symbol: 'FCFA', locale: 'fr-FR', decimals: 0 },
  { code: 'XAF', label: 'Franc CFA Afrique Centrale (FCFA)', symbol: 'FCFA', locale: 'fr-FR', decimals: 0 },
  { code: 'GNF', label: 'Franc Guinéen (FG)', symbol: 'FG', locale: 'fr-FR', decimals: 0 },
  { code: 'GMD', label: 'Dalasi gambien (D)', symbol: 'D', locale: 'en-GM', decimals: 2 },
  { code: 'MRU', label: 'Ouguiya mauritanien (MRU)', symbol: 'MRU', locale: 'fr-FR', decimals: 2 },
  { code: 'MAD', label: 'Dirham marocain (MAD)', symbol: 'MAD', locale: 'fr-MA', decimals: 2 },
  { code: 'DZD', label: 'Dinar algérien (DZD)', symbol: 'DZD', locale: 'fr-DZ', decimals: 2 },
  { code: 'TND', label: 'Dinar tunisien (TND)', symbol: 'TND', locale: 'fr-TN', decimals: 3 },
  { code: 'NGN', label: 'Naira nigérian (₦)', symbol: '₦', locale: 'en-NG', decimals: 2 },
  { code: 'GHS', label: 'Cedi ghanéen (GH₵)', symbol: 'GH₵', locale: 'en-GH', decimals: 2 },
  { code: 'EUR', label: 'Euro (€)', symbol: '€', locale: 'fr-FR', decimals: 2 },
  { code: 'USD', label: 'Dollar américain ($)', symbol: '$', locale: 'en-US', decimals: 2 },
  { code: 'GBP', label: 'Livre sterling (£)', symbol: '£', locale: 'en-GB', decimals: 2 },
]

export const COUNTRIES = [
  { code: 'SN', label: '🇸🇳 Sénégal',              currency: 'XOF', dialCode: '+221' },
  { code: 'ML', label: '🇲🇱 Mali',                  currency: 'XOF', dialCode: '+223' },
  { code: 'CI', label: "🇨🇮 Côte d'Ivoire",         currency: 'XOF', dialCode: '+225' },
  { code: 'GN', label: '🇬🇳 Guinée',                currency: 'GNF', dialCode: '+224' },
  { code: 'BF', label: '🇧🇫 Burkina Faso',          currency: 'XOF', dialCode: '+226' },
  { code: 'BJ', label: '🇧🇯 Bénin',                 currency: 'XOF', dialCode: '+229' },
  { code: 'TG', label: '🇹🇬 Togo',                  currency: 'XOF', dialCode: '+228' },
  { code: 'NE', label: '🇳🇪 Niger',                 currency: 'XOF', dialCode: '+227' },
  { code: 'MR', label: '🇲🇷 Mauritanie',            currency: 'MRU', dialCode: '+222' },
  { code: 'GM', label: '🇬🇲 Gambie',                currency: 'GMD', dialCode: '+220' },
  { code: 'GW', label: '🇬🇼 Guinée-Bissau',         currency: 'XOF', dialCode: '+245' },
  { code: 'CV', label: '🇨🇻 Cap-Vert',              currency: 'CVE', dialCode: '+238' },
  { code: 'CM', label: '🇨🇲 Cameroun',              currency: 'XAF', dialCode: '+237' },
  { code: 'GA', label: '🇬🇦 Gabon',                 currency: 'XAF', dialCode: '+241' },
  { code: 'CG', label: '🇨🇬 Congo',                 currency: 'XAF', dialCode: '+242' },
  { code: 'CD', label: '🇨🇩 RD Congo',              currency: 'CDF', dialCode: '+243' },
  { code: 'TD', label: '🇹🇩 Tchad',                 currency: 'XAF', dialCode: '+235' },
  { code: 'CF', label: '🇨🇫 Rép. Centrafricaine',   currency: 'XAF', dialCode: '+236' },
  { code: 'GQ', label: '🇬🇶 Guinée Équatoriale',    currency: 'XAF', dialCode: '+240' },
  { code: 'MA', label: '🇲🇦 Maroc',                 currency: 'MAD', dialCode: '+212' },
  { code: 'DZ', label: '🇩🇿 Algérie',               currency: 'DZD', dialCode: '+213' },
  { code: 'TN', label: '🇹🇳 Tunisie',               currency: 'TND', dialCode: '+216' },
  { code: 'NG', label: '🇳🇬 Nigeria',               currency: 'NGN', dialCode: '+234' },
  { code: 'GH', label: '🇬🇭 Ghana',                 currency: 'GHS', dialCode: '+233' },
  { code: 'FR', label: '🇫🇷 France',                currency: 'EUR', dialCode: '+33'  },
  { code: 'BE', label: '🇧🇪 Belgique',              currency: 'EUR', dialCode: '+32'  },
  { code: 'CH', label: '🇨🇭 Suisse',                currency: 'CHF', dialCode: '+41'  },
  { code: 'US', label: '🇺🇸 États-Unis',            currency: 'USD', dialCode: '+1'   },
  { code: 'GB', label: '🇬🇧 Royaume-Uni',           currency: 'GBP', dialCode: '+44'  },
]

export function getDialCode(countryCode) {
  return COUNTRIES.find(c => c.code === countryCode)?.dialCode ?? ''
}

/**
 * Formate un montant selon la devise passée.
 * Fonction pure — utilisable en dehors des composants React.
 */
export function formatCurrency(amount, currency = 'XOF') {
  const cfg = CURRENCIES.find(c => c.code === currency) ?? CURRENCIES[0]
  const formatted = new Intl.NumberFormat(cfg.locale, {
    minimumFractionDigits: cfg.decimals,
    maximumFractionDigits: cfg.decimals,
  }).format(amount ?? 0)
  return formatted + ' ' + cfg.symbol
}

export function getCurrencySymbol(currency = 'XOF') {
  return CURRENCIES.find(c => c.code === currency)?.symbol ?? 'FCFA'
}

/**
 * Hook React — retourne la fonction de formatage liée au tenant courant.
 * Sélecteur précis : ne se re-rend que si la devise change (pas à chaque
 * modification du store entier).
 */
export function useCurrency() {
  // Sélecteur ciblé → re-render uniquement quand settings.currency change
  const currency = useAuthStore(
    s => s.user?.tenant?.settings?.currency ?? 'XOF'
  )

  // format est stable tant que currency ne change pas
  const format = useCallback(
    (n) => formatCurrency(n, currency),
    [currency]
  )

  return {
    currency,
    symbol: getCurrencySymbol(currency),
    format,
  }
}
