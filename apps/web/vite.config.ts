import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// NOTE: Gemini API key is no longer exposed to the browser bundle.
// AI calls must go through apps/api per docs/architecture/decisions.md.
export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  server: {
    port: 8000,
    strictPort: true,
    host: '0.0.0.0',
  },
  optimizeDeps: {
    include: ['react-grid-layout', 'react-resizable'],
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
