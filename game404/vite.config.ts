import { defineConfig } from 'vite';

// IIFE lib build: tek dosya /g404/game.js olarak repo köküne kopyalanır.
// Hash'siz dosya adı bilinçli: _headers'ta kısa cache + revalidate ile servis edilir.
export default defineConfig({
  build: {
    lib: { entry: 'src/main.ts', name: 'VoltageGame404', formats: ['iife'], fileName: () => 'game.js' },
    outDir: 'dist',
    emptyOutDir: true,
    target: 'es2019',
    minify: 'esbuild',
  },
});
