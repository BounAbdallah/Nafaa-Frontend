import api from './api'

export const subscriptionService = {
  // ── Côté espace (tenant admin) ──
  async getMine(params = {}) {
    const res = await api.get('/subscription', { params })
    return res.data
  },

  async getPacks() {
    const res = await api.get('/subscription/packs')
    return res.data
  },

  async requestPlanChange(packId, note = '') {
    const res = await api.post('/subscription/plan-request', { pack_id: packId, note })
    return res.data
  },

  // ── Côté super admin ──
  async setTrial(tenantId, payload) {
    const res = await api.patch(`/admin/subscriptions/${tenantId}/trial`, payload)
    return res.data
  },

  async setPricing(tenantId, payload) {
    const res = await api.patch(`/admin/subscriptions/${tenantId}/pricing`, payload)
    return res.data
  },

  async getPlanRequests(status = 'pending') {
    const res = await api.get('/admin/subscriptions/plan-requests', { params: { status } })
    return res.data
  },

  async decidePlanRequest(id, decision, adminNote = '') {
    const res = await api.patch(`/admin/subscriptions/plan-requests/${id}`, { decision, admin_note: adminNote })
    return res.data
  },
}
