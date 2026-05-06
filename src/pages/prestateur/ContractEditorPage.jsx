import { useEffect, useState, useCallback } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { contractService, quoteService, templateService } from '@/services/prestateurService'
import { customerService } from '@/services/customerService'
import DocumentEditor from '@/components/prestateur/DocumentEditor'
import toast from 'react-hot-toast'
import {
  ArrowLeft, Save, Printer, Loader2, LayoutTemplate, ChevronDown,
  ChevronUp, Info,
} from 'lucide-react'
import { cn } from '@/utils/cn'

// ── Helpers ───────────────────────────────────────────────────────────────────
const today = () => new Date().toISOString().slice(0, 10)

const STATUS_OPTIONS = [
  { value: 'draft',     label: 'Brouillon' },
  { value: 'sent',      label: 'Envoyé' },
  { value: 'signed',    label: 'Signé' },
  { value: 'expired',   label: 'Expiré' },
  { value: 'cancelled', label: 'Annulé' },
]

const STATUS_BADGE = {
  draft:     'bg-muted-100 text-muted-600',
  sent:      'bg-blue-50 text-blue-600',
  signed:    'bg-green-50 text-success',
  expired:   'bg-orange-50 text-orange-600',
  cancelled: 'bg-muted-100 text-muted-500',
}

const VARIABLES = [
  { key: '{{nom_client}}',       label: 'Nom client' },
  { key: '{{adresse_client}}',   label: 'Adresse client' },
  { key: '{{email_client}}',     label: 'Email client' },
  { key: '{{telephone_client}}', label: 'Tél. client' },
  { key: '{{reference}}',        label: 'Référence' },
  { key: '{{date}}',             label: 'Date' },
  { key: '{{date_signature}}',   label: 'Date de signature' },
  { key: '{{date_debut}}',       label: 'Date de début' },
  { key: '{{date_fin}}',         label: 'Date de fin' },
  { key: '{{montant_total}}',    label: 'Montant total' },
  { key: '{{nom_prestataire}}',  label: 'Nom prestataire' },
]

const EMPTY_FORM = () => ({
  customer_id:   '',
  quote_id:      '',
  title:         '',
  signed_at:     '',
  start_at:      today(),
  end_at:        '',
  status:        'draft',
  value:         '',
  currency:      'FCFA',
  notes:         '',
  body:          '',
})

export default function ContractEditorPage() {
  const { id }   = useParams()
  const navigate = useNavigate()
  const isNew    = !id || id === 'new'

  const [form, setForm]           = useState(EMPTY_FORM())
  const [customers, setCustomers] = useState([])
  const [quotes, setQuotes]       = useState([])
  const [templates, setTemplates] = useState([])
  const [loading, setLoading]     = useState(!isNew)
  const [saving, setSaving]       = useState(false)
  const [showTemplates, setShowTemplates] = useState(true)
  const [showVariables, setShowVariables] = useState(false)
  const [applyingTpl, setApplyingTpl]     = useState(null)

  // Charger clients + devis + templates
  useEffect(() => {
    customerService.getAll({ per_page: 200 })
      .then((r) => {
        const list = r?.data?.customers ?? r?.data?.data ?? r?.data ?? []
        setCustomers(Array.isArray(list) ? list : [])
      })
      .catch(() => {})

    quoteService.getAll({ per_page: 200, status: 'accepted' })
      .then((r) => {
        const d = r.data?.data ?? r.data
        setQuotes(Array.isArray(d) ? d : d?.data ?? [])
      })
      .catch(() => {})

    templateService.getAll('contract')
      .then((r) => {
        const list = r.data?.data ?? r.data ?? []
        setTemplates(Array.isArray(list) ? list : [])
      })
      .catch(() => {})
  }, [])

  // Charger le contrat existant
  useEffect(() => {
    if (!isNew) {
      setLoading(true)
      contractService.get(id)
        .then((res) => {
          const d = res.data?.data ?? res.data
          setForm({
            ...EMPTY_FORM(),
            ...d,
            customer_id: d.customer_id ?? d.customer?.id ?? '',
            quote_id:    d.quote_id  ?? '',
            body:        d.body      ?? '',
            notes:       d.notes     ?? '',
            signed_at:   d.signed_at ? d.signed_at.slice(0, 10) : '',
            start_at:    d.start_at  ? d.start_at.slice(0, 10)  : today(),
            end_at:      d.end_at    ? d.end_at.slice(0, 10)    : '',
          })
        })
        .catch(() => toast.error('Contrat introuvable.'))
        .finally(() => setLoading(false))
    }
  }, [id, isNew])

  const setField = useCallback((field, value) => {
    setForm((f) => ({ ...f, [field]: value }))
  }, [])

  const handleApplyTemplate = async (tpl) => {
    if (!window.confirm(`Appliquer le template "${tpl.name}" ? Le contenu actuel sera remplacé.`)) return
    setApplyingTpl(tpl.id)
    try {
      // Si le template a du contenu directement
      if (tpl.body) {
        setForm((f) => ({ ...f, body: tpl.body }))
        toast.success(`Template "${tpl.name}" appliqué.`)
      } else {
        // Charger via API si besoin
        const res = await templateService.getAll('contract')
        const list = res.data?.data ?? res.data ?? []
        const full = Array.isArray(list) ? list.find((t) => t.id === tpl.id) : null
        if (full?.body) {
          setForm((f) => ({ ...f, body: full.body }))
          toast.success(`Template "${tpl.name}" appliqué.`)
        } else {
          toast.error('Ce template ne contient pas de contenu.')
        }
      }
    } catch {
      toast.error('Impossible de charger le template.')
    } finally {
      setApplyingTpl(null)
    }
  }

  const handleSave = async () => {
    if (!form.customer_id) { toast.error('Veuillez sélectionner un client.'); return }
    if (!form.title)        { toast.error('Le titre est requis.');              return }

    setSaving(true)
    try {
      const payload = { ...form }
      if (!payload.quote_id) delete payload.quote_id
      if (!payload.value)    delete payload.value

      if (isNew) {
        const res = await contractService.create(payload)
        const newId = res.data?.data?.id ?? res.data?.id
        toast.success('Contrat créé.')
        navigate(`/prestateur/contracts/${newId}`, { replace: true })
      } else {
        await contractService.update(id, payload)
        toast.success('Contrat mis à jour.')
      }
    } catch (err) {
      const msg = err.response?.data?.message ?? 'Erreur lors de la sauvegarde.'
      toast.error(msg)
    } finally {
      setSaving(false)
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
        <Link to="/prestateur/contracts" className="p-2 rounded text-muted-500 hover:text-navy hover:bg-muted-100">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-display font-bold text-navy">
              {isNew ? 'Nouveau contrat' : `Contrat ${form.reference ?? ''}`}
            </h1>
            {!isNew && (
              <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', STATUS_BADGE[form.status] ?? 'bg-muted-100 text-muted-600')}>
                {statusLabel}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => window.print()} className="btn-outline flex items-center gap-2">
            <Printer size={14} /> Imprimer
          </button>
          <Link to="/prestateur/contracts" className="btn-outline">Annuler</Link>
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

      {/* Corps de la page : formulaire + panneaux latéraux */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-5">
        {/* Colonne principale */}
        <div className="space-y-5">
          {/* Formulaire infos */}
          <div className="bg-surface rounded-card shadow-card p-5 space-y-4">
            <h2 className="text-sm font-semibold text-navy uppercase tracking-wide border-b border-muted-100 pb-2">
              Informations du contrat
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Client */}
              <div className="space-y-1.5 sm:col-span-2">
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
              <div className="space-y-1.5 sm:col-span-2">
                <label className="label-field">Titre *</label>
                <input
                  value={form.title}
                  onChange={(e) => setField('title', e.target.value)}
                  placeholder="Objet du contrat…"
                  className="input-field"
                />
              </div>

              {/* Devis lié */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="label-field">Devis lié (optionnel)</label>
                <select
                  value={form.quote_id}
                  onChange={(e) => setField('quote_id', e.target.value)}
                  className="input-field appearance-none"
                >
                  <option value="">— Aucun devis lié —</option>
                  {quotes.map((q) => (
                    <option key={q.id} value={q.id}>
                      {q.reference} — {q.title} ({q.customer?.name})
                    </option>
                  ))}
                </select>
              </div>

              {/* Date de signature */}
              <div className="space-y-1.5">
                <label className="label-field">Date de signature</label>
                <input
                  type="date"
                  value={form.signed_at}
                  onChange={(e) => setField('signed_at', e.target.value)}
                  className="input-field"
                />
              </div>

              {/* Statut */}
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

              {/* Dates début/fin */}
              <div className="space-y-1.5">
                <label className="label-field">Date de début</label>
                <input
                  type="date"
                  value={form.start_at}
                  onChange={(e) => setField('start_at', e.target.value)}
                  className="input-field"
                />
              </div>

              <div className="space-y-1.5">
                <label className="label-field">Date de fin</label>
                <input
                  type="date"
                  value={form.end_at}
                  onChange={(e) => setField('end_at', e.target.value)}
                  className="input-field"
                />
              </div>

              {/* Valeur + Devise */}
              <div className="space-y-1.5">
                <label className="label-field">Valeur du contrat</label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={form.value}
                  onChange={(e) => setField('value', e.target.value)}
                  placeholder="0"
                  className="input-field"
                />
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

              {/* Notes */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="label-field">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setField('notes', e.target.value)}
                  rows={3}
                  placeholder="Notes internes ou instructions complémentaires…"
                  className="input-field resize-none"
                />
              </div>
            </div>
          </div>

          {/* Éditeur TipTap */}
          <div className="bg-surface rounded-card shadow-card p-5 space-y-3">
            <h2 className="text-sm font-semibold text-navy uppercase tracking-wide border-b border-muted-100 pb-2">
              Corps du contrat
            </h2>
            <DocumentEditor
              content={form.body}
              onChange={(html) => setField('body', html)}
              editable={true}
              minHeight="600px"
            />
          </div>
        </div>

        {/* Colonne droite — Templates + Variables */}
        <div className="space-y-4 print:hidden">
          {/* Panneau Templates */}
          <div className="bg-surface rounded-card shadow-card overflow-hidden">
            <button
              type="button"
              onClick={() => setShowTemplates((v) => !v)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-muted-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <LayoutTemplate size={15} className="text-primary-500" />
                <span className="text-sm font-semibold text-navy">Templates</span>
                {templates.length > 0 && (
                  <span className="text-xs bg-primary-100 text-primary-700 px-1.5 py-0.5 rounded-full font-semibold">
                    {templates.length}
                  </span>
                )}
              </div>
              {showTemplates ? <ChevronUp size={15} className="text-muted-400" /> : <ChevronDown size={15} className="text-muted-400" />}
            </button>

            {showTemplates && (
              <div className="border-t border-muted-100">
                {templates.length === 0 ? (
                  <div className="p-4 text-center">
                    <p className="text-xs text-muted-500">Aucun template disponible.</p>
                    <p className="text-xs text-muted-400 mt-1">Importez un PDF depuis la liste des contrats.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-muted-100">
                    {templates.map((tpl) => (
                      <div key={tpl.id} className="p-3 flex items-center justify-between gap-2 hover:bg-muted-50">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-navy truncate">{tpl.name}</p>
                          {tpl.description && (
                            <p className="text-[11px] text-muted-500 truncate mt-0.5">{tpl.description}</p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleApplyTemplate(tpl)}
                          disabled={applyingTpl === tpl.id}
                          className="flex-shrink-0 text-xs btn-outline py-1 px-2.5 flex items-center gap-1"
                        >
                          {applyingTpl === tpl.id
                            ? <Loader2 size={11} className="animate-spin" />
                            : null
                          }
                          Appliquer
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Panneau Variables */}
          <div className="bg-surface rounded-card shadow-card overflow-hidden">
            <button
              type="button"
              onClick={() => setShowVariables((v) => !v)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-muted-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Info size={15} className="text-muted-500" />
                <span className="text-sm font-semibold text-navy">Variables disponibles</span>
              </div>
              {showVariables ? <ChevronUp size={15} className="text-muted-400" /> : <ChevronDown size={15} className="text-muted-400" />}
            </button>

            {showVariables && (
              <div className="border-t border-muted-100 p-3 space-y-1.5">
                <p className="text-[11px] text-muted-500 mb-2">
                  Insérez ces variables dans le corps du contrat via le bouton <strong>{"{ }"} Variable</strong> de l'éditeur.
                </p>
                {VARIABLES.map((v) => (
                  <div key={v.key} className="flex items-center justify-between gap-2 p-1.5 rounded hover:bg-muted-50">
                    <code className="text-[11px] font-mono text-primary-600 bg-primary-50 px-1.5 py-0.5 rounded">
                      {v.key}
                    </code>
                    <span className="text-[11px] text-muted-500">{v.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
