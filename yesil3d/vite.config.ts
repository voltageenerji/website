import { defineConfig } from 'vite';

// IIFE lib build: tek dosya /gyesil/cicek.js olarak repo köküne yazılır (game404 ile aynı düzen).
// Hash'siz dosya adı bilinçli: _headers'ta kısa cache + revalidate ile servis edilir.
export default defineConfig({
  build: {
    lib: { entry: 'src/main.ts', name: 'VoltageYesil', formats: ['iife'], fileName: () => 'cicek.js' },
    outDir: '../gyesil',
    emptyOutDir: true,
    target: 'es2019',
    minify: 'esbuild',
  },
});
