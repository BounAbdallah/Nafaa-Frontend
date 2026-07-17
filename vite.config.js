import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // injectManifest lets us write a custom SW (src/sw.js)
      // that handles both Workbox caching AND web push events.
      strategies:     'injectManifest',
      srcDir:         'src',
      filename:       'sw.js',
      registerType:   'autoUpdate',
      injectRegister: 'auto',
      includeAssets:  ['icons/*.png', 'icons/*.svg', 'offline.html'],

      // Use our existing public/manifest.webmanifest
      manifest: false,

      injectManifest: {
        globPatterns:                  ['**/*.{js,css,html,ico,png,svg,woff2}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      },

      devOptions: {
        enabled: false,
        type:    'module',
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
        target:       'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
