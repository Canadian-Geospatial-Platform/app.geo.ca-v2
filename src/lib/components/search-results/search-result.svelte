<script lang="ts">
	import { goto } from '$app/navigation';
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	export let title = 'title';
	export let organization = 'organization';
	export let date = 'date';
	export let description = 'description';
	export let id = 'xxx';

	function emitViewFootprintEvent() {
		console.log('emiting..');
		dispatch('viewFootPrintEvent', { id: id });
	}
</script>

<li>
	{title}
	{organization}
	{date}
	{description}
	<button on:click={emitViewFootprintEvent}>VIEW FOOTPRINT</button>
	<a href={'records/' + id}>VIEW RECORD</a>
</li>
