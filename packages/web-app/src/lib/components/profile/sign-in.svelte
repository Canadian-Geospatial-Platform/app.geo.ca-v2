<script lang="ts">
	import { slide } from 'svelte/transition';
	import { page } from '$app/stores';
	$: lang = $page.data.lang;
	$: signInText = lang == 'en-ca' ? 'sign in' : 'connexion';
</script>

{#if !$page.data.signedIn}
	<a transition:slide href={'/' + lang + '/sign-in/send?state=' + $page.url.href}>
		<button> {signInText}</button>
	</a>
{:else}
	<a transition:slide data-sveltekit-reload href={'/' + lang + '/sign-in/oidc-logout'}
		><button>Sign Out</button></a
	>
{/if}

<style>
	button {
		@apply bg-custom-16;
		@apply hover:bg-custom-23;
		@apply text-custom-1;
		@apply rounded-[0.3125rem];
		@apply pl-[0.8125rem];
		@apply pr-[0.5625rem];
		@apply h-full;
	}
	a {
		@apply divide-y;
		@apply divide-custom-16;
	}
</style>
