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
	$: keywords = $page.data.lang == 'en-ca' ? 'Keywords' : 'Mots-clés';
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

<div class="p-4 m-4 w-full lg:w-auto bg-orange-100 rounded-lg drop-shadow-lg">
	<button
		class="button-1 m-2 p-2"
		on:click={() => {
			collapse = !collapse;
			console.log(collapse);
		}}>{icon}</button
	>
	{#if collapse}
		<form data-sveltekit-noscroll transition:fade>
			<div class="flex flex-col text-2xl">
				<div class="p-1 m-1 text-2xl">
					<Text id="search-terms" name={keywords} />
				</div>
				<h2 class="p-2 m-2">{title}</h2>
				<div class="p-2 mx-2 text-xl"><Organisation /></div>
				<div class="p-2 mx-2 text-xl"><Other /></div>
				<div class="p-2 mx-2 text-xl"><SpatioTemporal /></div>
				<div class="p-2 mx-2 text-xl"><Theme /></div>
				<div class="p-2 mx-2 text-xl"><Type /></div>
				<button type="submit" class="p-2 m-2 button-1"> {search} </button>
			</div>
		</form>
	{/if}
</div>
