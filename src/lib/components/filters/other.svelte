<script lang="ts">
	import { page } from '$app/stores';
	import { slide } from 'svelte/transition';
	let collapse = true;
	let others = ['Données de base du Canada'];
	function init(key) {
		return $page.url.searchParams.get(key) == 'on';
	}

	function getId(key) {
		return 'filters-others-' + key.toLowerCase().replace(/\s/g, '-');
	}
</script>

<button on:click={() => (collapse = !collapse)}>Other</button>
{#if !collapse}
	<ul transition:slide>
		{#each others as x}
			<li>
				<input checked={init(getId(x))} type="checkbox" id={getId(x)} name={getId(x)} />
				<label for={getId(x)}>{x}</label>
			</li>
		{/each}
	</ul>
{/if}
