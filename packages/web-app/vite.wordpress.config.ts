import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { resolve } from 'path';

export default defineConfig({
  plugins: [svelte()],

  build: {
    outDir: 'dist-wordpress',

    lib: {
      entry: resolve(__dirname, 'src/lib/geochat/widget/wordpress.ts'),
      name: 'GeoChat',
      formats: ['iife'],
      fileName: () => 'geochat.js',
      cssFileName: 'geochat-styles',
    },
  },
});
