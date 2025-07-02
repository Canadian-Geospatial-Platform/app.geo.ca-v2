<script lang="ts">
	import { navigating, page } from '$app/stores';
	import LoadingMask from '$lib/components/loading-mask/loading-mask.svelte';
	import Favourites from '$lib/components/favourites/favourites.svelte';

	const lang = $page.data.lang;
	const title = lang == 'fr-ca' ? 'app.geo.ca - Favoris' : 'app.geo.ca - Favourites';

	const canonicalUrl = $page.data.canonicalUrl;
	const alternateUrl = $page.data.alternateUrl;
	const alternateLang = $page.data.alternateLang;
	const metaDescription = $page.data.metaDescription;
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={metaDescription} />
	<link rel="canonical" href={canonicalUrl} />
	<link rel="alternate" hreflang={alternateLang} href={alternateUrl} />
</svelte:head>

{#if $navigating}
	<LoadingMask classes="fixed left-0 top-0 items-center" />
{/if}

<Favourites />
