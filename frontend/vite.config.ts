import { defineConfig } from 'vite';

export default defineConfig({
  build: { outDir: 'build' },
  server: { proxy: { '/api': 'http://localhost:4000' } },
});
