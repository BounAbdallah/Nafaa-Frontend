import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import {
  Mic, Send, Loader2, X, Sparkles, MessageSquare, AlertCircle, CheckCircle2,
  Paperclip, FileSpreadsheet,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { sendText, sendVoice, importCsv } from '../../services/aiService'
import { cn } from '@/utils/cn'

/**
 * Qiwam assistant — unified chat + voice assistant.
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
  hint = 'Qiwam assistant',
}) => {
  const location = useLocation()
  const isExpensesPage = location.pathname.includes('/expenses')
  const isOrdersPage = location.pathname.includes('/orders')
  const isCustomersPage = location.pathname.includes('/customers')
  
  const greeting = isExpensesPage
    ? "Bonjour 👋 Je peux t'aider avec tes dépenses :\n• tape « Enregistre 5000 pour le carburant »\n• maintiens 🎙️ pour parler\n• clique 📊 pour importer un CSV ou XLSX de dépenses"
    : isOrdersPage
    ? "Bonjour 👋 Je peux t'aider avec tes ventes :\n• demande « Combien j'ai vendu aujourd'hui ? »\n• tape « Liste les 5 dernières commandes »\n• ou « Détails commande CMD-2026-001 »"
    : isCustomersPage
    ? "Bonjour 👋 Je peux t'aider avec tes clients :\n• demande « Trouve le client Diop »\n• tape « Ajoute un client Jean Paul au 771234567 »\n• ou « Liste mes meilleurs clients »"
    : "Bonjour 👋  Trois manières d'interagir :\n• tape une question ou colle un tableau Markdown\n• maintiens 🎙️ pour parler\n• clique 📊 pour importer un CSV ou XLSX (matières / produits)"

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
  const csvInputRef = useRef(null)

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

  // ── CSV upload path ──
  const handleCsvUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = '' // reset to allow re-uploading the same file

    const isXlsx = /\.xlsx$/i.test(file.name) || file.type.includes('spreadsheetml')
    const isCsv  = /\.csv$/i.test(file.name) || file.type.includes('csv')
    if (!isXlsx && !isCsv) {
      toast.error('Seuls les fichiers .csv et .xlsx sont acceptés.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Fichier trop volumineux (max 5 MB).')
      return
    }

    const fileIcon = isXlsx ? '📊' : '📄'
    pushMessage({ role: 'user', text: `${fileIcon} Import de ${file.name} (${(file.size / 1024).toFixed(1)} KB)` })
    setIsSending(true)

    try {
      const result = await importCsv(file, isExpensesPage ? 'expense' : 'material')
      ingestResult(`Import ${isXlsx ? 'XLSX' : 'CSV'} ${file.name}`, result)
    } catch (err) {
      const detail = err?.response?.data?.message || err?.response?.data?.error || 'Échec de l\'import CSV.'
      pushMessage({ role: 'assistant', text: detail, ok: false })
    } finally {
      setIsSending(false)
    }
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

  // Draggable state
  const [pos, setPos] = useState(() => {
    const saved = localStorage.getItem('qiwam_assistant_pos')
    return saved ? JSON.parse(saved) : { x: 0, y: 0 }
  })
  const [isDragging, setIsDragging] = useState(false)
  const dragStartPos = useRef({ x: 0, y: 0 })

  const handleDragStart = (e) => {
    // Don't drag if clicking buttons inside unless it's a drag handle
    if (e.target.closest('button') && !e.target.closest('.drag-handle')) return
    setIsDragging(true)
    dragStartPos.current = {
      x: e.clientX - pos.x,
      y: e.clientY - pos.y
    }
  }

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return
      const newPos = {
        x: e.clientX - dragStartPos.current.x,
        y: e.clientY - dragStartPos.current.y
      }
      setPos(newPos)
    }

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false)
        localStorage.setItem('qiwam_assistant_pos', JSON.stringify(pos))
      }
    }

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, pos])

  // ── UI ──
  const wrapperCls = placement === 'fixed'
    ? 'fixed z-50 transition-shadow'
    : 'inline-block'

  const wrapperStyle = placement === 'fixed' ? {
    bottom: `calc(24px - ${pos.y}px)`,
    right: `calc(24px - ${pos.x}px)`,
    cursor: isDragging ? 'grabbing' : 'auto'
  } : {}

  if (!isOpen) {
    return (
      <div className={wrapperCls} style={wrapperStyle}>
        <button
          type="button"
          title={hint}
          onMouseDown={handleDragStart}
          onClick={() => { if (!isDragging) setIsOpen(true); }}
          className={[
            "group relative h-16 w-16 rounded-full shadow-2xl bg-gradient-to-br from-[#3AA0D8] to-[#2880B8] hover:scale-105 transition-all duration-200 flex items-center justify-center text-white",
            isDragging && "scale-95 opacity-80"
          ].join(' ')}
        >
          <Sparkles className="h-7 w-7 pointer-events-none" />
          <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-[#E8A020] border-2 border-white pointer-events-none" />
          {/* Tooltip */}
          <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-lg bg-slate-900 text-white text-xs px-2.5 py-1.5 opacity-0 group-hover:opacity-100 transition pointer-events-none">
            {hint} (Glisser pour déplacer)
          </span>
        </button>
      </div>
    )
  }

  return (
    <div className={wrapperCls} style={wrapperStyle}>
      <div className="w-[380px] h-[560px] max-h-[80vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
        {/* Header */}
        <div 
          onMouseDown={handleDragStart}
          className="px-4 py-3 bg-gradient-to-r from-[#0F1E30] to-[#1A3550] text-white flex items-center justify-between cursor-grab active:cursor-grabbing"
        >
          <div className="flex items-center gap-2.5">
            <div className="relative h-9 w-9 rounded-lg bg-white/10 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-[#3AA0D8]" />
              <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-[#E8A020]" />
            </div>
            <div>
              <div className="text-sm font-semibold tracking-tight">Qiwam assistant</div>
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
          {/* Hidden CSV / XLSX input */}
          <input
            ref={csvInputRef}
            type="file"
            accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onChange={handleCsvUpload}
            className="hidden"
          />

          {/* CSV / XLSX upload button */}
          <button
            type="button"
            onClick={() => csvInputRef.current?.click()}
            disabled={isSending || isRecording}
            title="Importer un fichier CSV ou XLSX"
            className="h-10 w-10 shrink-0 rounded-full flex items-center justify-center transition-all bg-slate-100 text-slate-600 hover:bg-[#3AA0D8]/10 hover:text-[#3AA0D8] disabled:opacity-50"
          >
            <FileSpreadsheet className="h-4 w-4" />
          </button>

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
          Qiwam assistant by NWS
        </div>
      </div>
    </div>
  )
}

// ── Sub-components ──

/**
 * Tiny formatter: turns plain text with **bold**, line breaks and bullet
 * markers (•, -, *) into proper React nodes — no markdown lib needed.
 * Détecte les marqueurs de stock bas (amber) et rupture (rouge) pour coloriser.
 */

/** Détermine le niveau de stock d'un item de liste */
const stockLevel = (text) => {
  const t = text.toLowerCase()
  if (/rupture|stock\s*[=:]\s*0\b|0\s*(kg|u|pcs|unité)/.test(t)) return 'out'
  if (/⚠️|stock bas|stock faible|alerte stock/.test(t)) return 'low'
  return 'ok'
}

const formatText = (raw) => {
  if (!raw) return null

  const lines = raw.replace(/\r\n/g, '\n').split('\n')

  // Render a single line, replacing **bold** with <strong>
  const renderInline = (line, key) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g)
    return (
      <span key={key}>
        {parts.map((part, i) =>
          part.startsWith('**') && part.endsWith('**')
            ? <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>
            : part
        )}
      </span>
    )
  }

  // Group consecutive bullet lines into a single <ul>
  const blocks = []
  let bulletGroup = null
  lines.forEach((line, i) => {
    const m = line.match(/^\s*[•\-*]\s+(.*)$/)
    if (m) {
      if (!bulletGroup) {
        bulletGroup = []
        blocks.push({ kind: 'ul', items: bulletGroup })
      }
      bulletGroup.push(m[1])
    } else {
      bulletGroup = null
      if (line.trim() !== '') blocks.push({ kind: 'p', text: line })
    }
  })

  return blocks.map((b, i) => {
    if (b.kind === 'ul') {
      return (
        <ul key={i} className="my-1 space-y-0.5 pl-1">
          {b.items.map((item, j) => {
            const level = stockLevel(item)
            const bulletColor = level === 'out'
              ? 'text-red-500'
              : level === 'low'
                ? 'text-amber-500'
                : 'text-[#3AA0D8]'
            const rowClass = level === 'out'
              ? 'bg-red-50 rounded px-1.5 py-0.5 -mx-1'
              : level === 'low'
                ? 'bg-amber-50 rounded px-1.5 py-0.5 -mx-1'
                : ''
            return (
              <li key={j} className={`flex gap-2 leading-snug ${rowClass}`}>
                <span className={`${bulletColor} select-none`}>•</span>
                <span className="flex-1">{renderInline(item, `${i}-${j}`)}</span>
              </li>
            )
          })}
        </ul>
      )
    }
    return <p key={i} className="leading-snug">{renderInline(b.text, i)}</p>
  })
}

const MessageBubble = ({ msg }) => {
  const isUser = msg.role === 'user'
  const ok = msg.ok

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-1 duration-150`}>
      <div className={[
        'max-w-[85%] rounded-2xl px-3.5 py-2 text-sm break-words space-y-0.5',
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
        ) : isUser ? (
          <span>
            {msg.isVoice && <span className="text-[10px] opacity-75 mr-1">🎙️</span>}
            {msg.text}
          </span>
        ) : (
          <div className="space-y-1">
            {formatText(msg.text)}
          </div>
        )}
      </div>
    </div>
  )
}

export default AiAssistant
