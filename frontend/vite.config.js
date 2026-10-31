import fs from 'node:fs';
import path from 'node:path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

/** GitHub Pages отдаёт 404.html для «глубоких» ссылок SPA — копируем туда index.html. */
function spaFallback() {
  return {
    name: 'spa-fallback',
    closeBundle() {
      const dist = path.resolve(process.cwd(), 'dist');
      const index = path.join(dist, 'index.html');
      if (!fs.existsSync(index)) return;
      fs.copyFileSync(index, path.join(dist, '404.html'));
      fs.writeFileSync(path.join(dist, '.nojekyll'), '');
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const isDemo = env.VITE_DEMO === 'true';

  return {
    base: env.VITE_BASE || '/',
    plugins: [react(), ...(isDemo ? [spaFallback()] : [])],
    server: {
      host: true,
      port: 3000,
      strictPort: true,
      allowedHosts: true,
      proxy: {
        '/api': {
          target: process.env.VITE_API_PROXY || 'http://localhost:5000',
          changeOrigin: true,
        },
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
    },
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: './src/setupTests.js',
      css: false,
      exclude: ['e2e/**', 'node_modules/**', 'dist/**'],
    },
  };
});
