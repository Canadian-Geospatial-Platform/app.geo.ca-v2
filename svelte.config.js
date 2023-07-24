import { adapter } from 'sveltekit-adapter-aws';
import { vitePreprocess } from '@sveltejs/kit/vite';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://kit.svelte.dev/docs/integrations#preprocessors
	// for more information about preprocessors
	preprocess: vitePreprocess(),

	kit: {
		adapter: adapter({
			autoDeploy: true,
			stackName: 'pascal-aws-sdk-deploy-test'
		})
	}
};

export default config;
