<script lang="ts">
	import { slide } from 'svelte/transition';
	import { page } from '$app/stores';
	$: lang = $page.data.lang;
	$: signInText = lang == 'en-ca' ? 'sign in' : 'connexion';
</script>

{#if $page.data.FEATURE_SIGN_IN}
	{#if !$page.data.signedIn}
		<a transition:slide class="button-1" href={'/' + lang + '/sign-in/send?state=' + $page.url.href}
			>{signInText}</a
		>
	{:else}
		<a
			transition:slide
			data-sveltekit-reload
			class="button-1"
			href={'/' + lang + '/sign-in/oidc-logout'}>Sign Out</a
		>
	{/if}
{/if}
