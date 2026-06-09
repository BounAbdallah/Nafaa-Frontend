/**
 * barcode.js
 * Utilitaires pour générer un code-barres CODE128 à partir d'un produit.
 * Utilise jsbarcode (rendu canvas pour l'affichage, SVG pour l'impression).
 */
import JsBarcode from 'jsbarcode'

/**
 * Valeur du code-barres d'un produit.
 * - Utilise le SKU si présent.
 * - Sinon génère un code stable et unique basé sur l'ID : « QW » + ID sur 8 chiffres.
 */
export function getBarcodeValue(product) {
  if (!product) return ''
  if (product.sku && String(product.sku).trim() !== '') return String(product.sku).trim()
  return 'QW' + String(product.id ?? 0).padStart(8, '0')
}

/**
 * Génère le markup SVG d'un code-barres (utilisable dans une fenêtre d'impression).
 * Retourne une chaîne SVG, ou une chaîne vide en cas d'échec.
 */
export function generateBarcodeSvg(value, options = {}) {
  try {
    const xmlns = 'http://www.w3.org/2000/svg'
    const svg = document.createElementNS(xmlns, 'svg')
    JsBarcode(svg, value, {
      format: 'CODE128',
      width: 2,
      height: 50,
      displayValue: true,
      fontSize: 14,
      margin: 8,
      ...options,
    })
    return new XMLSerializer().serializeToString(svg)
  } catch {
    return ''
  }
}
