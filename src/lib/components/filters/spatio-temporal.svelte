<script lang="ts">
	import { page } from '$app/stores';
	import { slide } from 'svelte/transition';
	import Temporal from './inputs/temporal.svelte';

	let collapse = false;

	function getId(key) {
		return 'filters-types-' + key.toLowerCase().replace(/\s/g, '-');
	}
</script>

<button on:click={() => (collapse = !collapse)}>Spatio-temporal</button>
{#if !collapse}
	<ul transition:slide>
		<li><Temporal id={getId('start')} name="Start date" /></li>
		<li><Temporal id={getId('end')} name="End date" /></li>
	</ul>
{/if}
