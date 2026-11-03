import adapter from './scripts/svelte-kit-sst.js';
import { sveltekit } from '@sveltejs/kit/vite';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { svelteTesting } from '@testing-library/svelte/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    sveltekit({
      preprocess: vitePreprocess(),
      adapter: adapter(),
      csrf: { trustedOrigins: ['*'] },
    }),
    svelteTesting(),
  ],
  // @ts-expect-error - consumed by Vitest; not part of Vite UserConfig typings.
  test: {
    environment: 'jsdom',
    include: ['src/**/*.component.test.ts'],
  },
});
