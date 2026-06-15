import api from './api'

export const catalogService = {
  async getAll(params = {}) {
    const res = await api.get('/admin/catalog', { params })
    return res.data
  },
  async create(formData) {
    const res = await api.post('/admin/catalog', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data
  },
  async update(id, formData) {
    formData.append('_method', 'PATCH')
    const res = await api.post(`/admin/catalog/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data
  },
  async remove(id) {
    const res = await api.delete(`/admin/catalog/${id}`)
    return res.data
  },
}
