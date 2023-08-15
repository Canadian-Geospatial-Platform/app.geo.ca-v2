<script lang="ts">
	import { slide } from 'svelte/transition';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	$: lang = $page.data.lang;
	$: otherLang = lang == 'en-ca' ? 'fr-ca' : 'en-ca';
	$: otherLangPathName = $page.url.pathname.replace(lang, otherLang);
</script>

<nav
	transition:slide
	class="flex flex-col lg:flex-row items-center lg:h-24 p-2 m-2 text-2xl bg-custom-1 rounded-lg"
>
	<img
		class="h-full"
		src="https://geo.ca/wp-content/uploads/2023/02/geo-ca-logo.svg"
		alt="GEO.CA logo, blue and green globe / Logo de GEO.CA, globe bleu et vert"
		decoding="async"
		loading="lazy"
	/>
	<div class="grow" />

	<a href="/{lang}/record/12893-12434-fsdf32-q32ef32">record</a>
	<a href="/{lang}/map-browser">map-browser</a>
	<a href={otherLangPathName + $page.url.search}>{otherLang}</a>
</nav>

<style>
	a {
		@apply p-2;
		@apply m-2;
		@apply text-custom-2;
	}
</style>
