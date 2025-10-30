<script lang="ts">
	import { slide } from 'svelte/transition';
	import { page } from '$app/stores';
	$: lang = $page.data.lang;
	$: signInText = lang == 'en-ca' ? 'Sign In' : 'connexion';
	export let light = false;
</script>

<div>
	{#if !$page.data.signedIn}
		<a transition:slide href={'/' + lang + '/sign-in/send?state=' + $page.url.href}>
			<button class={light ? 'button-2' : 'button-1'}>{signInText}</button>
		</a>
	{:else}
		<a transition:slide data-sveltekit-reload href={'/' + lang + '/sign-in/logout'}
			><button class={light ? 'button-2' : 'button-1'}>Sign Out</button></a
		>
	{/if}
</div>

<style>
	a {
		@apply divide-y;
		@apply divide-custom-16;
	}
	div {
		display: flex;
		height: 100%;
		align-items: center;
		@apply whitespace-nowrap;
	}
</style>
