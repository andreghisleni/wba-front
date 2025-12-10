import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import { tanstackRouter } from '@tanstack/router-vite-plugin';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
      generatedRouteTree: './src/route-tree.gen.ts',
      routesDirectory: './src/pages',
      routeToken: 'layout',
    }),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      external: [
        './src/pages/_app/$eventId/tickets/critica/**', // Exclude an entire folder
        './src/pages/_app/$eventId/tickets/import/**', // Exclude an entire folder
        './src/pages/_app/$eventId/tickets/ranges/**', // Exclude an entire folder
        'src/pages/_app/$eventId/tickets/payments/import/**', // Exclude an entire folder
      ],
    },
  },
  server: {
    allowedHosts: ['1ed5f08d712d.ngrok-free.app'],
  }
});
