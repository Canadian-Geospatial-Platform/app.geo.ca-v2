<script lang="ts">
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
</script>

<h2 on:click={() => (collapse = !collapse)}>Themes</h2>
{#if collapse}
	<ul transition:slide>
		{#each themes as t}
			<li>
				<input type="checkbox" id="themes-filter-{t}" name="themes-filter-{t}" />
				<label for="themes-filter-{t}">{t}</label>
			</li>
		{/each}
	</ul>
{/if}
