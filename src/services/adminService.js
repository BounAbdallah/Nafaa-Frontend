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

  // ── Abonnements & Approbations ─────────────────────────────────────────────
  async getPendingApprovals() {
    const res = await api.get('/admin/subscriptions/pending')
    return res.data
  },

  async approveTenant(tenantId) {
    const res = await api.post(`/admin/subscriptions/${tenantId}/approve`)
    return res.data
  },

  async getSubscriptionStats() {
    const res = await api.get('/admin/subscriptions/stats')
    return res.data
  },

  async getSubscriptionTracking(year) {
    const res = await api.get('/admin/subscriptions/tracking', { params: { year } })
    return res.data
  },

  async getTenantHistory(tenantId) {
    const res = await api.get(`/admin/subscriptions/${tenantId}/history`)
    return res.data
  },

  async recordPayment(tenantId, payload) {
    const res = await api.post(`/admin/subscriptions/${tenantId}/payment`, payload)
    return res.data
  },

  // ── Notifications ────────────────────────────────────────────────────────
  async getNotifications() {
    const res = await api.get('/auth/notifications')
    return res.data
  },

  async markAllRead() {
    const res = await api.post('/auth/notifications/mark-all-read')
    return res.data
  },

  async markAsRead(id) {
    const res = await api.patch(`/auth/notifications/${id}/read`)
    return res.data
  },
}
