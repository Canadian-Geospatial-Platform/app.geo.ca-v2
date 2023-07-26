<script lang="ts">
	import { page } from '$app/stores';
	import { slide } from 'svelte/transition';
	let collapse = false;
	let types = ['API', 'Application', 'Collection', 'Communauté', 'Jeu de données', 'Service'];
	function init(key) {
		return $page.url.searchParams.get(key) == 'on';
	}

	function getId(key) {
		return 'filters-types-' + key.toLowerCase().replace(/\s/g, '-');
	}
</script>

<button on:click={() => (collapse = !collapse)}>Types</button>
{#if !collapse}
	<ul transition:slide>
		{#each types as x}
			<li>
				<input checked={init(getId(x))} type="checkbox" id={getId(x)} name={getId(x)} />
				<label for={getId(x)}>{x}</label>
			</li>
		{/each}
	</ul>
{/if}
