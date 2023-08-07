<script>
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { fade } from 'svelte/transition';
	import Organisation from './organisation.svelte';
	import Other from './other.svelte';
	import SpatioTemporal from './spatio-temporal.svelte';
	import Theme from './theme.svelte';
	import Type from './type.svelte';
	import Text from './inputs/text.svelte';
	$: title = $page.data.lang == 'en-ca' ? 'filters' : 'filtres';
	$: search = $page.data.lang == 'en-ca' ? 'Search' : 'Rechercher';
	let collapse = true;
	$: icon = collapse ? 'X' : '|||';
	function update() {
		let query = new URLSearchParams($page.url.searchParams.toString());
		query.set('keywords', keyword);
		let opts = {
			replaceState: true,
			keepfocus: true
		};
		goto(`?${query.toString()}`, opts);
	}
</script>

<div class="p-4">
	<button
		class="button-1 m-2 p-2"
		on:click={() => {
			collapse = !collapse;
			console.log(collapse);
		}}>{icon}</button
	>
	{#if collapse}
		<form data-sveltekit-noscroll transition:fade>
			<br />
			<Text id="search-terms" name={search} />
			<button type="submit"> {search} </button>
			<br />
			<h2>{title}</h2>
			<Organisation />
			<br />
			<Other />
			<br />
			<SpatioTemporal />
			<br />
			<Theme />
			<br />
			<Type />
		</form>
	{/if}
</div>
