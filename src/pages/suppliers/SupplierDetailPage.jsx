import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supplierService } from '@/services/supplierService'
import { purchaseOrderService } from '@/services/purchaseOrderService'
import toast from 'react-hot-toast'
import {
  ChevronLeft, Edit2, Trash2, Loader2, RefreshCw,
  Phone, Mail, MapPin, Building2, User, FileText,
  ShoppingCart, Calendar, X, TrendingUp, CheckCircle2,
  XCircle, Package,
} from 'lucide-react'
import { cn } from '@/utils/cn'

/* ─── helpers ─────────────────────────────────────────────────────────────── */

const fmt     = (n) => new Intl.NumberFormat('fr-FR').format(n ?? 0) + ' FCFA'
const fmtDate = (iso) =>
  new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })

/* ─── purchase-order status config ────────────────────────────────────────── */

const ORDER_STATUS = {
  draft:      { label: 'Brouillon',   cls: 'bg-muted-100 text-muted-600' },
  ordered:    { label: 'Commandé',    cls: 'bg-blue-50 text-blue-600' },
  in_transit: { label: 'En transit',  cls: 'bg-violet-50 text-violet-600' },
  partial:    { label: 'Partiel',     cls: 'bg-amber-50 text-amber-700' },
  received:   { label: 'Reçu',        cls: 'bg-green-50 text-success' },
  cancelled:  { label: 'Annulé',      cls: 'bg-red-50 text-danger' },
}

/* ─── small shared components ─────────────────────────────────────────────── */

function InfoRow({ label, value, className }) {
  return (
    <div className="flex items-start justify-between py-3 border-b border-muted-100 last:border-0">
      <span className="text-xs font-sans font-semibold text-muted-500 uppercase tracking-wide">
        {label}
      </span>
      <span className={cn('text-sm font-sans text-navy text-right max-w-[60%]', className)}>
        {value ?? '—'}
      </span>
    </div>
  )
}

function StatBox({ label, value, color }) {
  return (
    <div className="card p-4 text-center space-y-1">
      <p className={cn('text-2xl font-display font-bold', color ?? 'text-navy')}>{value}</p>
      <p className="text-xs text-muted-500 font-sans">{label}</p>
    </div>
  )
}

function SupplierAvatar({ name, size = 'lg' }) {
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const sizeClass = size === 'lg'
    ? 'w-12 h-12 text-base'
    : 'w-8 h-8 text-xs'

  return (
    <div
      className={cn(
        'rounded-card bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0 font-bold font-sans',
        sizeClass,
      )}
    >
      {initials}
    </div>
  )
}

/* ─── zod schema (mirrors SuppliersPage) ──────────────────────────────────── */

const schema = z.object({
  name:         z.string().min(1, 'Nom requis'),
  phone:        z.string().optional(),
  email:        z.string().email('Email invalide').optional().or(z.literal('')),
  contact_name: z.string().optional(),
  address:      z.string().optional(),
  city:         z.string().optional(),
  country:      z.string().optional(),
  notes:        z.string().optional(),
  is_active:    z.boolean().optional(),
})

/* ─── inline edit modal ───────────────────────────────────────────────────── */

function EditModal({ supplier, meta, onClose, onSaved }) {
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { ...supplier },
  })

  useEffect(() => { reset(supplier) }, [supplier, reset])

  const onSubmit = async (data) => {
    try {
      await supplierService.update(supplier.id, data)
      toast.success('Fournisseur mis à jour.')
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
      <label className="block text-xs font-sans font-semibold text-muted-700 uppercase tracking-wide">
        {label}
      </label>
      <input
        {...register(name)}
        {...props}
        className={cn('input-field', errors[name] && 'border-danger')}
      />
      {errors[name] && (
        <p className="text-xs text-danger">{errors[name].message}</p>
      )}
    </div>
  )

  return (
    <div className="fixed inset-0 bg-navy/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-modal shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 flex-shrink-0">
          <h3 className="font-display font-bold text-navy">Modifier le fournisseur</h3>
          <button
            onClick={onClose}
            className="p-1.5 text-muted-500 hover:text-navy rounded-btn hover:bg-muted-100"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="overflow-y-auto flex-1">
          <div className="px-6 pb-6 space-y-4">

            {field('name', 'Nom du fournisseur *', { placeholder: 'ex: Grossiste Diallo & Fils' })}

            <div className="grid grid-cols-2 gap-3">
              {field('contact_name', 'Personne de contact', { placeholder: 'ex: Mamadou Diallo' })}
              {field('phone', 'Téléphone', { placeholder: '+221 77 000 00 00' })}
            </div>

            {field('email', 'Email', { type: 'email', placeholder: 'contact@fournisseur.com' })}

            {field('address', 'Adresse', { placeholder: 'ex: Zone industrielle, Dakar' })}

            <div className="grid grid-cols-2 gap-3">
              {field('city', 'Ville', { placeholder: 'ex: Dakar' })}
              <div className="space-y-1.5">
                <label className="block text-xs font-sans font-semibold text-muted-700 uppercase tracking-wide">
                  Pays
                </label>
                <Controller
                  name="country"
                  control={control}
                  render={({ field }) => (
                    <select {...field} className="input-field appearance-none">
                      <option value="">— Sélectionner —</option>
                      {meta?.countries?.map((c) => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  )}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-sans font-semibold text-muted-700 uppercase tracking-wide">
                Notes
              </label>
              <textarea
                {...register('notes')}
                rows={3}
                placeholder="Notes internes…"
                className="input-field resize-none"
              />
            </div>

            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                {...register('is_active')}
                className="w-4 h-4 accent-primary-500 rounded"
              />
              <span className="text-sm font-sans text-navy">Fournisseur actif</span>
            </label>

          </div>
        </form>

        {/* Footer */}
        <div className="flex gap-3 p-6 pt-4 border-t border-muted-100 flex-shrink-0">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">
            Annuler
          </button>
          <button
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            {isSubmitting && <Loader2 size={15} className="animate-spin" />}
            {isSubmitting ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>

      </div>
    </div>
  )
}

/* ─── main page ───────────────────────────────────────────────────────────── */

export default function SupplierDetailPage() {
  const { id }    = useParams()
  const navigate  = useNavigate()
  const { can }   = useAuthStore()

  const [supplier, setSupplier]   = useState(null)
  const [meta, setMeta]           = useState(null)
  const [orders, setOrders]       = useState([])
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [loading, setLoading]     = useState(true)
  const [editing, setEditing]     = useState(false)

  /* load supplier */
  const load = async () => {
    setLoading(true)
    try {
      const r = await supplierService.getOne(id)
      setSupplier(r.data.supplier)
    } catch {
      toast.error('Fournisseur introuvable.')
      navigate('/suppliers')
    } finally {
      setLoading(false)
    }
  }

  /* load recent purchase orders */
  const loadOrders = async () => {
    setOrdersLoading(true)
    try {
      const r = await purchaseOrderService.getAll({ supplier_id: id, per_page: 5 })
      setOrders(r.data.purchase_orders ?? r.data.orders ?? [])
    } catch {
      setOrders([])
    } finally {
      setOrdersLoading(false)
    }
  }

  useEffect(() => {
    load()
    loadOrders()
    supplierService.getMeta()
      .then((r) => setMeta(r.data))
      .catch(() => {})
  }, [id])

  /* delete */
  const handleDelete = async () => {
    if (!window.confirm(`Supprimer "${supplier.name}" définitivement ?`)) return
    try {
      await supplierService.remove(supplier.id)
      toast.success('Fournisseur supprimé.')
      navigate('/suppliers')
    } catch {
      toast.error('Erreur lors de la suppression.')
    }
  }

  /* ── loading state ── */
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={24} className="animate-spin text-primary-500" />
      </div>
    )
  }

  if (!supplier) return null

  const statusCfg = ORDER_STATUS

  return (
    <div className="space-y-5">

      {/* ── Breadcrumb + Header ──────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <Link
            to="/suppliers"
            className="inline-flex items-center gap-1.5 text-xs font-sans text-muted-500 hover:text-navy transition-colors"
          >
            <ChevronLeft size={14} />Fournisseurs
          </Link>

          <div className="flex items-center gap-3 flex-wrap">
            <SupplierAvatar name={supplier.name} size="lg" />
            <div>
              <h1 className="text-2xl font-display font-bold text-navy leading-tight">
                {supplier.name}
              </h1>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                {/* statut actif/inactif */}
                <span className={cn(
                  'inline-flex items-center gap-1 text-xs font-sans font-semibold px-2 py-0.5 rounded-badge',
                  supplier.is_active
                    ? 'bg-green-50 text-success'
                    : 'bg-muted-100 text-muted-500',
                )}>
                  {supplier.is_active
                    ? <CheckCircle2 size={10} />
                    : <XCircle size={10} />}
                  {supplier.is_active ? 'Actif' : 'Inactif'}
                </span>

                {/* badge pays */}
                {supplier.country_label && (
                  <span className="inline-flex items-center gap-1 text-xs font-sans font-semibold px-2 py-0.5 rounded-badge bg-amber-50 text-amber-700">
                    <MapPin size={10} />
                    {supplier.country_label}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* action buttons */}
        <div className="flex gap-2 flex-shrink-0">
          <button onClick={load} className="btn-secondary p-2.5" title="Rafraîchir">
            <RefreshCw size={15} />
          </button>
          {can('suppliers', 'edit') && (
            <button
              onClick={() => setEditing(true)}
              className="btn-secondary flex items-center gap-2"
            >
              <Edit2 size={14} />Modifier
            </button>
          )}
          {can('suppliers', 'delete') && (
            <button
              onClick={handleDelete}
              className="btn-danger flex items-center gap-2"
            >
              <Trash2 size={14} />Supprimer
            </button>
          )}
        </div>
      </div>

      {/* ── Stats boxes ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        <StatBox
          label="Total commandé"
          value={fmt(supplier.total_ordered)}
          color="text-navy"
        />
        <StatBox
          label="Nombre de commandes"
          value={supplier.orders_count ?? 0}
          color="text-primary-600"
        />
        <StatBox
          label="Statut"
          value={supplier.is_active ? 'Actif' : 'Inactif'}
          color={supplier.is_active ? 'text-success' : 'text-muted-500'}
        />
      </div>

      {/* ── Main body ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* LEFT — 2/3 */}
        <div className="md:col-span-2 space-y-4">

          {/* Informations card */}
          <div className="card p-5">
            <h2 className="font-display font-semibold text-navy mb-1 flex items-center gap-2">
              <Building2 size={15} className="text-muted-400" />Informations
            </h2>
            <div className="mt-3">
              <InfoRow label="Nom"               value={supplier.name} />
              <InfoRow
                label="Personne de contact"
                value={
                  supplier.contact_name ? (
                    <span className="flex items-center gap-1.5 justify-end">
                      <User size={12} className="text-muted-400" />
                      {supplier.contact_name}
                    </span>
                  ) : null
                }
              />
              <InfoRow
                label="Email"
                value={
                  supplier.email ? (
                    <a
                      href={`mailto:${supplier.email}`}
                      className="flex items-center gap-1.5 justify-end text-primary-500 hover:underline"
                    >
                      <Mail size={12} />
                      {supplier.email}
                    </a>
                  ) : null
                }
              />
              <InfoRow
                label="Téléphone"
                value={
                  supplier.phone ? (
                    <a
                      href={`tel:${supplier.phone}`}
                      className="flex items-center gap-1.5 justify-end text-primary-500 hover:underline"
                    >
                      <Phone size={12} />
                      {supplier.phone}
                    </a>
                  ) : null
                }
              />
              <InfoRow label="Adresse" value={supplier.address} />
              <InfoRow label="Ville"   value={supplier.city} />
              <InfoRow label="Pays"    value={supplier.country_label} />
            </div>
          </div>

          {/* Dernières commandes card */}
          <div className="card overflow-hidden">
            <div className="p-5 pb-3 flex items-center justify-between">
              <h2 className="font-display font-semibold text-navy flex items-center gap-2">
                <ShoppingCart size={15} className="text-muted-400" />Dernières commandes
              </h2>
              {orders.length > 0 && (
                <Link
                  to={`/purchase-orders?supplier_id=${id}`}
                  className="text-xs font-sans text-primary-500 hover:underline"
                >
                  Voir tout
                </Link>
              )}
            </div>

            {ordersLoading ? (
              <div className="px-5 pb-5 space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse h-10 bg-muted-100 rounded-card" />
                ))}
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-10 px-5">
                <Package size={28} className="mx-auto text-muted-200 mb-2" />
                <p className="text-sm font-sans text-muted-400">
                  Aucune commande enregistrée pour ce fournisseur.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-y border-muted-100 bg-muted-100/50">
                      <th className="text-left py-2.5 px-5 text-xs font-sans font-semibold text-muted-700 uppercase tracking-wide">
                        Référence
                      </th>
                      <th className="text-left py-2.5 px-4 text-xs font-sans font-semibold text-muted-700 uppercase tracking-wide hidden sm:table-cell">
                        Date
                      </th>
                      <th className="text-right py-2.5 px-4 text-xs font-sans font-semibold text-muted-700 uppercase tracking-wide">
                        Montant
                      </th>
                      <th className="text-center py-2.5 px-4 text-xs font-sans font-semibold text-muted-700 uppercase tracking-wide">
                        Statut
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-muted-100">
                    {orders.map((o) => {
                      const cfg = statusCfg[o.status] ?? { label: o.status, cls: 'bg-muted-100 text-muted-600' }
                      return (
                        <tr key={o.id} className="hover:bg-muted-100/30 transition-colors">
                          <td className="py-3 px-5">
                            <Link
                              to={`/purchase-orders/${o.id}`}
                              className="text-sm font-sans font-semibold text-primary-500 hover:underline"
                            >
                              {o.reference ?? `#${o.id}`}
                            </Link>
                          </td>
                          <td className="py-3 px-4 hidden sm:table-cell">
                            <span className="text-xs font-sans text-muted-700">
                              {o.ordered_at ? fmtDate(o.ordered_at) : o.created_at ? fmtDate(o.created_at) : '—'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="text-sm font-sans font-semibold text-navy">
                              {fmt(o.total_amount ?? o.total ?? 0)}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={cn(
                              'inline-flex items-center text-xs font-sans font-semibold px-2 py-0.5 rounded-badge',
                              cfg.cls,
                            )}>
                              {cfg.label}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

        {/* RIGHT sidebar — 1/3 */}
        <div className="space-y-4">

          {/* Notes card */}
          <div className="card p-5">
            <h2 className="font-display font-semibold text-navy mb-3 flex items-center gap-2">
              <FileText size={15} className="text-muted-400" />Notes
            </h2>
            {supplier.notes ? (
              <p className="text-sm font-sans text-muted-700 leading-relaxed whitespace-pre-line">
                {supplier.notes}
              </p>
            ) : (
              <p className="text-sm font-sans text-muted-400 italic">Aucune note renseignée.</p>
            )}
          </div>

          {/* Métadonnées card */}
          <div className="card p-5">
            <h2 className="font-display font-semibold text-navy mb-3 flex items-center gap-2">
              <Calendar size={15} className="text-muted-400" />Métadonnées
            </h2>
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-sans">
                <span className="text-muted-500">Créé le</span>
                <span className="text-navy">{fmtDate(supplier.created_at)}</span>
              </div>
              <div className="flex justify-between text-xs font-sans">
                <span className="text-muted-500">Modifié le</span>
                <span className="text-navy">{fmtDate(supplier.updated_at)}</span>
              </div>
              <div className="flex justify-between text-xs font-sans">
                <span className="text-muted-500">ID interne</span>
                <span className="text-muted-400 font-mono">#{supplier.id}</span>
              </div>
            </div>
          </div>

          {/* Quick stats sidebar */}
          <div className="card p-5">
            <h2 className="font-display font-semibold text-navy mb-3 flex items-center gap-2">
              <TrendingUp size={15} className="text-muted-400" />Activité
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between text-xs font-sans">
                <span className="text-muted-500">Total commandé</span>
                <span className="font-semibold text-navy">{fmt(supplier.total_ordered)}</span>
              </div>
              <div className="flex justify-between text-xs font-sans">
                <span className="text-muted-500">Nb. commandes</span>
                <span className="font-semibold text-navy">{supplier.orders_count ?? 0}</span>
              </div>
              {(supplier.orders_count ?? 0) > 0 && (
                <div className="flex justify-between text-xs font-sans">
                  <span className="text-muted-500">Panier moyen</span>
                  <span className="font-semibold text-navy">
                    {fmt(Math.round((supplier.total_ordered ?? 0) / supplier.orders_count))}
                  </span>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* ── Edit modal ──────────────────────────────────────────────────── */}
      {editing && (
        <EditModal
          supplier={supplier}
          meta={meta}
          onClose={() => setEditing(false)}
          onSaved={() => { setEditing(false); load() }}
        />
      )}

    </div>
  )
}
