/// <reference types="vitest/config" />

import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';
import { VitePWA } from 'vite-plugin-pwa';

const dirname = path.dirname(fileURLToPath(import.meta.url));

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
        start_url: '/#/quick-score',
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
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          exclude: ['node_modules/**', 'dist/**', '.tmp/**'],
          include: ['src/**/*.{test,spec}.{ts,tsx}'],
        },
      },
      {
        extends: true,
        plugins: [
          storybookTest({
            configDir: path.join(dirname, '.storybook'),
          }),
        ],
        test: {
          name: 'storybook',
          browser: {
            enabled: true,
            headless: true,
            provider: 'playwright',
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
  },
});
