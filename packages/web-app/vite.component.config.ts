import adapter from './scripts/svelte-kit-sst.js';
import { sveltekit } from '@sveltejs/kit/vite';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { svelteTesting } from '@testing-library/svelte/vite';
import { defineConfig } from 'vite';
import { gitCommitDate } from './scripts/git-date.ts';

export default defineConfig({
  define: {
    __APP_DATE_MODIFIED__: JSON.stringify(gitCommitDate),
  },
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
