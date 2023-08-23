<script>
	import { page } from '$app/stores';
	import { signIn } from '$lib/APIs/authorization';
	import { onMount } from 'svelte';

	let promise;

	onMount(async () => {
		promise = await signIn(
			$page.url.searchParams.get('code'),
			$page.url.origin + '/sign-in',
			$page.url.searchParams.get('state')
		);
	});
</script>

{#await promise}
	<p class="bg-custom-2">Signing in...</p>
{:then jwt}
	<p class="bg-green-100">The jwt is {jwt}</p>
{:catch error}
	<p style="bg-red-100">{error}</p>
{/await}

<style>
	p {
		@apply p-2;
		@apply m-4;
		@apply rounded-lg;
		@apply drop-shadow-lg;
	}
</style>
