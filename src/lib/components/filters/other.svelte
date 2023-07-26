<script lang="ts">
	import { slide } from 'svelte/transition';
	let collapse = false;
	let others = ['Données de base du Canada'];
</script>

<h2 on:click={() => (collapse = !collapse)}>Other</h2>
{#if collapse}
	<ul transition:slide>
		{#each others as o}
			<li>
				<input type="checkbox" id="others-filter-{o}" name="others-filter-{o}" />
				<label for="others-filter-{o}">{o}</label>
			</li>
		{/each}
	</ul>
{/if}
