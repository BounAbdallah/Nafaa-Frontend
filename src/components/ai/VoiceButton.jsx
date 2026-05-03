import { useEffect, useRef, useState } from 'react'
import { Mic, Loader2, Check, X, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import { sendVoice } from '../../services/aiService'

/**
 * Floating microphone button — press-and-hold (or click-to-toggle) to record,
 * release to send the audio to /ai/voice.
 *
 * Props:
 *   - onResult?:   (result) => void   // fires when the AI replies
 *   - onSuccess?:  (result) => void   // fires only if tool_result.ok === true
 *   - placement?:  'fixed' | 'inline' (default 'fixed', bottom-right)
 *   - hint?:       string  // tooltip / aria-label
 */
const VoiceButton = ({ onResult, onSuccess, placement = 'fixed', hint = 'Parle à Qiwam' }) => {
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [lastReply, setLastReply] = useState(null)

  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const streamRef = useRef(null)

  // Cleanup on unmount
  useEffect(() => () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
    }
  }, [])

  const start = async () => {
    if (isProcessing || isRecording) return

    if (!navigator.mediaDevices?.getUserMedia) {
      toast.error("Le micro n'est pas disponible dans ce navigateur.")
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const mr = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm',
      })

      chunksRef.current = []
      mr.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data)
      }
      mr.onstop = handleStop
      mr.start()
      mediaRecorderRef.current = mr
      setIsRecording(true)
    } catch (err) {
      toast.error("Impossible d'accéder au microphone.")
    }
  }

  const stop = () => {
    const mr = mediaRecorderRef.current
    if (mr && mr.state !== 'inactive') {
      mr.stop()
    }
    setIsRecording(false)
  }

  const cancel = () => {
    chunksRef.current = []
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    setIsRecording(false)
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop())
  }

  const handleStop = async () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }

    const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
    if (blob.size < 1500) {
      toast('Trop court — réessaye en parlant plus longtemps.', { icon: 'ℹ️' })
      return
    }

    setIsProcessing(true)
    const t = toast.loading('Qiwam vous écoute…')

    try {
      const result = await sendVoice(blob)
      const ok = result?.tool_result?.ok ?? null

      setLastReply(result)
      onResult?.(result)
      if (ok) onSuccess?.(result)

      if (result?.reply) {
        if (ok === false) {
          toast.error(result.reply, { id: t, duration: 6000 })
        } else {
          toast.success(result.reply, { id: t, duration: 5000 })
        }
      } else {
        toast.dismiss(t)
      }
    } catch (err) {
      const msg = err?.response?.data?.error || 'Échec de la commande vocale.'
      toast.error(msg, { id: t })
    } finally {
      setIsProcessing(false)
    }
  }

  // ── UI ──
  const wrapperCls =
    placement === 'fixed'
      ? 'fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2'
      : 'inline-flex flex-col items-end gap-2'

  return (
    <div className={wrapperCls}>
      {lastReply?.transcript && (
        <div className="max-w-sm rounded-xl bg-white shadow-lg border border-slate-200 px-4 py-2 text-xs text-slate-600 animate-in fade-in slide-in-from-bottom-2">
          <div className="font-semibold text-slate-400 uppercase tracking-wider text-[10px] mb-1">
            Vous avez dit
          </div>
          <div className="italic">« {lastReply.transcript} »</div>
        </div>
      )}

      <button
        type="button"
        title={hint}
        aria-label={hint}
        onMouseDown={start}
        onMouseUp={stop}
        onMouseLeave={isRecording ? stop : undefined}
        onTouchStart={(e) => { e.preventDefault(); start() }}
        onTouchEnd={(e) => { e.preventDefault(); stop() }}
        disabled={isProcessing}
        className={[
          'relative h-16 w-16 rounded-full shadow-2xl transition-all duration-200',
          'flex items-center justify-center text-white',
          isRecording
            ? 'bg-red-500 scale-110 shadow-red-500/50'
            : isProcessing
            ? 'bg-slate-400 cursor-wait'
            : 'bg-[#3AA0D8] hover:bg-[#2880B8] hover:scale-105 cursor-pointer',
        ].join(' ')}
      >
        {isProcessing ? (
          <Loader2 className="h-6 w-6 animate-spin" />
        ) : (
          <Mic className={`h-6 w-6 ${isRecording ? 'animate-pulse' : ''}`} />
        )}

        {/* Pulse rings while recording */}
        {isRecording && (
          <>
            <span className="absolute inset-0 rounded-full bg-red-500 opacity-40 animate-ping" />
            <span className="absolute -inset-2 rounded-full border-2 border-red-300 opacity-60" />
          </>
        )}
      </button>

      {isRecording && (
        <div className="rounded-full bg-slate-900 px-3 py-1 text-[11px] font-medium text-white shadow-lg flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-red-400 animate-pulse" />
          Relâchez pour envoyer
        </div>
      )}
    </div>
  )
}

export default VoiceButton
