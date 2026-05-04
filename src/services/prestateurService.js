import api from './api'

// ── Rendez-vous ──────────────────────────────────────────────────────────────
export const appointmentService = {
  getAll:   (p)  => api.get('/prestateur/appointments', { params: p }),
  create:   (d)  => api.post('/prestateur/appointments', d),
  update:   (id, d) => api.put(`/prestateur/appointments/${id}`, d),
  remove:   (id) => api.delete(`/prestateur/appointments/${id}`),
}

// ── Devis ─────────────────────────────────────────────────────────────────────
export const quoteService = {
  getAll:          (p)      => api.get('/prestateur/quotes', { params: p }),
  get:             (id)     => api.get(`/prestateur/quotes/${id}`),
  create:          (d)      => api.post('/prestateur/quotes', d),
  update:          (id, d)  => api.put(`/prestateur/quotes/${id}`, d),
  remove:          (id)     => api.delete(`/prestateur/quotes/${id}`),
  convertInvoice:  (id)     => api.post(`/prestateur/quotes/${id}/convert-to-invoice`),
  downloadPdf:     (id)     => api.get(`/prestateur/quotes/${id}/pdf`, { responseType: 'blob' }),
}

// ── Factures ──────────────────────────────────────────────────────────────────
export const invoiceService = {
  getAll:  (p)     => api.get('/prestateur/invoices', { params: p }),
  get:     (id)    => api.get(`/prestateur/invoices/${id}`),
  create:  (d)     => api.post('/prestateur/invoices', d),
  update:  (id, d) => api.put(`/prestateur/invoices/${id}`, d),
  remove:  (id)    => api.delete(`/prestateur/invoices/${id}`),
  downloadPdf: (id) => api.get(`/prestateur/invoices/${id}/pdf`, { responseType: 'blob' }),
}

// ── Contrats ──────────────────────────────────────────────────────────────────
export const contractService = {
  getAll:  (p)     => api.get('/prestateur/contracts', { params: p }),
  get:     (id)    => api.get(`/prestateur/contracts/${id}`),
  create:  (d)     => api.post('/prestateur/contracts', d),
  update:  (id, d) => api.put(`/prestateur/contracts/${id}`, d),
  remove:  (id)    => api.delete(`/prestateur/contracts/${id}`),
}

// ── Templates ─────────────────────────────────────────────────────────────────
export const templateService = {
  getAll:    (type)  => api.get('/prestateur/templates', { params: { type } }),
  create:    (d)     => api.post('/prestateur/templates', d),
  update:    (id, d) => api.put(`/prestateur/templates/${id}`, d),
  remove:    (id)    => api.delete(`/prestateur/templates/${id}`),
  importPdf: (form)  => api.post('/prestateur/templates/import-pdf', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
}
