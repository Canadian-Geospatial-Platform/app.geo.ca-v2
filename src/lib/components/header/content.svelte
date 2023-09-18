<script lang="ts">
	import { slide } from 'svelte/transition';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	$: lang = $page.data.lang;
	$: otherLang = lang == 'en-ca' ? 'fr-ca' : 'en-ca';
	$: otherLangPathName = $page.url.pathname.replace(lang, otherLang);

	$: catalogText = lang == 'en-ca' ? 'catalog' : 'catalogue';
	$: favoritesText = lang == 'en-ca' ? 'favorites' : 'favoris';
</script>

<a transition:slide href="/{lang}/favorites">{favoritesText}</a>
<a transition:slide href="/{lang}/map-browser">{catalogText}</a>
<a transition:slide href={otherLangPathName + $page.url.search}>{otherLang}</a>

<style>
	a {
		@apply p-2;
		@apply m-2;
		@apply text-custom-2;
	}
</style>
