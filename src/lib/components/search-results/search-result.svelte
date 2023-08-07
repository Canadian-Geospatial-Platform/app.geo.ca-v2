<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { createEventDispatcher } from 'svelte';

	$: footprint = $page.data.lang == 'en-ca' ? 'VIEW FOOTPRINT' : "AFFICHER L'EMPREINTE";
	$: viewRecord = $page.data.lang == 'en-ca' ? 'VIEW RECORD' : "AFFICHER L'ENREGISTREMENT";

	const dispatch = createEventDispatcher();

	export let title = 'title';
	export let organization = 'organization';
	export let date = 'date';
	export let description = 'description';
	export let id = 'xxx';

	function emitViewFootprintEvent() {
		dispatch('viewFootPrintEvent', { id: id });
	}
</script>

<li>
	{title}
	{organization}
	{date}
	{description}
	<button class="button-1" on:click={emitViewFootprintEvent}>{footprint}</button>
	<a href={'records/' + id}><button class="button-1">{viewRecord}</button></a>
</li>
