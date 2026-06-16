import { useEffect, useState } from 'react'
import { confirmDialog } from '@/utils/confirm'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { customerService } from '@/services/customerService'
import toast from 'react-hot-toast'
import {
  ChevronLeft, Edit2, Trash2, Loader2,
  Calendar, RefreshCw, CheckCircle2, XCircle,
  ShoppingCart, User, Building2, Mail, Phone,
  MapPin, FileText, X, Info, Wallet, ArrowDownCircle, ArrowUpCircle,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { useCurrency } from '@/utils/currency'

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtDate = (iso) =>
  new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })

// ── Zod schema ────────────────────────────────────────────────────────────────
const schema = z.object({
  name:      z.string().min(1, 'Nom requis'),
  type:      z.enum(['individual', 'company']),
  email:     z.string().email('Email invalide').optional().or(z.literal('')),
  phone:     z.string().optional(),
  company:   z.string().optional(),
  address:   z.string().optional(),
  city:      z.string().optional(),
  country:   z.string().optional(),
  notes:     z.string().optional(),
  is_active: z.boolean().optional(),
})

// ── InfoRow ───────────────────────────────────────────────────────────────────
function InfoRow({ label, value, className }) {
  return (
    <div className="flex items-start justify-between py-2.5 sm:py-3 border-b border-muted-100 last:border-0 gap-3">
      <span className="text-xs font-sans font-semibold text-muted-500 uppercase tracking-wide shrink-0">{label}</span>
      <span className={cn('text-sm font-sans text-navy text-right min-w-0 break-words', className)}>
        {value ?? '—'}
      </span>
    </div>
  )
}

// ── StatBox ───────────────────────────────────────────────────────────────────
function StatBox({ label, value, sub, color }) {
  return (
    <div className="card p-3 sm:p-4 text-center space-y-0.5 sm:space-y-1">
      <p className={cn('text-xl sm:text-2xl font-display font-bold', color ?? 'text-navy')}>{value}</p>
      {sub && <p className="text-[10px] sm:text-[11px] text-muted-400 font-sans">{sub}</p>}
      <p className="text-xs text-muted-500 font-sans">{label}</p>
    </div>
  )
}

// ── CustomerEditModal ─────────────────────────────────────────────────────────
function CustomerEditModal({ customer, meta, onClose, onSaved }) {
  const {
    register, handleSubmit, watch, reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: customer ? { ...customer } : { type: 'individual', is_active: true },
  })
  const type = watch('type')

  useEffect(() => { if (customer) reset(customer) }, [customer, reset])

  const onSubmit = async (data) => {
    try {
      await customerService.update(customer.id, data)
      toast.success('Client mis à jour.')
      onSaved()
    } catch (err) {
      const msg = err.response?.data?.errors
        ? Object.values(err.response.data.errors).flat()[0]
        : err.response?.data?.message || 'Erreur.'
      toast.error(msg)
    }
  }

  const field = (name, label, props = {}) => (
    <div className="space-y-1.5">
      <label className="block text-xs font-sans font-semibold text-muted-700 uppercase tracking-wide">{label}</label>
      <input
        {...register(name)}
        {...props}
        className={cn('input-field', errors[name] && 'border-danger focus:border-danger focus:ring-danger/20')}
      />
      {errors[name] && <p className="text-xs text-danger">{errors[name].message}</p>}
    </div>
  )

  return (
    <div className="fixed inset-0 bg-navy/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-surface rounded-t-2xl sm:rounded-modal shadow-2xl w-full sm:max-w-xl max-h-[95dvh] sm:max-h-[90vh] flex flex-col animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">

        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-muted-100 shrink-0">
          <h3 className="font-display font-bold text-navy">Modifier le client</h3>
          <button onClick={onClose} className="p-1.5 text-muted-500 hover:text-navy rounded-btn hover:bg-muted-100">
            <X size={18} />
          </button>
        </div>

        {/* Form body */}
        <form onSubmit={handleSubmit(onSubmit)} className="overflow-y-auto flex-1">
          <div className="px-5 sm:px-6 py-4 space-y-4">

            {/* Type */}
            <div className="space-y-1.5">
              <label className="block text-xs font-sans font-semibold text-muted-700 uppercase tracking-wide">Type</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { v: 'individual', l: 'Particulier', icon: User },
                  { v: 'company',    l: 'Entreprise',  icon: Building2 },
                ].map(({ v, l, icon: Icon }) => (
                  <label key={v} className={cn(
                    'flex items-center gap-2.5 p-3 rounded-card border cursor-pointer transition-all',
                    type === v ? 'border-primary-400 bg-primary-50' : 'border-muted-300 hover:border-muted-500'
                  )}>
                    <input type="radio" value={v} {...register('type')} className="sr-only" />
                    <Icon size={16} className={type === v ? 'text-primary-500' : 'text-muted-500'} />
                    <span className="text-sm font-sans font-medium text-navy">{l}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Nom */}
            {field('name', 'Nom complet', {
              placeholder: type === 'company' ? 'ex: Société BTP Mali' : 'ex: Aminata Diallo',
            })}

            {/* Entreprise si particulier */}
            {type === 'individual' && (
              field('company', 'Entreprise (optionnel)', { placeholder: 'ex: SARL Diallo & Fils' })
            )}

            {/* Contacts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {field('email', 'Email', { type: 'email', placeholder: 'exemple@email.com' })}
              {field('phone', 'Téléphone', { placeholder: '+223 70 00 00 00' })}
            </div>

            {/* Adresse */}
            {field('address', 'Adresse', { placeholder: 'ex: Quartier du Fleuve, Rue 123' })}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {field('city', 'Ville', { placeholder: 'ex: Bamako' })}
              <div className="space-y-1.5">
                <label className="block text-xs font-sans font-semibold text-muted-700 uppercase tracking-wide">Pays</label>
                <select {...register('country')} className="input-field appearance-none">
                  <option value="">— Sélectionner —</option>
                  {meta?.countries?.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <label className="block text-xs font-sans font-semibold text-muted-700 uppercase tracking-wide">Notes</label>
              <textarea
                {...register('notes')}
                rows={2}
                placeholder="Notes internes optionnelles…"
                className="input-field resize-none"
              />
            </div>

            {/* Actif */}
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" {...register('is_active')} className="w-4 h-4 accent-primary-500 rounded" />
              <span className="text-sm font-sans text-navy">Client actif</span>
            </label>
          </div>
        </form>

        {/* Footer */}
        <div className="flex gap-3 px-5 sm:px-6 py-4 border-t border-muted-100 shrink-0">
          <button type="button" onClick={onClose} className="btn-secondary flex-1 h-11">Annuler</button>
          <button
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            className="btn-primary flex-1 h-11 flex items-center justify-center gap-2"
          >
            {isSubmitting && <Loader2 size={15} className="animate-spin" />}
            {isSubmitting ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Page principale ───────────────────────────────────────────────────────────
export default function CustomerDetailPage() {
  const { id }   = useParams()
  const navigate = useNavigate()
  const { can }  = useAuthStore()
  const { format: fmt } = useCurrency()

  const [customer, setCustomer] = useState(null)
  const [loading, setLoading]   = useState(true)
  const [editing, setEditing]   = useState(false)
  const [meta, setMeta]         = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const r = await customerService.getOne(id)
      setCustomer(r.data.customer)
    } catch {
      toast.error('Client introuvable.')
      navigate('/customers')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    customerService.getMeta().then(r => setMeta(r.data)).catch(() => {})
  }, [id])

  const handleDelete = async () => {
    if (!(await confirmDialog({
      title: `Supprimer "${customer.name}" ?`,
      text: 'Cette action est irréversible.',
      confirmText: 'Supprimer',
    }))) return
    try {
      await customerService.remove(customer.id)
      toast.success('Client supprimé.')
      navigate('/customers')
    } catch {
      toast.error('Erreur lors de la suppression.')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={24} className="animate-spin text-primary-500" />
      </div>
    )
  }

  if (!customer) return null

  const isCompany = customer.type === 'company'
  const initials  = customer.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()

  return (
    <div className="space-y-4 sm:space-y-5">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">

        {/* Breadcrumb + identité */}
        <div className="space-y-2">
          <Link
            to="/customers"
            className="inline-flex items-center gap-1.5 text-xs font-sans text-muted-500 hover:text-navy transition-colors"
          >
            <ChevronLeft size={14} />Clients
          </Link>

          <div className="flex items-center gap-3">
            <div className={cn(
              'w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shrink-0 text-sm font-sans font-bold',
              isCompany ? 'bg-violet-100 text-violet-600' : 'bg-primary-50 text-primary-600'
            )}>
              {initials}
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-display font-bold text-navy leading-tight truncate">
                {customer.name}
              </h1>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className={cn(
                  'inline-flex items-center gap-1 text-xs font-sans font-semibold px-2 py-0.5 rounded-badge',
                  isCompany ? 'bg-violet-100 text-violet-600' : 'bg-primary-50 text-primary-600'
                )}>
                  {isCompany ? <Building2 size={10} /> : <User size={10} />}
                  {customer.type_label}
                </span>
                <span className={cn(
                  'inline-flex items-center gap-1 text-xs font-sans font-semibold px-2 py-0.5 rounded-badge',
                  customer.is_active ? 'bg-green-50 text-success' : 'bg-muted-100 text-muted-500'
                )}>
                  {customer.is_active ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
                  {customer.is_active ? 'Actif' : 'Inactif'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 sm:shrink-0">
          <button
            onClick={() => load()}
            className="p-2 sm:p-2.5 btn-secondary"
            title="Rafraîchir"
          >
            <RefreshCw size={15} />
          </button>
          {can('customers', 'edit') && (
            <button
              onClick={() => setEditing(true)}
              className="btn-secondary flex items-center gap-1.5 h-9 px-3 sm:px-4 text-sm"
            >
              <Edit2 size={14} />
              <span className="hidden xs:inline">Modifier</span>
            </button>
          )}
          {can('customers', 'delete') && (
            <button
              onClick={handleDelete}
              className="btn-danger flex items-center gap-1.5 h-9 px-3 sm:px-4 text-sm"
            >
              <Trash2 size={14} />
              <span className="hidden xs:inline">Supprimer</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <StatBox
          label="Total dépensé"
          value={fmt(customer.total_spent)}
          sub={customer.total_spent > 0 ? 'Cumul des achats' : 'Aucun achat encore'}
          color="text-navy"
        />
        <StatBox
          label="Commandes"
          value={customer.orders_count ?? 0}
          sub={customer.orders_count === 1 ? 'commande passée' : 'commandes passées'}
          color={customer.orders_count > 0 ? 'text-primary-500' : 'text-muted-500'}
        />
      </div>

      {/* ── Compte client (crédit / avance) ── */}
      <CustomerAccountCard customer={customer} onChanged={load} />

      {/* ── Corps principal ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Colonne principale (2/3) */}
        <div className="md:col-span-2 space-y-4">

          {/* Informations générales */}
          <div className="card p-4 sm:p-5">
            <h2 className="font-display font-semibold text-navy mb-1 flex items-center gap-2">
              <Info size={15} className="text-muted-400" />Informations générales
            </h2>
            <div className="mt-3">
              <InfoRow label="Nom" value={customer.name} />
              <InfoRow label="Type" value={customer.type_label} />
              {!isCompany && customer.company && (
                <InfoRow label="Entreprise" value={customer.company} />
              )}
              <InfoRow
                label="Email"
                value={customer.email
                  ? <a href={`mailto:${customer.email}`} className="text-primary-500 hover:underline break-all">{customer.email}</a>
                  : null
                }
              />
              <InfoRow
                label="Téléphone"
                value={customer.phone
                  ? <a href={`tel:${customer.phone}`} className="text-primary-500 hover:underline">{customer.phone}</a>
                  : null
                }
              />
            </div>
          </div>

          {/* Adresse */}
          <div className="card p-4 sm:p-5">
            <h2 className="font-display font-semibold text-navy mb-1 flex items-center gap-2">
              <MapPin size={15} className="text-muted-400" />Adresse
            </h2>
            <div className="mt-3">
              <InfoRow label="Adresse" value={customer.address} />
              <InfoRow label="Ville"   value={customer.city} />
              <InfoRow label="Pays"    value={customer.country_label} />
            </div>
            {!customer.address && !customer.city && !customer.country && (
              <p className="text-sm font-sans text-muted-400 italic mt-3">Aucune adresse renseignée.</p>
            )}
          </div>

          {/* Notes */}
          <div className="card p-4 sm:p-5">
            <h2 className="font-display font-semibold text-navy mb-3 flex items-center gap-2">
              <FileText size={15} className="text-muted-400" />Notes
            </h2>
            {customer.notes
              ? <p className="text-sm font-sans text-muted-700 leading-relaxed whitespace-pre-line">{customer.notes}</p>
              : <p className="text-sm font-sans text-muted-400 italic">Aucune note renseignée.</p>
            }
          </div>
        </div>

        {/* Sidebar (1/3) */}
        <div className="space-y-4">

          {/* Commandes récentes */}
          <div className="card p-4 sm:p-5">
            <h2 className="font-display font-semibold text-navy mb-3 flex items-center gap-2">
              <ShoppingCart size={15} className="text-muted-400" />Commandes récentes
            </h2>
            <div className="space-y-2.5">
              {customer.recent_orders?.length === 0 ? (
                <div className="text-center py-4">
                  <ShoppingCart size={24} className="mx-auto text-muted-200 mb-2" />
                  <p className="text-xs font-sans text-muted-400">Aucune commande trouvée.</p>
                </div>
              ) : (
                customer.recent_orders.map(order => (
                  <Link
                    key={order.id}
                    to="/orders"
                    className="block p-3 rounded-card bg-muted-50 border border-muted-200 hover:border-primary-300 hover:bg-white transition-all group"
                  >
                    <div className="flex justify-between items-start mb-1 gap-2">
                      <span className="text-xs font-bold text-navy group-hover:text-primary-600 truncate">{order.reference}</span>
                      <span className="text-[10px] text-muted-400 shrink-0">{new Date(order.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-sm font-display font-black text-navy whitespace-nowrap">{fmt(order.total_amount)}</span>
                      <span className={cn(
                        'text-[9px] px-1.5 py-0.5 rounded-badge font-bold uppercase shrink-0',
                        order.status === 'completed' ? 'bg-green-50 text-success' :
                        order.status === 'pending'   ? 'bg-orange-50 text-orange-600' :
                                                       'bg-red-50 text-danger'
                      )}>
                        {order.status === 'completed' ? 'Terminée' :
                         order.status === 'pending'   ? 'En attente' : 'Annulée'}
                      </span>
                    </div>
                  </Link>
                ))
              )}
              {customer.orders_count > 5 && (
                <Link to="/orders" className="block text-center text-[11px] text-primary-500 font-bold hover:underline mt-1">
                  Voir toutes les {customer.orders_count} commandes →
                </Link>
              )}
            </div>
          </div>

          {/* Métadonnées */}
          <div className="card p-4 sm:p-5">
            <h2 className="font-display font-semibold text-navy mb-3 flex items-center gap-2">
              <Calendar size={15} className="text-muted-400" />Métadonnées
            </h2>
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-sans gap-2">
                <span className="text-muted-500 shrink-0">Créé le</span>
                <span className="text-navy text-right">{fmtDate(customer.created_at)}</span>
              </div>
              <div className="flex justify-between text-xs font-sans gap-2">
                <span className="text-muted-500 shrink-0">Modifié le</span>
                <span className="text-navy text-right">{fmtDate(customer.updated_at)}</span>
              </div>
              <div className="flex justify-between text-xs font-sans gap-2">
                <span className="text-muted-500 shrink-0">ID interne</span>
                <span className="text-muted-400 font-mono">#{customer.id}</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Modal édition */}
      {editing && (
        <CustomerEditModal
          customer={customer}
          meta={meta}
          onClose={() => setEditing(false)}
          onSaved={() => { setEditing(false); load() }}
        />
      )}
    </div>
  )
}

// ── Carte compte client (crédit / avance) ────────────────────────────────────
function CustomerAccountCard({ customer, onChanged }) {
  const { format: fmt } = useCurrency()
  const [account, setAccount] = useState(null)
  const [loading, setLoading] = useState(true)
  const [modal, setModal]     = useState(null) // 'repay' | 'deposit'

  const fetchAccount = async () => {
    setLoading(true)
    try {
      const r = await customerService.getAccount(customer.id)
      setAccount(r.data)
    } catch { /* silencieux */ }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchAccount() }, [customer.id])

  const debt    = account?.debt ?? customer.debt ?? 0
  const deposit = account?.deposit ?? customer.deposit ?? 0
  const entries = account?.entries ?? []

  const refresh = () => { fetchAccount(); onChanged?.() }

  return (
    <div className="card p-4 sm:p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display font-semibold text-navy flex items-center gap-2">
          <Wallet size={16} className="text-muted-400" />Compte client
        </h2>
      </div>

      {/* Solde */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className={cn('rounded-card p-3 border', debt > 0 ? 'bg-red-50 border-red-100' : 'bg-muted-50 border-muted-100')}>
          <p className="text-[11px] text-muted-500 uppercase font-bold tracking-wide">Dette (ardoise)</p>
          <p className={cn('text-xl font-display font-black', debt > 0 ? 'text-danger' : 'text-muted-400')}>{fmt(debt)}</p>
        </div>
        <div className={cn('rounded-card p-3 border', deposit > 0 ? 'bg-green-50 border-green-100' : 'bg-muted-50 border-muted-100')}>
          <p className="text-[11px] text-muted-500 uppercase font-bold tracking-wide">Avance disponible</p>
          <p className={cn('text-xl font-display font-black', deposit > 0 ? 'text-success' : 'text-muted-400')}>{fmt(deposit)}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setModal('repay')}
          disabled={debt <= 0}
          className="flex items-center gap-1.5 text-xs font-sans font-semibold px-3 py-2 rounded-btn border border-muted-200 hover:border-primary-300 hover:bg-primary-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ArrowDownCircle size={14} className="text-success" />Encaisser un remboursement
        </button>
        <button
          onClick={() => setModal('deposit')}
          className="flex items-center gap-1.5 text-xs font-sans font-semibold px-3 py-2 rounded-btn border border-muted-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
        >
          <ArrowUpCircle size={14} className="text-primary-500" />Enregistrer une avance
        </button>
      </div>

      {/* Historique */}
      {loading ? (
        <div className="flex justify-center py-6"><Loader2 size={18} className="animate-spin text-muted-300" /></div>
      ) : entries.length === 0 ? (
        <p className="text-xs text-muted-400 text-center py-4">Aucun mouvement de compte pour ce client.</p>
      ) : (
        <div className="divide-y divide-muted-100">
          {entries.map(e => {
            const isDebit = e.type === 'credit' || e.type === 'withdrawal'
            return (
              <div key={e.id} className="flex items-center justify-between py-2.5">
                <div className="min-w-0">
                  <p className="text-sm font-sans font-semibold text-navy">{e.type_label}</p>
                  <p className="text-[11px] text-muted-500">
                    {new Date(e.created_at).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    {e.due_date && ` · échéance ${new Date(e.due_date).toLocaleDateString('fr-FR')}`}
                    {e.by && ` · ${e.by}`}
                  </p>
                </div>
                <span className={cn('text-sm font-display font-bold whitespace-nowrap', isDebit ? 'text-danger' : 'text-success')}>
                  {isDebit ? '−' : '+'}{fmt(e.amount)}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {modal && (
        <AccountOpModal
          customer={customer}
          op={modal}
          maxDebt={debt}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); refresh() }}
        />
      )}
    </div>
  )
}

function AccountOpModal({ customer, op, maxDebt, onClose, onSaved }) {
  const { format: fmt } = useCurrency()
  const isRepay = op === 'repay'
  const [amount, setAmount]   = useState('')
  const [method, setMethod]   = useState('cash')
  const [note, setNote]       = useState('')
  const [saving, setSaving]   = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    const value = parseFloat(amount)
    if (!value || value <= 0) { toast.error('Montant invalide.'); return }
    if (isRepay && value > maxDebt) { toast.error('Le montant dépasse la dette.'); return }
    setSaving(true)
    try {
      const payload = { amount: value, payment_method: method, note }
      const r = isRepay
        ? await customerService.repay(customer.id, payload)
        : await customerService.deposit(customer.id, payload)
      toast.success(r.message)
      onSaved()
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Erreur.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-surface rounded-card w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-muted-200">
          <h3 className="font-display font-bold text-navy">
            {isRepay ? 'Encaisser un remboursement' : 'Enregistrer une avance'}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-btn text-muted-500 hover:bg-muted-100"><X size={18} /></button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-4">
          {isRepay && (
            <p className="text-xs text-muted-500">Dette actuelle : <strong className="text-danger">{fmt(maxDebt)}</strong></p>
          )}
          <div className="space-y-1.5">
            <label className="block text-xs font-sans font-semibold text-muted-700 uppercase tracking-wide">Montant</label>
            <input type="number" min={1} className="input-field w-full text-right font-bold" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" autoFocus />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-sans font-semibold text-muted-700 uppercase tracking-wide">Mode</label>
            <select className="input-field w-full" value={method} onChange={e => setMethod(e.target.value)}>
              <option value="cash">Espèces</option>
              <option value="wave">Wave</option>
              <option value="orange_money">Orange Money</option>
              <option value="card">Carte bancaire</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-sans font-semibold text-muted-700 uppercase tracking-wide">Note (optionnel)</label>
            <input className="input-field w-full" value={note} onChange={e => setNote(e.target.value)} placeholder="Commentaire…" />
          </div>
          <button type="submit" disabled={saving} className="btn-primary w-full py-2.5 flex items-center justify-center gap-2 disabled:opacity-50">
            {saving ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
            {isRepay ? 'Encaisser' : 'Enregistrer l\'avance'}
          </button>
        </form>
      </div>
    </div>
  )
}
