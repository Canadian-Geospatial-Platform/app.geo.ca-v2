<script lang="ts">
	import { page } from '$app/stores';
	import { slide } from 'svelte/transition';
	import { typeCollapse, type } from './store.ts';
	import Checkbox from './inputs/checkbox.svelte';

	$: title = $page.data.lang == 'en-ca' ? 'Type' : 'Autres';
	let collapse = true;

	type.subscribe((value) => {
		collapse = value;
	});

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
		return 'types-' + key.toLowerCase();
	}

	function toggleCollapse() {
		type.update((x) => (x = !x));
	}
</script>

<button on:click|preventDefault={typeCollapse}>{title}</button>
{#if !collapse}
	<ul transition:slide>
		{#each types as x}
			<li>
				<Checkbox id={getId(x['en-ca'])} name={x[$page.data.lang]} />
			</li>
		{/each}
	</ul>
{/if}
