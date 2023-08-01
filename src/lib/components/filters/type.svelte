<script lang="ts">
	import { page } from '$app/stores';
	import { slide } from 'svelte/transition';
	import Checkbox from './inputs/checkbox.svelte';

	let collapse = true;

	const types = [
		{ 'fr-ca': 'API', 'en-ca': 'API' },
		{ 'fr-ca': 'Application', 'en-ca': 'Application' },
		{ 'fr-ca': 'Collection', 'en-ca': 'Collection' },
		{ 'fr-ca': 'Communauté', 'en-ca': 'Community' },
		{ 'fr-ca': 'Jeu de données', 'en-ca': 'Dataset' },
		{ 'fr-ca': 'Service', 'en-ca': 'Service' }
	];

	function init(key) {
		return $page.url.searchParams.get(key) == 'on';
	}

	function getId(key) {
		return 'types-' + key.toLowerCase().replace(/\s/g, '-');
	}
</script>

<button on:click={() => (collapse = !collapse)}>Types</button>
{#if !collapse}
	<ul transition:slide>
		{#each types as x}
			<li>
				<Checkbox id={getId(x['en-ca'])} name={x[$page.data.lang]} />
			</li>
		{/each}
	</ul>
{/if}
