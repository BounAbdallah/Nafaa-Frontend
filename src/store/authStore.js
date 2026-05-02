import { create } from 'zustand'
import { authService } from '@/services/authService'

function extractRole(user) {
  if (!user?.roles?.length) return null
  if (user.roles.includes('super_admin')) return 'super_admin'
  if (user.roles.includes('admin'))       return 'admin'
  if (user.roles.includes('employee'))    return 'employee'
  return user.roles[0]
}

export const useAuthStore = create((set, get) => ({
  user:            null,
  role:            null,
  token:           localStorage.getItem('qiwam_token'),
  isAuthenticated: false,
  isLoading:       true,

  initAuth: async () => {
    const token = localStorage.getItem('qiwam_token')
    if (!token) {
      set({ isLoading: false, isAuthenticated: false })
      return
    }

    try {
      const res = await authService.me()
      const user = res.data.user
      set({
        user,
        role:            extractRole(user),
        token,
        isAuthenticated: true,
        isLoading:       false,
      })
    } catch {
      localStorage.removeItem('qiwam_token')
      set({ user: null, role: null, token: null, isAuthenticated: false, isLoading: false })
    }
  },

  login: async (credentials) => {
    const res = await authService.login(credentials)
    const { user, token } = res.data
    localStorage.setItem('qiwam_token', token)
    set({ user, role: extractRole(user), token, isAuthenticated: true })
    return user
  },

  register: async (data) => {
    const res = await authService.register(data)
    const { user, token } = res.data
    localStorage.setItem('qiwam_token', token)
    set({ user, role: extractRole(user), token, isAuthenticated: true })
    return user
  },

  logout: async () => {
    try { await authService.logout() } catch { /* proceed regardless */ }
    localStorage.removeItem('qiwam_token')
    set({ user: null, role: null, token: null, isAuthenticated: false })
  },

  setUser: (user) => set({ user, role: extractRole(user) }),

  updateTenant: (tenant) =>
    set((state) => ({
      user: state.user ? { ...state.user, tenant_id: tenant.id, tenant } : state.user,
    })),

  isSuperAdmin: () => get().role === 'super_admin',
  isAdmin:      () => ['admin', 'super_admin'].includes(get().role),
  hasRole:      (r) => get().role === r,
}))
