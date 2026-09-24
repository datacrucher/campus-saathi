import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  // The web app lives in frontend/; it also imports the classifier from ml/.
  root: 'frontend',
  build: { outDir: path.resolve('dist'), emptyOutDir: true },
  server: {
    // Keep the browser's Host header so the API's same-origin check passes.
    proxy: { '/api': { target: 'http://localhost:3001', changeOrigin: false } },
    fs: { allow: [path.resolve('.')] },
  },
});
