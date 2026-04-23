import api from './api'

export const orderService = {
  getAll: (params) => api.get('/orders', { params }),
  getById: (id) => api.get(`/orders/${id}`),
  create: (data) => api.post('/orders', data),
  remove: (id) => api.delete(`/orders/${id}`),
  getMeta: () => api.get('/orders/meta'),
  downloadInvoice: (id) => {
    const token = localStorage.getItem('nafaa_token')
    window.open(`${import.meta.env.VITE_API_URL}/orders/${id}/invoice?token=${token}`, '_blank')
  }
}
