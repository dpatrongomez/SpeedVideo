import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  build: {
    rollupOptions: {
      input: {
        // Popup entry point
        popup: path.resolve(__dirname, 'index.html'),
        // Content script – must be an IIFE (no ES module imports at runtime)
        content: path.resolve(__dirname, 'src/content.ts'),
        // Background service worker
        background: path.resolve(__dirname, 'src/background.ts'),
      },
      output: {
        // Keep filenames predictable so manifest.json can reference them
        entryFileNames: (chunk) => {
          if (chunk.name === 'content' || chunk.name === 'background') {
            return '[name].js';
          }
          return 'assets/[name]-[hash].js';
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        // content.js must be IIFE so Chrome can inject it without module support
        format: 'es',
      },
    },
  },
  server: {
    hmr: process.env.DISABLE_HMR !== 'true',
  },
});
