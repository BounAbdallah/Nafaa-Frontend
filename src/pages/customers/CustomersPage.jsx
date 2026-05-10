import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { customerService } from '@/services/customerService'
import toast from 'react-hot-toast'
import {
  Plus, Search, Users, Building2, User, Edit2, Trash2,
  X, Loader2, ChevronLeft, ChevronRight, RefreshCw,
  Phone, Mail, MapPin, TrendingUp, ShoppingBag, Eye,
} from 'lucide-react'
import { cn } from '@/utils/cn'

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (n) => new Intl.NumberFormat('fr-FR').format(n) + ' FCFA'

const schema = z.object({
  name:    z.string().min(1, 'Nom requis'),
  type:    z.enum(['individual', 'company']),
  email:   z.string().email('Email invalide').optional().or(z.literal('')),
  phone:   z.string().optional(),
  company: z.string().optional(),
  address: z.string().optional(),
  city:    z.string().optional(),
  country: z.string().optional(),
  notes:   z.string().optional(),
  is_active: z.boolean().optional(),
})

// ── Modal Add/Edit ────────────────────────────────────────────────────────────
function CustomerModal({ customer, meta, onClose, onSaved }) {
  const isEdit = !!customer

  const { register, handleSubmit, watch, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: customer
      ? { ...customer }
      : { type: 'individual', is_active: true },
  })
  const type = watch('type')

  useEffect(() => { if (customer) reset(customer) }, [customer, reset])

  const onSubmit = async (data) => {
    try {
      if (isEdit) await customerService.update(customer.id, data)
      else        await customerService.create(data)
      toast.success(isEdit ? 'Client mis à jour.' : 'Client ajouté.')
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
    <div className="fixed inset-0 bg-navy/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-modal shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 flex-shrink-0">
          <h3 className="font-display font-bold text-navy">
            {isEdit ? 'Modifier le client' : 'Ajouter un client'}
          </h3>
          <button onClick={onClose} className="p-1.5 text-muted-500 hover:text-navy rounded-btn hover:bg-muted-100">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="overflow-y-auto flex-1">
          <div className="px-6 pb-6 space-y-4">
            {/* Type */}
            <div className="space-y-1.5">
              <label className="block text-xs font-sans font-semibold text-muted-700 uppercase tracking-wide">Type</label>
              <div className="grid grid-cols-2 gap-2">
                {[{v:'individual',l:'Particulier',icon:User},{v:'company',l:'Entreprise',icon:Building2}].map(({v,l,icon:Icon}) => (
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
            {field('name', 'Nom complet', { placeholder: type === 'company' ? 'ex: Société BTP Mali' : 'ex: Aminata Diallo' })}

            {/* Entreprise (si particulier avec société) */}
            {type === 'individual' && (
              field('company', 'Entreprise (optionnel)', { placeholder: 'ex: SARL Diallo & Fils' })
            )}

            {/* Contacts */}
            <div className="grid grid-cols-2 gap-3">
              {field('email', 'Email', { type: 'email', placeholder: 'exemple@email.com' })}
              {field('phone', 'Téléphone', { placeholder: '+223 70 00 00 00' })}
            </div>

            {/* Adresse */}
            {field('address', 'Adresse', { placeholder: 'ex: Quartier du Fleuve, Rue 123' })}

            <div className="grid grid-cols-2 gap-3">
              {field('city', 'Ville', { placeholder: 'ex: Bamako' })}
              <div className="space-y-1.5">
                <label className="block text-xs font-sans font-semibold text-muted-700 uppercase tracking-wide">Pays</label>
                <select {...register('country')} className="input-field appearance-none">
                  <option value="">— Sélectionner —</option>
                  {meta?.countries?.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <label className="block text-xs font-sans font-semibold text-muted-700 uppercase tracking-wide">Notes</label>
              <textarea {...register('notes')} rows={2} placeholder="Notes internes optionnelles…" className="input-field resize-none" />
            </div>

            {/* Actif */}
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" {...register('is_active')} className="w-4 h-4 accent-primary-500 rounded" />
              <span className="text-sm font-sans text-navy">Client actif</span>
            </label>
          </div>
        </form>

        {/* Footer */}
        <div className="flex gap-3 p-6 pt-4 border-t border-muted-100 flex-shrink-0">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Annuler</button>
          <button
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            {isSubmitting ? <Loader2 size={15} className="animate-spin" /> : null}
            {isSubmitting ? 'Enregistrement…' : (isEdit ? 'Enregistrer' : 'Ajouter')}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Initiales avatar ──────────────────────────────────────────────────────────
function Avatar({ name, type }) {
  const initials = (name || '?').split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || '?'
  return (
    <div className={cn(
      'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-sans font-bold',
      type === 'company' ? 'bg-violet-100 text-violet-600' : 'bg-primary-50 text-primary-600'
    )}>
      {initials}
    </div>
  )
}

// ── Page principale ───────────────────────────────────────────────────────────
export default function CustomersPage() {
  const { can }  = useAuthStore()
  const [customers, setCustomers] = useState([])
  const [meta, setMeta]           = useState(null)
  const [pageMeta, setPageMeta]   = useState(null)
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [typeFilter, setType]     = useState('')
  const [page, setPage]           = useState(1)
  const [modal, setModal]         = useState(null) // null | 'add' | customer_obj

  useEffect(() => {
    customerService.getMeta().then(r => setMeta(r.data)).catch(() => {})
  }, [])

  const fetchCustomers = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, per_page: 15 }
      if (search)     params.search = search
      if (typeFilter) params.type   = typeFilter
      const r = await customerService.getAll(params)
      setCustomers(r.data.customers)
      setPageMeta(r.data.meta)
    } catch { toast.error('Impossible de charger les clients.') }
    finally { setLoading(false) }
  }, [page, search, typeFilter])

  useEffect(() => { fetchCustomers() }, [fetchCustomers])

  // Listen for AI actions
  useEffect(() => {
    const handleAiAction = (e) => {
      const action = e.detail?.action
      if (action === 'create_customer' || action === 'list_customers') {
        fetchCustomers()
      }
    }
    window.addEventListener('qiwam:ai-action', handleAiAction)
    return () => window.removeEventListener('qiwam:ai-action', handleAiAction)
  }, [fetchCustomers])

  const handleDelete = async (c) => {
    if (!window.confirm(`Supprimer "${c.name}" ?`)) return
    try {
      await customerService.remove(c.id)
      toast.success('Client supprimé.')
      fetchCustomers()
    } catch { toast.error('Erreur lors de la suppression.') }
  }

  const stats = {
    total:      pageMeta?.total ?? 0,
    companies:  customers.filter(c => c.type === 'company').length,
    active:     customers.filter(c => c.is_active).length,
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-navy">Clients</h1>
          <p className="text-sm font-sans text-muted-500 mt-1">
            {pageMeta ? `${pageMeta.total} client${pageMeta.total > 1 ? 's' : ''}` : '…'}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchCustomers} className="btn-secondary p-2.5"><RefreshCw size={15} /></button>
          {can('customers', 'create') && (
            <button onClick={() => setModal('add')} className="btn-primary flex items-center gap-2">
              <Plus size={16} />Ajouter
            </button>
          )}
        </div>
      </div>

      {/* Stats rapides */}
      {pageMeta && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Total clients', value: pageMeta.total, icon: Users,       color: 'text-primary-500 bg-primary-50' },
            { label: 'Entreprises',   value: stats.companies, icon: Building2,   color: 'text-violet-500 bg-violet-50' },
            { label: 'Actifs',        value: stats.active,    icon: TrendingUp,  color: 'text-success bg-green-50' },
          ].map(s => (
            <div key={s.label} className="card p-4 flex items-center gap-3">
              <div className={cn('w-9 h-9 rounded-card flex items-center justify-center flex-shrink-0', s.color)}>
                <s.icon size={17} />
              </div>
              <div>
                <p className="text-lg font-display font-bold text-navy">{s.value}</p>
                <p className="text-xs text-muted-500 font-sans">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filtres */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-500" />
          <input
            placeholder="Rechercher par nom, email, téléphone…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            className="input-field pl-9"
          />
        </div>
        <select
          value={typeFilter}
          onChange={e => { setType(e.target.value); setPage(1) }}
          className="input-field appearance-none min-w-[150px]"
        >
          <option value="">Tous les types</option>
          <option value="individual">Particuliers</option>
          <option value="company">Entreprises</option>
        </select>
      </div>

      {/* Tableau */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-muted-300 bg-muted-100/50">
                <th className="text-left py-3 px-4 text-xs font-sans font-semibold text-muted-700 uppercase tracking-wide">Client</th>
                <th className="text-left py-3 px-4 text-xs font-sans font-semibold text-muted-700 uppercase tracking-wide hidden sm:table-cell">Contact</th>
                <th className="text-left py-3 px-4 text-xs font-sans font-semibold text-muted-700 uppercase tracking-wide hidden md:table-cell">Localisation</th>
                <th className="text-right py-3 px-4 text-xs font-sans font-semibold text-muted-700 uppercase tracking-wide hidden lg:table-cell">Total dépensé</th>
                <th className="text-center py-3 px-4 text-xs font-sans font-semibold text-muted-700 uppercase tracking-wide">Statut</th>
                <th className="py-3 px-4 w-20" />
              </tr>
            </thead>
            <tbody className="divide-y divide-muted-100">
              {loading
                ? [...Array(5)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="py-3 px-4"><div className="h-4 w-40 bg-muted-100 rounded" /></td>
                      <td className="py-3 px-4 hidden sm:table-cell"><div className="h-4 w-32 bg-muted-100 rounded" /></td>
                      <td className="py-3 px-4 hidden md:table-cell"><div className="h-4 w-24 bg-muted-100 rounded" /></td>
                      <td className="py-3 px-4 hidden lg:table-cell text-right"><div className="h-4 w-20 bg-muted-100 rounded ml-auto" /></td>
                      <td className="py-3 px-4 text-center"><div className="h-5 w-14 bg-muted-100 rounded-badge mx-auto" /></td>
                      <td className="py-3 px-4"><div className="h-7 w-16 bg-muted-100 rounded-btn ml-auto" /></td>
                    </tr>
                  ))
                : customers.length === 0
                  ? (
                    <tr>
                      <td colSpan={6} className="py-16 text-center">
                        <Users size={32} className="mx-auto text-muted-300 mb-3" />
                        <p className="text-sm font-sans text-muted-500">Aucun client trouvé.</p>
                        <button onClick={() => setModal('add')} className="btn-primary mt-4 mx-auto text-xs py-2 px-4">
                          Ajouter le premier client
                        </button>
                      </td>
                    </tr>
                  )
                  : customers.map(c => (
                    <tr key={c.id} className="hover:bg-muted-100/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={c.name} type={c.type} />
                          <div>
                            <p className="text-sm font-sans font-semibold text-navy">{c.name}</p>
                            <div className="flex items-center gap-1.5">
                              {c.type === 'company'
                                ? <Building2 size={10} className="text-violet-400" />
                                : <User size={10} className="text-primary-400" />
                              }
                              <span className="text-[11px] text-muted-500">
                                {c.type === 'company' ? 'Entreprise' : 'Particulier'}
                                {c.company && c.type === 'individual' && ` · ${c.company}`}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 hidden sm:table-cell">
                        <div className="space-y-0.5">
                          {c.email && (
                            <div className="flex items-center gap-1.5">
                              <Mail size={11} className="text-muted-400 flex-shrink-0" />
                              <span className="text-xs font-sans text-muted-700 truncate max-w-[160px]">{c.email}</span>
                            </div>
                          )}
                          {c.phone && (
                            <div className="flex items-center gap-1.5">
                              <Phone size={11} className="text-muted-400 flex-shrink-0" />
                              <span className="text-xs font-sans text-muted-700">{c.phone}</span>
                            </div>
                          )}
                          {!c.email && !c.phone && <span className="text-xs text-muted-400">—</span>}
                        </div>
                      </td>
                      <td className="py-3 px-4 hidden md:table-cell">
                        {(c.city || c.country_label) ? (
                          <div className="flex items-center gap-1.5">
                            <MapPin size={11} className="text-muted-400 flex-shrink-0" />
                            <span className="text-xs font-sans text-muted-700">
                              {[c.city, c.country_label].filter(Boolean).join(', ')}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-400">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right hidden lg:table-cell">
                        {c.total_spent > 0 ? (
                          <div>
                            <span className="text-sm font-sans font-semibold text-navy">{fmt(c.total_spent)}</span>
                            <p className="text-[11px] text-muted-500 flex items-center justify-end gap-1">
                              <ShoppingBag size={9} />{c.orders_count} commande{c.orders_count > 1 ? 's' : ''}
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-400">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={cn(
                          'inline-flex items-center gap-1 text-xs font-sans font-semibold px-2 py-0.5 rounded-badge',
                          c.is_active ? 'bg-green-50 text-success' : 'bg-muted-100 text-muted-500'
                        )}>
                          <span className={cn('w-1.5 h-1.5 rounded-full', c.is_active ? 'bg-success' : 'bg-muted-400')} />
                          {c.is_active ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-1">
                          <Link to={`/customers/${c.id}`} className="p-1.5 rounded-btn text-muted-500 hover:text-primary-500 hover:bg-primary-50 transition-colors" title="Voir détails">
                            <Eye size={14} />
                          </Link>
                          {can('customers', 'edit') && (
                            <button
                              onClick={() => setModal(c)}
                              className="p-1.5 rounded-btn text-muted-500 hover:text-primary-500 hover:bg-primary-50 transition-colors"
                              title="Modifier"
                            >
                              <Edit2 size={14} />
                            </button>
                          )}
                          {can('customers', 'delete') && (
                            <button
                              onClick={() => handleDelete(c)}
                              className="p-1.5 rounded-btn text-muted-500 hover:text-danger hover:bg-danger/5 transition-colors"
                              title="Supprimer"
                            >
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

        {/* Pagination */}
        {pageMeta && pageMeta.last_page > 1 && (
          <div className="border-t border-muted-100 px-4 py-3 flex items-center justify-between">
            <span className="text-xs text-muted-500 font-sans">Page {pageMeta.current_page} / {pageMeta.last_page}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => p - 1)} disabled={page === 1} className="p-1.5 rounded-btn border border-muted-300 text-muted-500 hover:text-navy disabled:opacity-30">
                <ChevronLeft size={15} />
              </button>
              <button onClick={() => setPage(p => p + 1)} disabled={page === pageMeta.last_page} className="p-1.5 rounded-btn border border-muted-300 text-muted-500 hover:text-navy disabled:opacity-30">
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <CustomerModal
          customer={modal === 'add' ? null : modal}
          meta={meta}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); fetchCustomers() }}
        />
      )}
    </div>
  )
}
