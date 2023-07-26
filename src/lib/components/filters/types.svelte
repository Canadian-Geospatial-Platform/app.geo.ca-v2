<script lang="ts">
	import { slide } from 'svelte/transition';
	let collapse = false;
	let types = ['API', 'Application', 'Collection', 'Communauté', 'Jeu de données', 'Service'];
</script>

<h2 on:click={() => (collapse = !collapse)}>Types</h2>
{#if collapse}
	<ul transition:slide>
		{#each types as t}
			<li>
				<input type="checkbox" id="types-filter-{t}" name="types-filter-{t}" />
				<label for="types-filter-{t}">{t}</label>
			</li>
		{/each}
	</ul>
{/if}
