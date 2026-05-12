import { useEffect, useState, useCallback } from 'react'
import { confirmDialog } from '@/utils/confirm'
import { appointmentService } from '@/services/prestateurService'
import { customerService } from '@/services/customerService'
import toast from 'react-hot-toast'
import {
  ChevronLeft, ChevronRight, Plus, X, Clock,
  MapPin, User, Check, Trash2,
} from 'lucide-react'
import { cn } from '@/utils/cn'

const DAYS_FR  = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const MONTHS_FR= ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']
const COLORS   = ['#3AA0D8','#10B981','#F59E0B','#EF4444','#8B5CF6','#EC4899','#14B8A6']
const STATUSES = [
  { value: 'scheduled', label: 'Prévu',     color: 'bg-blue-100 text-blue-700'    },
  { value: 'confirmed', label: 'Confirmé',  color: 'bg-green-100 text-green-700'  },
  { value: 'completed', label: 'Terminé',   color: 'bg-muted-100 text-muted-600'  },
  { value: 'cancelled', label: 'Annulé',    color: 'bg-red-100 text-red-700'      },
]

export default function CalendarPage() {
  const [currentDate, setCurrentDate]   = useState(new Date())
  const [appointments, setAppointments] = useState([])
  const [customers, setCustomers]       = useState([])
  const [loading, setLoading]           = useState(true)
  const [modal, setModal]               = useState(null)   // null | 'new' | appointment obj
  const [selectedDay, setSelectedDay]   = useState(null)

  const year  = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const fetchAppointments = useCallback(async () => {
    setLoading(true)
    try {
      const m = `${year}-${String(month + 1).padStart(2, '0')}`
      const r = await appointmentService.getAll({ month: m })
      setAppointments(r.data)
    } catch { toast.error('Impossible de charger les RDV.') }
    finally { setLoading(false) }
  }, [year, month])

  useEffect(() => { fetchAppointments() }, [fetchAppointments])
  useEffect(() => {
    customerService.getAll({ per_page: 200 })
      .then(r => setCustomers(r.data?.customers || r.data?.data?.customers || []))
      .catch(() => {})
  }, [])

  // Calcul des jours du mois
  const firstDay  = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const startOffset = (firstDay + 6) % 7  // lundi = 0

  const getApptForDay = (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return appointments.filter(a => a.start_at?.startsWith(dateStr))
  }

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))
  const goToday   = () => setCurrentDate(new Date())

  const openNew = (day) => {
    const d = new Date(year, month, day)
    d.setHours(9, 0)
    setSelectedDay(d)
    setModal('new')
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-black text-navy tracking-tight">Calendrier</h1>
          <p className="text-sm text-muted-500 mt-1">Planifiez et gérez vos rendez-vous.</p>
        </div>
        <button onClick={() => { setSelectedDay(new Date()); setModal('new') }} className="btn-primary flex items-center gap-2">
          <Plus size={16} />Nouveau RDV
        </button>
      </div>

      {/* Navigation mois */}
      <div className="bg-surface rounded-card border border-muted-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-muted-100">
          <div className="flex items-center gap-3">
            <button onClick={prevMonth} className="p-1.5 rounded border border-muted-200 hover:bg-muted-50"><ChevronLeft size={16} /></button>
            <h2 className="text-lg font-black text-navy min-w-[180px] text-center">
              {MONTHS_FR[month]} {year}
            </h2>
            <button onClick={nextMonth} className="p-1.5 rounded border border-muted-200 hover:bg-muted-50"><ChevronRight size={16} /></button>
          </div>
          <button onClick={goToday} className="text-xs font-semibold text-primary-600 hover:text-primary-700 border border-primary-200 px-3 py-1.5 rounded-btn">
            Aujourd'hui
          </button>
        </div>

        {/* Grille calendrier */}
        <div className="grid grid-cols-7">
          {DAYS_FR.map(d => (
            <div key={d} className="py-2.5 text-center text-[11px] font-bold text-muted-500 uppercase tracking-wider border-b border-muted-100">
              {d}
            </div>
          ))}

          {/* Cases vides avant le 1er */}
          {[...Array(startOffset)].map((_, i) => (
            <div key={`empty-${i}`} className="h-28 border-b border-r border-muted-100 bg-muted-50/30" />
          ))}

          {/* Jours du mois */}
          {[...Array(daysInMonth)].map((_, i) => {
            const day     = i + 1
            const appts   = getApptForDay(day)
            const isToday = new Date().toDateString() === new Date(year, month, day).toDateString()

            return (
              <div
                key={day}
                onClick={() => openNew(day)}
                className={cn(
                  'h-28 border-b border-r border-muted-100 p-1.5 cursor-pointer hover:bg-primary-50/30 transition-colors group',
                  (i + startOffset + 1) % 7 === 0 && 'border-r-0'
                )}
              >
                <div className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold mb-1 transition-colors',
                  isToday ? 'bg-primary-600 text-white' : 'text-muted-600 group-hover:bg-primary-100 group-hover:text-primary-700'
                )}>
                  {day}
                </div>
                <div className="space-y-0.5 overflow-hidden">
                  {appts.slice(0, 3).map(a => (
                    <div
                      key={a.id}
                      onClick={(e) => { e.stopPropagation(); setModal(a) }}
                      className="truncate text-[10px] font-semibold px-1.5 py-0.5 rounded text-white cursor-pointer hover:opacity-80 transition-opacity"
                      style={{ backgroundColor: a.color || '#3AA0D8' }}
                      title={a.title}
                    >
                      {new Date(a.start_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} {a.title}
                    </div>
                  ))}
                  {appts.length > 3 && (
                    <div className="text-[10px] text-muted-400 px-1">+{appts.length - 3} autres</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Modal RDV */}
      {modal && (
        <AppointmentModal
          appointment={modal === 'new' ? null : modal}
          defaultDate={selectedDay}
          customers={customers}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); fetchAppointments() }}
          onDeleted={() => { setModal(null); fetchAppointments() }}
        />
      )}
    </div>
  )
}

// ── Modal Rendez-vous ────────────────────────────────────────────────────────

function AppointmentModal({ appointment, defaultDate, customers, onClose, onSaved, onDeleted }) {
  const isEdit = !!appointment

  const toLocal = (d) => {
    if (!d) return ''
    const dt = new Date(d)
    return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}T${String(dt.getHours()).padStart(2,'0')}:${String(dt.getMinutes()).padStart(2,'0')}`
  }

  const defaultStart = defaultDate ? toLocal(defaultDate) : toLocal(new Date())
  const defaultEnd   = defaultDate ? (() => { const d = new Date(defaultDate); d.setHours(d.getHours()+1); return toLocal(d) })() : ''

  const [form, setForm] = useState({
    title:       appointment?.title       || '',
    customer_id: appointment?.customer_id || '',
    description: appointment?.description || '',
    location:    appointment?.location    || '',
    start_at:    appointment ? toLocal(appointment.start_at) : defaultStart,
    end_at:      appointment ? toLocal(appointment.end_at)   : defaultEnd,
    status:      appointment?.status      || 'scheduled',
    color:       appointment?.color       || '#3AA0D8',
    notes:       appointment?.notes       || '',
  })
  const [saving, setSaving] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (isEdit) {
        await appointmentService.update(appointment.id, form)
        toast.success('RDV mis à jour.')
      } else {
        await appointmentService.create(form)
        toast.success('RDV créé.')
      }
      onSaved()
    } catch { toast.error('Erreur lors de la sauvegarde.') }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!(await confirmDialog({ title: 'Supprimer ce rendez-vous ?', text: 'Cette action est irréversible.', confirmText: 'Supprimer' }))) return
    try {
      await appointmentService.remove(appointment.id)
      toast.success('RDV supprimé.')
      onDeleted()
    } catch { toast.error('Erreur lors de la suppression.') }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <form
        onSubmit={handleSubmit}
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-muted-100">
          <h2 className="font-black text-navy">{isEdit ? 'Modifier le RDV' : 'Nouveau RDV'}</h2>
          <button type="button" onClick={onClose}><X size={20} className="text-muted-400 hover:text-muted-600" /></button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Titre */}
          <div>
            <label className="label-field">Titre *</label>
            <input className="input-field" value={form.title} onChange={e => set('title', e.target.value)} required />
          </div>

          {/* Client */}
          <div>
            <label className="label-field">Client</label>
            <select className="input-field" value={form.customer_id} onChange={e => set('customer_id', e.target.value)}>
              <option value="">— Aucun client —</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-field">Début *</label>
              <input type="datetime-local" className="input-field" value={form.start_at} onChange={e => set('start_at', e.target.value)} required />
            </div>
            <div>
              <label className="label-field">Fin *</label>
              <input type="datetime-local" className="input-field" value={form.end_at} onChange={e => set('end_at', e.target.value)} required />
            </div>
          </div>

          {/* Lieu */}
          <div>
            <label className="label-field">Lieu</label>
            <input className="input-field" value={form.location} onChange={e => set('location', e.target.value)} placeholder="Adresse, lien visio…" />
          </div>

          {/* Statut + Couleur */}
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="label-field">Statut</label>
              <select className="input-field" value={form.status} onChange={e => set('status', e.target.value)}>
                {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label-field">Couleur</label>
              <div className="flex gap-1.5 mt-1">
                {COLORS.map(c => (
                  <button key={c} type="button" onClick={() => set('color', c)}
                    className={cn('w-7 h-7 rounded-full border-2 transition-all', form.color === c ? 'border-navy scale-110' : 'border-transparent')}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="label-field">Notes</label>
            <textarea className="input-field" rows={3} value={form.notes} onChange={e => set('notes', e.target.value)} />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-muted-100 bg-muted-50">
          {isEdit ? (
            <button type="button" onClick={handleDelete} className="flex items-center gap-1.5 text-sm text-red-600 hover:text-red-700 font-medium">
              <Trash2 size={15} /> Supprimer
            </button>
          ) : <div />}
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="btn-outline">Annuler</button>
            <button type="submit" disabled={saving} className="btn-primary flex items-center gap-1.5">
              <Check size={15} />{saving ? 'Sauvegarde…' : isEdit ? 'Mettre à jour' : 'Créer'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
