<script lang="ts">
	import { afterNavigate } from '$app/navigation';
	import Record from '$lib/components/record/record.svelte';
	import { page } from '$app/stores';

	const lang = $page.data.lang;
	const canonicalUrl = $page.data.canonicalUrl;
	const alternateUrl = $page.data.alternateUrl;
	const alternateLang = $page.data.alternateLang;
	const metaDescription = $page.data.metaDescription;
</script>

<svelte:head>
	<title>{$page.data.item_v2.title}</title>
	<meta name="description" content={metaDescription} />
	<link rel="canonical" href={canonicalUrl} />
	<link rel="alternate" hreflang={alternateLang} href={alternateUrl} />
</svelte:head>

<Record data={$page.data} />
