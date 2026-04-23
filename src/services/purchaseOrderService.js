import api from './api'

export const purchaseOrderService = {
  async getMeta()                    { return (await api.get('/purchase-orders/meta')).data },
  async getAll(params = {})          { return (await api.get('/purchase-orders', { params })).data },
  async getOne(id)                   { return (await api.get(`/purchase-orders/${id}`)).data },
  async create(data)                 { return (await api.post('/purchase-orders', data)).data },
  async updateStatus(id, data)       { return (await api.patch(`/purchase-orders/${id}/status`, data)).data },
  async remove(id)                   { return (await api.delete(`/purchase-orders/${id}`)).data },
}
