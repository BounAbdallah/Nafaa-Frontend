import api from './api'

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw     = window.atob(base64)
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)))
}

export const pushService = {
  isSupported() {
    return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window
  },

  async getPermission() {
    if (!this.isSupported()) return 'unsupported'
    return Notification.permission
  },

  async requestPermission() {
    if (!this.isSupported()) return false
    const result = await Notification.requestPermission()
    return result === 'granted'
  },

  async getVapidKey() {
    const res = await api.get('/push/vapid-key')
    return res.data.public_key
  },

  async subscribe() {
    if (!this.isSupported()) throw new Error('Push notifications non supportées')

    const granted = await this.requestPermission()
    if (!granted) throw new Error('Permission refusée')

    const reg       = await navigator.serviceWorker.ready
    const vapidKey  = await this.getVapidKey()

    const subscription = await reg.pushManager.subscribe({
      userVisibleOnly:      true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey),
    })

    const json = subscription.toJSON()
    await api.post('/push/subscribe', {
      endpoint:         json.endpoint,
      keys:             json.keys,
      content_encoding: (subscription.options?.contentEncoding) || 'aesgcm',
    })

    return subscription
  },

  async unsubscribe() {
    const reg          = await navigator.serviceWorker.ready
    const subscription = await reg.pushManager.getSubscription()
    if (!subscription) return

    await api.post('/push/unsubscribe', { endpoint: subscription.endpoint })
    await subscription.unsubscribe()
  },

  async isSubscribed() {
    if (!this.isSupported()) return false
    if (Notification.permission !== 'granted') return false
    const reg          = await navigator.serviceWorker.ready
    const subscription = await reg.pushManager.getSubscription()
    if (!subscription) return false

    try {
      const res = await api.get('/push/status', { params: { endpoint: subscription.endpoint } })
      return res.data.active === true
    } catch {
      return false
    }
  },
}
