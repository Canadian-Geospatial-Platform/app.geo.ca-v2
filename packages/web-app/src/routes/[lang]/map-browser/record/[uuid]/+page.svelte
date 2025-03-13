<script lang="ts">
	import { tick } from 'svelte';
	import { afterNavigate } from '$app/navigation';
	import Record from '$lib/components/record/record.svelte';
	import { page } from '$app/stores';

	afterNavigate(async () => {
		try {
			await tick();
			cgpv.init();
		} catch (e) {
			console.warn('Error initialising cgpv.', e);
		}
	});
	
	const properties = $page.data.item_v2.properties;
	const lang = $page.data.lang;
	const title = lang == 'fr-ca' ? properties.title.fr : properties.title.en;
</script>

<svelte:head>
  <title>{title}</title>
</svelte:head>

<Record data={$page.data} />
