import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  root: 'frontend',
  build: { outDir: path.resolve('dist'), emptyOutDir: true },
  server: {
    proxy: { '/api': { target: 'http://localhost:3001', changeOrigin: false } },
    fs: { allow: [path.resolve('.')] },
  },
});
