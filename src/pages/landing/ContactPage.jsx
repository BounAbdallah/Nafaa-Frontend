import { useState } from 'react'
import LegalLayout from './LegalLayout'
import { Mail, Phone, MapPin, Send, CheckCircle } from 'lucide-react'

function InfoCard({ icon: Icon, label, value, href, color }) {
  const content = (
    <div className="flex items-start gap-4 p-5 bg-[#F4F8FB] rounded-2xl border border-[#E8EFF5] hover:border-[#3AA0D8]/30 hover:bg-white transition-all group">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
           style={{ background: `${color}15` }}>
        <Icon size={18} style={{ color }}/>
      </div>
      <div>
        <p className="text-xs text-[#7A90A4] font-medium mb-0.5">{label}</p>
        <p className="text-[#0F1E30] font-bold text-sm">{value}</p>
      </div>
    </div>
  )
  return href ? <a href={href}>{content}</a> : content
}

export default function ContactPage() {
  const [form, setForm]       = useState({ name: '', email: '', subject: '', message: '' })
  const [sent, setSent]       = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    // Simulation d'envoi (à connecter à votre backend)
    await new Promise(r => setTimeout(r, 1200))
    setSent(true)
    setLoading(false)
  }

  return (
    <LegalLayout title="Nous contacter">
      <p className="text-[#7A90A4] text-sm mb-8 -mt-2">
        Notre équipe est disponible du lundi au vendredi, de 8h à 18h (GMT).
      </p>

      <div className="grid sm:grid-cols-3 gap-4 mb-10">
        <InfoCard icon={Mail}    label="Email"    color="#3AA0D8"
          value="contact@qiwam.sn"    href="mailto:contact@qiwam.sn" />
        <InfoCard icon={Phone}   label="Téléphone" color="#1A7A45"
          value="+221 77 000 00 00"   href="tel:+221770000000" />
        <InfoCard icon={MapPin}  label="Adresse"   color="#E8A020"
          value="Dakar, Sénégal" />
      </div>

      {sent ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
          <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center">
            <CheckCircle size={32} className="text-[#1A7A45]"/>
          </div>
          <h3 className="text-xl font-black text-[#0F1E30]">Message envoyé !</h3>
          <p className="text-[#7A90A4] text-sm max-w-sm">
            Merci pour votre message. Notre équipe vous répondra dans les plus brefs délais.
          </p>
          <button
            onClick={() => { setSent(false); setForm({ name: '', email: '', subject: '', message: '' }) }}
            className="mt-2 text-sm text-[#3AA0D8] hover:underline font-medium"
          >
            Envoyer un autre message
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <h2 className="text-base font-black text-[#0F1E30] mb-4">Envoyer un message</h2>

          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-[#3D5268] mb-1.5">Nom complet *</label>
              <input
                required
                type="text"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Votre nom"
                className="w-full border border-[#E8EFF5] rounded-xl px-4 py-3 text-sm text-[#0F1E30] placeholder:text-[#C4D0DC] focus:outline-none focus:border-[#3AA0D8] focus:ring-2 focus:ring-[#3AA0D8]/10 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#3D5268] mb-1.5">Email *</label>
              <input
                required
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="votre@email.com"
                className="w-full border border-[#E8EFF5] rounded-xl px-4 py-3 text-sm text-[#0F1E30] placeholder:text-[#C4D0DC] focus:outline-none focus:border-[#3AA0D8] focus:ring-2 focus:ring-[#3AA0D8]/10 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#3D5268] mb-1.5">Sujet *</label>
            <select
              required
              value={form.subject}
              onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
              className="w-full border border-[#E8EFF5] rounded-xl px-4 py-3 text-sm text-[#0F1E30] focus:outline-none focus:border-[#3AA0D8] focus:ring-2 focus:ring-[#3AA0D8]/10 transition-all bg-white"
            >
              <option value="">Choisir un sujet…</option>
              <option value="demo">Demande de démo</option>
              <option value="pricing">Informations tarifaires</option>
              <option value="support">Support technique</option>
              <option value="partnership">Partenariat</option>
              <option value="other">Autre</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#3D5268] mb-1.5">Message *</label>
            <textarea
              required
              rows={5}
              value={form.message}
              onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
              placeholder="Décrivez votre demande…"
              className="w-full border border-[#E8EFF5] rounded-xl px-4 py-3 text-sm text-[#0F1E30] placeholder:text-[#C4D0DC] focus:outline-none focus:border-[#3AA0D8] focus:ring-2 focus:ring-[#3AA0D8]/10 transition-all resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 bg-[#0F1E30] hover:bg-[#1a3050] disabled:opacity-60 text-white font-bold px-8 py-3.5 rounded-xl text-sm transition-all"
          >
            {loading ? (
              <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> Envoi…</>
            ) : (
              <><Send size={15}/> Envoyer le message</>
            )}
          </button>
        </form>
      )}
    </LegalLayout>
  )
}
