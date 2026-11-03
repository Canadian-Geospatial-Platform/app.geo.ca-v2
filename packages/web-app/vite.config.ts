import adapter from './scripts/svelte-kit-sst.js';
import { sveltekit } from '@sveltejs/kit/vite';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';

// Allow self-signed certificates in dev (e.g. internal API endpoints with corp CA).
// This flag is intentionally scoped to vite.config.ts so it never runs in production builds.
if (process.env.NODE_ENV !== 'production') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

export default defineConfig({
  plugins: [
    sveltekit({
      preprocess: vitePreprocess(),
      adapter: adapter(),
      csrf: { trustedOrigins: ['*'] },
    }),
  ],
  // @ts-expect-error - consumed by Vitest; not part of Vite UserConfig typings.
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    exclude: ['src/**/*.component.test.ts'],
  },
  server: {
    port: 8080,
    strictPort: true,
    allowedHosts: true,
  },
});
