import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: 'auto',
      manifest: {
        id: '/',
        name: '日麻点数工具',
        short_name: '日麻点数',
        description: '日麻点数计算、练习与速查工具',
        lang: 'zh-CN',
        start_url: '/#/home',
        scope: '/',
        display: 'standalone',
        theme_color: '#F6F2E8',
        background_color: '#F6F2E8',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        clientsClaim: true,
        skipWaiting: false,
      cleanupOutdatedCaches: true,
      navigateFallback: 'index.html',
      globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
      globIgnores: [
        '**/pwa-*.png',
        '**/maskable-icon-*.png',
        '**/manifest.webmanifest',
      ],
      runtimeCaching: [
          {
            urlPattern: /\/models\/.*\.onnx(?:\?.*)?$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'mahjong-model-v1',
              cacheableResponse: {
                statuses: [200],
              },
              expiration: {
                maxEntries: 2,
              },
            },
          },
          {
            urlPattern: /\/assets\/ort-wasm[^/]*\.wasm(?:\?.*)?$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'mahjong-ort-v1',
              cacheableResponse: {
                statuses: [200],
              },
              expiration: {
                maxEntries: 2,
              },
            },
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  build: {
    sourcemap: true,
  },
  test: {
    exclude: ['node_modules/**', 'dist/**', '.tmp/**'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
});
