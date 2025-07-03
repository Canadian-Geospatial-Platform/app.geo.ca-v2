<script lang="ts">
	import { navigating, page } from '$app/stores';
	import { onMount, tick } from 'svelte';
	import LoadingMask from '$lib/components/loading-mask/loading-mask.svelte';
	import MapCart from '$lib/components/mapcart/mapcart.svelte';

	const lang = $page.data.lang;
	const title = lang == 'fr-ca' ? 'app.geo.ca - Panier de cartes' : 'app.geo.ca - Map Cart';

	const canonicalUrl = $page.data.canonicalUrl;
	const alternateUrl = $page.data.alternateUrl;
	const alternateLang = $page.data.alternateLang;
	const metaDescription = $page.data.metaDescription;

	onMount(async () => {
		try {
			await tick();
			cgpv.init();
		} catch (e) {
			console.warn('Error initialising cgpv.', e);
		}
	});
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={metaDescription} />
	<link rel="canonical" href={canonicalUrl} />
	<link rel="alternate" hreflang={alternateLang} href={alternateUrl} />
	<script src="https://canadian-geospatial-platform.github.io/geoview/public/cgpv-main.js"></script>
</svelte:head>

{#if $navigating}
	<LoadingMask classes="fixed left-0 top-0 items-center" />
{/if}

<MapCart />
