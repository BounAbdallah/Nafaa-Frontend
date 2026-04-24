import api from './api'

export const reportService = {
  getDailySales: (startDate, endDate) => {
    return api.get('/reports/sales', { params: { start_date: startDate, end_date: endDate } })
  },
  
  getFinancialSummary: (period, startDate, endDate) => {
    const params = { period }
    if (period === 'custom') {
      params.start_date = startDate
      params.end_date = endDate
    }
    return api.get('/reports/finance', { params })
  },
  
  getInventoryValuation: () => {
    return api.get('/reports/inventory')
  },

  getTeamPerformance: (startDate, endDate) => {
    return api.get('/reports/team', { params: { start_date: startDate, end_date: endDate } })
  },

  getCustomerAnalytics: (startDate, endDate) => {
    return api.get('/reports/customers', { params: { start_date: startDate, end_date: endDate } })
  }
}
