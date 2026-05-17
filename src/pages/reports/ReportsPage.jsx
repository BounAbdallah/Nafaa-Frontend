import { useState, useEffect, useMemo } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useCurrency } from '@/utils/currency'
import { canAccessModule } from '@/utils/modulePermissions'
import { reportService } from '@/services/reportService'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  LineChart, Line, PieChart as RechartsPieChart, Pie, Cell, Legend
} from 'recharts'
import {
  BarChart2, DollarSign, Package, Calendar, TrendingUp, Download, PieChart, Wallet, Users, UserCircle2,
  ChevronLeft, ChevronRight
} from 'lucide-react'
import toast from 'react-hot-toast'
import Button from '@/components/ui/Button'
import { cn } from '@/utils/cn'

const ALL_TABS = [
  { id: 'sales',     label: 'Clôture de Journée', icon: Calendar,    adminOnly: false, noStock: true  },
  { id: 'finance',   label: 'Finances',            icon: BarChart2,   adminOnly: true,  noStock: false },
  { id: 'inventory', label: 'Valeur du Stock',     icon: Package,     adminOnly: true,  noStock: false },
  { id: 'team',      label: 'Performance Équipe',  icon: UserCircle2, adminOnly: true,  noStock: false },
  { id: 'customers', label: 'Analyse Clients',     icon: Users,       adminOnly: true,  noStock: false },
]

export default function ReportsPage() {
  const { isAdmin, user } = useAuthStore()
  const { format: formatCurrency } = useCurrency()
  const hasBom = canAccessModule(user, 'production')
  const isServiceProvider = user?.tenant?.profile_type === 'service_provider'

  // Valeur du Stock not relevant for service providers (they sell services, not products)
  const TABS = useMemo(() => ALL_TABS.filter(t => {
    if (t.adminOnly && !isAdmin()) return false
    if (t.id === 'inventory' && isServiceProvider) return false
    return true
  }), [isAdmin, isServiceProvider])
  const [activeTab, setActiveTab] = useState(() =>
    (isAdmin() ? 'sales' : 'sales')  // always start on sales
  )

  // If current tab is not accessible, reset to first available
  useEffect(() => {
    if (!TABS.find(t => t.id === activeTab)) {
      setActiveTab(TABS[0]?.id ?? 'sales')
    }
  }, [TABS, activeTab])
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [inventoryType, setInventoryType] = useState(null) // null = tous | 'product' | 'material'

  // Global Date Filters
  const [periodPreset, setPeriodPreset] = useState('month')
  const [startDate, setStartDate] = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0]
  })
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0])

  // Finance specific
  const [financePeriod, setFinancePeriod] = useState('custom') // Default to custom to use global dates

  const handlePresetChange = (preset) => {
    setPeriodPreset(preset)
    const today = new Date()
    let start, end

    if (preset === 'today') {
      start = new Date()
      end = new Date()
    } else if (preset === 'week') {
      const day = today.getDay()
      const diff = today.getDate() - day + (day === 0 ? -6 : 1) // adjust when day is sunday
      start = new Date(today.setDate(diff))
      end = new Date(start)
      end.setDate(end.getDate() + 6)
    } else if (preset === 'month') {
      start = new Date(today.getFullYear(), today.getMonth(), 1)
      end = new Date(today.getFullYear(), today.getMonth() + 1, 0)
    } else if (preset === 'year') {
      start = new Date(today.getFullYear(), 0, 1)
      end = new Date(today.getFullYear(), 11, 31)
    }

    if (preset !== 'custom') {
      setStartDate(start.toISOString().split('T')[0])
      setEndDate(end.toISOString().split('T')[0])
    }
  }

  useEffect(() => {
    fetchData()
  }, [activeTab, startDate, endDate, financePeriod, currentPage, inventoryType])

  const fetchData = async () => {
    setLoading(true)
    try {
      let res;
      if (activeTab === 'sales') {
        res = await reportService.getDailySales(startDate, endDate)
      } else if (activeTab === 'finance') {
        res = await reportService.getFinancialSummary(financePeriod, startDate, endDate)
      } else if (activeTab === 'inventory') {
        res = await reportService.getInventoryValuation(currentPage, 15, inventoryType)
      } else if (activeTab === 'team') {
        res = await reportService.getTeamPerformance(startDate, endDate)
      } else if (activeTab === 'customers') {
        res = await reportService.getCustomerAnalytics(startDate, endDate)
      }
      setData(res.data.data)
    } catch (err) {
      toast.error('Erreur lors du chargement des rapports.')
    } finally {
      setLoading(false)
    }
  }

  const downloadCSV = (csvData, filename) => {
    const blob = new Blob(["﻿" + csvData], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const exportInventoryCSV = () => {
    if (!data?.details) return;
    const header = ["Produit", "Type", "Catégorie", "Quantité", "Prix Achat", "Valeur (Achat)"]
    const rows = data.details.map(p => [
      `"${p.name}"`,
      `"${p.type === 'material' ? 'Matière' : 'Produit'}"`,
      `"${p.category || 'Sans catégorie'}"`,
      p.quantity,
      p.cost_price,
      p.valuation_cost
    ])
    const csvContent = [header.join(','), ...rows.map(r => r.join(','))].join('\n')
    downloadCSV(csvContent, `valorisation_stock_${new Date().toISOString().split('T')[0]}.csv`)
  }

  const exportTeamCSV = () => {
    if (!data?.performance) return;
    const header = ["Employé", "Nombre de Commandes", "Chiffre d'Affaires Généré"]
    const rows = data.performance.map(p => [
      `"${p.name}"`,
      p.total_orders,
      p.total_revenue
    ])
    const csvContent = [header.join(','), ...rows.map(r => r.join(','))].join('\n')
    downloadCSV(csvContent, `performance_equipe_${startDate}_au_${endDate}.csv`)
  }

  const exportCustomersCSV = () => {
    if (!data?.top_customers) return;
    const header = ["Client", "Téléphone", "Nombre de Commandes", "Total Dépensé"]
    const rows = data.top_customers.map(c => [
      `"${c.name}"`,
      `"${c.phone || ''}"`,
      c.total_orders,
      c.total_spent
    ])
    const csvContent = [header.join(','), ...rows.map(r => r.join(','))].join('\n')
    downloadCSV(csvContent, `analyse_clients_${startDate}_au_${endDate}.csv`)
  }

  const renderSalesTab = () => {
    if (!data) return null;
    return (
      <div className="space-y-6 animate-fade-in">
        {/* Stats: 2 cols on mobile, 3 on md+ */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="card p-4 sm:p-5 border-l-4 border-l-primary-500">
            <div className="flex items-center gap-2 sm:gap-3 mb-2">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary-50 flex items-center justify-center text-primary-500">
                <Wallet size={14} />
              </div>
              <span className="text-xs sm:text-sm font-sans text-muted-500 font-semibold">CA</span>
            </div>
            <p className="text-lg sm:text-2xl font-display font-bold text-navy">{formatCurrency(data.total_sales)}</p>
          </div>

          <div className="card p-4 sm:p-5 border-l-4 border-l-gold">
            <div className="flex items-center gap-2 sm:gap-3 mb-2">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-amber-50 flex items-center justify-center text-gold">
                <PieChart size={14} />
              </div>
              <span className="text-xs sm:text-sm font-sans text-muted-500 font-semibold">Commandes</span>
            </div>
            <p className="text-lg sm:text-2xl font-display font-bold text-navy">{data.orders_count}</p>
          </div>

          <div className="card p-4 sm:p-5 border-l-4 border-l-red-500 col-span-2 sm:col-span-1">
            <div className="flex items-center gap-2 sm:gap-3 mb-2">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-red-50 flex items-center justify-center text-red-500">
                <TrendingUp size={14} />
              </div>
              <span className="text-xs sm:text-sm font-sans text-muted-500 font-semibold">Remises</span>
            </div>
            <p className="text-lg sm:text-2xl font-display font-bold text-navy">{formatCurrency(data.total_discount)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card p-4 sm:p-5">
            <h3 className="text-sm font-display font-bold text-navy mb-4">Répartition des paiements</h3>
            <div className="h-[180px] sm:h-[250px] w-full flex items-center justify-center">
              {Object.entries(data.payment_methods || {}).length > 0 ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                  <RechartsPieChart>
                    <Pie
                      data={Object.entries(data.payment_methods).map(([k, v]) => ({ name: k.replace('_', ' ').toUpperCase(), value: v.total }))}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {Object.entries(data.payment_methods).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={['#3AA0D8', '#E8A020', '#1A365D', '#10B981'][index % 4]} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(val) => formatCurrency(val)} />
                    <Legend />
                  </RechartsPieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-500">Aucune transaction.</p>
              )}
            </div>
          </div>

          <div className="card p-4 sm:p-5">
            <h3 className="text-sm font-display font-bold text-navy mb-4">Top 5 Produits Vendus</h3>
            <div className="h-[180px] sm:h-[250px] w-full">
              {data.top_products?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                  <BarChart data={data.top_products} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E2E8F0" />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} width={120} />
                    <RechartsTooltip
                      cursor={{ fill: '#F1F5F9' }}
                      formatter={(val) => [formatCurrency(val), 'Chiffre d\'Affaires']}
                    />
                    <Bar dataKey="total_revenue" fill="#E8A020" radius={[0, 4, 4, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center">
                  <p className="text-sm text-muted-500">Aucun produit vendu.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderFinanceTab = () => {
    if (!data) return null;
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-lg font-display font-bold text-navy">Performance Financière</h2>
          <select
            value={financePeriod}
            onChange={(e) => setFinancePeriod(e.target.value)}
            className="input-field w-full sm:w-auto sm:max-w-[150px]"
          >
            <option value="custom">Période personnalisée</option>
            <option value="week">Cette semaine</option>
            <option value="month">Ce mois</option>
            <option value="year">Cette année</option>
          </select>
        </div>

        {/* KPIs: 2 cols on mobile, 4 on sm+ */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {/* Chiffre d'affaires */}
          <div className="card p-4 sm:p-5 bg-gradient-to-br from-green-50 to-emerald-50 border-emerald-100">
            <span className="text-xs sm:text-sm font-sans text-emerald-600 font-semibold mb-1 block">CA</span>
            <p className="text-lg sm:text-2xl font-display font-bold text-emerald-700">{formatCurrency(data.revenues)}</p>
            <p className="text-[10px] font-sans text-emerald-400 mt-1">Total des ventes</p>
          </div>

          {/* Total Charges */}
          <div className="card p-4 sm:p-5 bg-gradient-to-br from-red-50 to-rose-50 border-rose-100">
            <span className="text-xs sm:text-sm font-sans text-rose-600 font-semibold mb-1 block">Charges</span>
            <p className="text-lg sm:text-2xl font-display font-bold text-rose-700">{formatCurrency(data.expenses)}</p>
            <p className="text-[10px] font-sans text-rose-400 mt-1">Dépenses</p>
          </div>

          {/* Bénéfice Brut */}
          <div className="card p-4 sm:p-5 bg-gradient-to-br from-blue-50 to-indigo-50 border-indigo-100">
            <span className="text-xs sm:text-sm font-sans text-indigo-600 font-semibold mb-1 block">Bén. Brut</span>
            <p className={cn('text-lg sm:text-2xl font-display font-bold', (data.gross_profit ?? 0) >= 0 ? 'text-indigo-700' : 'text-rose-700')}>
              {formatCurrency(data.gross_profit ?? 0)}
            </p>
            <p className="text-[10px] font-sans text-indigo-400 mt-1">Prix vente − achat</p>
          </div>

          {/* Bénéfice Net */}
          <div className="card p-4 sm:p-5 bg-navy text-white">
            <span className="text-xs sm:text-sm font-sans text-white/70 font-semibold mb-1 block">Bén. Net</span>
            <p className={cn('text-lg sm:text-2xl font-display font-bold', (data.net_profit ?? 0) >= 0 ? 'text-gold' : 'text-rose-400')}>
              {formatCurrency(data.net_profit ?? 0)}
            </p>
            <p className="text-[10px] font-sans text-white/50 mt-1">Bén. brut − Charges</p>
          </div>
        </div>

        <div className="card p-4 sm:p-6">
          <h3 className="text-sm font-display font-bold text-navy mb-4 sm:mb-6">Évolution (Revenus vs Dépenses)</h3>
          <div className="h-[200px] sm:h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
              <BarChart data={data.chart_data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                <RechartsTooltip
                  cursor={{ fill: '#F1F5F9' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value) => [formatCurrency(value), '']}
                />
                <Bar dataKey="revenue" name="Revenus" fill="#3AA0D8" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="expense" name="Dépenses" fill="#EF4444" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    )
  }

  const renderInventoryTab = () => {
    if (!data || !data.summary) return null;
    const summary = data.summary;
    const details = data.details;
    const meta = data.meta;

    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-lg font-display font-bold text-navy">Valorisation du Stock (Instant T)</h2>
          <Button variant="outline" className="gap-2 self-start sm:self-auto" onClick={exportInventoryCSV}>
            <Download size={16} /> Exporter (CSV)
          </Button>
        </div>

        {/* Ligne 1 — totaux stock */}
        {(() => {
          const showMaterials = inventoryType !== 'product'
          const showBom       = hasBom && inventoryType !== 'material'
          const cols = [true, showMaterials, showBom].filter(Boolean).length
          const gridCols = cols === 1 ? 'sm:grid-cols-1' : cols === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-3'
          return (
            <div className={cn('grid grid-cols-1 gap-4', gridCols)}>
              {/* Total Stock Prix Achat — toujours visible */}
              <div className="card p-4 sm:p-5 bg-gradient-to-r from-navy to-navy/90 text-white border-none shadow-lg">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                    <DollarSign size={16} className="text-gold" />
                  </div>
                  <span className="text-xs font-sans text-white/70 font-bold uppercase tracking-wider">
                    Total Stock (Prix Achat)
                  </span>
                </div>
                <p className="text-xl sm:text-2xl font-display font-black text-white">{formatCurrency(summary.total_valuation_cost)}</p>
                {inventoryType && (
                  <p className="text-[10px] font-sans text-white/50 mt-1">
                    {inventoryType === 'product' ? 'Produits uniquement' : 'Matières uniquement'}
                  </p>
                )}
              </div>

              {/* Matières Premières — masqué si filtre = Produits */}
              {showMaterials && (
                <div className="card p-4 sm:p-5 bg-white border-l-4 border-l-primary-500 shadow-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center text-primary-500">
                      <Package size={16} />
                    </div>
                    <span className="text-xs font-sans text-muted-500 font-bold uppercase tracking-wider">Matières Premières</span>
                  </div>
                  <p className="text-xl sm:text-2xl font-display font-bold text-navy">{formatCurrency(summary.materials_valuation)}</p>
                </div>
              )}

              {/* BOM — masqué si filtre = Matières */}
              {showBom && (
                <div className="card p-4 sm:p-5 bg-white border-l-4 border-l-gold shadow-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-gold">
                      <BarChart2 size={16} />
                    </div>
                    <span className="text-xs font-sans text-muted-500 font-bold uppercase tracking-wider">Valeur Stock BOM</span>
                  </div>
                  <p className="text-xl sm:text-2xl font-display font-bold text-navy">{formatCurrency(summary.bom_stock_valuation)}</p>
                </div>
              )}
            </div>
          )
        })()}

        {/* Ligne 2 — Valeur vente + Marge potentielle */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="card p-4 sm:p-5 border-l-4 border-l-emerald-500">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp size={20} className="text-emerald-500" />
              <span className="text-sm font-sans text-muted-500 font-semibold">Valeur Totale (Vente)</span>
            </div>
            <p className="text-xl sm:text-2xl font-display font-bold text-navy">{formatCurrency(summary.total_valuation_selling)}</p>
          </div>
          <div className="card p-4 sm:p-5 border-l-4 border-l-blue-500">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign size={20} className="text-blue-500" />
              <span className="text-sm font-sans text-muted-500 font-semibold">Marge Potentielle</span>
            </div>
            <p className={cn('text-xl sm:text-2xl font-display font-bold', summary.potential_profit >= 0 ? 'text-navy' : 'text-rose-600')}>
              {formatCurrency(summary.potential_profit)}
            </p>
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="p-4 border-b border-muted-200 bg-muted-50/50 flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-xs font-bold text-navy uppercase tracking-widest">Détails des Articles</h3>
            <div className="flex items-center gap-2">
              {/* Filtre type */}
              <div className="flex items-center gap-1 bg-muted-100 p-0.5 rounded-btn">
                {[
                  { value: null,       label: 'Tous' },
                  { value: 'product',  label: 'Produits' },
                  { value: 'material', label: 'Matières' },
                ].map(({ value, label }) => (
                  <button
                    key={String(value)}
                    onClick={() => { setInventoryType(value); setCurrentPage(1) }}
                    className={cn(
                      'px-2 sm:px-3 py-1 text-xs font-sans font-semibold rounded-btn transition-all',
                      inventoryType === value
                        ? 'bg-white text-navy shadow-sm'
                        : 'text-muted-500 hover:text-navy',
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <span className="text-[10px] font-bold text-muted-500 uppercase tracking-widest">{meta.total} articles</span>
            </div>
          </div>

          {/* Table for sm+, card list for mobile */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-muted-50/30 border-b border-muted-200">
                  <th className="text-left py-4 px-6 text-[10px] font-bold text-muted-500 uppercase tracking-widest">Article</th>
                  <th className="text-center py-4 px-6 text-[10px] font-bold text-muted-500 uppercase tracking-widest">Type</th>
                  <th className="text-center py-4 px-6 text-[10px] font-bold text-muted-500 uppercase tracking-widest">Stock</th>
                  <th className="text-right py-4 px-6 text-[10px] font-bold text-muted-500 uppercase tracking-widest hidden md:table-cell">Prix Achat</th>
                  <th className="text-right py-4 px-6 text-[10px] font-bold text-muted-500 uppercase tracking-widest">Valeur (Achat)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-muted-100">
                {details?.length > 0 ? (
                  details.map((p) => (
                    <tr key={p.id} className="hover:bg-muted-50/50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-bold text-sm text-navy">{p.name}</div>
                        <div className="text-[10px] text-muted-400 font-medium uppercase tracking-tighter">{p.category || 'Sans catégorie'}</div>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter",
                          p.type === 'material' ? "bg-amber-100 text-amber-700" : "bg-primary-100 text-primary-700"
                        )}>
                          {p.type === 'material' ? 'Matière' : 'Produit'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className="text-sm font-black text-navy">{p.quantity}</span>
                        <span className="text-[10px] text-muted-400 ml-1 font-bold">{p.unit}</span>
                      </td>
                      <td className="py-4 px-6 text-right text-sm font-medium text-muted-600 hidden md:table-cell">{formatCurrency(p.cost_price)}</td>
                      <td className="py-4 px-6 text-right text-sm font-black text-navy">{formatCurrency(p.valuation_cost)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-sm text-muted-500 font-medium italic">Aucun article en stock.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile card list */}
          <div className="sm:hidden divide-y divide-muted-100">
            {details?.length > 0 ? (
              details.map((p) => (
                <div key={p.id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-sm text-navy">{p.name}</div>
                      <div className="text-[10px] text-muted-400 font-medium uppercase tracking-tighter mt-0.5">{p.category || 'Sans catégorie'}</div>
                    </div>
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter shrink-0",
                      p.type === 'material' ? "bg-amber-100 text-amber-700" : "bg-primary-100 text-primary-700"
                    )}>
                      {p.type === 'material' ? 'Matière' : 'Produit'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-500">Stock : <span className="font-black text-navy">{p.quantity} {p.unit}</span></span>
                    <span className="font-black text-navy">{formatCurrency(p.valuation_cost)}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-sm text-muted-500 font-medium italic">Aucun article en stock.</div>
            )}
          </div>

          {/* Pagination Controls */}
          {meta.last_page > 1 && (
            <div className="p-4 border-t border-muted-200 bg-muted-50/30 flex items-center justify-between">
              <span className="text-xs font-sans text-muted-500">
                Page <span className="font-bold text-navy">{meta.current_page}</span> sur <span className="font-bold text-navy">{meta.last_page}</span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={meta.current_page === 1}
                  className="p-2 rounded-btn border border-muted-200 bg-white text-muted-500 hover:text-navy hover:border-muted-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(meta.last_page, prev + 1))}
                  disabled={meta.current_page === meta.last_page}
                  className="p-2 rounded-btn border border-muted-200 bg-white text-muted-500 hover:text-navy hover:border-muted-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderTeamTab = () => {
    if (!data) return null;
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-lg font-display font-bold text-navy">Performance de l'Équipe</h2>
          <Button variant="outline" className="gap-2 self-start sm:self-auto" onClick={exportTeamCSV}>
            <Download size={16} /> Exporter (CSV)
          </Button>
        </div>

        {/* Table for sm+, card list for mobile */}
        <div className="card overflow-hidden">
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-muted-50 border-b border-muted-200">
                  <th className="text-left py-3 px-4 text-xs font-sans font-semibold text-muted-500 uppercase">Employé</th>
                  <th className="text-center py-3 px-4 text-xs font-sans font-semibold text-muted-500 uppercase">Commandes traitées</th>
                  <th className="text-right py-3 px-4 text-xs font-sans font-semibold text-muted-500 uppercase">CA Généré</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-muted-100">
                {data.performance?.length > 0 ? (
                  data.performance.map((p, i) => (
                    <tr key={p.id} className="hover:bg-muted-50/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-display font-bold text-xs">
                            {p.name.charAt(0)}
                          </div>
                          <span className="font-medium text-sm text-navy">{p.name} {i === 0 && '👑'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center text-sm font-medium">{p.total_orders}</td>
                      <td className="py-3 px-4 text-right text-sm font-bold text-emerald-600">{formatCurrency(p.total_revenue)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-sm text-muted-500">Aucune vente sur cette période.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden divide-y divide-muted-100">
            {data.performance?.length > 0 ? (
              data.performance.map((p, i) => (
                <div key={p.id} className="p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-display font-bold text-sm shrink-0">
                      {p.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium text-sm text-navy">{p.name} {i === 0 && '👑'}</div>
                      <div className="text-xs text-muted-500">{p.total_orders} commandes</div>
                    </div>
                  </div>
                  <div className="text-sm font-bold text-emerald-600 shrink-0">{formatCurrency(p.total_revenue)}</div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-sm text-muted-500">Aucune vente sur cette période.</div>
            )}
          </div>
        </div>
      </div>
    )
  }

  const renderCustomersTab = () => {
    if (!data) return null;
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-lg font-display font-bold text-navy">Top Clients (Fidélité & Revenus)</h2>
          <Button variant="outline" className="gap-2 self-start sm:self-auto" onClick={exportCustomersCSV}>
            <Download size={16} /> Exporter (CSV)
          </Button>
        </div>

        {/* Table for sm+, card list for mobile */}
        <div className="card overflow-hidden">
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-muted-50 border-b border-muted-200">
                  <th className="text-left py-3 px-4 text-xs font-sans font-semibold text-muted-500 uppercase">Client</th>
                  <th className="text-center py-3 px-4 text-xs font-sans font-semibold text-muted-500 uppercase">Téléphone</th>
                  <th className="text-center py-3 px-4 text-xs font-sans font-semibold text-muted-500 uppercase">Achats</th>
                  <th className="text-right py-3 px-4 text-xs font-sans font-semibold text-muted-500 uppercase">Total Dépensé</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-muted-100">
                {data.top_customers?.length > 0 ? (
                  data.top_customers.map((c, i) => (
                    <tr key={c.id} className="hover:bg-muted-50/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-medium text-sm text-navy">{c.name} {i < 3 && '⭐'}</div>
                      </td>
                      <td className="py-3 px-4 text-center text-sm text-muted-500">{c.phone || '-'}</td>
                      <td className="py-3 px-4 text-center text-sm font-medium">{c.total_orders}</td>
                      <td className="py-3 px-4 text-right text-sm font-bold text-primary-600">{formatCurrency(c.total_spent)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-sm text-muted-500">Aucun achat client identifié sur cette période.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden divide-y divide-muted-100">
            {data.top_customers?.length > 0 ? (
              data.top_customers.map((c, i) => (
                <div key={c.id} className="p-4 flex items-center justify-between gap-3">
                  <div>
                    <div className="font-medium text-sm text-navy">{c.name} {i < 3 && '⭐'}</div>
                    <div className="text-xs text-muted-500 mt-0.5">{c.phone || '—'} · {c.total_orders} achats</div>
                  </div>
                  <div className="text-sm font-bold text-primary-600 shrink-0">{formatCurrency(c.total_spent)}</div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-sm text-muted-500">Aucun achat client identifié sur cette période.</div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-bold text-navy">Rapports & Analytics</h1>
          <p className="text-xs sm:text-sm font-sans text-muted-500 mt-0.5 sm:mt-1 hidden sm:block">Consultez et analysez les performances de votre entreprise</p>
        </div>

        {/* Global Date Filter */}
        {activeTab !== 'inventory' && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            <select
              value={periodPreset}
              onChange={(e) => handlePresetChange(e.target.value)}
              className="input-field h-9 sm:h-[38px] text-sm w-full sm:w-auto sm:max-w-[160px]"
            >
              <option value="today">Aujourd'hui</option>
              <option value="week">Cette semaine</option>
              <option value="month">Ce mois-ci</option>
              <option value="year">Cette année</option>
              <option value="custom">Personnalisé</option>
            </select>

            {periodPreset === 'custom' && (
              <div className="flex items-center gap-2 bg-surface px-3 py-2 sm:h-[38px] rounded-btn border border-muted-200 w-full sm:w-auto">
                <div className="flex items-center gap-1 flex-1 sm:flex-none">
                  <span className="text-[10px] font-sans font-medium text-muted-400 uppercase tracking-wide">Du</span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-transparent text-sm font-medium text-navy focus:outline-none flex-1 sm:w-[110px] min-w-0"
                  />
                </div>
                <div className="w-px h-4 bg-muted-200"></div>
                <div className="flex items-center gap-1 flex-1 sm:flex-none">
                  <span className="text-[10px] font-sans font-medium text-muted-400 uppercase tracking-wide">Au</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="bg-transparent text-sm font-medium text-navy focus:outline-none flex-1 sm:w-[110px] min-w-0"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tabs — scrollable on mobile */}
      <div className="flex items-center gap-1 bg-surface p-1 rounded-modal border border-muted-200 overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.id}
            title={tab.label}
            onClick={() => {
              setActiveTab(tab.id);
              setCurrentPage(1);
              setInventoryType(null);
              setData(null);
            }}
            className={cn(
              'flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-btn text-xs sm:text-sm font-sans font-semibold transition-all whitespace-nowrap flex-1 sm:flex-none justify-center sm:justify-start',
              activeTab === tab.id
                ? 'bg-primary-50 text-primary-600 shadow-sm'
                : 'text-muted-500 hover:text-navy hover:bg-muted-50'
            )}
          >
            <tab.icon size={15} className={activeTab === tab.id ? 'text-primary-500' : ''} />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="min-h-[400px]">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-primary-100 border-t-primary-500 rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {activeTab === 'sales' && renderSalesTab()}
            {activeTab === 'finance' && renderFinanceTab()}
            {activeTab === 'inventory' && renderInventoryTab()}
            {activeTab === 'team' && renderTeamTab()}
            {activeTab === 'customers' && renderCustomersTab()}
          </>
        )}
      </div>
    </div>
  )
}
