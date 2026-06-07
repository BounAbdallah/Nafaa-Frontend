import axios from 'axios'
import toast from 'react-hot-toast'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8001/api/v1',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  withCredentials: true,
})

// Request interceptor — attach token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('qiwam_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Méthodes d'écriture qui peuvent être mises en queue hors ligne
const QUEUEABLE_METHODS = ['post', 'put', 'patch', 'delete']

// Response interceptor — handle global errors + offline queue
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status  = error.response?.status
    const config  = error.config
    const method  = config?.method?.toLowerCase()

    // ── Erreur réseau (pas de réponse serveur = hors ligne) ──
    if (!error.response && error.request && QUEUEABLE_METHODS.includes(method)) {
      // Import dynamique pour éviter les dépendances circulaires
      const { enqueue } = await import('./offlineQueue')
      const label = config._offlineLabel || `${method.toUpperCase()} ${config.url}`
      await enqueue({
        method,
        url:   config.url,
        data:  config.data ? JSON.parse(config.data) : undefined,
        label,
      })
      toast('📶 Hors ligne — opération mise en attente', {
        icon: '⏳',
        style: { background: '#1a3a52', color: '#fff' },
      })
      // On résout avec un objet factice pour que l'appelant ne plante pas
      return Promise.resolve({ data: { _offline: true, queued: true }, status: 0 })
    }

    // ── Erreurs HTTP standard ──
    if (status === 401) {
      localStorage.removeItem('qiwam_token')
      if (window.location.pathname !== '/auth/login') {
        window.location.href = '/auth/login'
      }
    }

    if (status === 403) {
      toast.error('Accès refusé.')
    }

    if (status === 500) {
      toast.error('Erreur serveur. Veuillez réessayer.')
    }

    return Promise.reject(error)
  }
)

export default api
