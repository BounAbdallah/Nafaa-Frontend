import { useEffect, useState, useCallback } from 'react'
import { confirmDialog } from '@/utils/confirm'
import { appointmentService } from '@/services/prestateurService'
import { customerService } from '@/services/customerService'
import toast from 'react-hot-toast'
import {
  ChevronLeft, ChevronRight, Plus, X, Clock,
  MapPin, User, Check, Trash2, Calendar,
} from 'lucide-react'
import { cn } from '@/utils/cn'

const DAYS_FR   = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const MONTHS_FR = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']
const COLORS    = ['#3AA0D8','#10B981','#F59E0B','#EF4444','#8B5CF6','#EC4899','#14B8A6']
const STATUSES  = [
  { value: 'scheduled', label: 'Prévu',    color: 'bg-blue-100 text-blue-700'   },
  { value: 'confirmed', label: 'Confirmé', color: 'bg-green-100 text-green-700' },
  { value: 'completed', label: 'Terminé',  color: 'bg-muted-100 text-muted-600' },
  { value: 'cancelled', label: 'Annulé',   color: 'bg-red-100 text-red-700'     },
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
    } catch {
      toast.error('Impossible de charger les RDV.')
    } finally {
      setLoading(false)
    }
  }, [year, month])

  useEffect(() => { fetchAppointments() }, [fetchAppointments])
  useEffect(() => {
    customerService.getAll({ per_page: 200 })
      .then((r) => setCustomers(r.data?.customers || r.data?.data?.customers || []))
      .catch(() => {})
  }, [])

  // Calcul des jours du mois
  const firstDay    = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const startOffset = (firstDay + 6) % 7  // lundi = 0

  const getApptForDay = (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return appointments.filter((a) => a.start_at?.startsWith(dateStr))
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

  // List of all appointments this month sorted by date (for mobile agenda view)
  const allThisMonth = [...appointments].sort((a, b) =>
    new Date(a.start_at) - new Date(b.start_at)
  )

  return (
    <div className="space-y-4 sm:space-y-5 animate-fade-in">
      {/* ── Header ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-black text-navy tracking-tight">Calendrier</h1>
          <p className="text-sm text-muted-500 mt-1">Planifiez et gérez vos rendez-vous.</p>
        </div>
        {/* New RDV — icon-only on mobile */}
        <button
          onClick={() => { setSelectedDay(new Date()); setModal('new') }}
          className="btn-primary flex items-center gap-2 text-sm self-start sm:self-auto"
          title="Nouveau RDV"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">Nouveau RDV</span>
          <span className="sm:hidden">Nouveau</span>
        </button>
      </div>

      {/* ── Navigation mois ── */}
      <div className="bg-surface rounded-card border border-muted-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-muted-100 gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={prevMonth}
              className="p-1.5 rounded border border-muted-200 hover:bg-muted-50"
            >
              <ChevronLeft size={16} />
            </button>
            <h2 className="text-base sm:text-lg font-black text-navy min-w-[140px] sm:min-w-[180px] text-center">
              {MONTHS_FR[month]} {year}
            </h2>
            <button
              onClick={nextMonth}
              className="p-1.5 rounded border border-muted-200 hover:bg-muted-50"
            >
              <ChevronRight size={16} />
            </button>
          </div>
          <button
            onClick={goToday}
            className="text-xs font-semibold text-primary-600 hover:text-primary-700 border border-primary-200 px-3 py-1.5 rounded-btn flex-shrink-0"
          >
            Aujourd'hui
          </button>
        </div>

        {/* ── Desktop calendar grid (hidden on mobile) ── */}
        <div className="hidden sm:grid grid-cols-7">
          {DAYS_FR.map((d) => (
            <div
              key={d}
              className="py-2.5 text-center text-[11px] font-bold text-muted-500 uppercase tracking-wider border-b border-muted-100"
            >
              {d}
            </div>
          ))}

          {/* Empty cells before day 1 */}
          {[...Array(startOffset)].map((_, i) => (
            <div key={`empty-${i}`} className="h-28 border-b border-r border-muted-100 bg-muted-50/30" />
          ))}

          {/* Days */}
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
                  (i + startOffset + 1) % 7 === 0 && 'border-r-0',
                )}
              >
                <div className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold mb-1 transition-colors',
                  isToday
                    ? 'bg-primary-600 text-white'
                    : 'text-muted-600 group-hover:bg-primary-100 group-hover:text-primary-700',
                )}>
                  {day}
                </div>
                <div className="space-y-0.5 overflow-hidden">
                  {appts.slice(0, 3).map((a) => (
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

        {/* ── Mobile mini-grid (just day numbers) ── */}
        <div className="sm:hidden">
          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-muted-100">
            {DAYS_FR.map((d) => (
              <div
                key={d}
                className="py-2 text-center text-[10px] font-bold text-muted-500 uppercase"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Day number cells */}
          <div className="grid grid-cols-7">
            {[...Array(startOffset)].map((_, i) => (
              <div key={`empty-${i}`} className="h-10 border-b border-r border-muted-50" />
            ))}

            {[...Array(daysInMonth)].map((_, i) => {
              const day     = i + 1
              const appts   = getApptForDay(day)
              const isToday = new Date().toDateString() === new Date(year, month, day).toDateString()

              return (
                <div
                  key={day}
                  onClick={() => openNew(day)}
                  className={cn(
                    'h-10 border-b border-r border-muted-100 flex flex-col items-center justify-start pt-1 cursor-pointer transition-colors',
                    (i + startOffset + 1) % 7 === 0 && 'border-r-0',
                  )}
                >
                  <div className={cn(
                    'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                    isToday ? 'bg-primary-600 text-white' : 'text-muted-600',
                  )}>
                    {day}
                  </div>
                  {appts.length > 0 && (
                    <div
                      className="w-1.5 h-1.5 rounded-full mt-0.5"
                      style={{ backgroundColor: appts[0].color || '#3AA0D8' }}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Mobile agenda list ── */}
      <div className="sm:hidden bg-surface rounded-card shadow-card overflow-hidden">
        <div className="px-4 py-3 border-b border-muted-100 flex items-center gap-2">
          <Calendar size={15} className="text-primary-500" />
          <h3 className="text-sm font-semibold text-navy">
            Agenda — {MONTHS_FR[month]} {year}
          </h3>
        </div>
        {loading ? (
          <div className="divide-y divide-muted-100">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-4 space-y-1.5 animate-pulse">
                <div className="h-3.5 bg-muted-100 rounded w-1/3" />
                <div className="h-4 bg-muted-100 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : allThisMonth.length === 0 ? (
          <div className="py-10 text-center px-4">
            <Calendar size={28} className="mx-auto text-muted-300 mb-2" />
            <p className="text-sm text-muted-500">Aucun rendez-vous ce mois-ci.</p>
            <button
              onClick={() => { setSelectedDay(new Date()); setModal('new') }}
              className="btn-primary mt-3 inline-flex items-center gap-1.5 text-xs py-2 px-4"
            >
              <Plus size={13} /> Créer un RDV
            </button>
          </div>
        ) : (
          <div className="divide-y divide-muted-100">
            {allThisMonth.map((a) => {
              const start = new Date(a.start_at)
              return (
                <div
                  key={a.id}
                  onClick={() => setModal(a)}
                  className="flex items-start gap-3 p-4 cursor-pointer active:bg-muted-50 transition-colors"
                >
                  {/* Color dot + date */}
                  <div className="flex-shrink-0 flex flex-col items-center pt-0.5 w-10">
                    <span className="text-xs font-bold text-muted-700">
                      {start.toLocaleDateString('fr-FR', { day: '2-digit' })}
                    </span>
                    <span className="text-[10px] text-muted-500 uppercase">
                      {start.toLocaleDateString('fr-FR', { month: 'short' })}
                    </span>
                    <div
                      className="w-2 h-2 rounded-full mt-1"
                      style={{ backgroundColor: a.color || '#3AA0D8' }}
                    />
                  </div>
                  {/* Details */}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-navy truncate">{a.title}</p>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                      <span className="flex items-center gap-1 text-xs text-muted-500">
                        <Clock size={11} />
                        {start.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {a.customer?.name && (
                        <span className="flex items-center gap-1 text-xs text-muted-500">
                          <User size={11} /> {a.customer.name}
                        </span>
                      )}
                      {a.location && (
                        <span className="flex items-center gap-1 text-xs text-muted-500">
                          <MapPin size={11} /> {a.location}
                        </span>
                      )}
                    </div>
                  </div>
                  {/* Status badge */}
                  {(() => {
                    const s = STATUSES.find((st) => st.value === a.status)
                    return s ? (
                      <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0', s.color)}>
                        {s.label}
                      </span>
                    ) : null
                  })()}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Modal RDV ── */}
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
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}T${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`
  }

  const defaultStart = defaultDate ? toLocal(defaultDate) : toLocal(new Date())
  const defaultEnd   = defaultDate
    ? (() => { const d = new Date(defaultDate); d.setHours(d.getHours() + 1); return toLocal(d) })()
    : ''

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

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

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
    } catch {
      toast.error('Erreur lors de la sauvegarde.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!(await confirmDialog({
      title: 'Supprimer ce rendez-vous ?',
      text: 'Cette action est irréversible.',
      confirmText: 'Supprimer',
    }))) return
    try {
      await appointmentService.remove(appointment.id)
      toast.success('RDV supprimé.')
      onDeleted()
    } catch {
      toast.error('Erreur lors de la suppression.')
    }
  }

  return (
    /* Bottom-sheet on mobile, centered dialog on sm+ */
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'bg-white w-full sm:max-w-lg max-h-[95dvh] overflow-y-auto shadow-2xl',
          'rounded-t-2xl sm:rounded-2xl',
          'animate-in slide-in-from-bottom sm:animate-in sm:fade-in duration-200',
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-muted-100 sticky top-0 bg-white z-10">
          <h2 className="font-black text-navy">{isEdit ? 'Modifier le RDV' : 'Nouveau RDV'}</h2>
          <button type="button" onClick={onClose} className="p-1.5 rounded hover:bg-muted-100">
            <X size={20} className="text-muted-400 hover:text-muted-600" />
          </button>
        </div>

        <div className="px-4 sm:px-6 py-4 sm:py-5 space-y-4">
          {/* Titre */}
          <div>
            <label className="label-field">Titre *</label>
            <input
              className="input-field"
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              required
            />
          </div>

          {/* Client */}
          <div>
            <label className="label-field">Client</label>
            <select
              className="input-field"
              value={form.customer_id}
              onChange={(e) => set('customer_id', e.target.value)}
            >
              <option value="">— Aucun client —</option>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {/* Dates — stacked on mobile, side-by-side on sm+ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label-field">Début *</label>
              <input
                type="datetime-local"
                className="input-field"
                value={form.start_at}
                onChange={(e) => set('start_at', e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label-field">Fin *</label>
              <input
                type="datetime-local"
                className="input-field"
                value={form.end_at}
                onChange={(e) => set('end_at', e.target.value)}
                required
              />
            </div>
          </div>

          {/* Lieu */}
          <div>
            <label className="label-field">Lieu</label>
            <input
              className="input-field"
              value={form.location}
              onChange={(e) => set('location', e.target.value)}
              placeholder="Adresse, lien visio…"
            />
          </div>

          {/* Statut + Couleur — stack on very small screens */}
          <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
            <div className="flex-1">
              <label className="label-field">Statut</label>
              <select
                className="input-field"
                value={form.status}
                onChange={(e) => set('status', e.target.value)}
              >
                {STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-field">Couleur</label>
              <div className="flex gap-1.5 mt-1 flex-wrap">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => set('color', c)}
                    className={cn(
                      'w-7 h-7 rounded-full border-2 transition-all',
                      form.color === c ? 'border-navy scale-110' : 'border-transparent',
                    )}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="label-field">Notes</label>
            <textarea
              className="input-field"
              rows={3}
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-t border-muted-100 bg-muted-50 sticky bottom-0">
          {isEdit ? (
            <button
              type="button"
              onClick={handleDelete}
              className="flex items-center gap-1.5 text-sm text-red-600 hover:text-red-700 font-medium"
            >
              <Trash2 size={15} /> Supprimer
            </button>
          ) : <div />}
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="btn-outline text-sm">Annuler</button>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary flex items-center gap-1.5 text-sm"
            >
              <Check size={15} />
              {saving ? 'Sauvegarde…' : isEdit ? 'Mettre à jour' : 'Créer'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
