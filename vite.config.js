// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'safari-pinned-tab.svg', 'logo-512.png'], 
      manifest: {
        name: 'EduPulse',
        short_name: 'EduPulse',
        description: 'منصتك الذكية للمذاكرة والامتحانات',
        theme_color: '#121212',
        background_color: '#121212',
        display: 'standalone', 
        orientation: 'portrait',
        icons: [
          {
            src: '/logo-512.png', 
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/logo-512.png', 
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/logo-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        // الحل الأساسي لمنع فشل البناء
        maximumFileSizeToCacheInBytes: 8000000, 
        
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkFirst', 
            options: {
              cacheName: 'supabase-data-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7 
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|pdf)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'assets-cache',
            }
          }
        ]
      }
    })
  ],
  // إلغاء تحذير الـ 500kb لتبسيط البناء وعدم توقف الـ Terminal
  build: {
    chunkSizeWarningLimit: 8000, 
  }
})