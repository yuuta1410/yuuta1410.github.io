import tailwindcss from '@tailwindcss/postcss';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const rootDir = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(rootDir, '.'),
      'next/image': resolve(rootDir, 'src/image.tsx'),
    },
  },
  css: { postcss: { plugins: [tailwindcss()] } },
  build: {
    target: 'es2020',
    rolldownOptions: {
      input: {
        main: resolve(rootDir, 'index.html'),
        admin: resolve(rootDir, 'admin/index.html'),
      },
    },
  },
});
