/**
 * Broadcast a data-changed event so the Dashboard (and any other listener)
 * knows it should re-fetch its statistics.
 *
 * Call this after every mutation: create, update, delete.
 */
export const notifyDataChanged = () => {
  window.dispatchEvent(new CustomEvent('qiwam:data-changed'))
}
