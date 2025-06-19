import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'GoldenLayout',
      fileName: 'index',
      formats: ['es'],
    },
    rollupOptions: {
      external: ['open-props'],
      output: {
        globals: {
          'open-props': 'OpenProps',
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
