/**
 * MODULE PERMISSIONS — Source de vérité unique pour les accès par profil.
 *
 * Chaque clé correspond à un `profile_type` de Tenant.
 * Les valeurs sont les identifiants de modules autorisés.
 *
 * Pour ajouter un nouveau profil ou changer les droits, modifier ce fichier.
 */

export const MODULE_IDS = {
  DASHBOARD:       'dashboard',
  POS:             'pos',
  PRODUCTS:        'products',
  CUSTOMERS:       'customers',
  ORDERS:          'orders',
  SUPPLIERS:       'suppliers',
  PURCHASE_ORDERS: 'purchase-orders',
  EXPENSES:        'expenses',
  REPORTS:         'reports',
  TEAM:            'team',
  SETTINGS:        'settings',
}

// ─── Matrice par profile_type ────────────────────────────────────────────────

const FULL_ACCESS = Object.values(MODULE_IDS)

export const MODULE_PERMISSIONS = {
  /**
   * Fabricant / Artisan
   * Accès complet : vente + production (fournisseurs, commandes fournisseurs, dépenses)
   */
  manufacturer: FULL_ACCESS,

  /**
   * Revendeur (Vendeur)
   * Outils de vente uniquement — pas de fabrication/approvisionnement
   */
  reseller: [
    MODULE_IDS.DASHBOARD,
    MODULE_IDS.POS,
    MODULE_IDS.PRODUCTS,
    MODULE_IDS.CUSTOMERS,
    MODULE_IDS.ORDERS,
    MODULE_IDS.SUPPLIERS,
    MODULE_IDS.PURCHASE_ORDERS,
    MODULE_IDS.EXPENSES,
    MODULE_IDS.REPORTS,
    MODULE_IDS.TEAM,
    MODULE_IDS.SETTINGS,
  ],

  /**
   * Grossiste / Semi-grossiste
   * Vente en volume — accès similaire au revendeur
   */
  wholesaler: [
    MODULE_IDS.DASHBOARD,
    MODULE_IDS.POS,
    MODULE_IDS.PRODUCTS,
    MODULE_IDS.CUSTOMERS,
    MODULE_IDS.ORDERS,
    MODULE_IDS.SUPPLIERS,
    MODULE_IDS.PURCHASE_ORDERS,
    MODULE_IDS.EXPENSES,
    MODULE_IDS.REPORTS,
    MODULE_IDS.TEAM,
    MODULE_IDS.SETTINGS,
  ],

  /**
   * Prestataire de services
   * Pas de POS ni stock — gestion client et facturation
   */
  service_provider: [
    MODULE_IDS.DASHBOARD,
    MODULE_IDS.PRODUCTS,
    MODULE_IDS.CUSTOMERS,
    MODULE_IDS.ORDERS,
    MODULE_IDS.EXPENSES,
    MODULE_IDS.REPORTS,
    MODULE_IDS.TEAM,
    MODULE_IDS.SETTINGS,
  ],
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Retourne la liste des modules autorisés pour un profil donné.
 * Si le profil est inconnu, retourne l'accès complet par sécurité.
 */
export function getAllowedModules(profileType) {
  return MODULE_PERMISSIONS[profileType] ?? FULL_ACCESS
}

/**
 * Vérifie si un module est accessible pour un profil donné.
 */
export function canAccessModule(profileType, moduleId) {
  return getAllowedModules(profileType).includes(moduleId)
}

/**
 * Métadonnées lisibles pour l'UI admin (badges, labels).
 */
export const PROFILE_META = {
  manufacturer: {
    label:       'Fabricant',
    description: 'Vente + Production complète',
    color:       'bg-orange-50 text-orange-700 border-orange-200',
    dot:         'bg-orange-500',
    modules:     MODULE_PERMISSIONS.manufacturer.length,
  },
  reseller: {
    label:       'Revendeur',
    description: 'Outils de vente uniquement',
    color:       'bg-blue-50 text-blue-700 border-blue-200',
    dot:         'bg-blue-500',
    modules:     MODULE_PERMISSIONS.reseller.length,
  },
  wholesaler: {
    label:       'Grossiste',
    description: 'Vente en volume',
    color:       'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot:         'bg-emerald-500',
    modules:     MODULE_PERMISSIONS.wholesaler.length,
  },
  service_provider: {
    label:       'Prestataire',
    description: 'Services aux clients',
    color:       'bg-violet-50 text-violet-700 border-violet-200',
    dot:         'bg-violet-500',
    modules:     MODULE_PERMISSIONS.service_provider.length,
  },
}
