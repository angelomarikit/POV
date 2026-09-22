import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['pov-logo.png', 'pwa-192.png', 'pwa-512.png'],
      manifest: {
        name: 'Pinoy Online Venture',
        short_name: 'POV',
        description: 'People, opportunities, and stories from the Pinoy Online Venture community.',
        theme_color: '#f97316',
        background_color: '#0b0b0c',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        navigateFallback: '/index.html',
        globPatterns: ['**/*.{js,css,html,svg,png,webp,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/v1\/object\/public\//,
            handler: 'CacheFirst',
            options: { cacheName: 'pov-media', expiration: { maxEntries: 80, maxAgeSeconds: 2592000 } },
          },
          {
            urlPattern: /^https:\/\/i\.ytimg\.com\//,
            handler: 'CacheFirst',
            options: { cacheName: 'youtube-thumbnails', expiration: { maxEntries: 40, maxAgeSeconds: 604800 } },
          },
        ],
      },
    }),
  ],
})
