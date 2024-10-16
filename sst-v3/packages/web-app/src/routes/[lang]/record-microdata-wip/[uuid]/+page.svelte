<script>
	import MicroData from '$lib/components/microdata/microdata.svelte';
	import { page } from '$app/stores';
</script>

<MicroData item={$page.data.item_v2} />
<h1>This page will display a detailed view of a specific result.</h1>
<p>The UUID of the result currently searched for is: {$page.data.uuid}.</p>
<p>The language: {$page.data.lang}.</p>
