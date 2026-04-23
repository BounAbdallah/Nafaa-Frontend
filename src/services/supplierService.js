import api from './api'

export const supplierService = {
  async getMeta()              { return (await api.get('/suppliers/meta')).data },
  async getAll(params = {})    { return (await api.get('/suppliers', { params })).data },
  async getOne(id)             { return (await api.get(`/suppliers/${id}`)).data },
  async create(data)           { return (await api.post('/suppliers', data)).data },
  async update(id, data)       { return (await api.put(`/suppliers/${id}`, data)).data },
  async remove(id)             { return (await api.delete(`/suppliers/${id}`)).data },
}
