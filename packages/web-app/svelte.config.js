import adapter from 'svelte-kit-sst';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter(),
    // Origin check is enforced in hooks.server.ts so the OIDC back-channel logout route can be exempted.
    csrf: {
      trustedOrigins: ['*'],
    },
  },
};

export default config;
