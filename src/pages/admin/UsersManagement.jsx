import { useEffect, useState, useCallback } from 'react'
import CountryFilter from '@/components/admin/CountryFilter'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { adminService } from '@/services/adminService'
import { useCurrency } from '@/utils/currency'
import { useAuthStore } from '@/store/authStore'
import { confirmDialog } from '@/utils/confirm'
import toast from 'react-hot-toast'
import {
  Search,
  UserX,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  Filter,
  RefreshCw,
  ShieldCheck,
  Building2,
  User,
  X,
  Clock,
  Trash2,
} from 'lucide-react'

const ROLE_BADGE = {
  super_admin: 'bg-purple-100 text-purple-700',
  admin:       'bg-primary-100 text-primary-700',
  employee:    'bg-amber-100 text-amber-700',
  viewer:      'bg-muted-100 text-muted-700',
}

function RoleBadge({ role }) {
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-sans font-semibold px-2 py-0.5 rounded-badge ${ROLE_BADGE[role] ?? 'bg-muted-100 text-muted-700'}`}>
      {role === 'super_admin' && <ShieldCheck size={10} />}
      {role}
    </span>
  )
}

function BlockModal({ user, onConfirm, onClose }) {
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    await onConfirm(reason)
    setLoading(false)
  }

  return (
    /* Bottom sheet on mobile, centered on sm+ */
    <div className="fixed inset-0 bg-navy/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-surface rounded-t-2xl sm:rounded-modal shadow-2xl w-full sm:max-w-xl max-h-[95dvh] sm:max-h-[90vh] flex flex-col animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
        {/* Fixed header */}
        <div className="flex items-start justify-between p-4 sm:p-6 border-b border-muted-100 shrink-0">
          <div>
            <h3 className="font-display font-bold text-navy">Bloquer l'utilisateur</h3>
            <p className="text-sm text-muted-500 font-sans mt-1">{user.name} · {user.email}</p>
          </div>
          <button onClick={onClose} className="p-1 text-muted-500 hover:text-navy">
            <X size={18} />
          </button>
        </div>

        {/* Scrollable body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-4 sm:p-6 space-y-4">
          <div>
            <label className="block text-xs font-sans font-semibold text-muted-700 mb-1.5 uppercase tracking-wide">
              Raison (optionnel)
            </label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={3}
              placeholder="Ex: Violation des conditions d'utilisation..."
              className="input-field resize-none"
            />
          </div>
        </form>

        {/* Fixed footer */}
        <div className="flex gap-3 p-4 sm:p-6 border-t border-muted-100 shrink-0">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-2 px-4 bg-danger text-white rounded-btn text-sm font-sans font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Blocage...' : 'Bloquer'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function UsersManagement() {
  const navigate = useNavigate()
  const role = useAuthStore(s => s.role)
  const isSuper = role === 'super_admin'
  const { format: fmt } = useCurrency()
  const [searchParams, setSearchParams] = useSearchParams()
  const [users, setUsers]       = useState([])
  const [meta, setMeta]         = useState(null)
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [tenantStatusFilter, setTenantStatusFilter] = useState(searchParams.get('tenant_status') || '')
  const [page, setPage]         = useState(1)
  const [country, setCountry]   = useState('')
  const [blockTarget, setBlockTarget]   = useState(null)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, per_page: 15 }
      if (search)             params.search = search
      if (statusFilter)       params.status = statusFilter
      if (tenantStatusFilter) params.tenant_status = tenantStatusFilter
      if (country)            params.country = country
      const res = await adminService.getUsers(params)
      setUsers(res.data.users)
      setMeta(res.data.meta)
    } catch {
      toast.error('Impossible de charger les utilisateurs.')
    } finally {
      setLoading(false)
    }
  }, [page, search, statusFilter, tenantStatusFilter, country])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  const handleBlock = async (reason) => {
    try {
      await adminService.blockUser(blockTarget.id, reason)
      toast.success(`${blockTarget.name} a été bloqué.`)
      setBlockTarget(null)
      fetchUsers()
    } catch {
      toast.error('Erreur lors du blocage.')
    }
  }

  const handleUnblock = async (user) => {
    try {
      await adminService.unblockUser(user.id)
      toast.success(`${user.name} a été débloqué.`)
      fetchUsers()
    } catch {
      toast.error('Erreur lors du déblocage.')
    }
  }

  const handleDelete = async (user) => {
    if (!(await confirmDialog({
      title: `Supprimer ${user.name} ?`,
      text: 'L\'utilisateur sera déplacé dans la corbeille et déconnecté immédiatement.',
      confirmText: 'Supprimer',
    }))) return
    try {
      const r = await adminService.deleteUser(user.id)
      toast.success(r.message)
      fetchUsers()
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Erreur lors de la suppression.')
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold text-navy">Utilisateurs</h1>
          <p className="text-sm font-sans text-muted-500 mt-1">
            {meta ? `${meta.total} utilisateur${meta.total > 1 ? 's' : ''} au total` : '…'}
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <CountryFilter value={country} onChange={(c) => { setCountry(c); setPage(1) }} className="w-44" />
          {isSuper && (
            <button
              onClick={() => navigate('/admin/trash')}
              className="btn-secondary flex items-center gap-2 text-sm"
              title="Corbeille"
            >
              <Trash2 size={14} />
              <span className="hidden sm:inline">Corbeille</span>
            </button>
          )}
          <button
            onClick={fetchUsers}
            className="btn-secondary flex items-center gap-2 text-sm"
            title="Actualiser"
          >
            <RefreshCw size={14} />
            <span className="hidden sm:inline">Actualiser</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 sm:p-5 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-500" />
          <input
            type="text"
            placeholder="Rechercher par nom ou email…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            className="input-field pl-9"
          />
        </div>
        <div className="relative">
          <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-500" />
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
            className="input-field pl-9 pr-8 appearance-none cursor-pointer w-full sm:min-w-[150px]"
          >
            <option value="">Profil (Tout)</option>
            <option value="active">Actifs</option>
            <option value="blocked">Bloqués</option>
          </select>
        </div>
        <div className="relative">
          <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-500" />
          <select
            value={tenantStatusFilter}
            onChange={e => {
              setTenantStatusFilter(e.target.value)
              setPage(1)
              setSearchParams({})
            }}
            className="input-field pl-9 pr-8 appearance-none cursor-pointer w-full sm:min-w-[170px]"
          >
            <option value="">Espace (Tout)</option>
            <option value="active">Espaces Actifs</option>
            <option value="pending">En attente d'approbation</option>
          </select>
        </div>
      </div>

      {/* ── Desktop Table (hidden on mobile) ── */}
      <div className="card overflow-hidden hidden sm:block">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-muted-300 bg-muted-100/50">
                <th className="text-left py-3 px-4 text-xs font-sans font-semibold text-muted-700 uppercase tracking-wide">Utilisateur</th>
                <th className="text-left py-3 px-4 text-xs font-sans font-semibold text-muted-700 uppercase tracking-wide hidden md:table-cell">Rôle</th>
                <th className="text-left py-3 px-4 text-xs font-sans font-semibold text-muted-700 uppercase tracking-wide hidden lg:table-cell">Espace</th>
                <th className="text-left py-3 px-4 text-xs font-sans font-semibold text-muted-700 uppercase tracking-wide">Statut</th>
                <th className="text-right py-3 px-4 text-xs font-sans font-semibold text-muted-700 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-muted-100">
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-muted-100" />
                        <div>
                          <div className="h-3.5 w-32 bg-muted-100 rounded mb-1.5" />
                          <div className="h-3 w-24 bg-muted-100 rounded" />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell"><div className="h-5 w-16 bg-muted-100 rounded-badge" /></td>
                    <td className="py-3 px-4 hidden lg:table-cell"><div className="h-3.5 w-24 bg-muted-100 rounded" /></td>
                    <td className="py-3 px-4"><div className="h-5 w-14 bg-muted-100 rounded-badge" /></td>
                    <td className="py-3 px-4"><div className="h-7 w-20 bg-muted-100 rounded-btn ml-auto" /></td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-sm text-muted-500 font-sans">
                    Aucun utilisateur trouvé.
                  </td>
                </tr>
              ) : (
                users.map(user => (
                  <tr key={user.id}
                    onClick={() => navigate(`/admin/users/${user.id}`)}
                    className="hover:bg-primary-50/40 transition-colors cursor-pointer">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-display font-bold text-white">
                            {user.name?.[0]?.toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-sans font-semibold text-navy">{user.name}</p>
                          <p className="text-xs text-muted-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell">
                      {user.roles?.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {user.roles.map(r => <RoleBadge key={r} role={r} />)}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-300 font-sans">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 hidden lg:table-cell">
                      {user.tenant ? (
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5 text-xs text-navy font-bold font-display">
                            <Building2 size={12} className="text-muted-500" />
                            {user.tenant.name}
                          </div>
                          {!user.tenant.is_active && (
                            <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-tighter text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 w-fit">
                              <Clock size={10} /> Approbation requise
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-300 font-sans">Sans espace</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {user.is_active ? (
                        <span className="inline-flex items-center gap-1 text-xs font-sans font-semibold px-2 py-0.5 rounded-badge bg-green-50 text-success">
                          <span className="w-1.5 h-1.5 rounded-full bg-success" />
                          Actif
                        </span>
                      ) : (
                        <span
                          className="inline-flex items-center gap-1 text-xs font-sans font-semibold px-2 py-0.5 rounded-badge bg-red-50 text-danger cursor-help"
                          title={user.block_reason ?? ''}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-danger" />
                          Bloqué
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right" onClick={e => e.stopPropagation()}>
                      {user.tenant && !user.tenant.is_active ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-sans font-black uppercase tracking-tighter px-3 py-1.5 rounded-btn bg-navy text-white">
                          Examiner
                        </span>
                      ) : user.roles?.includes('super_admin') ? (
                        <span className="text-xs text-muted-300 font-sans">Protégé</span>
                      ) : (
                        <div className="inline-flex items-center gap-1.5">
                          {user.is_active ? (
                            <button
                              onClick={() => setBlockTarget(user)}
                              className="inline-flex items-center gap-1.5 text-xs font-sans font-semibold px-3 py-1.5 rounded-btn border border-danger/30 text-danger hover:bg-danger/5 transition-colors"
                            >
                              <UserX size={13} />
                              Bloquer
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUnblock(user)}
                              className="inline-flex items-center gap-1.5 text-xs font-sans font-semibold px-3 py-1.5 rounded-btn border border-success/30 text-success hover:bg-success/5 transition-colors"
                            >
                              <UserCheck size={13} />
                              Débloquer
                            </button>
                          )}
                          {isSuper && (
                            <button
                              onClick={() => handleDelete(user)}
                              className="p-1.5 rounded-btn text-muted-400 hover:text-danger hover:bg-danger/5 transition-colors"
                              title="Supprimer (corbeille)"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta && meta.last_page > 1 && (
          <div className="border-t border-muted-100 px-4 py-3 flex items-center justify-between">
            <span className="text-xs text-muted-500 font-sans">
              Page {meta.current_page} / {meta.last_page}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => p - 1)}
                disabled={page === 1}
                className="p-1.5 rounded-btn border border-muted-300 text-muted-500 hover:text-navy disabled:opacity-30 transition-colors"
              >
                <ChevronLeft size={15} />
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page === meta.last_page}
                className="p-1.5 rounded-btn border border-muted-300 text-muted-500 hover:text-navy disabled:opacity-30 transition-colors"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Mobile Card List (sm:hidden) ── */}
      <div className="sm:hidden space-y-3">
        {loading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="card p-4 animate-pulse space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-muted-100 shrink-0" />
                <div className="flex-1">
                  <div className="h-3.5 w-32 bg-muted-100 rounded mb-2" />
                  <div className="h-3 w-24 bg-muted-100 rounded" />
                </div>
              </div>
              <div className="h-7 w-full bg-muted-100 rounded-btn" />
            </div>
          ))
        ) : users.length === 0 ? (
          <div className="card p-8 text-center text-sm text-muted-500 font-sans">
            Aucun utilisateur trouvé.
          </div>
        ) : (
          users.map(user => (
            <div
              key={user.id}
              className="card p-4 cursor-pointer hover:border-primary-200 transition-colors"
              onClick={() => navigate(`/admin/users/${user.id}`)}
            >
              {/* User info row */}
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-display font-bold text-white">
                    {user.name?.[0]?.toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-sans font-semibold text-navy truncate">{user.name}</p>
                  <p className="text-xs text-muted-500 truncate">{user.email}</p>
                  {/* Roles */}
                  {user.roles?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {user.roles.map(r => <RoleBadge key={r} role={r} />)}
                    </div>
                  )}
                </div>
                {/* Status badge */}
                <div className="shrink-0">
                  {user.is_active ? (
                    <span className="inline-flex items-center gap-1 text-xs font-sans font-semibold px-2 py-0.5 rounded-badge bg-green-50 text-success">
                      <span className="w-1.5 h-1.5 rounded-full bg-success" />
                      Actif
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-sans font-semibold px-2 py-0.5 rounded-badge bg-red-50 text-danger">
                      <span className="w-1.5 h-1.5 rounded-full bg-danger" />
                      Bloqué
                    </span>
                  )}
                </div>
              </div>

              {/* Tenant info */}
              {user.tenant && (
                <div className="mt-2.5 flex items-center gap-1.5 text-xs text-muted-600">
                  <Building2 size={11} className="text-muted-400 shrink-0" />
                  <span className="font-medium truncate">{user.tenant.name}</span>
                  {!user.tenant.is_active && (
                    <span className="ml-1 inline-flex items-center gap-0.5 text-[9px] font-black uppercase tracking-tighter text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                      <Clock size={9} /> En attente
                    </span>
                  )}
                </div>
              )}

              {/* Action button — always visible */}
              <div className="mt-3 pt-3 border-t border-muted-100" onClick={e => e.stopPropagation()}>
                {user.tenant && !user.tenant.is_active ? (
                  <button
                    onClick={() => navigate(`/admin/users/${user.id}`)}
                    className="w-full inline-flex items-center justify-center gap-1.5 text-xs font-sans font-black uppercase tracking-tighter px-3 py-2 rounded-btn bg-navy text-white"
                  >
                    Examiner l'espace
                  </button>
                ) : user.roles?.includes('super_admin') ? (
                  <span className="block text-center text-xs text-muted-300 font-sans">Compte protégé</span>
                ) : user.is_active ? (
                  <button
                    onClick={() => setBlockTarget(user)}
                    className="w-full inline-flex items-center justify-center gap-1.5 text-xs font-sans font-semibold px-3 py-2 rounded-btn border border-danger/30 text-danger hover:bg-danger/5 transition-colors"
                  >
                    <UserX size={13} />
                    Bloquer l'utilisateur
                  </button>
                ) : (
                  <button
                    onClick={() => handleUnblock(user)}
                    className="w-full inline-flex items-center justify-center gap-1.5 text-xs font-sans font-semibold px-3 py-2 rounded-btn border border-success/30 text-success hover:bg-success/5 transition-colors"
                  >
                    <UserCheck size={13} />
                    Débloquer l'utilisateur
                  </button>
                )}
              </div>
            </div>
          ))
        )}

        {/* Mobile pagination */}
        {meta && meta.last_page > 1 && (
          <div className="flex items-center justify-between px-1">
            <span className="text-xs text-muted-500 font-sans">
              Page {meta.current_page} / {meta.last_page}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => p - 1)}
                disabled={page === 1}
                className="p-2 rounded-btn border border-muted-300 text-muted-500 hover:text-navy disabled:opacity-30 transition-colors"
              >
                <ChevronLeft size={15} />
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page === meta.last_page}
                className="p-2 rounded-btn border border-muted-300 text-muted-500 hover:text-navy disabled:opacity-30 transition-colors"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Block modal */}
      {blockTarget && (
        <BlockModal
          user={blockTarget}
          onConfirm={handleBlock}
          onClose={() => setBlockTarget(null)}
        />
      )}
    </div>
  )
}
