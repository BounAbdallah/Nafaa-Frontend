import api from './api'

export const reportService = {
  getDailySales: (date) => {
    return api.get('/reports/sales', { params: { date } })
  },
  
  getFinancialSummary: (period) => {
    return api.get('/reports/finance', { params: { period } })
  },
  
  getInventoryValuation: () => {
    return api.get('/reports/inventory')
  }
}
