import api from './api'

export const bomService = {
  async getAll() {
    return (await api.get('/production/boms')).data
  },

  async getMeta() {
    return (await api.get('/production/boms/meta')).data
  },

  async getById(id) {
    return (await api.get(`/production/boms/${id}`)).data
  },

  async create(data) {
    return (await api.post('/production/boms', data)).data
  },

  async update(id, data) {
    return (await api.put(`/production/boms/${id}`, data)).data
  },

  async remove(id) {
    return (await api.delete(`/production/boms/${id}`)).data
  }
}
