import api from './api'

export const financeService = {
  async getSummary(params = {}) {
    const res = await api.get('/finance/summary', { params })
    return res.data
  },
}
