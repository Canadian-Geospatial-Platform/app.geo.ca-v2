<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import Catalog from './catalog.svelte';
	import Record from './record.svelte';
	import item from './sample-item.json';

	$: lang = $page.data.lang == 'en-ca' ? 'en' : 'fr';

	onMount(() => {
		console.log(item);
	});
	// todo: add catalog metadata
</script>

<div vocab="http://schema.org/" typeof="Dataset">
	<Record {item} {lang} />
</div>
