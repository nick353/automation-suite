import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Vite builds the React UI from frontend/ and outputs to public/dist
export default defineConfig({
  root: path.resolve(__dirname, 'frontend'),
  plugins: [react()],
  build: {
    outDir: path.resolve(__dirname, 'public/dist'),
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(__dirname, 'frontend/index.html'),
    },
  },
  server: {
    port: 5173,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'frontend'),
    },
  },
});
