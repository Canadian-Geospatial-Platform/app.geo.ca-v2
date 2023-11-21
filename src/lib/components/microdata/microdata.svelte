<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import Catalog from './catalog.svelte';
	import Record from './record.svelte';

	export let item;
	$: lang = $page.data.lang == 'en-ca' ? 'en' : 'fr';
</script>

<div vocab="http://schema.org/" typeof="Dataset" class="hidden">
	<Record {item} {lang} />
	<Catalog {item} {lang} />
</div>
