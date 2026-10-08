/// <reference types="vitest/config" />
import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  build: {
    // The app chunk includes the bundled sample statements (~215 KB of camt.053 XML) by design.
    chunkSizeWarningLimit: 800,
    rolldownOptions: {
      output: {
        // Rolldown (Vite 8) dropped the object form of manualChunks; codeSplitting groups replace it.
        codeSplitting: {
          groups: [
            { name: 'react', test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/ },
            { name: 'charts', test: /[\\/]node_modules[\\/]recharts[\\/]/ },
            {
              name: 'ui',
              test: /[\\/]node_modules[\\/](radix-ui|@radix-ui[\\/][^\\/]+|cmdk|sonner|lucide-react)[\\/]/,
            },
            { name: 'state', test: /[\\/]node_modules[\\/](zustand|zod)[\\/]/ },
          ],
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
  },
});
