import api from './api'

export const teamService = {
  async getMembers() {
    const res = await api.get('/team')
    return res.data
  },

  async invite(data) {
    const res = await api.post('/team/invite', data)
    return res.data
  },

  async updateRole(userId, role) {
    const res = await api.patch(`/team/members/${userId}/role`, { role })
    return res.data
  },

  async removeMember(userId) {
    const res = await api.delete(`/team/members/${userId}`)
    return res.data
  },

  async getActivity(limit = 20) {
    const res = await api.get('/team/activity', { params: { limit } })
    return res.data
  },
}
