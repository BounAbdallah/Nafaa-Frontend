import api from './api'

export const authService = {
  async register(data) {
    const res = await api.post('/auth/register', data)
    return res.data
  },

  async login(data) {
    const res = await api.post('/auth/login', data)
    return res.data
  },

  async logout() {
    const res = await api.post('/auth/logout')
    return res.data
  },

  async me() {
    const res = await api.get('/auth/me')
    return res.data
  },

  async updateProfile(payload) {
    const res = await api.patch('/auth/profile', payload)
    return res.data
  },

  async forgotPassword(email) {
    const res = await api.post('/auth/forgot-password', { email })
    return res.data
  },

  async resetPassword(data) {
    const res = await api.post('/auth/reset-password', data)
    return res.data
  },

  async resendVerification() {
    const res = await api.post('/auth/email/resend')
    return res.data
  },

  async verifyEmail(id, hash, expires, signature) {
    const res = await api.post(
      `/auth/email/verify/${id}/${hash}`,
      {},
      { params: { expires, signature } }
    )
    return res.data
  },
}
