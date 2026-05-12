import Swal from 'sweetalert2'

/**
 * Remplace window.confirm() par une SweetAlert2 stylée Qiwam.
 *
 * Usage :
 *   const ok = await confirmDialog({ title: 'Supprimer ?', text: 'Cette action est irréversible.' })
 *   if (!ok) return
 *
 * @param {object} options
 * @param {string} options.title        - Titre principal
 * @param {string} [options.text]       - Description secondaire
 * @param {string} [options.confirmText] - Texte du bouton de confirmation (défaut : "Confirmer")
 * @param {string} [options.cancelText]  - Texte du bouton d'annulation (défaut : "Annuler")
 * @param {'danger'|'warning'|'info'}  [options.type] - Style (défaut : 'danger')
 * @returns {Promise<boolean>}
 */
export async function confirmDialog({
  title       = 'Êtes-vous sûr ?',
  text        = 'Cette action est irréversible.',
  confirmText = 'Confirmer',
  cancelText  = 'Annuler',
  type        = 'danger',
} = {}) {
  const COLORS = {
    danger:  { icon: 'warning', confirmBg: '#EF4444', confirmHover: '#DC2626', iconColor: '#EF4444' },
    warning: { icon: 'warning', confirmBg: '#F59E0B', confirmHover: '#D97706', iconColor: '#F59E0B' },
    info:    { icon: 'question', confirmBg: '#3AA0D8', confirmHover: '#2880B8', iconColor: '#3AA0D8' },
  }
  const cfg = COLORS[type] ?? COLORS.danger

  const result = await Swal.fire({
    title,
    text,
    icon: cfg.icon,
    iconColor: cfg.iconColor,

    showCancelButton:  true,
    confirmButtonText: confirmText,
    cancelButtonText:  cancelText,
    reverseButtons:    true,          // Annuler à gauche, Confirmer à droite

    // ── Style ──────────────────────────────────────────────────────────────
    customClass: {
      popup:         'qiwam-swal-popup',
      title:         'qiwam-swal-title',
      htmlContainer: 'qiwam-swal-text',
      confirmButton: 'qiwam-swal-confirm',
      cancelButton:  'qiwam-swal-cancel',
      icon:          'qiwam-swal-icon',
    },
    buttonsStyling: false,            // On gère le style nous-mêmes (ci-dessous)

    // Injecte le CSS inline la première fois
    didOpen: () => injectSwalStyles(cfg.confirmBg, cfg.confirmHover),
  })

  return result.isConfirmed
}

// ── Injecteur de styles (une seule fois dans le DOM) ──────────────────────────
let _stylesInjected = false
function injectSwalStyles(confirmBg, confirmHover) {
  if (_stylesInjected) return
  _stylesInjected = true

  const style = document.createElement('style')
  style.innerHTML = `
    /* Popup */
    .qiwam-swal-popup {
      border-radius: 16px !important;
      padding: 28px 28px 24px !important;
      font-family: 'Inter', 'Calibri', sans-serif !important;
      box-shadow: 0 20px 60px rgba(15,30,48,.18) !important;
      max-width: 400px !important;
    }
    /* Icon */
    .qiwam-swal-icon {
      margin-bottom: 14px !important;
    }
    /* Title */
    .qiwam-swal-title {
      font-size: 1.15rem !important;
      font-weight: 700 !important;
      color: #0F1E30 !important;
      margin-bottom: 6px !important;
    }
    /* Text */
    .qiwam-swal-text {
      font-size: 0.875rem !important;
      color: #6B7280 !important;
      margin-bottom: 0 !important;
    }
    /* Buttons container */
    .swal2-actions {
      margin-top: 22px !important;
      gap: 10px !important;
    }
    /* Confirm button */
    .qiwam-swal-confirm {
      background: ${confirmBg} !important;
      color: #fff !important;
      border: none !important;
      border-radius: 10px !important;
      padding: 9px 22px !important;
      font-size: 0.875rem !important;
      font-weight: 600 !important;
      cursor: pointer !important;
      transition: background .15s !important;
      min-width: 100px !important;
    }
    .qiwam-swal-confirm:hover {
      background: ${confirmHover} !important;
    }
    /* Cancel button */
    .qiwam-swal-cancel {
      background: #F3F4F6 !important;
      color: #374151 !important;
      border: 1px solid #E5E7EB !important;
      border-radius: 10px !important;
      padding: 9px 22px !important;
      font-size: 0.875rem !important;
      font-weight: 600 !important;
      cursor: pointer !important;
      transition: background .15s !important;
      min-width: 100px !important;
    }
    .qiwam-swal-cancel:hover {
      background: #E5E7EB !important;
    }
  `
  document.head.appendChild(style)
}
