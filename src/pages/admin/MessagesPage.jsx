import { useState, useEffect } from 'react'
import { adminService } from '@/services/adminService'
import {
  Mail, MailOpen, Trash2, RefreshCw, MessageSquare,
  User, Clock, Tag, ChevronDown, ChevronUp, CheckCheck,
} from 'lucide-react'
import toast from 'react-hot-toast'

const SUBJECT_LABELS = {
  demo:        { label: 'Demande de démo',       color: 'bg-[#3AA0D8]/10 text-[#3AA0D8]' },
  pricing:     { label: 'Tarifs',                color: 'bg-[#E8A020]/10 text-[#E8A020]' },
  support:     { label: 'Support technique',     color: 'bg-red-50 text-red-600' },
  partnership: { label: 'Partenariat',           color: 'bg-purple-50 text-purple-600' },
  other:       { label: 'Autre',                 color: 'bg-gray-100 text-gray-500' },
}

function MessageCard({ msg, onRead, onDelete }) {
  const [open, setOpen] = useState(false)
  const subject = SUBJECT_LABELS[msg.subject] || { label: msg.subject, color: 'bg-gray-100 text-gray-500' }

  const handleOpen = () => {
    setOpen(o => !o)
    if (!msg.read && !open) onRead(msg.id)
  }

  return (
    <div className={`rounded-2xl border transition-all ${msg.read ? 'border-[#E8EFF5] bg-white' : 'border-[#3AA0D8]/30 bg-[#EBF6FD]'}`}>
      {/* Header */}
      <button
        onClick={handleOpen}
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-[#F4F8FB] rounded-2xl transition-colors"
      >
        <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${msg.read ? 'bg-[#E8EFF5]' : 'bg-[#3AA0D8]/15'}`}>
          {msg.read
            ? <MailOpen size={16} className="text-[#7A90A4]" />
            : <Mail     size={16} className="text-[#3AA0D8]" />
          }
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`font-black text-sm ${msg.read ? 'text-[#3D5268]' : 'text-[#0F1E30]'}`}>
              {msg.name}
            </span>
            {!msg.read && <span className="w-2 h-2 bg-[#3AA0D8] rounded-full" />}
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${subject.color}`}>
              {subject.label}
            </span>
          </div>
          <p className="text-xs text-[#7A90A4] truncate">{msg.email}</p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="text-[10px] text-[#7A90A4] hidden sm:block">
            {new Date(msg.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </span>
          {open ? <ChevronUp size={14} className="text-[#7A90A4]" /> : <ChevronDown size={14} className="text-[#7A90A4]" />}
        </div>
      </button>

      {/* Body */}
      {open && (
        <div className="px-5 pb-5 border-t border-[#E8EFF5] pt-4 space-y-4">
          <div className="grid sm:grid-cols-3 gap-3 text-xs">
            <div className="flex items-center gap-2 text-[#3D5268]">
              <User size={13} className="text-[#7A90A4]" />
              <span><strong>Nom :</strong> {msg.name}</span>
            </div>
            <div className="flex items-center gap-2 text-[#3D5268]">
              <Mail size={13} className="text-[#7A90A4]" />
              <a href={`mailto:${msg.email}`} className="text-[#3AA0D8] hover:underline">{msg.email}</a>
            </div>
            <div className="flex items-center gap-2 text-[#3D5268]">
              <Clock size={13} className="text-[#7A90A4]" />
              <span>{new Date(msg.created_at).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>
          </div>

          <div className="bg-[#F4F8FB] rounded-xl p-4 text-sm text-[#0F1E30] leading-relaxed whitespace-pre-wrap">
            {msg.message}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <a
              href={`mailto:${msg.email}?subject=Re: ${subject.label}`}
              className="inline-flex items-center gap-2 bg-[#0F1E30] hover:bg-[#1a3050] text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors"
            >
              <Mail size={13} /> Répondre
            </a>
            <button
              onClick={() => onDelete(msg.id)}
              className="inline-flex items-center gap-2 border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold px-4 py-2 rounded-xl transition-colors"
            >
              <Trash2 size={13} /> Supprimer
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function MessagesPage() {
  const [messages, setMessages] = useState([])
  const [loading, setLoading]   = useState(true)
  const [filter, setFilter]     = useState('all') // all | unread | read

  const load = async () => {
    setLoading(true)
    try {
      const res = await adminService.getContactMessages()
      setMessages(res.data || [])
    } catch {
      toast.error('Impossible de charger les messages')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleRead = async (id) => {
    await adminService.markContactRead(id)
    setMessages(prev => prev.map(m => m.id === id ? { ...m, read: true } : m))
  }

  const handleDelete = async (id) => {
    if (!confirm('Supprimer ce message définitivement ?')) return
    await adminService.deleteContactMessage(id)
    setMessages(prev => prev.filter(m => m.id !== id))
    toast.success('Message supprimé')
  }

  const handleMarkAllRead = async () => {
    await Promise.all(messages.filter(m => !m.read).map(m => adminService.markContactRead(m.id)))
    setMessages(prev => prev.map(m => ({ ...m, read: true })))
    toast.success('Tous les messages marqués comme lus')
  }

  const unreadCount = messages.filter(m => !m.read).length

  const filtered = messages.filter(m => {
    if (filter === 'unread') return !m.read
    if (filter === 'read')   return m.read
    return true
  })

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#0F1E30] flex items-center gap-2">
            <MessageSquare size={22} className="text-[#3AA0D8]" />
            Messagerie
          </h1>
          <p className="text-sm text-[#7A90A4] mt-1">
            Messages reçus depuis le formulaire de contact du portail
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#3AA0D8] hover:underline"
            >
              <CheckCheck size={14} /> Tout marquer lu
            </button>
          )}
          <button
            onClick={load}
            disabled={loading}
            className="p-2 text-[#7A90A4] hover:text-[#0F1E30] hover:bg-[#F4F8FB] rounded-xl transition-colors"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Stats + Filtres */}
      <div className="flex items-center gap-2 flex-wrap">
        {[
          { key: 'all',    label: `Tous (${messages.length})` },
          { key: 'unread', label: `Non lus (${unreadCount})` },
          { key: 'read',   label: `Lus (${messages.length - unreadCount})` },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`text-xs font-bold px-3 py-1.5 rounded-full transition-colors ${
              filter === f.key
                ? 'bg-[#0F1E30] text-white'
                : 'bg-[#F4F8FB] text-[#7A90A4] hover:text-[#0F1E30]'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Liste */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-[#F4F8FB] rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#F4F8FB] flex items-center justify-center">
            <MessageSquare size={24} className="text-[#C4D0DC]" />
          </div>
          <p className="font-bold text-[#0F1E30]">Aucun message</p>
          <p className="text-sm text-[#7A90A4]">
            {filter === 'unread' ? 'Tous les messages ont été lus.' : 'Aucun message de contact pour l\'instant.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(msg => (
            <MessageCard
              key={msg.id}
              msg={msg}
              onRead={handleRead}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}
