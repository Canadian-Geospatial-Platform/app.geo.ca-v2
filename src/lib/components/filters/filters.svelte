<script>
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import Organisation from './organisation.svelte';
	import Other from './other.svelte';
	import SpatioTemporal from './spatio-temporal.svelte';
	import Theme from './theme.svelte';
	import Type from './type.svelte';
	import Text from './inputs/text.svelte';
	const title = $page.data.lang == 'en-ca' ? 'filters' : 'filtres';
	const search = $page.data.lang == 'en-ca' ? 'Search' : 'Rechercher';
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

<form data-sveltekit-noscroll>
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
