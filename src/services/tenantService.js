import api from './api'

export const tenantService = {
  async create(data) {
    const res = await api.post('/tenants', data)
    return res.data
  },

  async getCurrent() {
    const res = await api.get('/tenants/current')
    return res.data
  },

  async getIndustries() {
    const res = await api.get('/tenants/industries')
    return res.data
  },

  async getPacks() {
    const res = await api.get('/packs')
    return res.data
  },
}
