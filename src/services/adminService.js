import api from './api'

export const adminService = {
  async getStats(params = {}) {
    const res = await api.get('/admin/users/stats', { params })
    return res.data
  },

  async getUsers(params = {}) {
    const res = await api.get('/admin/users', { params })
    return res.data
  },

  async getLogins(params = {}) {
    const res = await api.get('/admin/logins', { params })
    return res.data
  },

  async getLoginFrequency(userId, params = {}) {
    const res = await api.get(`/admin/logins/${userId}/frequency`, { params })
    return res.data
  },

  async getGlobalLoginFrequency(params = {}) {
    const res = await api.get('/admin/logins/frequency', { params })
    return res.data
  },

  async getUser(id) {
    const res = await api.get(`/admin/users/${id}`)
    return res.data
  },

  // ── Administrateurs plateforme (admins pays) ──
  async setPackCountryPrice(packId, payload) {
    const res = await api.put(`/admin/packs/${packId}/country-price`, payload)
    return res.data
  },

  async removePackCountryPrice(packId, country) {
    const res = await api.delete(`/admin/packs/${packId}/country-price/${country}`)
    return res.data
  },

  async getAdmins() {
    const res = await api.get('/admin/admins')
    return res.data
  },

  async getAdmin(id) {
    const res = await api.get(`/admin/admins/${id}`)
    return res.data
  },

  async createAdmin(payload) {
    const res = await api.post('/admin/admins', payload)
    return res.data
  },

  async updateAdmin(id, payload) {
    const res = await api.patch(`/admin/admins/${id}`, payload)
    return res.data
  },

  async blockAdmin(id, reason = '') {
    const res = await api.patch(`/admin/admins/${id}/block`, { reason })
    return res.data
  },

  async unblockAdmin(id) {
    const res = await api.patch(`/admin/admins/${id}/unblock`)
    return res.data
  },

  async deleteAdmin(id) {
    const res = await api.delete(`/admin/admins/${id}`)
    return res.data
  },

  async blockUser(id, reason = '') {
    const res = await api.patch(`/admin/users/${id}/block`, { reason })
    return res.data
  },

  // ── Suppression / corbeille utilisateurs (super admin) ──
  async deleteUser(id)        { return (await api.delete(`/admin/users/${id}`)).data },
  async getTrashedUsers(params = {}) { return (await api.get('/admin/users/trashed', { params })).data },
  async restoreUser(id)       { return (await api.patch(`/admin/users/${id}/restore`)).data },
  async forceDeleteUser(id)   { return (await api.delete(`/admin/users/${id}/force`)).data },

  // ── Suppression / corbeille espaces ──
  async deleteTenant(id)      { return (await api.delete(`/admin/tenants/${id}`)).data },
  async getTrashedTenants(params = {}) { return (await api.get('/admin/tenants/trashed', { params })).data },
  async restoreTenant(id)     { return (await api.patch(`/admin/tenants/${id}/restore`)).data },
  async forceDeleteTenant(id) { return (await api.delete(`/admin/tenants/${id}/force`)).data },

  // ── Sessions en cours ──
  async getActiveSessions(params = {}) { return (await api.get('/admin/sessions', { params })).data },
  async revokeSession(id)     { return (await api.delete(`/admin/sessions/${id}`)).data },

  async unblockUser(id) {
    const res = await api.patch(`/admin/users/${id}/unblock`)
    return res.data
  },

  async getTenants(params = {}) {
    const res = await api.get('/admin/tenants', { params })
    return res.data
  },

  async getTenant(id) {
    const res = await api.get(`/admin/tenants/${id}`)
    return res.data
  },

  async updateTenant(id, payload) {
    const res = await api.patch(`/admin/tenants/${id}`, payload)
    return res.data
  },

  async updateTenantModules(tenantId, enabledModules) {
    const res = await api.patch(`/admin/tenants/${tenantId}/modules`, { enabled_modules: enabledModules })
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

  async getSubscriptionStats(params = {}) {
    const res = await api.get('/admin/subscriptions/stats', { params })
    return res.data
  },

  async getSubscriptionTracking(year, filters = {}) {
    const res = await api.get('/admin/subscriptions/tracking', { params: { year, ...filters } })
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

  // ── Messages de contact (portail) ────────────────────────────────────────
  async getContactMessages() {
    const res = await api.get('/admin/contact-messages')
    return res.data
  },

  async markContactRead(id) {
    const res = await api.post(`/admin/contact-messages/${id}/read`)
    return res.data
  },

  async deleteContactMessage(id) {
    const res = await api.delete(`/admin/contact-messages/${id}`)
    return res.data
  },
}
