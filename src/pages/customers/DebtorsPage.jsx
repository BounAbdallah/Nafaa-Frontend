import { useEffect, useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { customerService } from '@/services/customerService'
import { useCurrency } from '@/utils/currency'
import toast from 'react-hot-toast'
import {
  ChevronLeft, Search, Loader2, Phone, ChevronRight, ChevronLeft as Prev, AlertTriangle, ArrowRight,
} from 'lucide-react'

export default function DebtorsPage() {
  const navigate = useNavigate()
  const { format: fmt } = useCurrency()
  const [customers, setCustomers] = useState([])
  const [totalDebt, setTotalDebt] = useState(0)
  const [meta, setMeta]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage]   = useState(1)
  const [search, setSearch] = useState('')

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, per_page: 20 }
      if (search) params.search = search
      const r = await customerService.getDebtors(params)
      setCustomers(r.data.customers)
      setTotalDebt(r.data.total_debt)
      setMeta(r.data.meta)
    } catch { toast.error('Erreur de chargement.') }
    finally { setLoading(false) }
  }, [page, search])

  useEffect(() => { const t = setTimeout(fetch, search ? 300 : 0); return () => clearTimeout(t) }, [fetch])

  return (
    <div className="space-y-4 sm:space-y-5">
      <div>
        <Link to="/customers" className="inline-flex items-center gap-1.5 text-xs font-sans text-muted-500 hover:text-navy transition-colors">
          <ChevronLeft size={14} />Clients
        </Link>
        <h1 className="text-xl sm:text-2xl font-display font-bold text-navy flex items-center gap-2 mt-2">
          <AlertTriangle size={22} className="text-amber-500" />
          Ardoises — qui me doit de l'argent
        </h1>
      </div>

      {/* Total dû */}
      <div className="card p-4 sm:p-5 bg-red-50/60 border-red-100">
        <p className="text-xs font-sans font-semibold text-danger uppercase tracking-wide">Total des dettes en cours</p>
        <p className="text-2xl sm:text-3xl font-display font-black text-danger mt-1">{fmt(totalDebt)}</p>
        <p className="text-xs text-muted-500 mt-0.5">{meta?.total ?? 0} client{(meta?.total ?? 0) > 1 ? 's' : ''} avec une ardoise</p>
      </div>

      {/* Recherche */}
      <div className="card p-3 sm:p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-500" />
          <input type="text" placeholder="Rechercher par nom ou téléphone…" className="input-field pl-10 w-full"
            value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
        </div>
      </div>

      {/* Liste */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-muted-300 bg-muted-100/50">
                <th className="text-left py-3 px-4 text-xs font-sans font-semibold text-muted-700 uppercase tracking-wide">Client</th>
                <th className="text-right py-3 px-4 text-xs font-sans font-semibold text-muted-700 uppercase tracking-wide">Dette</th>
                <th className="py-3 px-4 w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-muted-100">
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-3 px-4"><div className="h-4 w-40 bg-muted-100 rounded" /></td>
                    <td className="py-3 px-4"><div className="h-4 w-20 bg-muted-100 rounded ml-auto" /></td>
                    <td className="py-3 px-4" />
                  </tr>
                ))
              ) : customers.length === 0 ? (
                <tr><td colSpan={3} className="py-16 text-center">
                  <AlertTriangle size={32} className="mx-auto text-muted-300 mb-3" />
                  <p className="text-sm font-sans text-muted-500">Aucune ardoise — tous vos clients sont à jour 🎉</p>
                </td></tr>
              ) : customers.map(c => (
                <tr key={c.id} onClick={() => navigate(`/customers/${c.id}`)}
                  className="hover:bg-primary-50/40 transition-colors cursor-pointer">
                  <td className="py-3 px-4">
                    <p className="text-sm font-sans font-semibold text-navy">{c.name}</p>
                    {c.phone && <p className="text-[11px] text-muted-500 flex items-center gap-1"><Phone size={9} />{c.phone}</p>}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="text-sm font-display font-bold text-danger whitespace-nowrap">{fmt(c.debt)}</span>
                  </td>
                  <td className="py-3 px-4 text-muted-300"><ChevronRight size={16} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {meta && meta.last_page > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-muted-200">
            <p className="text-xs text-muted-500">page {meta.current_page}/{meta.last_page}</p>
            <div className="flex gap-1">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="p-1.5 rounded-btn border border-muted-200 text-muted-600 disabled:opacity-40 hover:bg-muted-50"><Prev size={15} /></button>
              <button disabled={page >= meta.last_page} onClick={() => setPage(p => p + 1)} className="p-1.5 rounded-btn border border-muted-200 text-muted-600 disabled:opacity-40 hover:bg-muted-50"><ChevronRight size={15} /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
