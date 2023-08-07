<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	$: lang = $page.data.lang;
	$: otherLang = lang == 'en-ca' ? 'fr-ca' : 'en-ca';
	$: otherLangPathName = $page.url.pathname.replace(lang, otherLang);
</script>

<nav class="flex items-center h-24 p-2 m-2 text-2xl">
	<img
		class="h-full"
		src="https://geo.ca/wp-content/uploads/2023/02/geo-ca-logo.svg"
		alt="GEO.CA logo, blue and green globe / Logo de GEO.CA, globe bleu et vert"
		decoding="async"
		loading="lazy"
	/>
	<div class="grow" />

	<a href="/{lang}/records/12893-12434-fsdf32-q32ef32">record</a>
	<a href="/{lang}/map-browser">map-browser</a>
	<a href="/{lang}/text-browser">text-browser</a>
	<a href={otherLangPathName + $page.url.search}>{otherLang}</a>
</nav>

<style>
	a {
		@apply p-2;
		@apply m-2;
		color: green;
	}
</style>
