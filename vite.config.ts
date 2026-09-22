import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, type Plugin } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// Share cards need an absolute URL, and a wrong one means Facebook silently fails
// to fetch the image. Resolve it at build time instead of hardcoding a domain:
// an explicit VITE_SITE_URL wins, otherwise Vercel's own production domain is used.
function resolveSiteUrl() {
  const explicit = process.env.VITE_SITE_URL?.trim()
  if (explicit) return explicit.replace(/\/+$/, '')
  const vercelDomain = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim() || process.env.VERCEL_URL?.trim()
  if (vercelDomain) return `https://${vercelDomain.replace(/^https?:\/\//, '').replace(/\/+$/, '')}`
  return 'https://pinoy-online-ventures.vercel.app'
}

const SITE_URL = resolveSiteUrl()

function injectSiteUrl(): Plugin {
  let outDir = 'dist'
  return {
    name: 'pov-inject-site-url',
    configResolved(config) { outDir = config.build.outDir },
    transformIndexHtml: (html) => html.replaceAll('__SITE_URL__', SITE_URL),
    closeBundle() {
      // public/ files are copied verbatim, so patch the emitted copies.
      for (const file of ['robots.txt', 'sitemap.xml']) {
        const target = resolve(outDir, file)
        if (!existsSync(target)) continue
        writeFileSync(target, readFileSync(target, 'utf8').replaceAll('__SITE_URL__', SITE_URL))
      }
    },
  }
}

export default defineConfig({
  define: { 'import.meta.env.VITE_SITE_URL': JSON.stringify(SITE_URL) },
  plugins: [
    react(),
    tailwindcss(),
    injectSiteUrl(),
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
