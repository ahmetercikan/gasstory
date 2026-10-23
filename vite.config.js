import { defineConfig } from 'vite';

// base: './' → aynı derleme hem Capacitor içinde hem herhangi bir alt yolda çalışır.
export default defineConfig({
  base: './',
  build: { target: 'es2020', chunkSizeWarningLimit: 1500 },
});
