import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['icons/*.png', 'icons/*.svg', 'offline.html'],

      // On utilise notre fichier manifest.webmanifest dans /public
      manifest: false,

      workbox: {
        // Fichiers à précacher (shell applicatif)
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],

        // Ne pas dépasser 5 Mo par fichier dans le précache
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,

        // Stratégies de cache par route API
        runtimeCaching: [
          // ── API lecture : Network-first, fallback cache 24h ──
          {
            urlPattern: /\/api\/v1\/(products|customers|orders|dashboard|meta)/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-reads',
              networkTimeoutSeconds: 5,
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },

          // ── Settings/Tenant : Stale-while-revalidate ──
          {
            urlPattern: /\/api\/v1\/(settings|tenants|team)/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'api-settings',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 7 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },

          // ── Fonts Google ──
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],

        // Page offline quand la navigation échoue
        navigateFallback: '/offline.html',
        navigateFallbackAllowlist: [/^(?!\/(api|icons))/],

        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
      },

      devOptions: {
        // Mettre à true temporairement pour tester le SW en dev
        enabled: false,
        type: 'module',
      },
    }),
  ],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
