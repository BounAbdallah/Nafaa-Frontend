import { useEffect, useState, useCallback } from 'react'
import { accountingService } from '@/services/financeService'
import { useCurrency } from '@/utils/currency'
import toast from 'react-hot-toast'
import {
  BookOpen, Plus, Trash2, Loader2, ChevronDown, ChevronUp, X, Search,
} from 'lucide-react'
import { cn } from '@/utils/cn'

const todayISO      = () => new Date().toISOString().slice(0, 10)
const monthStartISO = () => { const d = new Date(); d.setDate(1); return d.toISOString().slice(0, 10) }

const SOURCE_LABELS = {
  manual:        'Manuel',
  sale:          'Vente',
  expense:       'Dépense',
  cash_movement: 'Trésorerie',
  purchase:      'Achat',
}

function EntryRow({ entry, onDelete }) {
  const { format: fmt } = useCurrency()
  const [open, setOpen] = useState(false)

  return (
    <div className="border-b border-muted-100 last:border-0">
      <div
        className="flex items-center gap-3 px-4 py-3 hover:bg-muted-50 cursor-pointer"
        onClick={() => setOpen(o => !o)}
      >
        <div className="text-xs text-muted-400 w-24 shrink-0">{entry.entry_date}</div>
        <div className="text-xs font-mono text-muted-500 w-28 shrink-0">{entry.reference}</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-navy truncate">{entry.description}</p>
          <p className="text-xs text-muted-400">{SOURCE_LABELS[entry.source] ?? entry.source}</p>
        </div>
        <div className="text-right shrink-0 w-24">
          <p className="text-sm font-bold text-navy">{fmt(entry.total_debit)}</p>
        </div>
        <div className="flex items-center gap-1 ml-2">
          {entry.source === 'manual' && !entry.is_locked && (
            <button
              onClick={e => { e.stopPropagation(); onDelete(entry.id) }}
              className="text-muted-300 hover:text-danger p-1"
            >
              <Trash2 size={13} />
            </button>
          )}
          {open ? <ChevronUp size={14} className="text-muted-400" /> : <ChevronDown size={14} className="text-muted-400" />}
        </div>
      </div>

      {open && (
        <div className="bg-muted-50 px-4 pb-3">
          <table className="w-full text-xs mt-2">
            <thead>
              <tr className="text-muted-400 border-b border-muted-200">
                <th className="text-left pb-1 font-medium">Compte</th>
                <th className="text-left pb-1 font-medium">Libellé</th>
                <th className="text-right pb-1 font-medium">Débit</th>
                <th className="text-right pb-1 font-medium">Crédit</th>
              </tr>
            </thead>
            <tbody>
              {entry.lines.map((l, i) => (
                <tr key={i} className="border-b border-muted-100 last:border-0">
                  <td className="py-1 font-mono">{l.account_number} — {l.account_label}</td>
                  <td className="py-1 text-muted-500">{l.label ?? '—'}</td>
                  <td className="py-1 text-right">{l.debit > 0 ? fmt(l.debit) : ''}</td>
                  <td className="py-1 text-right">{l.credit > 0 ? fmt(l.credit) : ''}</td>
                </tr>
              ))}
              <tr className="border-t border-muted-300 font-bold">
                <td colSpan={2} className="py-1 text-muted-500">Total</td>
                <td className="py-1 text-right">{fmt(entry.total_debit)}</td>
                <td className="py-1 text-right">{fmt(entry.total_credit)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function NewEntryModal({ accounts, onClose, onSaved }) {
  const { format: fmt } = useCurrency()
  const [saving, setSaving] = useState(false)
  const [form, setForm]     = useState({
    description: '',
    entry_date:  todayISO(),
    lines: [
      { account_number: '', debit: '', credit: '', label: '' },
      { account_number: '', debit: '', credit: '', label: '' },
    ],
  })

  const updateLine = (i, field, value) => {
    setForm(f => {
      const lines = [...f.lines]
      lines[i] = { ...lines[i], [field]: value }
      return { ...f, lines }
    })
  }

  const addLine = () => setForm(f => ({
    ...f, lines: [...f.lines, { account_number: '', debit: '', credit: '', label: '' }],
  }))

  const removeLine = (i) => setForm(f => ({ ...f, lines: f.lines.filter((_, idx) => idx !== i) }))

  const totalDebit  = form.lines.reduce((s, l) => s + (parseFloat(l.debit)  || 0), 0)
  const totalCredit = form.lines.reduce((s, l) => s + (parseFloat(l.credit) || 0), 0)
  const balanced    = Math.abs(totalDebit - totalCredit) < 0.01

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!balanced) return toast.error('L\'écriture n\'est pas équilibrée (débits ≠ crédits).')
    setSaving(true)
    try {
      const lines = form.lines
        .filter(l => l.account_number)
        .map(l => ({ ...l, debit: parseFloat(l.debit) || 0, credit: parseFloat(l.credit) || 0 }))
      await accountingService.createEntry({ ...form, lines })
      toast.success('Écriture enregistrée.')
      onSaved()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Erreur.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-muted-100">
          <h2 className="font-display font-bold text-navy text-lg">Nouvelle écriture comptable</h2>
          <button onClick={onClose}><X size={18} className="text-muted-400" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-field">Description *</label>
              <input className="input-field" required value={form.description}
                onChange={e => setForm(f => ({...f, description: e.target.value}))} />
            </div>
            <div>
              <label className="label-field">Date *</label>
              <input className="input-field" type="date" required value={form.entry_date}
                onChange={e => setForm(f => ({...f, entry_date: e.target.value}))} />
            </div>
          </div>

          {/* Lignes */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-muted-500 uppercase tracking-wide">Lignes d'écriture</label>
              <button type="button" onClick={addLine} className="text-xs text-primary-500 hover:underline flex items-center gap-1">
                <Plus size={12} /> Ajouter une ligne
              </button>
            </div>
            <div className="border border-muted-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted-50 text-xs text-muted-500">
                    <th className="text-left p-2 font-medium">Compte</th>
                    <th className="text-left p-2 font-medium">Libellé</th>
                    <th className="text-right p-2 font-medium">Débit</th>
                    <th className="text-right p-2 font-medium">Crédit</th>
                    <th className="p-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {form.lines.map((line, i) => (
                    <tr key={i} className="border-t border-muted-100">
                      <td className="p-1.5">
                        <select className="input-field text-xs py-1"
                          value={line.account_number}
                          onChange={e => updateLine(i, 'account_number', e.target.value)}>
                          <option value="">— Choisir —</option>
                          {accounts.map(a => (
                            <option key={a.number} value={a.number}>{a.number} — {a.label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="p-1.5">
                        <input className="input-field text-xs py-1" placeholder="Libellé"
                          value={line.label} onChange={e => updateLine(i, 'label', e.target.value)} />
                      </td>
                      <td className="p-1.5 w-28">
                        <input className="input-field text-xs py-1 text-right" type="number" min="0" step="any"
                          placeholder="0" value={line.debit}
                          onChange={e => updateLine(i, 'debit', e.target.value)} />
                      </td>
                      <td className="p-1.5 w-28">
                        <input className="input-field text-xs py-1 text-right" type="number" min="0" step="any"
                          placeholder="0" value={line.credit}
                          onChange={e => updateLine(i, 'credit', e.target.value)} />
                      </td>
                      <td className="p-1.5">
                        {form.lines.length > 2 && (
                          <button type="button" onClick={() => removeLine(i)} className="text-muted-300 hover:text-danger">
                            <X size={13} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-muted-200 bg-muted-50 text-xs font-bold">
                    <td colSpan={2} className="p-2 text-muted-500">Totaux</td>
                    <td className={cn('p-2 text-right', balanced ? 'text-success' : 'text-danger')}>{fmt(totalDebit)}</td>
                    <td className={cn('p-2 text-right', balanced ? 'text-success' : 'text-danger')}>{fmt(totalCredit)}</td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>
            {!balanced && totalDebit > 0 && (
              <p className="text-xs text-danger mt-1">⚠ Écart : {fmt(Math.abs(totalDebit - totalCredit))}</p>
            )}
          </div>

          <div className="flex gap-3 justify-end pt-2 border-t border-muted-100">
            <button type="button" onClick={onClose} className="btn-secondary text-sm">Annuler</button>
            <button type="submit" disabled={saving || !balanced} className="btn-primary text-sm flex items-center gap-2">
              {saving && <Loader2 size={13} className="animate-spin" />} Valider l'écriture
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function JournalPage() {
  const [entries, setEntries]   = useState([])
  const [accounts, setAccounts] = useState([])
  const [meta, setMeta]         = useState(null)
  const [loading, setLoading]   = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [from, setFrom]         = useState(monthStartISO())
  const [to, setTo]             = useState(todayISO())
  const [search, setSearch]     = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [jRes, aRes] = await Promise.all([
        accountingService.getJournal({ from, to, search }),
        accountingService.getAccounts(),
      ])
      setEntries(jRes.data.entries.data ?? jRes.data.entries)
      setMeta(jRes.data.meta)
      setAccounts(aRes.data.accounts)
    } catch (err) {
      if (err.response?.status === 500) {
        // Plan des comptes probablement pas initialisé
        try {
          await accountingService.initChart()
          load()
        } catch { toast.error('Impossible de charger le journal.') }
      } else {
        toast.error(err.response?.data?.message ?? 'Impossible de charger le journal.')
      }
    } finally {
      setLoading(false)
    }
  }, [from, to, search])

  useEffect(() => { load() }, [load])

  const handleDelete = async (id) => {
    if (!confirm('Supprimer cette écriture ?')) return
    try {
      await accountingService.deleteEntry(id)
      toast.success('Écriture supprimée.')
      load()
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Impossible de supprimer.')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-display font-bold text-navy flex items-center gap-2">
            <BookOpen size={18} className="text-primary-500" /> Journal des écritures
          </h2>
          <p className="text-xs text-muted-400 mt-0.5">Toutes les écritures comptables en partie double.</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary text-sm flex items-center gap-2 self-start sm:self-auto">
          <Plus size={14} /> Nouvelle écriture
        </button>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap items-center gap-2">
        <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="input-field h-9 text-sm" />
        <span className="text-muted-400 text-xs">→</span>
        <input type="date" value={to}   onChange={e => setTo(e.target.value)}   className="input-field h-9 text-sm" />
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-400" />
          <input className="input-field h-9 text-sm pl-8 w-48" placeholder="Rechercher…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Liste */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-primary-500" /></div>
      ) : entries.length === 0 ? (
        <div className="card p-10 text-center text-muted-400 text-sm">
          Aucune écriture sur la période.<br />
          <span className="text-xs">Les ventes et dépenses sont automatiquement comptabilisées lors de leur saisie.</span>
        </div>
      ) : (
        <div className="card">
          {/* Header tableau */}
          <div className="flex items-center gap-3 px-4 py-2 border-b border-muted-100 bg-muted-50 text-xs text-muted-500 font-medium">
            <span className="w-24 shrink-0">Date</span>
            <span className="w-28 shrink-0">Référence</span>
            <span className="flex-1">Description</span>
            <span className="w-24 text-right">Montant</span>
            <span className="w-8"></span>
          </div>
          {entries.map(e => (
            <EntryRow key={e.id} entry={e} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {showForm && (
        <NewEntryModal
          accounts={accounts}
          onClose={() => setShowForm(false)}
          onSaved={load}
        />
      )}
    </div>
  )
}
