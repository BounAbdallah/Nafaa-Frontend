import { create } from 'zustand'
import { tenantService } from '@/services/tenantService'

export const useTenantStore = create((set) => ({
  tenant: null,
  isLoading: false,

  fetchTenant: async () => {
    set({ isLoading: true })
    try {
      const res = await tenantService.getCurrent()
      set({ tenant: res.data.tenant, isLoading: false })
    } catch {
      set({ tenant: null, isLoading: false })
    }
  },

  setTenant: (tenant) => set({ tenant }),
}))
