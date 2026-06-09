import api from './api'

export const ambassadorService = {
  // ── Admin ─────────────────────────────────────────────────────────────────
  list:       ()              => api.get('/admin/ambassadors'),
  get:        (id)            => api.get(`/admin/ambassadors/${id}`),
  create:     (data)          => api.post('/admin/ambassadors', data),
  update:     (id, data)      => api.put(`/admin/ambassadors/${id}`, data),
  remove:     (id)            => api.delete(`/admin/ambassadors/${id}`),
  markPaid:   (id, referralId) => api.post(`/admin/ambassadors/${id}/mark-paid`, { referral_id: referralId }),

  // ── Ambassador dashboard ──────────────────────────────────────────────────
  dashboard:      ()      => api.get('/ambassador/dashboard'),
  changePassword: (data)  => api.post('/ambassador/change-password', data),
}
