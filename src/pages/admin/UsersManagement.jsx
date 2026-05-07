import { useEffect, useState, useCallback } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { adminService } from '@/services/adminService'
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
    <div className="fixed inset-0 bg-navy/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-modal shadow-2xl w-full max-w-md p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-display font-bold text-navy">Bloquer l'utilisateur</h3>
            <p className="text-sm text-muted-500 font-sans mt-1">{user.name} · {user.email}</p>
          </div>
          <button onClick={onClose} className="p-1 text-muted-500 hover:text-navy">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 px-4 bg-danger text-white rounded-btn text-sm font-sans font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Blocage...' : 'Bloquer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function UsersManagement() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [users, setUsers]       = useState([])
  const [meta, setMeta]         = useState(null)
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [tenantStatusFilter, setTenantStatusFilter] = useState(searchParams.get('tenant_status') || '')
  const [page, setPage]         = useState(1)
  const [blockTarget, setBlockTarget]   = useState(null)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, per_page: 15 }
      if (search)             params.search = search
      if (statusFilter)       params.status = statusFilter
      if (tenantStatusFilter) params.tenant_status = tenantStatusFilter
      const res = await adminService.getUsers(params)
      setUsers(res.data.users)
      setMeta(res.data.meta)
    } catch {
      toast.error('Impossible de charger les utilisateurs.')
    } finally {
      setLoading(false)
    }
  }, [page, search, statusFilter, tenantStatusFilter])

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

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-navy">Utilisateurs</h1>
          <p className="text-sm font-sans text-muted-500 mt-1">
            {meta ? `${meta.total} utilisateur${meta.total > 1 ? 's' : ''} au total` : '…'}
          </p>
        </div>
        <button
          onClick={fetchUsers}
          className="btn-secondary flex items-center gap-2 text-sm"
        >
          <RefreshCw size={14} />
          Actualiser
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3">
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
            className="input-field pl-9 pr-8 appearance-none cursor-pointer min-w-[150px]"
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
              setTenantStatusFilter(e.target.value); 
              setPage(1); 
              setSearchParams({}); // Clear URL params when changing filter manually
            }}
            className="input-field pl-9 pr-8 appearance-none cursor-pointer min-w-[170px]"
          >
            <option value="">Espace (Tout)</option>
            <option value="active">Espaces Actifs</option>
            <option value="pending">En attente d'approbation</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
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
                      ) : user.is_active ? (
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
