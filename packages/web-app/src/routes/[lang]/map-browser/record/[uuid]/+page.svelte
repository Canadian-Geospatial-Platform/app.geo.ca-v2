<script lang="ts">
	import { tick } from 'svelte';
	import { afterNavigate } from '$app/navigation';
	import Record from '$lib/components/record/record.svelte';
	import { page } from '$app/stores';

	// afterNavigate(async () => {
	// 	try {
	// 		await tick();
	// 		cgpv.init();
	// 	} catch (e) {
	// 		console.warn('Error initialising cgpv.', e);
	// 	}
	// });
	
	const properties = $page.data.item_v2.properties;
	const lang = $page.data.lang;
	const title = lang == 'fr-ca' ? properties.title.fr : properties.title.en;
	
	const canonicalUrl = $page.data.canonicalUrl;
	const alternateUrl = $page.data.alternateUrl;
	const alternateLang = $page.data.alternateLang;
    const metaDescription = $page.data.metaDescription;
</script>

<svelte:head>
  <title>{title}</title>
  <meta name="description" content={metaDescription} />
  <link rel="canonical" href={canonicalUrl} />
  <link rel="alternate" hreflang="{alternateLang}" href="{alternateUrl}" />
</svelte:head>

<Record data={$page.data} />
