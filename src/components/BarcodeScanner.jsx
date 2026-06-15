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
export default function BarcodeScanner({ onScan, onClose, lastResult, allowManual = true }) {
  const scannerRef = useRef(null)
  const lastScanRef = useRef({ code: '', at: 0 })
  const onScanRef = useRef(onScan)
  onScanRef.current = onScan
  const handledRef = useRef(false)
  const [error, setError]     = useState(null)
  const [starting, setStarting] = useState(true)
  const [manualCode, setManualCode] = useState('')

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
      // Utilise le détecteur natif du navigateur s'il existe (plus rapide/fiable sur mobile)
      experimentalFeatures: { useBarCodeDetectorIfSupported: true },
      verbose: false,
    })

    // Zone de visée large : un code-barres 1D est plus large que haut
    const computeQrbox = (vw, vh) => {
      const w = Math.floor(Math.min(vw, vh) * 0.85)
      return { width: w, height: Math.floor(w * 0.55) }
    }
    scannerRef.current = html5

    const handleSuccess = (decodedText) => {
      // Un seul scan traité : on évite tout double-déclenchement
      if (handledRef.current) return
      handledRef.current = true

      // Bip sonore léger
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)()
        const osc = ctx.createOscillator()
        osc.frequency.value = 880
        osc.connect(ctx.destination)
        osc.start()
        osc.stop(ctx.currentTime + 0.08)
      } catch { /* pas de son */ }

      // Arrêter la caméra AVANT de remonter le résultat, pour que le parent
      // puisse démonter le scanner sans interrompre un flux vidéo encore actif.
      const finish = () => onScanRef.current?.(decodedText)
      try {
        const state = html5.getState?.()
        if (state === Html5QrcodeScannerState.SCANNING || state === Html5QrcodeScannerState.PAUSED) {
          html5.stop().then(() => html5.clear()).catch(() => {}).finally(finish)
        } else {
          finish()
        }
      } catch {
        finish()
      }
    }

    // On conserve la promesse de démarrage pour attendre sa fin avant d'arrêter
    const startPromise = html5.start(
      { facingMode: 'environment' },
      { fps: 15, qrbox: computeQrbox, aspectRatio: 1.4 },
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
            Pointe la caméra vers le code-barres (tiens-le bien à plat et net).
          </p>
          {lastResult && (
            <div className="text-center text-sm font-sans font-semibold text-navy bg-muted-50 rounded-btn py-2 px-3">
              {lastResult}
            </div>
          )}

          {/* Saisie manuelle en secours */}
          {allowManual && (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                const code = manualCode.trim()
                if (!code || handledRef.current) return
                handledRef.current = true
                const finish = () => onScanRef.current?.(code)
                const s = scannerRef.current
                try {
                  const state = s?.getState?.()
                  if (state === Html5QrcodeScannerState.SCANNING || state === Html5QrcodeScannerState.PAUSED) {
                    s.stop().then(() => s.clear()).catch(() => {}).finally(finish)
                  } else {
                    finish()
                  }
                } catch {
                  finish()
                }
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                inputMode="numeric"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Ou saisir le code à la main…"
                className="flex-1 border border-muted-200 rounded-btn px-3 py-2 text-sm focus:outline-none focus:border-primary-400"
              />
              <button type="submit" className="btn-secondary px-3 py-2 text-sm shrink-0">OK</button>
            </form>
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
