/**
 * syncService.js
 * --------------
 * Rejoue les requêtes en attente de la file offline.
 * Appelé automatiquement quand `navigator.onLine` repasse à true.
 */

import api from './api'
import * as queue from './offlineQueue'
import toast from 'react-hot-toast'

let syncing = false

export async function processQueue() {
  if (syncing || !navigator.onLine) return
  syncing = true

  const items = await queue.getAll()
  if (items.length === 0) { syncing = false; return }

  const toastId = toast.loading(`Synchronisation de ${items.length} opération(s)…`)
  let success = 0
  let failed  = 0

  for (const item of items) {
    try {
      await api.request({
        method: item.method,
        url:    item.url,
        data:   item.data,
      })
      await queue.remove(item.id)
      success++
    } catch (err) {
      // Si l'erreur n'est PAS un problème réseau, on supprime quand même
      // (ex: 422 validation = données invalides, on ne peut pas rejouer)
      if (err.response) {
        await queue.remove(item.id)
        failed++
        console.warn('[Sync] Requête rejetée (supprimée):', item.label, err.response.status)
      }
      // Si réseau toujours KO, on arrête et on réessaiera plus tard
      else {
        break
      }
    }
  }

  syncing = false

  if (success > 0 && failed === 0) {
    toast.success(`${success} opération(s) synchronisée(s) ✓`, { id: toastId })
    window.dispatchEvent(new CustomEvent('qiwam:data-changed'))
  } else if (success > 0 && failed > 0) {
    toast.error(`${success} sync OK, ${failed} rejeté(s)`, { id: toastId })
    window.dispatchEvent(new CustomEvent('qiwam:data-changed'))
  } else if (failed > 0) {
    toast.error(`${failed} opération(s) rejetée(s) par le serveur`, { id: toastId })
  } else {
    toast.dismiss(toastId)
  }
}

/** Initialiser l'écouteur de reconnexion */
export function initSyncOnReconnect() {
  window.addEventListener('online', () => {
    // Petit délai pour laisser le réseau s'établir
    setTimeout(processQueue, 1500)
  })
}
