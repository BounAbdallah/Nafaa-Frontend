import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { adminService } from '@/services/adminService'
import { useAuthStore } from '@/store/authStore'
import { COUNTRIES } from '@/utils/currency'
import { confirmDialog } from '@/utils/confirm'
import toast from 'react-hot-toast'
import {
  Trash2, RotateCcw, Search, ChevronLeft, ChevronRight, Users, Building2, ShieldCheck,
} from 'lucide-react'
import { cn } from '@/utils/cn'

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'

const countryLabel = (code) => COUNTRIES.find(c => c.code === code)?.label ?? code ?? '—'

export default function TrashPage() {
  const role = useAuthStore(s => s.role)
  const isSuper = role === 'super_admin'
  // L'onglet Utilisateurs n'existe que pour le super admin
  const [tab, setTab] = useState(isSuper ? 'users' : 'tenants')

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <Link to="/admin/users" className="inline-flex items-center gap-1.5 text-xs font-sans text-muted-500 hover:text-navy transition-colors">
          <ChevronLeft size={14} />Administration
        </Link>
        <h1 className="text-xl sm:text-2xl font-display font-bold text-navy flex items-center gap-2 mt-2">
          <Trash2 size={22} className="text-muted-400" />
          Corbeille
        </h1>
        <p className="text-sm font-sans text-muted-500 mt-1">
          Éléments supprimés — restaurez-les ou supprimez-les définitivement.
        </p>
      </div>

      {/* Onglets */}
      <div className="flex gap-1 border-b border-muted-200">
        {isSuper && (
          <TabButton active={tab === 'users'} onClick={() => setTab('users')} icon={Users} label="Utilisateurs" />
        )}
        <TabButton active={tab === 'tenants'} onClick={() => setTab('tenants')} icon={Building2} label="Espaces" />
      </div>

      {tab === 'users'   && isSuper && <UsersTrash />}
      {tab === 'tenants' && <TenantsTrash isSuper={isSuper} />}
    </div>
  )
}

function TabButton({ active, onClick, icon: Icon, label }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-4 py-2.5 font-semibold text-sm border-b-2 transition-colors flex items-center gap-2',
        active ? 'border-primary-500 text-primary-600' : 'border-transparent text-muted-500 hover:text-navy'
      )}
    >
      <Icon size={15} />{label}
    </button>
  )
}

// ── Corbeille utilisateurs ────────────────────────────────────────────────────
function UsersTrash() {
  const [items, setItems]   = useState([])
  const [meta, setMeta]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage]     = useState(1)
  const [search, setSearch] = useState('')
  const [busy, setBusy]     = useState(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, per_page: 15 }
      if (search) params.search = search
      const r = await adminService.getTrashedUsers(params)
      setItems(r.data.users)
      setMeta(r.data.meta)
    } catch { toast.error('Erreur de chargement.') }
    finally { setLoading(false) }
  }, [page, search])

  useEffect(() => { const t = setTimeout(fetch, search ? 300 : 0); return () => clearTimeout(t) }, [fetch])

  const restore = async (u) => {
    setBusy(u.id)
    try { const r = await adminService.restoreUser(u.id); toast.success(r.message); fetch() }
    catch { toast.error('Erreur.') } finally { setBusy(null) }
  }

  const purge = async (u) => {
    if (!(await confirmDialog({
      title: `Supprimer définitivement ${u.name} ?`,
      text: 'Action irréversible.', confirmText: 'Supprimer définitivement',
    }))) return
    setBusy(u.id)
    try { const r = await adminService.forceDeleteUser(u.id); toast.success(r.message); fetch() }
    catch { toast.error('Erreur.') } finally { setBusy(null) }
  }

  return (
    <TrashTable
      loading={loading} items={items} meta={meta} page={page} setPage={setPage}
      search={search} setSearch={setSearch} busy={busy}
      placeholder="Rechercher un utilisateur supprimé…"
      emptyText="Aucun utilisateur dans la corbeille."
      columns={['Utilisateur', 'Espace', 'Supprimé le']}
      renderRow={(u) => (
        <>
          <td className="py-3 px-4">
            <p className="text-sm font-sans font-semibold text-navy">{u.name}</p>
            <p className="text-[11px] text-muted-500">{u.email}</p>
            {u.roles?.length > 0 && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-muted-500 mt-0.5">
                {u.roles.includes('super_admin') && <ShieldCheck size={9} />}{u.roles.join(', ')}
              </span>
            )}
          </td>
          <td className="py-3 px-4 hidden sm:table-cell"><span className="text-xs text-muted-700">{u.tenant ?? '—'}</span></td>
          <td className="py-3 px-4 text-right hidden md:table-cell"><span className="text-xs text-muted-500">{fmtDate(u.deleted_at)}</span></td>
        </>
      )}
      onRestore={restore} onPurge={purge}
    />
  )
}

// ── Corbeille espaces ─────────────────────────────────────────────────────────
function TenantsTrash() {
  const [items, setItems]   = useState([])
  const [meta, setMeta]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage]     = useState(1)
  const [search, setSearch] = useState('')
  const [busy, setBusy]     = useState(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, per_page: 15 }
      if (search) params.search = search
      const r = await adminService.getTrashedTenants(params)
      setItems(r.data.tenants)
      setMeta(r.data.meta)
    } catch { toast.error('Erreur de chargement.') }
    finally { setLoading(false) }
  }, [page, search])

  useEffect(() => { const t = setTimeout(fetch, search ? 300 : 0); return () => clearTimeout(t) }, [fetch])

  const restore = async (t) => {
    setBusy(t.id)
    try { const r = await adminService.restoreTenant(t.id); toast.success(r.message); fetch() }
    catch { toast.error('Erreur.') } finally { setBusy(null) }
  }

  const purge = async (t) => {
    if (!(await confirmDialog({
      title: `Supprimer définitivement « ${t.name} » ?`,
      text: 'L\'espace ET tous ses utilisateurs seront effacés pour toujours.', confirmText: 'Supprimer définitivement',
    }))) return
    setBusy(t.id)
    try { const r = await adminService.forceDeleteTenant(t.id); toast.success(r.message); fetch() }
    catch { toast.error('Erreur.') } finally { setBusy(null) }
  }

  return (
    <TrashTable
      loading={loading} items={items} meta={meta} page={page} setPage={setPage}
      search={search} setSearch={setSearch} busy={busy}
      placeholder="Rechercher un espace supprimé…"
      emptyText="Aucun espace dans la corbeille."
      columns={['Espace', 'Propriétaire', 'Supprimé le']}
      renderRow={(t) => (
        <>
          <td className="py-3 px-4">
            <p className="text-sm font-sans font-semibold text-navy">{t.name}</p>
            {t.country && <p className="text-[11px] text-muted-500">{countryLabel(t.country)}</p>}
          </td>
          <td className="py-3 px-4 hidden sm:table-cell">
            <p className="text-xs text-muted-700">{t.owner ?? '—'}</p>
            {t.owner_email && <p className="text-[11px] text-muted-400">{t.owner_email}</p>}
          </td>
          <td className="py-3 px-4 text-right hidden md:table-cell"><span className="text-xs text-muted-500">{fmtDate(t.deleted_at)}</span></td>
        </>
      )}
      onRestore={restore} onPurge={purge}
    />
  )
}

// ── Tableau générique de corbeille ────────────────────────────────────────────
function TrashTable({ loading, items, meta, page, setPage, search, setSearch, busy, placeholder, emptyText, columns, renderRow, onRestore, onPurge }) {
  return (
    <div className="space-y-4">
      <div className="card p-3 sm:p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-500" />
          <input type="text" placeholder={placeholder} className="input-field pl-10 w-full"
            value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-muted-300 bg-muted-100/50">
                <th className="text-left py-3 px-4 text-xs font-sans font-semibold text-muted-700 uppercase tracking-wide">{columns[0]}</th>
                <th className="text-left py-3 px-4 text-xs font-sans font-semibold text-muted-700 uppercase tracking-wide hidden sm:table-cell">{columns[1]}</th>
                <th className="text-right py-3 px-4 text-xs font-sans font-semibold text-muted-700 uppercase tracking-wide hidden md:table-cell">{columns[2]}</th>
                <th className="py-3 px-4 w-40" />
              </tr>
            </thead>
            <tbody className="divide-y divide-muted-100">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-3 px-4"><div className="h-4 w-40 bg-muted-100 rounded" /></td>
                    <td className="py-3 px-4 hidden sm:table-cell"><div className="h-4 w-28 bg-muted-100 rounded" /></td>
                    <td className="py-3 px-4 hidden md:table-cell"><div className="h-4 w-24 bg-muted-100 rounded ml-auto" /></td>
                    <td className="py-3 px-4"><div className="h-7 w-28 bg-muted-100 rounded-btn ml-auto" /></td>
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr><td colSpan={4} className="py-16 text-center">
                  <Trash2 size={32} className="mx-auto text-muted-300 mb-3" />
                  <p className="text-sm font-sans text-muted-500">{emptyText}</p>
                </td></tr>
              ) : items.map(item => (
                <tr key={item.id} className="hover:bg-muted-50/60 transition-colors">
                  {renderRow(item)}
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-1.5">
                      <button onClick={() => onRestore(item)} disabled={busy === item.id}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-btn border border-muted-200 text-xs font-sans font-semibold text-muted-600 hover:text-success hover:border-green-300 hover:bg-green-50 transition-colors disabled:opacity-50">
                        <RotateCcw size={13} />Restaurer
                      </button>
                      <button onClick={() => onPurge(item)} disabled={busy === item.id}
                        className="p-1.5 rounded-btn text-muted-500 hover:text-danger hover:bg-danger/5 transition-colors disabled:opacity-50"
                        title="Supprimer définitivement">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {meta && meta.last_page > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-muted-200">
            <p className="text-xs text-muted-500">{meta.total} élément(s) — page {meta.current_page}/{meta.last_page}</p>
            <div className="flex gap-1">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="p-1.5 rounded-btn border border-muted-200 text-muted-600 disabled:opacity-40 hover:bg-muted-50"><ChevronLeft size={15} /></button>
              <button disabled={page >= meta.last_page} onClick={() => setPage(p => p + 1)} className="p-1.5 rounded-btn border border-muted-200 text-muted-600 disabled:opacity-40 hover:bg-muted-50"><ChevronRight size={15} /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
