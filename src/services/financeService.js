import api from './api'

export const financeService = {
  async getSummary(params = {}) {
    const res = await api.get('/finance/summary', { params })
    return res.data
  },

  async exportPdf(params = {}) {
    const res = await api.get('/finance/export/pdf', { params, responseType: 'blob' })
    return res.data
  },

  async exportExcel(params = {}) {
    const res = await api.get('/finance/export/excel', { params, responseType: 'blob' })
    return res.data
  },
}

export const cashMovementService = {
  async getMeta()           { return (await api.get('/cash-movements/meta')).data },
  async getAll(params = {}) { return (await api.get('/cash-movements', { params })).data },
  async create(data)        { return (await api.post('/cash-movements', data)).data },
  async remove(id)          { return (await api.delete(`/cash-movements/${id}`)).data },
}

export const expenseCategoryService = {
  async getAll()     { return (await api.get('/expense-categories')).data },
  async create(data) { return (await api.post('/expense-categories', data)).data },
  async remove(id)   { return (await api.delete(`/expense-categories/${id}`)).data },
}

export const accountingService = {
  // Plan des comptes
  async getAccounts(params = {}) { return (await api.get('/accounting/accounts', { params })).data },
  async createAccount(data)      { return (await api.post('/accounting/accounts', data)).data },
  async initChart()              { return (await api.post('/accounting/accounts/init')).data },

  // Journal
  async getJournal(params = {})  { return (await api.get('/accounting/journal', { params })).data },
  async createEntry(data)        { return (await api.post('/accounting/journal', data)).data },
  async deleteEntry(id)          { return (await api.delete(`/accounting/journal/${id}`)).data },

  // Grand livre
  async getLedger(params = {})   { return (await api.get('/accounting/ledger', { params })).data },

  // Balance
  async getBalance(params = {})  { return (await api.get('/accounting/balance', { params })).data },

  // États financiers
  async getBilan(params = {})    { return (await api.get('/accounting/bilan', { params })).data },
  async getResultat(params = {}) { return (await api.get('/accounting/resultat', { params })).data },
}
