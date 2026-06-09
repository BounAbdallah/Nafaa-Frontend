import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode, Html5QrcodeSupportedFormats, Html5QrcodeScannerState } from 'html5-qrcode'
import { X, Camera, AlertTriangle, Loader2 } from 'lucide-react'

const READER_ID = 'qiwam-barcode-reader'

/**
 * Modal de scan de code-barres via la caméra (mobile/desktop).
 * @param {(code: string) => void} onScan  - Appelé à chaque scan réussi (déjà dédupliqué).
 * @param {() => void} onClose             - Fermeture du scanner.
 * @param {string} lastResult              - Texte de feedback du dernier scan (affiché en bas).
 */
export default function BarcodeScanner({ onScan, onClose, lastResult }) {
  const scannerRef = useRef(null)
  const lastScanRef = useRef({ code: '', at: 0 })
  const onScanRef = useRef(onScan)
  onScanRef.current = onScan
  const [error, setError]     = useState(null)
  const [starting, setStarting] = useState(true)

  useEffect(() => {
    let cancelled = false
    const html5 = new Html5Qrcode(READER_ID, {
      formatsToSupport: [
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.CODE_39,
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.UPC_E,
        Html5QrcodeSupportedFormats.QR_CODE,
      ],
      verbose: false,
    })
    scannerRef.current = html5

    const handleSuccess = (decodedText) => {
      const now = Date.now()
      const last = lastScanRef.current
      // Anti-rebond : ignore le même code dans les 1,5 s
      if (decodedText === last.code && now - last.at < 1500) return
      lastScanRef.current = { code: decodedText, at: now }
      // Bip sonore léger
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)()
        const osc = ctx.createOscillator()
        osc.frequency.value = 880
        osc.connect(ctx.destination)
        osc.start()
        osc.stop(ctx.currentTime + 0.08)
      } catch { /* pas de son */ }
      onScanRef.current?.(decodedText)
    }

    // On conserve la promesse de démarrage pour attendre sa fin avant d'arrêter
    const startPromise = html5.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 250, height: 160 }, aspectRatio: 1.4 },
      handleSuccess,
      () => { /* échec de lecture par frame — ignoré */ }
    )
      .then(() => { if (!cancelled) setStarting(false) })
      .catch((err) => {
        if (cancelled) return
        setStarting(false)
        setError(
          err?.toString().includes('NotAllowed')
            ? "Accès à la caméra refusé. Autorise la caméra dans les réglages du navigateur."
            : "Impossible de démarrer la caméra. Vérifie qu'aucune autre application ne l'utilise."
        )
      })

    return () => {
      cancelled = true
      // Attendre la fin (succès ou échec) du démarrage avant d'arrêter,
      // sinon stop() lève « scanner is not running » (StrictMode double-mount).
      startPromise.finally(() => {
        try {
          const state = html5.getState?.()
          if (state === Html5QrcodeScannerState.SCANNING || state === Html5QrcodeScannerState.PAUSED) {
            html5.stop().then(() => html5.clear()).catch(() => {})
          } else {
            html5.clear?.()
          }
        } catch { /* ignore */ }
      })
    }
  }, [])

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4">
      <div className="bg-surface rounded-card w-full max-w-md overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-muted-200">
          <div className="flex items-center gap-2">
            <Camera size={18} className="text-primary-500" />
            <h3 className="font-display font-bold text-navy">Scanner un produit</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-btn text-muted-500 hover:bg-muted-100">
            <X size={18} />
          </button>
        </div>

        {/* Camera viewport */}
        <div className="relative bg-black aspect-[4/3]">
          <div id={READER_ID} className="w-full h-full [&_video]:object-cover [&_video]:w-full [&_video]:h-full" />

          {starting && !error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white gap-2">
              <Loader2 size={28} className="animate-spin" />
              <p className="text-sm">Démarrage de la caméra…</p>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white gap-3 p-6 text-center">
              <AlertTriangle size={32} className="text-amber-400" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Cadre de visée */}
          {!starting && !error && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-[250px] h-[160px] border-2 border-primary-400 rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
            </div>
          )}
        </div>

        {/* Footer feedback */}
        <div className="px-4 py-3 border-t border-muted-200 space-y-2">
          <p className="text-xs text-muted-500 text-center">
            Pointe la caméra vers le code-barres du produit.
          </p>
          {lastResult && (
            <div className="text-center text-sm font-sans font-semibold text-navy bg-muted-50 rounded-btn py-2 px-3">
              {lastResult}
            </div>
          )}
          <button
            onClick={onClose}
            className="btn-primary w-full py-2.5 text-sm"
          >
            Terminer le scan
          </button>
        </div>
      </div>
    </div>
  )
}
