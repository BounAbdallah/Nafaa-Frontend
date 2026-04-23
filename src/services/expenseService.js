import api from './api'

export const expenseService = {
  async getMeta()              { return (await api.get('/expenses/meta')).data },
  async getAll(params = {})    { return (await api.get('/expenses', { params })).data },
  async getOne(id)             { return (await api.get(`/expenses/${id}`)).data },
  async create(data)           { return (await api.post('/expenses', data)).data },
  async update(id, data)       { return (await api.put(`/expenses/${id}`, data)).data },
  async remove(id)             { return (await api.delete(`/expenses/${id}`)).data },
}
