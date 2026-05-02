import api from './api'

export const adminService = {
  async getStats() {
    const res = await api.get('/admin/users/stats')
    return res.data
  },

  async getUsers(params = {}) {
    const res = await api.get('/admin/users', { params })
    return res.data
  },

  async getUser(id) {
    const res = await api.get(`/admin/users/${id}`)
    return res.data
  },

  async blockUser(id, reason = '') {
    const res = await api.patch(`/admin/users/${id}/block`, { reason })
    return res.data
  },

  async unblockUser(id) {
    const res = await api.patch(`/admin/users/${id}/unblock`)
    return res.data
  },

  async getTenants(params = {}) {
    const res = await api.get('/admin/tenants', { params })
    return res.data
  },

  async updateTenant(id, payload) {
    const res = await api.patch(`/admin/tenants/${id}`, payload)
    return res.data
  },

  // Packs
  async getPacks() {
    const res = await api.get('/admin/packs')
    return res.data
  },

  async getPack(id) {
    const res = await api.get(`/admin/packs/${id}`)
    return res.data
  },

  async createPack(payload) {
    const res = await api.post('/admin/packs', payload)
    return res.data
  },

  async updatePack(id, payload) {
    const res = await api.patch(`/admin/packs/${id}`, payload)
    return res.data
  },

  async deletePack(id) {
    const res = await api.delete(`/admin/packs/${id}`)
    return res.data
  },
}
