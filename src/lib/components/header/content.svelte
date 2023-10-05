<script lang="ts">
	import { slide } from 'svelte/transition';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import SignIn from './sign-in.svelte';
	$: lang = $page.data.lang;
	$: otherLang = lang == 'en-ca' ? 'fr-ca' : 'en-ca';
	$: otherLangPathName = $page.url.pathname.replace(lang, otherLang);

	$: catalogText = lang == 'en-ca' ? 'catalog' : 'catalogue';
	$: favoritesText = lang == 'en-ca' ? 'favorites' : 'favoris';
	$: signInText = lang == 'en-ca' ? 'sign in' : 'connexion';
</script>

<a transition:slide class="a" href="/{lang}/favorites">{favoritesText}</a>
<a transition:slide class="a" href="/{lang}/map-browser">{catalogText}</a>
<a transition:slide class="a" href={otherLangPathName + $page.url.search}>{otherLang}</a>
<SignIn />

<style>
	.a {
		@apply p-2;
		@apply m-2;
		@apply text-custom-2;
	}
</style>
