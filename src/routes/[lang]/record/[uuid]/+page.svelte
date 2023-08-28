<script>
	import MicroData from '$lib/components/microdata/microdata.svelte';
	export let data;
</script>

<MicroData />
<h1>This page will display a detailed view of a specific result.</h1>
<p>The UUID of the result currently searched for is: {data.uuid}.</p>
<p>The language: {data.lang}.</p>
