<script lang="ts">
	import { slide } from 'svelte/transition';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	$: lang = $page.data.lang;
	$: otherLang = lang == 'en-ca' ? 'fr-ca' : 'en-ca';
	$: otherLangPathName = $page.url.pathname.replace(lang, otherLang);
</script>

<a transition:slide href="/{lang}/favorites">favorites</a>
<a transition:slide href="/{lang}/map-browser">map-browser</a>
<a transition:slide href={otherLangPathName + $page.url.search}>{otherLang}</a>

<style>
	a {
		@apply p-2;
		@apply m-2;
		@apply text-custom-2;
	}
</style>
