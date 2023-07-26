<script lang="ts">
	import { page } from '$app/stores';
	import { slide } from 'svelte/transition';
	let collapse = false;
	let themes = [
		'Administration',
		'Économie',
		'Environnement',
		'Imagerie',
		'Infrastructure',
		'Renseignements juridiques',
		'Science',
		'Société',
		'Urgences'
	];
	function init(key) {
		return $page.url.searchParams.get(key) == 'on';
	}

	function getId(key) {
		return 'filters-themes-' + key.toLowerCase().replace(/\s/g, '-');
	}
</script>

<button on:click={() => (collapse = !collapse)}>Themes</button>
{#if !collapse}
	<ul transition:slide>
		{#each themes as x}
			<li>
				<input checked={init(getId(x))} type="checkbox" id={getId(x)} name={getId(x)} />
				<label for={getId(x)}>{x}</label>
			</li>
		{/each}
	</ul>
{/if}
