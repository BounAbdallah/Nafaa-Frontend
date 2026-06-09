import api from './api'

export const printerService = {
  /** Imprimer le ticket d'une commande sur l'imprimante thermique du tenant */
  printReceipt: (orderId) =>
    api.post(`/orders/${orderId}/print`),

  /** Imprimer un ticket de test (vérifie la connexion) */
  test: () =>
    api.post('/print/test'),
}
