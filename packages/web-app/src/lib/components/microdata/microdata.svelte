<script lang="ts">
	import { page } from '$app/stores';
	import Catalog from './catalog.svelte';
	import Record from './record.svelte';

	let { item } = $props();
	let lang = $derived($page.data.lang == 'en-ca' ? 'en' : 'fr');
</script>

{#if item}
	<div vocab="http://schema.org/" typeof="Dataset" class="hidden">
		<Record {item} {lang} />
		<Catalog {item} {lang} />
	</div>
{/if}
