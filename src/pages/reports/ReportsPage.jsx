import { useState, useEffect } from 'react'
import { reportService } from '@/services/reportService'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart as RechartsPieChart, Pie, Cell
} from 'recharts'
import { 
  BarChart2, DollarSign, Package, Calendar, TrendingUp, Download, PieChart, Wallet, Users, UserCircle2
} from 'lucide-react'
import toast from 'react-hot-toast'
import Button from '@/components/ui/Button'
import { cn } from '@/utils/cn'

const TABS = [
  { id: 'sales', label: 'Clôture de Journée', icon: Calendar },
  { id: 'finance', label: 'Finances', icon: BarChart2 },
  { id: 'inventory', label: 'Valeur du Stock', icon: Package },
  { id: 'team', label: 'Performance Équipe', icon: UserCircle2 },
  { id: 'customers', label: 'Analyse Clients', icon: Users },
]

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('sales')
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState(null)

  // Global Date Filters
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0])
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0])
  
  // Finance specific
  const [financePeriod, setFinancePeriod] = useState('custom') // Default to custom to use global dates

  useEffect(() => {
    fetchData()
  }, [activeTab, startDate, endDate, financePeriod])

  const fetchData = async () => {
    setLoading(true)
    try {
      let res;
      if (activeTab === 'sales') {
        res = await reportService.getDailySales(startDate, endDate)
      } else if (activeTab === 'finance') {
        res = await reportService.getFinancialSummary(financePeriod, startDate, endDate)
      } else if (activeTab === 'inventory') {
        res = await reportService.getInventoryValuation() // No date filter needed for current stock
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

  const formatCurrency = (val) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(val || 0)

  const downloadCSV = (csvData, filename) => {
    const blob = new Blob(["\uFEFF" + csvData], { type: 'text/csv;charset=utf-8;' })
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
    const header = ["Produit", "Catégorie", "Quantité", "Prix Unitaire", "Valeur Totale"]
    const rows = data.details.map(p => [
      `"${p.name}"`, 
      `"${p.category || 'Sans catégorie'}"`, 
      p.quantity, 
      p.unit_price, 
      p.valuation
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card p-5 border-l-4 border-l-primary-500">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center text-primary-500">
                <Wallet size={16} />
              </div>
              <span className="text-sm font-sans text-muted-500 font-semibold">Chiffre d'Affaires</span>
            </div>
            <p className="text-2xl font-display font-bold text-navy">{formatCurrency(data.total_sales)}</p>
          </div>
          
          <div className="card p-5 border-l-4 border-l-gold">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center text-gold">
                <PieChart size={16} />
              </div>
              <span className="text-sm font-sans text-muted-500 font-semibold">Commandes</span>
            </div>
            <p className="text-2xl font-display font-bold text-navy">{data.orders_count}</p>
          </div>

          <div className="card p-5 border-l-4 border-l-red-500">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-red-500">
                <TrendingUp size={16} />
              </div>
              <span className="text-sm font-sans text-muted-500 font-semibold">Remises Accordées</span>
            </div>
            <p className="text-2xl font-display font-bold text-navy">{formatCurrency(data.total_discount)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card p-5">
            <h3 className="text-sm font-display font-bold text-navy mb-4">Modes de paiement</h3>
            <div className="space-y-3">
              {Object.entries(data.payment_methods || {}).length > 0 ? (
                Object.entries(data.payment_methods).map(([method, stats]) => (
                  <div key={method} className="flex items-center justify-between p-3 rounded-lg bg-surface border border-muted-200">
                    <span className="font-sans font-medium text-navy uppercase text-xs">{method.replace('_', ' ')}</span>
                    <div className="text-right">
                      <div className="font-display font-bold text-primary-600">{formatCurrency(stats.total)}</div>
                      <div className="text-[10px] text-muted-500">{stats.count} transactions</div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-500">Aucune transaction.</p>
              )}
            </div>
          </div>

          <div className="card p-5">
            <h3 className="text-sm font-display font-bold text-navy mb-4">Top Produits Vendus</h3>
            <div className="space-y-3">
              {data.top_products?.length > 0 ? (
                data.top_products.map((p, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-surface border border-muted-200">
                    <span className="font-sans font-medium text-navy text-sm truncate max-w-[60%]">{p.name}</span>
                    <div className="text-right">
                      <div className="font-display font-bold text-navy">{formatCurrency(p.total_revenue)}</div>
                      <div className="text-[10px] text-muted-500">{p.total_qty} vendus</div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-500">Aucun produit vendu.</p>
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
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-display font-bold text-navy">Performance Financière</h2>
          <select 
            value={financePeriod} 
            onChange={(e) => setFinancePeriod(e.target.value)}
            className="input-field max-w-[150px]"
          >
            <option value="custom">Période personnalisée</option>
            <option value="week">Cette semaine</option>
            <option value="month">Ce mois</option>
            <option value="year">Cette année</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card p-5 bg-gradient-to-br from-green-50 to-emerald-50 border-emerald-100">
            <span className="text-sm font-sans text-emerald-600 font-semibold mb-1 block">Total Revenus</span>
            <p className="text-2xl font-display font-bold text-emerald-700">{formatCurrency(data.revenues)}</p>
          </div>
          <div className="card p-5 bg-gradient-to-br from-red-50 to-rose-50 border-rose-100">
            <span className="text-sm font-sans text-rose-600 font-semibold mb-1 block">Total Dépenses</span>
            <p className="text-2xl font-display font-bold text-rose-700">{formatCurrency(data.expenses)}</p>
          </div>
          <div className="card p-5 bg-navy text-white">
            <span className="text-sm font-sans text-white/70 font-semibold mb-1 block">Bénéfice Net</span>
            <p className="text-2xl font-display font-bold text-gold">{formatCurrency(data.net_profit)}</p>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-sm font-display font-bold text-navy mb-6">Évolution (Revenus vs Dépenses)</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
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
    if (!data) return null;
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-display font-bold text-navy">Valorisation du Stock (Instant T)</h2>
          <Button variant="outline" className="gap-2" onClick={exportInventoryCSV}>
            <Download size={16} /> Exporter (CSV)
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="card p-5 bg-gradient-to-r from-[#0F1E30] to-[#1A365D] text-white">
            <div className="flex items-center gap-3 mb-2">
              <Package size={20} className="text-primary-400" />
              <span className="text-sm font-sans text-white/70 font-semibold">Valeur Totale du Stock (Prix de Vente)</span>
            </div>
            <p className="text-3xl font-display font-bold text-white">{formatCurrency(data.total_valuation)}</p>
          </div>
          <div className="card p-5 border-l-4 border-l-gold">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign size={20} className="text-gold" />
              <span className="text-sm font-sans text-muted-500 font-semibold">Marge Brute Potentielle</span>
            </div>
            <p className="text-3xl font-display font-bold text-navy">{formatCurrency(data.potential_profit)}</p>
          </div>
        </div>

        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-muted-50 border-b border-muted-200">
                <th className="text-left py-3 px-4 text-xs font-sans font-semibold text-muted-500 uppercase">Produit</th>
                <th className="text-center py-3 px-4 text-xs font-sans font-semibold text-muted-500 uppercase">Qté</th>
                <th className="text-right py-3 px-4 text-xs font-sans font-semibold text-muted-500 uppercase">Prix Unit.</th>
                <th className="text-right py-3 px-4 text-xs font-sans font-semibold text-muted-500 uppercase">Valeur Totale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-muted-100">
              {data.details?.length > 0 ? (
                data.details.map((p) => (
                  <tr key={p.id} className="hover:bg-muted-50/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-medium text-sm text-navy">{p.name}</div>
                      <div className="text-[11px] text-muted-500">{p.category || 'Sans catégorie'}</div>
                    </td>
                    <td className="py-3 px-4 text-center text-sm font-medium">{p.quantity}</td>
                    <td className="py-3 px-4 text-right text-sm text-muted-600">{formatCurrency(p.unit_price)}</td>
                    <td className="py-3 px-4 text-right text-sm font-bold text-navy">{formatCurrency(p.valuation)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-sm text-muted-500">Aucun produit en stock.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  const renderTeamTab = () => {
    if (!data) return null;
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-display font-bold text-navy">Performance de l'Équipe</h2>
          <Button variant="outline" className="gap-2" onClick={exportTeamCSV}>
            <Download size={16} /> Exporter (CSV)
          </Button>
        </div>

        <div className="card overflow-hidden">
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
      </div>
    )
  }

  const renderCustomersTab = () => {
    if (!data) return null;
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-display font-bold text-navy">Top Clients (Fidélité & Revenus)</h2>
          <Button variant="outline" className="gap-2" onClick={exportCustomersCSV}>
            <Download size={16} /> Exporter (CSV)
          </Button>
        </div>

        <div className="card overflow-hidden">
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
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-navy">Rapports & Analytics</h1>
          <p className="text-sm font-sans text-muted-500 mt-1">Consultez et analysez les performances de votre entreprise</p>
        </div>

        {/* Global Date Filter */}
        {activeTab !== 'inventory' && (
          <div className="flex items-center gap-2 bg-surface p-2 rounded-btn border border-muted-200">
            <div className="flex flex-col">
              <span className="text-[10px] font-sans font-medium text-muted-400 uppercase tracking-wide ml-1">Du</span>
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent text-sm font-medium text-navy focus:outline-none px-1"
              />
            </div>
            <div className="w-px h-6 bg-muted-200 mx-1"></div>
            <div className="flex flex-col">
              <span className="text-[10px] font-sans font-medium text-muted-400 uppercase tracking-wide ml-1">Au</span>
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent text-sm font-medium text-navy focus:outline-none px-1"
              />
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-surface p-1 rounded-modal border border-muted-200 overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-btn text-sm font-sans font-semibold transition-all whitespace-nowrap',
              activeTab === tab.id
                ? 'bg-primary-50 text-primary-600 shadow-sm'
                : 'text-muted-500 hover:text-navy hover:bg-muted-50'
            )}
          >
            <tab.icon size={16} className={activeTab === tab.id ? 'text-primary-500' : ''} />
            {tab.label}
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
