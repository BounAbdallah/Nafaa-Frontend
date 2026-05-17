import { useEffect, useState, useCallback } from 'react'
import { confirmDialog } from '@/utils/confirm'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supplierService } from '@/services/supplierService'
import toast from 'react-hot-toast'
import {
  Plus, Search, Truck, Edit2, Trash2, X, Loader2,
  ChevronLeft, ChevronRight, RefreshCw, Phone, Mail,
  MapPin, TrendingUp, ShoppingCart, Building2, Eye,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { useCurrency } from '@/utils/currency'

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

function SupplierModal({ supplier, meta, onClose, onSaved }) {
  const isEdit = !!supplier
  const { register, handleSubmit, reset, control, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: supplier ? { ...supplier } : { is_active: true },
  })

  useEffect(() => { if (supplier) reset(supplier) }, [supplier, reset])

  const onSubmit = async (data) => {
    try {
      if (isEdit) await supplierService.update(supplier.id, data)
      else        await supplierService.create(data)
      toast.success(isEdit ? 'Fournisseur mis à jour.' : 'Fournisseur ajouté.')
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
        className={cn('input-field', errors[name] && 'border-danger')}
      />
      {errors[name] && <p className="text-xs text-danger">{errors[name].message}</p>}
    </div>
  )

  return (
    <div className="fixed inset-0 bg-navy/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-surface rounded-t-2xl sm:rounded-modal shadow-2xl w-full sm:max-w-xl max-h-[95dvh] sm:max-h-[90vh] flex flex-col animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 sm:p-6 pb-3 sm:pb-4 flex-shrink-0">
          <h3 className="font-display font-bold text-navy">
            {isEdit ? 'Modifier le fournisseur' : 'Ajouter un fournisseur'}
          </h3>
          <button onClick={onClose} className="p-1.5 text-muted-500 hover:text-navy rounded-btn hover:bg-muted-100">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="overflow-y-auto flex-1">
          <div className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-4">
            {field('name', 'Nom du fournisseur *', { placeholder: 'ex: Grossiste Diallo & Fils' })}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {field('contact_name', 'Personne de contact', { placeholder: 'ex: Mamadou Diallo' })}
              {field('phone', 'Téléphone', { placeholder: '+221 77 000 00 00' })}
            </div>

            {field('email', 'Email', { type: 'email', placeholder: 'contact@fournisseur.com' })}

            {field('address', 'Adresse', { placeholder: 'ex: Zone industrielle, Dakar' })}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {field('city', 'Ville', { placeholder: 'ex: Dakar' })}
              <div className="space-y-1.5">
                <label className="block text-xs font-sans font-semibold text-muted-700 uppercase tracking-wide">Pays</label>
                <Controller name="country" control={control} render={({ field }) => (
                  <select {...field} className="input-field appearance-none">
                    <option value="">— Sélectionner —</option>
                    {meta?.countries?.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                )} />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-sans font-semibold text-muted-700 uppercase tracking-wide">Notes</label>
              <textarea {...register('notes')} rows={2} placeholder="Notes internes…" className="input-field resize-none" />
            </div>

            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" {...register('is_active')} className="w-4 h-4 accent-primary-500 rounded" />
              <span className="text-sm font-sans text-navy">Fournisseur actif</span>
            </label>
          </div>
        </form>

        <div className="flex gap-3 p-4 sm:p-6 pt-3 sm:pt-4 border-t border-muted-100 flex-shrink-0">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Annuler</button>
          <button onClick={handleSubmit(onSubmit)} disabled={isSubmitting} className="btn-primary flex-1 flex items-center justify-center gap-2">
            {isSubmitting && <Loader2 size={15} className="animate-spin" />}
            {isSubmitting ? 'Enregistrement…' : (isEdit ? 'Enregistrer' : 'Ajouter')}
          </button>
        </div>
      </div>
    </div>
  )
}

function Avatar({ name }) {
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  return (
    <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0 text-xs font-bold font-sans">
      {initials}
    </div>
  )
}

// Mobile card for a single supplier row
function SupplierCard({ s, can, onEdit, onDelete, fmt }) {
  return (
    <div className="px-4 py-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <Avatar name={s.name} />
          <div className="min-w-0">
            <p className="text-sm font-sans font-semibold text-navy truncate">{s.name}</p>
            {s.orders_count > 0 && (
              <p className="text-[11px] text-muted-500">{s.orders_count} commande{s.orders_count > 1 ? 's' : ''}</p>
            )}
          </div>
        </div>
        <span className={cn(
          'inline-flex items-center gap-1 text-xs font-sans font-semibold px-2 py-0.5 rounded-badge flex-shrink-0',
          s.is_active ? 'bg-green-50 text-success' : 'bg-muted-100 text-muted-500'
        )}>
          <span className={cn('w-1.5 h-1.5 rounded-full', s.is_active ? 'bg-success' : 'bg-muted-400')} />
          {s.is_active ? 'Actif' : 'Inactif'}
        </span>
      </div>

      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {s.phone && (
          <div className="flex items-center gap-1.5">
            <Phone size={11} className="text-muted-400" />
            <span className="text-xs text-muted-700">{s.phone}</span>
          </div>
        )}
        {s.email && (
          <div className="flex items-center gap-1.5">
            <Mail size={11} className="text-muted-400" />
            <span className="text-xs text-muted-700 truncate max-w-[180px]">{s.email}</span>
          </div>
        )}
        {(s.city || s.country_label) && (
          <div className="flex items-center gap-1.5">
            <MapPin size={11} className="text-muted-400" />
            <span className="text-xs text-muted-700">{[s.city, s.country_label].filter(Boolean).join(', ')}</span>
          </div>
        )}
      </div>

      {s.total_ordered > 0 && (
        <p className="text-xs font-sans text-muted-500">
          Total commandé : <span className="font-semibold text-navy">{fmt(s.total_ordered)}</span>
        </p>
      )}

      <div className="flex items-center gap-2 pt-1">
        <Link
          to={`/suppliers/${s.id}`}
          className="flex items-center gap-1.5 text-xs font-sans text-primary-500 hover:underline"
        >
          <Eye size={13} />Voir
        </Link>
        {can('suppliers', 'edit') && (
          <button
            onClick={onEdit}
            className="flex items-center gap-1.5 text-xs font-sans text-muted-600 hover:text-primary-500"
          >
            <Edit2 size={13} />Modifier
          </button>
        )}
        {can('suppliers', 'delete') && (
          <button
            onClick={onDelete}
            className="flex items-center gap-1.5 text-xs font-sans text-muted-600 hover:text-danger"
          >
            <Trash2 size={13} />Supprimer
          </button>
        )}
      </div>
    </div>
  )
}

export default function SuppliersPage() {
  const { can }  = useAuthStore()
  const { format: fmt } = useCurrency()
  const [suppliers, setSuppliers] = useState([])
  const [meta, setMeta]           = useState(null)
  const [pageMeta, setPageMeta]   = useState(null)
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [page, setPage]           = useState(1)
  const [modal, setModal]         = useState(null)

  useEffect(() => {
    supplierService.getMeta().then(r => setMeta(r.data)).catch(() => {})
  }, [])

  const fetchSuppliers = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, per_page: 15 }
      if (search) params.search = search
      const r = await supplierService.getAll(params)
      setSuppliers(r.data.suppliers)
      setPageMeta(r.data.meta)
    } catch { toast.error('Impossible de charger les fournisseurs.') }
    finally { setLoading(false) }
  }, [page, search])

  useEffect(() => { fetchSuppliers() }, [fetchSuppliers])

  const handleDelete = async (s) => {
    if (!(await confirmDialog({ title: `Supprimer "${s.name}" ?`, text: 'Cette action est irréversible.', confirmText: 'Supprimer' }))) return
    try {
      await supplierService.remove(s.id)
      toast.success('Fournisseur supprimé.')
      fetchSuppliers()
    } catch { toast.error('Erreur lors de la suppression.') }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-navy">Fournisseurs</h1>
          <p className="text-sm font-sans text-muted-500 mt-1">
            {pageMeta ? `${pageMeta.total} fournisseur${pageMeta.total > 1 ? 's' : ''}` : '…'}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchSuppliers} className="btn-secondary p-2.5"><RefreshCw size={15} /></button>
          {can('suppliers', 'create') && (
            <button onClick={() => setModal('add')} className="btn-primary flex items-center gap-2">
              <Plus size={16} />
              <span className="hidden sm:inline">Ajouter</span>
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      {pageMeta && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Total',          value: pageMeta.total, icon: Building2,    color: 'text-amber-600 bg-amber-50' },
            { label: 'Commandes',      value: suppliers.reduce((a, s) => a + s.orders_count, 0), icon: ShoppingCart, color: 'text-primary-500 bg-primary-50' },
            { label: 'Total commandé', value: fmt(suppliers.reduce((a, s) => a + s.total_ordered, 0)), icon: TrendingUp, color: 'text-success bg-green-50' },
          ].map(s => (
            <div key={s.label} className="card p-4 sm:p-5 flex items-center gap-3">
              <div className={cn('w-9 h-9 rounded-card flex items-center justify-center flex-shrink-0', s.color)}>
                <s.icon size={17} />
              </div>
              <div>
                <p className="text-lg font-display font-bold text-navy truncate">{s.value}</p>
                <p className="text-xs text-muted-500 font-sans">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filtre */}
      <div className="card p-4">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-500" />
          <input
            placeholder="Rechercher par nom, téléphone, email…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            className="input-field pl-9"
          />
        </div>
      </div>

      {/* Table (sm+) / Card list (xs) */}
      <div className="card overflow-hidden">
        {/* Mobile card list */}
        <div className="sm:hidden divide-y divide-muted-100">
          {loading
            ? [...Array(4)].map((_, i) => (
                <div key={i} className="px-4 py-3 space-y-2 animate-pulse">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-muted-100" />
                    <div className="h-4 w-36 bg-muted-100 rounded" />
                  </div>
                  <div className="h-3 w-48 bg-muted-100 rounded" />
                </div>
              ))
            : suppliers.length === 0
              ? (
                <div className="py-16 text-center px-4">
                  <Truck size={32} className="mx-auto text-muted-300 mb-3" />
                  <p className="text-sm font-sans text-muted-500">Aucun fournisseur trouvé.</p>
                  <button onClick={() => setModal('add')} className="btn-primary mt-4 mx-auto text-xs py-2 px-4">
                    Ajouter le premier fournisseur
                  </button>
                </div>
              )
              : suppliers.map(s => (
                <SupplierCard
                  key={s.id}
                  s={s}
                  can={can}
                  onEdit={() => setModal(s)}
                  onDelete={() => handleDelete(s)}
                  fmt={fmt}
                />
              ))
          }
        </div>

        {/* Desktop table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-muted-300 bg-muted-100/50">
                <th className="text-left py-3 px-4 text-xs font-sans font-semibold text-muted-700 uppercase tracking-wide">Fournisseur</th>
                <th className="text-left py-3 px-4 text-xs font-sans font-semibold text-muted-700 uppercase tracking-wide">Contact</th>
                <th className="text-left py-3 px-4 text-xs font-sans font-semibold text-muted-700 uppercase tracking-wide hidden md:table-cell">Localisation</th>
                <th className="text-right py-3 px-4 text-xs font-sans font-semibold text-muted-700 uppercase tracking-wide hidden lg:table-cell">Total commandé</th>
                <th className="text-center py-3 px-4 text-xs font-sans font-semibold text-muted-700 uppercase tracking-wide">Statut</th>
                <th className="py-3 px-4 w-20" />
              </tr>
            </thead>
            <tbody className="divide-y divide-muted-100">
              {loading
                ? [...Array(4)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="py-3 px-4"><div className="h-4 w-40 bg-muted-100 rounded" /></td>
                      <td className="py-3 px-4"><div className="h-4 w-32 bg-muted-100 rounded" /></td>
                      <td className="py-3 px-4 hidden md:table-cell"><div className="h-4 w-24 bg-muted-100 rounded" /></td>
                      <td className="py-3 px-4 hidden lg:table-cell"><div className="h-4 w-20 bg-muted-100 rounded ml-auto" /></td>
                      <td className="py-3 px-4 text-center"><div className="h-5 w-14 bg-muted-100 rounded-badge mx-auto" /></td>
                      <td className="py-3 px-4"><div className="h-7 w-16 bg-muted-100 rounded-btn ml-auto" /></td>
                    </tr>
                  ))
                : suppliers.length === 0
                  ? (
                    <tr>
                      <td colSpan={6} className="py-16 text-center">
                        <Truck size={32} className="mx-auto text-muted-300 mb-3" />
                        <p className="text-sm font-sans text-muted-500">Aucun fournisseur trouvé.</p>
                        <button onClick={() => setModal('add')} className="btn-primary mt-4 mx-auto text-xs py-2 px-4">
                          Ajouter le premier fournisseur
                        </button>
                      </td>
                    </tr>
                  )
                  : suppliers.map(s => (
                    <tr key={s.id} className="hover:bg-muted-100/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={s.name} />
                          <div>
                            <p className="text-sm font-sans font-semibold text-navy">{s.name}</p>
                            {s.orders_count > 0 && (
                              <p className="text-[11px] text-muted-500">{s.orders_count} commande{s.orders_count > 1 ? 's' : ''}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          {s.phone && <div className="flex items-center gap-1.5"><Phone size={11} className="text-muted-400" /><span className="text-xs text-muted-700">{s.phone}</span></div>}
                          {s.email && <div className="flex items-center gap-1.5"><Mail size={11} className="text-muted-400" /><span className="text-xs text-muted-700 truncate max-w-[150px]">{s.email}</span></div>}
                          {!s.phone && !s.email && <span className="text-xs text-muted-400">—</span>}
                        </div>
                      </td>
                      <td className="py-3 px-4 hidden md:table-cell">
                        {(s.city || s.country_label) ? (
                          <div className="flex items-center gap-1.5">
                            <MapPin size={11} className="text-muted-400" />
                            <span className="text-xs text-muted-700">{[s.city, s.country_label].filter(Boolean).join(', ')}</span>
                          </div>
                        ) : <span className="text-xs text-muted-400">—</span>}
                      </td>
                      <td className="py-3 px-4 text-right hidden lg:table-cell">
                        {s.total_ordered > 0
                          ? <span className="text-sm font-sans font-semibold text-navy">{fmt(s.total_ordered)}</span>
                          : <span className="text-xs text-muted-400">—</span>
                        }
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={cn(
                          'inline-flex items-center gap-1 text-xs font-sans font-semibold px-2 py-0.5 rounded-badge',
                          s.is_active ? 'bg-green-50 text-success' : 'bg-muted-100 text-muted-500'
                        )}>
                          <span className={cn('w-1.5 h-1.5 rounded-full', s.is_active ? 'bg-success' : 'bg-muted-400')} />
                          {s.is_active ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-1">
                          <Link to={`/suppliers/${s.id}`} className="p-1.5 rounded-btn text-muted-500 hover:text-primary-500 hover:bg-primary-50 transition-colors" title="Voir détails">
                            <Eye size={14} />
                          </Link>
                          {can('suppliers', 'edit') && (
                            <button onClick={() => setModal(s)} className="p-1.5 rounded-btn text-muted-500 hover:text-primary-500 hover:bg-primary-50 transition-colors" title="Modifier">
                              <Edit2 size={14} />
                            </button>
                          )}
                          {can('suppliers', 'delete') && (
                            <button onClick={() => handleDelete(s)} className="p-1.5 rounded-btn text-muted-500 hover:text-danger hover:bg-danger/5 transition-colors" title="Supprimer">
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>

        {pageMeta && pageMeta.last_page > 1 && (
          <div className="border-t border-muted-100 px-4 py-3 flex items-center justify-between">
            <span className="text-xs text-muted-500 font-sans">Page {pageMeta.current_page} / {pageMeta.last_page}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => p - 1)} disabled={page === 1} className="p-1.5 rounded-btn border border-muted-300 text-muted-500 hover:text-navy disabled:opacity-30"><ChevronLeft size={15} /></button>
              <button onClick={() => setPage(p => p + 1)} disabled={page === pageMeta.last_page} className="p-1.5 rounded-btn border border-muted-300 text-muted-500 hover:text-navy disabled:opacity-30"><ChevronRight size={15} /></button>
            </div>
          </div>
        )}
      </div>

      {modal && (
        <SupplierModal
          supplier={modal === 'add' ? null : modal}
          meta={meta}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); fetchSuppliers() }}
        />
      )}
    </div>
  )
}
