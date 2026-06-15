import api from './api'

export const productService = {
  async getMeta()              { return (await api.get('/products/meta')).data },
  async getAll(params = {})    { return (await api.get('/products', { params })).data },
  async getOne(id)             { return (await api.get(`/products/${id}`)).data },
  async create(data) {
    const config = data instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {}
    return (await api.post('/products', data, config)).data
  },
  async update(id, data) {
    if (data instanceof FormData) {
      data.append('_method', 'PATCH')
      return (await api.post(`/products/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } })).data
    }
    return (await api.patch(`/products/${id}`, data)).data
  },
  async getStats(id)           { return (await api.get(`/products/${id}/stats`)).data },
  async remove(id)             { return (await api.delete(`/products/${id}`)).data },
  async lookupBarcode(code)    { return (await api.get('/products/lookup-barcode', { params: { code } })).data },
  async getTrashed(params = {}) { return (await api.get('/products/trashed', { params })).data },
  async restore(id)            { return (await api.patch(`/products/${id}/restore`)).data },
  async forceDelete(id)        { return (await api.delete(`/products/${id}/force`)).data },
}
