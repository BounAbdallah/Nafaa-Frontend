import api from './api'

export const customerService = {
  async getMeta()              { return (await api.get('/customers/meta')).data },
  async getAll(params = {})    { return (await api.get('/customers', { params })).data },
  async getOne(id)             { return (await api.get(`/customers/${id}`)).data },
  async create(data)           { return (await api.post('/customers', data)).data },
  async update(id, data)       { return (await api.put(`/customers/${id}`, data)).data },
  async remove(id)             { return (await api.delete(`/customers/${id}`)).data },

  // ── Compte client (crédit / avance) ──
  async getAccount(id, params = {}) { return (await api.get(`/customers/${id}/account`, { params })).data },
  async repay(id, payload)          { return (await api.post(`/customers/${id}/repay`, payload)).data },
  async deposit(id, payload)        { return (await api.post(`/customers/${id}/deposit`, payload)).data },
  async getDebtors(params = {})     { return (await api.get('/customers/debtors', { params })).data },
}
