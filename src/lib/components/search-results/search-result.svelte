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

<li class="bg-yellow-100 rounded-lg p-4 m-4 drop-shadow-lg">
	<h2 class="text-2xl">{title}</h2>
	<p>{organization}</p>
	<p>{date}</p>
	<br />
	<p class="overflow-hidden text-ellipsis h-48">{description}</p>
	<div class="flex p-2 m-2">
		<div class="grow" />
		<button class="button-1" on:click={emitViewFootprintEvent}>{footprint}</button>
		<a href={'records/' + id}><button class="button-1">{viewRecord}</button></a>
	</div>
</li>
