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
  PRODUCTION:      'production',
  PRESTATEUR:      'prestateur',
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
   * Module Prestateur complet : RDV, devis, factures, contrats + clients + dépenses
   */
  service_provider: [
    MODULE_IDS.DASHBOARD,
    MODULE_IDS.PRODUCTS,
    MODULE_IDS.CUSTOMERS,
    MODULE_IDS.ORDERS,
    MODULE_IDS.EXPENSES,
    MODULE_IDS.PRESTATEUR,
    MODULE_IDS.REPORTS,
    MODULE_IDS.TEAM,
    MODULE_IDS.SETTINGS,
  ],
}

// Tous les profils ont accès au module prestateur (optionnel selon abonnement)
Object.keys(MODULE_PERMISSIONS).forEach(profile => {
  if (!MODULE_PERMISSIONS[profile].includes(MODULE_IDS.PRESTATEUR)) {
    MODULE_PERMISSIONS[profile].push(MODULE_IDS.PRESTATEUR)
  }
})

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Retourne la liste des modules autorisés pour un profil donné.
 */
export function getAllowedModules(profileType) {
  return MODULE_PERMISSIONS[profileType] ?? FULL_ACCESS
}

/**
 * Vérifie si un module est accessible pour un utilisateur donné,
 * en croisant son profil d'activité, les modules activés par le Super Admin,
 * et les permissions granulaires attribuées par l'admin du tenant.
 */
export function canAccessModule(user, moduleId) {
  if (!user) return false

  const profileType    = user.tenant?.profile_type
  const enabledModules = user.tenant?.settings?.enabled_modules

  // 1. Check profile-based permissions (tenant profile_type)
  const isAllowedByProfile = getAllowedModules(profileType).includes(moduleId)
  if (!isAllowedByProfile) return false

  // 2. Check Super Admin overrides (if settings exist)
  if (enabledModules && !enabledModules.includes(moduleId)) return false

  // 3. Check per-employee module_permissions (only for non-admin roles)
  const isAdmin = user.roles?.includes('admin') || user.roles?.includes('super_admin')
  if (!isAdmin) {
    // Modules toujours visibles pour tous les employés
    const alwaysVisible = ['dashboard', 'settings']
    if (alwaysVisible.includes(moduleId)) return true

    // Normalise le moduleId (purchase-orders → purchase_orders)
    const permKey = moduleId.replace(/-/g, '_')
    const perms   = user.module_permissions ?? {}

    // Si le module n'est pas défini dans les permissions → masquer
    if (perms[permKey] === undefined) return false

    // N'afficher que si au moins l'action 'view' est accordée
    return !!(perms[permKey]?.view)
  }

  return true
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

/**
 * Fonctionnalités optionnelles (au-delà des modules) activées sur l'abonnement.
 * Source : tenant.settings.features — alimenté par le pack et/ou un override admin.
 * Ex : hasFeature(user, 'credit')
 */
export function hasFeature(user, key) {
  const features = user?.tenant?.settings?.features
  return Array.isArray(features) && features.includes(key)
}
