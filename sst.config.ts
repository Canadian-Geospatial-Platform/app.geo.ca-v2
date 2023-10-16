import type { SSTConfig } from 'sst';
import { Config, SvelteKitSite } from 'sst/constructs';

export default {
	config(_input) {
		return {
			name: 'app-geo-ca-v2',
			region: 'ca-central-1'
		};
	},
	stacks(app) {
		app.stack(function Site({ stack }) {
			const OIDC_CLIENT_ID = new Config.Parameter(stack, 'OIDC_CLIENT_ID', {
				value: '53br9dirl7io6qoolkf6afjsj5'
			});
			const OIDC_CLIENT_SECRET = new Config.Secret(stack, 'OIDC_CLIENT_SECRET');
			const OIDC_CUSTOM_DOMAIN = new Config.Parameter(stack, 'OIDC_CUSTOM_DOMAIN', {
				value: 'https://auth-dev.geo.ca'
			});

			const site = new SvelteKitSite(stack, 'site', {
				bind: [OIDC_CLIENT_ID, OIDC_CLIENT_SECRET, OIDC_CUSTOM_DOMAIN]
			});
			stack.addOutputs({
				url: site.url
			});
		});
	}
} satisfies SSTConfig;
