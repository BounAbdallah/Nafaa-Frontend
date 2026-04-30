import api from './api'

export const orderService = {
  getAll: (params) => api.get('/orders', { params }),
  getById: (id) => api.get(`/orders/${id}`),
  create: (data) => api.post('/orders', data),
  remove: (id) => api.delete(`/orders/${id}`),
  getMeta: () => api.get('/orders/meta'),
  downloadInvoice: async (id, reference) => {
    const res = await api.get(`/orders/${id}/invoice`, { responseType: 'blob' })
    const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `facture-${reference || id}.pdf`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }
}
