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
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'style.css') return 'styles.css';
          return assetInfo.name;
        },
      },
    },
    // Optimize for library
    minify: 'esbuild',
    cssMinify: 'esbuild',
    sourcemap: true,
    // Report compressed size
    reportCompressedSize: true,
    // Inline assets smaller than 4kb
    assetsInlineLimit: 4096,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
