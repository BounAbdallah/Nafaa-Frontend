import api from './api'

export const productionService = {
  async getAll(params = {}) {
    return (await api.get('/production', { params })).data
  },

  async create(data) {
    return (await api.post('/production', data)).data
  },

  async start(id) {
    return (await api.post(`/production/${id}/start`)).data
  },

  async complete(id, data) {
    return (await api.post(`/production/${id}/complete`, data)).data
  },

  async cancel(id) {
    return (await api.post(`/production/${id}/cancel`)).data
  },

  async checkAvailability(bomId, quantity) {
    return (await api.post('/production/check-availability', { bom_id: bomId, quantity })).data
  }
}
