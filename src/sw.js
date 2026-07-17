import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'
import { registerRoute, NavigationRoute }          from 'workbox-routing'
import { NetworkFirst, StaleWhileRevalidate, CacheFirst } from 'workbox-strategies'
import { ExpirationPlugin }                        from 'workbox-expiration'
import { CacheableResponsePlugin }                 from 'workbox-cacheable-response'
import { createHandlerBoundToURL }                 from 'workbox-precaching'

// ── Precache (injected by VitePWA at build time) ────────────────────────────
precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()

// ── SPA navigation fallback ─────────────────────────────────────────────────
const navHandler = createHandlerBoundToURL('/index.html')
const navRoute   = new NavigationRoute(navHandler, {
  denylist: [/^\/api/, /^\/icons/, /\.[a-z]+$/i],
})
registerRoute(navRoute)

// ── Caching strategies ──────────────────────────────────────────────────────
registerRoute(
  ({ url }) => /\/api\/v1\/(products|customers|orders|dashboard|meta)/.test(url.pathname),
  new NetworkFirst({
    cacheName: 'api-reads',
    networkTimeoutSeconds: 5,
    plugins: [
      new ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 86400 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  })
)

registerRoute(
  ({ url }) => /\/api\/v1\/(settings|tenants|team)/.test(url.pathname),
  new StaleWhileRevalidate({
    cacheName: 'api-settings',
    plugins: [
      new ExpirationPlugin({ maxEntries: 20, maxAgeSeconds: 604800 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  })
)

registerRoute(
  ({ url }) => /^https:\/\/fonts\.(googleapis|gstatic)\.com/.test(url.href),
  new CacheFirst({
    cacheName: 'google-fonts',
    plugins: [
      new ExpirationPlugin({ maxEntries: 10, maxAgeSeconds: 31536000 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  })
)

// ── Push Notifications ──────────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return

  let payload
  try { payload = event.data.json() } catch { return }

  const title   = payload.title  || 'Qiwam ERP'
  const options = {
    body:    payload.body    || '',
    icon:    payload.icon    || '/icons/icon-192x192.png',
    badge:   payload.badge   || '/icons/icon-32x32.png',
    data:    payload.data    || {},
    vibrate: [100, 50, 100],
    tag:     payload.data?.type || 'qiwam',
    renotify: true,
    actions: payload.data?.url ? [
      { action: 'open', title: 'Voir' },
      { action: 'close', title: 'Fermer' },
    ] : [],
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

// ── Notification click ──────────────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const url = event.notification.data?.url || '/'

  if (event.action === 'close') return

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus existing window if open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus()
          client.navigate(url)
          return
        }
      }
      // Open new window
      if (clients.openWindow) return clients.openWindow(url)
    })
  )
})

// ── Skip waiting ────────────────────────────────────────────────────────────
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting()
})
self.skipWaiting()
self.clients.claim()
