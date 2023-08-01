<script lang="ts">
	import { page } from '$app/stores';
	import { slide } from 'svelte/transition';
	import Checkbox from './inputs/checkbox.svelte';
	let collapse = true;
	let others = [{'fr-ca': 'Données de base du Canada', 'en-ca': 'Foundation Data'}];

	function getId(key) {
		return 'others-' + key.toLowerCase().replace(/\s/g, '-');
	}
</script>

<button on:click={() => (collapse = !collapse)}>Other</button>
{#if !collapse}
	<ul transition:slide>
		{#each others as x}
			<li>
				<Checkbox id={getId(x['en-ca'])} name={x['fr-ca']} />
			</li>
		{/each}
	</ul>
{/if}
