import axios from 'axios'

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'

export const contactService = {
  send: (data) =>
    axios.post(`${baseURL}/contact`, data, {
      headers: { 'Content-Type': 'application/json' },
    }),
}
