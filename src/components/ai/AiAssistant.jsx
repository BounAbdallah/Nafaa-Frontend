import { useEffect, useRef, useState } from 'react'
import {
  Mic, Send, Loader2, X, Sparkles, MessageSquare, AlertCircle, CheckCircle2,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { sendText, sendVoice } from '../../services/aiService'

/**
 * Qiwam Intelligent — unified chat + voice assistant.
 *
 * Floating bubble that expands into a conversation panel.
 * Users can either type OR press-and-hold the mic to talk.
 *
 * Props:
 *   - onSuccess?: (result) => void   // fires when a tool call succeeds
 *   - placement?: 'fixed' | 'inline' (default 'fixed', bottom-right)
 *   - hint?:      string             // tooltip on the closed bubble
 *   - greeting?:  string             // first bot message
 */
const AiAssistant = ({
  onSuccess,
  placement = 'fixed',
  hint = 'Qiwam Intelligent',
  greeting = "Bonjour 👋  Posez-moi une question ou utilisez le micro. Exemples : « Ajoute 50 unités de Tissu Bazin » · « Quel est le stock de Boubou ? »",
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    { role: 'assistant', text: greeting, ts: Date.now() },
  ])
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)

  // Voice
  const [isRecording, setIsRecording] = useState(false)
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const streamRef = useRef(null)

  // Refs
  const scrollRef = useRef(null)
  const inputRef = useRef(null)

  // Auto-scroll to last message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isSending])

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen && inputRef.current) inputRef.current.focus()
  }, [isOpen])

  // Cleanup mic on unmount
  useEffect(() => () => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
  }, [])

  const pushMessage = (msg) => setMessages((m) => [...m, { ...msg, ts: Date.now() }])

  // ── Send a result back into the chat history ──
  const ingestResult = (userBubble, result) => {
    const ok = result?.tool_result?.ok
    pushMessage({
      role: 'assistant',
      text: result?.reply || (ok ? 'Action effectuée.' : 'Je n\'ai pas pu traiter ta demande.'),
      action: result?.action,
      ok,
    })
    if (ok) {
      onSuccess?.(result)
      // Broadcast so any page listening can refresh its data
      window.dispatchEvent(new CustomEvent('qiwam:ai-action', { detail: result }))
    }
  }

  // ── Text path ──
  const handleSubmit = async (e) => {
    e?.preventDefault?.()
    const message = input.trim()
    if (!message || isSending) return

    pushMessage({ role: 'user', text: message })
    setInput('')
    setIsSending(true)

    try {
      const result = await sendText(message)
      ingestResult(message, result)
    } catch (err) {
      const detail = err?.response?.data?.error || 'Le service IA est temporairement indisponible.'
      pushMessage({ role: 'assistant', text: detail, ok: false })
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  // ── Voice path ──
  const startRecording = async () => {
    if (isRecording || isSending) return
    if (!navigator.mediaDevices?.getUserMedia) {
      toast.error("Le micro n'est pas disponible.")
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
      mr.ondataavailable = (e) => { if (e.data?.size) chunksRef.current.push(e.data) }
      mr.onstop = handleRecordingStop
      mr.start()
      mediaRecorderRef.current = mr
      setIsRecording(true)
    } catch {
      toast.error("Impossible d'accéder au microphone.")
    }
  }

  const stopRecording = () => {
    const mr = mediaRecorderRef.current
    if (mr && mr.state !== 'inactive') mr.stop()
    setIsRecording(false)
  }

  const handleRecordingStop = async () => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null

    const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
    if (blob.size < 1500) {
      toast('Trop court — réessaye en parlant plus longtemps.', { icon: 'ℹ️' })
      return
    }

    // Optimistic placeholder
    pushMessage({ role: 'user', text: '🎙️ …', isVoicePending: true })
    setIsSending(true)

    try {
      const result = await sendVoice(blob)

      // Replace the placeholder with the real transcript
      setMessages((prev) => {
        const idx = [...prev].reverse().findIndex((m) => m.isVoicePending)
        if (idx === -1) return prev
        const realIdx = prev.length - 1 - idx
        const updated = [...prev]
        updated[realIdx] = {
          role: 'user',
          text: result.transcript || '🎙️ (inaudible)',
          ts: prev[realIdx].ts,
          isVoice: true,
        }
        return updated
      })

      ingestResult(result.transcript, result)
    } catch (err) {
      setMessages((prev) => prev.filter((m) => !m.isVoicePending))
      const detail = err?.response?.data?.error || 'Échec du traitement vocal.'
      pushMessage({ role: 'assistant', text: detail, ok: false })
    } finally {
      setIsSending(false)
    }
  }

  // ── UI ──
  const wrapperCls = placement === 'fixed'
    ? 'fixed bottom-6 right-6 z-50'
    : 'inline-block'

  if (!isOpen) {
    return (
      <div className={wrapperCls}>
        <button
          type="button"
          title={hint}
          onClick={() => setIsOpen(true)}
          className="group relative h-16 w-16 rounded-full shadow-2xl bg-gradient-to-br from-[#3AA0D8] to-[#2880B8] hover:scale-105 transition-all duration-200 flex items-center justify-center text-white"
        >
          <Sparkles className="h-7 w-7" />
          <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-[#E8A020] border-2 border-white" />
          {/* Tooltip */}
          <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-lg bg-slate-900 text-white text-xs px-2.5 py-1.5 opacity-0 group-hover:opacity-100 transition pointer-events-none">
            {hint}
          </span>
        </button>
      </div>
    )
  }

  return (
    <div className={wrapperCls}>
      <div className="w-[380px] h-[560px] max-h-[80vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
        {/* Header */}
        <div className="px-4 py-3 bg-gradient-to-r from-[#0F1E30] to-[#1A3550] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="relative h-9 w-9 rounded-lg bg-white/10 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-[#3AA0D8]" />
              <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-[#E8A020]" />
            </div>
            <div>
              <div className="text-sm font-semibold tracking-tight">Qiwam Intelligent</div>
              <div className="text-[11px] text-slate-300 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                En ligne
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="h-8 w-8 rounded-lg hover:bg-white/10 flex items-center justify-center transition"
            title="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 bg-slate-50 space-y-3">
          {messages.map((m, i) => (
            <MessageBubble key={i} msg={m} />
          ))}
          {isSending && (
            <div className="flex items-center gap-2 text-xs text-slate-400 pl-1">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Qiwam réfléchit…
            </div>
          )}
        </div>

        {/* Input bar */}
        <form onSubmit={handleSubmit} className="border-t border-slate-200 bg-white px-3 py-2.5 flex items-end gap-2">
          {/* Voice button */}
          <button
            type="button"
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            onMouseLeave={isRecording ? stopRecording : undefined}
            onTouchStart={(e) => { e.preventDefault(); startRecording() }}
            onTouchEnd={(e) => { e.preventDefault(); stopRecording() }}
            disabled={isSending}
            title="Maintenir pour parler"
            className={[
              'h-10 w-10 shrink-0 rounded-full flex items-center justify-center transition-all',
              isRecording
                ? 'bg-red-500 text-white scale-110 shadow-lg shadow-red-500/40'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-50',
            ].join(' ')}
          >
            <Mic className={`h-4 w-4 ${isRecording ? 'animate-pulse' : ''}`} />
            {isRecording && (
              <span className="absolute inset-0 rounded-full bg-red-500 opacity-30 animate-ping" />
            )}
          </button>

          {/* Text input */}
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isRecording ? 'Parle…' : 'Tape ton message ou maintiens 🎙️'}
            disabled={isRecording || isSending}
            className="flex-1 resize-none border-0 bg-slate-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3AA0D8]/30 disabled:opacity-50"
            style={{ minHeight: 40, maxHeight: 120 }}
          />

          {/* Send button */}
          <button
            type="submit"
            disabled={!input.trim() || isSending || isRecording}
            className="h-10 w-10 shrink-0 rounded-full bg-[#3AA0D8] hover:bg-[#2880B8] text-white flex items-center justify-center transition disabled:opacity-30 disabled:cursor-not-allowed"
            title="Envoyer"
          >
            {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </form>

        {/* Footer hint */}
        <div className="px-4 py-1.5 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-400 text-center">
          Powered by Hugging Face · Llama 3.3 + Whisper
        </div>
      </div>
    </div>
  )
}

// ── Sub-components ──
const MessageBubble = ({ msg }) => {
  const isUser = msg.role === 'user'
  const ok = msg.ok

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-1 duration-150`}>
      <div className={[
        'max-w-[85%] rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap break-words',
        isUser
          ? 'bg-[#3AA0D8] text-white rounded-br-md'
          : ok === false
          ? 'bg-red-50 text-red-900 border border-red-100 rounded-bl-md'
          : ok === true
          ? 'bg-emerald-50 text-emerald-900 border border-emerald-100 rounded-bl-md'
          : 'bg-white text-slate-800 border border-slate-200 rounded-bl-md',
      ].join(' ')}>
        {!isUser && (ok === true || ok === false) && (
          <div className={`flex items-center gap-1.5 mb-1 text-[10px] uppercase tracking-wider font-bold ${ok ? 'text-emerald-600' : 'text-red-600'}`}>
            {ok ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
            {msg.action && msg.action !== 'none' ? msg.action.replace(/_/g, ' ') : (ok ? 'Succès' : 'Erreur')}
          </div>
        )}
        {msg.isVoicePending ? (
          <span className="flex items-center gap-2 italic text-white/80">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Transcription en cours…
          </span>
        ) : (
          <>
            {isUser && msg.isVoice && <span className="text-[10px] opacity-75 mr-1">🎙️</span>}
            {msg.text}
          </>
        )}
      </div>
    </div>
  )
}

export default AiAssistant
