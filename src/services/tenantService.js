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

  async getPacks(country = '', profileType = '') {
    const params = {}
    if (country)     params.country = country
    if (profileType) params.profile_type = profileType
    const res = await api.get('/packs', { params })
    return res.data
  },
}
