import api from './api'

export const dashboardService = {
  async getStats(params = {}) {
    return (await api.get('/dashboard', { params })).data
  }
}
