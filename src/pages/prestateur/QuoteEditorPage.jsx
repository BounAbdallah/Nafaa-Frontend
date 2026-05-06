import { useEffect, useState, useCallback } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { quoteService, templateService } from '@/services/prestateurService'
import { customerService } from '@/services/customerService'
import DocumentEditor from '@/components/prestateur/DocumentEditor'
import toast from 'react-hot-toast'
import {
  ArrowLeft, Save, Printer, Plus, Trash2, Loader2, ArrowRightLeft, Download, Eye,
} from 'lucide-react'
import { cn } from '@/utils/cn'

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt  = (n) => new Intl.NumberFormat('fr-FR').format(Number(n) || 0) + ' FCFA'
const today = () => new Date().toISOString().slice(0, 10)
const addDays = (d, n) => {
  const dt = new Date(d)
  dt.setDate(dt.getDate() + n)
  return dt.toISOString().slice(0, 10)
}

const STATUS_OPTIONS = [
  { value: 'draft',    label: 'Brouillon' },
  { value: 'sent',     label: 'Envoyé' },
  { value: 'accepted', label: 'Accepté' },
  { value: 'rejected', label: 'Refusé' },
  { value: 'expired',  label: 'Expiré' },
]

const STATUS_BADGE = {
  draft:    'bg-muted-100 text-muted-600',
  sent:     'bg-blue-50 text-blue-600',
  accepted: 'bg-green-50 text-success',
  rejected: 'bg-red-50 text-danger',
  expired:  'bg-orange-50 text-orange-600',
}

const EMPTY_LINE = () => ({ description: '', quantity: 1, unit_price: 0, total: 0 })

const EMPTY_FORM = () => ({
  customer_id:  '',
  title:        '',
  issued_at:    today(),
  expires_at:   addDays(today(), 30),
  status:       'draft',
  currency:     'FCFA',
  notes:        '',
  terms:        '',
  tax_rate:     18,
  discount:     0,
  content:      '',
  items:        [EMPTY_LINE()],
})

// ── Ligne de devis ─────────────────────────────────────────────────────────────
function ItemRow({ item, index, onChange, onRemove, isLast }) {
  const update = (field, value) => {
    const updated = { ...item, [field]: value }
    updated.total = (Number(updated.quantity) || 0) * (Number(updated.unit_price) || 0)
    onChange(index, updated)
  }

  return (
    <tr className="border-b border-muted-100 group">
      <td className="py-2 px-3">
        <input
          value={item.description}
          onChange={(e) => update('description', e.target.value)}
          placeholder="Description de la prestation…"
          className="input-field text-sm py-1.5"
        />
      </td>
      <td className="py-2 px-3 w-24">
        <input
          type="number"
          min="0"
          step="1"
          value={item.quantity}
          onChange={(e) => update('quantity', e.target.value)}
          className="input-field text-sm py-1.5 text-right"
        />
      </td>
      <td className="py-2 px-3 w-36">
        <input
          type="number"
          min="0"
          step="100"
          value={item.unit_price}
          onChange={(e) => update('unit_price', e.target.value)}
          className="input-field text-sm py-1.5 text-right"
        />
      </td>
      <td className="py-2 px-3 w-36 text-right">
        <span className="text-sm font-semibold text-navy">
          {new Intl.NumberFormat('fr-FR').format(item.total || 0)}
        </span>
      </td>
      <td className="py-2 px-2 w-10">
        {!isLast && (
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="p-1 rounded text-muted-400 hover:text-danger hover:bg-danger/5 transition-colors opacity-0 group-hover:opacity-100"
          >
            <Trash2 size={13} />
          </button>
        )}
      </td>
    </tr>
  )
}

export default function QuoteEditorPage() {
  const { id }     = useParams()
  const navigate   = useNavigate()
  const isNew      = !id || id === 'new'

  const [form, setForm]         = useState(EMPTY_FORM())
  const [customers, setCustomers] = useState([])
  const [loading, setLoading]   = useState(!isNew)
  const [saving, setSaving]     = useState(false)
  const [converting, setConverting] = useState(false)

  // Calculs financiers
  const subtotal  = form.items.reduce((s, i) => s + (Number(i.total) || 0), 0)
  const taxAmt    = Math.round(subtotal * (Number(form.tax_rate) || 0) / 100)
  const discountAmt = Number(form.discount) || 0
  const total     = subtotal + taxAmt - discountAmt

  // Charger les clients
  useEffect(() => {
    customerService.getAll({ per_page: 200 })
      .then((r) => {
        const list = r?.data?.customers ?? r?.data?.data ?? r?.data ?? []
        setCustomers(Array.isArray(list) ? list : [])
      })
      .catch(() => toast.error('Impossible de charger les clients.'))
  }, [])

  // Charger le devis existant ou le template par défaut
  useEffect(() => {
    if (!isNew) {
      setLoading(true)
      quoteService.get(id)
        .then((res) => {
          const d = res.data?.data ?? res.data
          setForm({
            ...EMPTY_FORM(),
            ...d,
            customer_id: d.customer_id ?? d.customer?.id ?? '',
            items:       d.items?.length ? d.items : [EMPTY_LINE()],
            content:     d.content  ?? '',
            notes:       d.notes    ?? '',
            terms:       d.terms    ?? '',
            issued_at:   d.issued_at  ? d.issued_at.slice(0, 10)  : today(),
            expires_at:  d.expires_at ? d.expires_at.slice(0, 10) : addDays(today(), 30),
          })
        })
        .catch(() => toast.error('Devis introuvable.'))
        .finally(() => setLoading(false))
    } else {
      // Charger le template par défaut si création
      templateService.getAll('quote')
        .then((res) => {
          const list = res.data?.data ?? res.data ?? []
          const def  = Array.isArray(list) ? list.find((t) => t.is_default) ?? list[0] : null
          if (def?.content) setForm((f) => ({ ...f, content: def.content }))
        })
        .catch(() => {})
    }
  }, [id, isNew])

  const setField = useCallback((field, value) => {
    setForm((f) => ({ ...f, [field]: value }))
  }, [])

  const handleItemChange = (index, updated) => {
    setForm((f) => {
      const items = [...f.items]
      items[index] = updated
      return { ...f, items }
    })
  }

  const addItem = () => setForm((f) => ({ ...f, items: [...f.items, EMPTY_LINE()] }))

  const removeItem = (index) => {
    setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== index) }))
  }

  const handleSave = async () => {
    if (!form.customer_id) { toast.error('Veuillez sélectionner un client.'); return }
    if (!form.title)        { toast.error('Le titre est requis.');              return }

    setSaving(true)
    try {
      const payload = {
        ...form,
        items: form.items.filter(i => String(i.description ?? '').trim() !== ''),
      }
      if (isNew) {
        const res = await quoteService.create(payload)
        const newId = res.data?.data?.id ?? res.data?.id
        toast.success('Devis créé.')
        navigate(`/prestateur/quotes/${newId}`, { replace: true })
      } else {
        await quoteService.update(id, payload)
        toast.success('Devis mis à jour.')
      }
    } catch (err) {
      const msg = err.response?.data?.message ?? 'Erreur lors de la sauvegarde.'
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  const handleConvert = async () => {
    if (!window.confirm('Convertir ce devis en facture ?')) return
    setConverting(true)
    try {
      const res = await quoteService.convertInvoice(id)
      toast.success('Converti en facture.')
      const invoiceId = res.data?.data?.id ?? res.data?.id
      if (invoiceId) navigate(`/prestateur/invoices/${invoiceId}`)
    } catch {
      toast.error('Erreur lors de la conversion.')
    } finally {
      setConverting(false)
    }
  }

  const handleDownloadPdf = async () => {
    try {
      const res = await quoteService.downloadPdf(id)
      const blob = new Blob([res.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `devis-${form.reference || id}.pdf`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch {
      toast.error('Erreur lors du téléchargement du PDF.')
    }
  }

  const handlePreviewPdf = async () => {
    try {
      const res = await quoteService.downloadPdf(id)
      const blob = new Blob([res.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      window.open(url, '_blank')
    } catch {
      toast.error('Erreur lors de la prévisualisation du PDF.')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={28} className="animate-spin text-primary-500" />
      </div>
    )
  }

  const statusLabel = STATUS_OPTIONS.find((s) => s.value === form.status)?.label ?? form.status

  return (
    <div className="space-y-5 print:space-y-3">
      {/* Header */}
      <div className="flex items-center gap-4 print:hidden">
        <Link to="/prestateur/quotes" className="p-2 rounded text-muted-500 hover:text-navy hover:bg-muted-100">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-display font-bold text-navy">
              {isNew ? 'Nouveau devis' : `Devis ${form.reference ?? ''}`}
            </h1>
            {!isNew && (
              <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', STATUS_BADGE[form.status] ?? 'bg-muted-100 text-muted-600')}>
                {statusLabel}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {!isNew && form.status === 'accepted' && (
            <button
              onClick={handleConvert}
              disabled={converting}
              className="btn-outline flex items-center gap-2 text-green-700 border-green-300 hover:bg-green-50"
            >
              {converting ? <Loader2 size={14} className="animate-spin" /> : <ArrowRightLeft size={14} />}
              Convertir en facture
            </button>
          )}
          {!isNew && (
            <>
              <button
                onClick={handlePreviewPdf}
                className="btn-outline flex items-center gap-2"
              >
                <Eye size={14} /> Aperçu PDF
              </button>
              <button
                onClick={handleDownloadPdf}
                className="btn-outline flex items-center gap-2 text-primary-700 border-primary-300 hover:bg-primary-50"
              >
                <Download size={14} /> Télécharger PDF
              </button>
            </>
          )}
          <button
            onClick={() => window.print()}
            className="btn-outline flex items-center gap-2"
          >
            <Printer size={14} /> Imprimer
          </button>
          <Link to="/prestateur/quotes" className="btn-outline">Annuler</Link>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary flex items-center gap-2"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {saving ? 'Enregistrement…' : 'Sauvegarder'}
          </button>
        </div>
      </div>

      {/* Formulaire */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 print:grid-cols-2 print:gap-3">
        {/* Colonne gauche */}
        <div className="bg-surface rounded-card shadow-card p-5 space-y-4">
          <h2 className="text-sm font-semibold text-navy uppercase tracking-wide border-b border-muted-100 pb-2">
            Informations générales
          </h2>

          {/* Client */}
          <div className="space-y-1.5">
            <label className="label-field">Client *</label>
            <select
              value={form.customer_id}
              onChange={(e) => setField('customer_id', e.target.value)}
              className="input-field appearance-none"
            >
              <option value="">— Sélectionner un client —</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Titre */}
          <div className="space-y-1.5">
            <label className="label-field">Titre *</label>
            <input
              value={form.title}
              onChange={(e) => setField('title', e.target.value)}
              placeholder="Objet du devis…"
              className="input-field"
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="label-field">Date d'émission</label>
              <input
                type="date"
                value={form.issued_at}
                onChange={(e) => setField('issued_at', e.target.value)}
                className="input-field"
              />
            </div>
            <div className="space-y-1.5">
              <label className="label-field">Date d'expiration</label>
              <input
                type="date"
                value={form.expires_at}
                onChange={(e) => setField('expires_at', e.target.value)}
                className="input-field"
              />
            </div>
          </div>

          {/* Statut + Devise */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="label-field">Statut</label>
              <select
                value={form.status}
                onChange={(e) => setField('status', e.target.value)}
                className="input-field appearance-none"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="label-field">Devise</label>
              <select
                value={form.currency}
                onChange={(e) => setField('currency', e.target.value)}
                className="input-field appearance-none"
              >
                <option value="FCFA">FCFA</option>
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="label-field">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setField('notes', e.target.value)}
              rows={3}
              placeholder="Notes internes ou message pour le client…"
              className="input-field resize-none"
            />
          </div>

          {/* Conditions */}
          <div className="space-y-1.5">
            <label className="label-field">Conditions générales</label>
            <textarea
              value={form.terms}
              onChange={(e) => setField('terms', e.target.value)}
              rows={3}
              placeholder="Conditions de paiement, délais, modalités…"
              className="input-field resize-none"
            />
          </div>
        </div>

        {/* Colonne droite — lignes + totaux */}
        <div className="bg-surface rounded-card shadow-card p-5 space-y-4">
          <h2 className="text-sm font-semibold text-navy uppercase tracking-wide border-b border-muted-100 pb-2">
            Lignes du devis
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-muted-200">
                  <th className="text-left py-2 px-3 text-xs font-semibold text-muted-600 uppercase">Description</th>
                  <th className="text-right py-2 px-3 text-xs font-semibold text-muted-600 uppercase w-24">Qté</th>
                  <th className="text-right py-2 px-3 text-xs font-semibold text-muted-600 uppercase w-36">P.U.</th>
                  <th className="text-right py-2 px-3 text-xs font-semibold text-muted-600 uppercase w-36">Total</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {form.items.map((item, i) => (
                  <ItemRow
                    key={i}
                    item={item}
                    index={i}
                    onChange={handleItemChange}
                    onRemove={removeItem}
                    isLast={form.items.length === 1}
                  />
                ))}
              </tbody>
            </table>
          </div>

          <button
            type="button"
            onClick={addItem}
            className="btn-outline flex items-center gap-2 text-sm w-full justify-center print:hidden"
          >
            <Plus size={14} /> Ajouter une ligne
          </button>

          {/* Totaux */}
          <div className="border-t border-muted-200 pt-4 space-y-2">
            <div className="flex justify-between text-sm text-muted-600">
              <span>Sous-total</span>
              <span className="font-semibold text-navy">{fmt(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-muted-600">
              <div className="flex items-center gap-2">
                <span>TVA</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={form.tax_rate}
                  onChange={(e) => setField('tax_rate', e.target.value)}
                  className="input-field py-0.5 px-2 w-16 text-right text-xs"
                />
                <span className="text-xs">%</span>
              </div>
              <span className="font-semibold text-navy">{fmt(taxAmt)}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-muted-600">
              <div className="flex items-center gap-2">
                <span>Remise</span>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={form.discount}
                  onChange={(e) => setField('discount', e.target.value)}
                  className="input-field py-0.5 px-2 w-28 text-right text-xs"
                />
              </div>
              <span className="font-semibold text-navy">-{fmt(discountAmt)}</span>
            </div>
            <div className="flex justify-between text-base font-bold text-navy border-t border-muted-200 pt-2">
              <span>TOTAL</span>
              <span className="text-primary-600">{fmt(total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Éditeur TipTap */}
      <div className="bg-surface rounded-card shadow-card p-5 space-y-3">
        <h2 className="text-sm font-semibold text-navy uppercase tracking-wide border-b border-muted-100 pb-2">
          Corps du devis
        </h2>
        <DocumentEditor
          content={form.content}
          onChange={(html) => setField('content', html)}
          editable={true}
          minHeight="350px"
        />
      </div>
    </div>
  )
}
