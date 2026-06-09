import { useEffect, useRef } from 'react'
import JsBarcode from 'jsbarcode'

/**
 * Affiche un code-barres CODE128 rendu en SVG.
 * @param {string} value   - La valeur à encoder.
 * @param {object} options - Options jsbarcode (height, width, displayValue…).
 */
export default function Barcode({ value, className, options = {} }) {
  const ref = useRef(null)

  useEffect(() => {
    if (!ref.current || !value) return
    try {
      JsBarcode(ref.current, value, {
        format: 'CODE128',
        width: 2,
        height: 60,
        displayValue: true,
        fontSize: 15,
        margin: 6,
        lineColor: '#0f172a',
        background: '#ffffff',
        ...options,
      })
    } catch {
      /* valeur invalide — ignore */
    }
  }, [value, options])

  if (!value) return null
  return <svg ref={ref} className={className} />
}
