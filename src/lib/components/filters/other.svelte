<script lang="ts">
	import { page } from '$app/stores';
	import { slide } from 'svelte/transition';
	import Checkbox from './inputs/checkbox.svelte';
	let collapse = true;
	let others = ['Données de base du Canada'];

	function getId(key) {
		return 'filters-others-' + key.toLowerCase().replace(/\s/g, '-');
	}
</script>

<button on:click={() => (collapse = !collapse)}>Other</button>
{#if !collapse}
	<ul transition:slide>
		{#each others as x}
			<li>
				<Checkbox id={getId(x)} name={x} />
			</li>
		{/each}
	</ul>
{/if}
