<script lang="ts">
	import { page } from '$app/stores';
	import { slide } from 'svelte/transition';
	import { spatioTemporalCollapse, spatioTemporal } from './store.ts';
	import Temporal from './inputs/temporal.svelte';

	$: title = $page.data.lang == 'en-ca' ? 'Spatiotemporal' : 'Spatio temporelle';
	let collapse = true;

	spatioTemporal.subscribe((value) => {
		collapse = value;
	});

	const spatioTemporalFilters = [
		{ 'fr-ca': 'Date de début', 'en-ca': 'Start date' },
		{ 'fr-ca': 'Date de fin', 'en-ca': 'End date' }
	];

	function getId(key) {
		return 'spatio-temporal-' + key.toLowerCase().replace(/\s/g, '-');
	}
</script>

<button on:click|preventDefault={spatioTemporalCollapse}>{title}</button>
{#if !collapse}
	<ul transition:slide>
		<li><Temporal id={getId('start')} name={spatioTemporalFilters[0][$page.data.lang]} /></li>
		<li><Temporal id={getId('end')} name={spatioTemporalFilters[1][$page.data.lang]} /></li>
	</ul>
{/if}
