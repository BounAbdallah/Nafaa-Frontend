import api from './api'

export const settingsService = {
  async updateProfile(data) {
    const res = await api.put('/settings/profile', data)
    return res.data
  },

  async updateTenant(formData) {
    // Note: formData should be used here to support image uploads
    const res = await api.post('/settings/tenant', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return res.data
  }
}
