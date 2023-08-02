<script lang="ts">
	import { page } from '$app/stores';
	import { slide } from 'svelte/transition';
	import Checkbox from './inputs/checkbox.svelte';

	$: title = $page.data.lang == 'en-ca' ? 'Themes' : 'Thèmes';
	let collapse = true;

	const themes = [
		{ 'fr-ca': 'Administration', 'en-ca': 'Administration' },
		{ 'fr-ca': 'Économie', 'en-ca': 'Economy' },
		{ 'fr-ca': 'Environnement', 'en-ca': 'Environment' },
		{ 'fr-ca': 'Imagerie', 'en-ca': 'Imagery' },
		{ 'fr-ca': 'Infrastructure', 'en-ca': 'Infrastructure' },
		{ 'fr-ca': 'Science', 'en-ca': 'Science' },
		{ 'fr-ca': 'Société', 'en-ca': 'Society' },
		{ 'fr-ca': 'Urgences', 'en-ca': 'Emergency' },
		{ 'fr-ca': 'Renseignements juridiques', 'en-ca': 'Legal' }
	];

	function init(key) {
		return $page.url.searchParams.get(key) == 'on';
	}

	function getId(key) {
		return 'themes-' + key.toLowerCase();
	}
</script>

<button on:click|preventDefault={() => (collapse = !collapse)}>{title}</button>
{#if !collapse}
	<ul transition:slide>
		{#each themes as x}
			<li>
				<Checkbox id={getId(x['en-ca'])} name={x[$page.data.lang]} />
			</li>
		{/each}
	</ul>
{/if}
