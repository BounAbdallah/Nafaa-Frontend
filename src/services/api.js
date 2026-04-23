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
    const token = localStorage.getItem('nafaa_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor — handle global errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status

    if (status === 401) {
      localStorage.removeItem('nafaa_token')
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
