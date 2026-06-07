/// <reference types="vitest" />

import legacy from '@vitejs/plugin-legacy'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  base: process.env.VITE_BASE || '/',
  plugins: [
    vue(),
    legacy(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.png',
        'promptual-logo.png',
        'manifest.webmanifest',
        'icons/*.webp',
        'icons/apple-touch-icon-*.png',
      ],
      manifest: false,
      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        globPatterns: ['**/*.{js,css,html,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/promptual\.puntuale\.nl\/jsonapi\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'promptual-api',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 },
              networkTimeoutSeconds: 5,
            },
          },
          {
            urlPattern: /^https:\/\/promptual\.puntuale\.nl\/sites\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'promptual-images',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/jsonapi': {
        target: 'https://promptual.puntuale.nl',
        changeOrigin: true,
        secure: true,
      },
      '/sites': {
        target: 'https://promptual.puntuale.nl',
        changeOrigin: true,
        secure: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('/node_modules/@ionic/core/components/')) {
            return 'ionic-components';
          }
          if (id.includes('/node_modules/@ionic/vue')) {
            return 'ionic-vue';
          }
          if (id.includes('/node_modules/@ionic/')) {
            return 'ionic-core';
          }
          if (id.includes('/node_modules/ionicons/')) {
            return 'icons';
          }
          if (id.includes('/node_modules/@capacitor/')) {
            return 'capacitor';
          }
          if (id.includes('/node_modules/vue') || id.includes('/node_modules/@vue/')) {
            return 'vue';
          }
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom'
  }
})
