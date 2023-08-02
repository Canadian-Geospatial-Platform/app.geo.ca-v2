<script lang="ts">
	import { page } from '$app/stores';
	import { slide } from 'svelte/transition';
	import Checkbox from './inputs/checkbox.svelte';
	$: title = $page.data.lang == 'en-ca' ? 'Others' : 'Autres';
	let collapse = true;
	const others = [{ 'fr-ca': 'Données de base du Canada', 'en-ca': 'Foundation Data' }];

	function getId(key) {
		return 'others-' + key.toLowerCase();
	}
</script>

<button on:click|preventDefault={() => (collapse = !collapse)}>{title}</button>
{#if !collapse}
	<ul transition:slide>
		{#each others as x}
			<li>
				<Checkbox id={getId(x['en-ca'])} name={x[$page.data.lang]} />
			</li>
		{/each}
	</ul>
{/if}
