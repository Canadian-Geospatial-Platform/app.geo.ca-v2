<script>
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import Organisations from './organisations.svelte';
	import Other from './other.svelte';
	import SpatioTemporal from './spatio-temporal.svelte';
	import Themes from './themes.svelte';
	import Types from './types.svelte';

	let keyword = $page.url.searchParams.get('keyword');

	function update(event) {
		console.log(event);
		let query = new URLSearchParams($page.url.searchParams.toString());
		query.set('keywords', keyword);
		let opts = {
			replaceState: true,
			keepfocus: true
		};
		goto(`?${query.toString()}`, opts);
	}
</script>

<form>
	<Organisations />
	<Other />
	<SpatioTemporal />
	<Themes />
	<Types />
	<input bind:value={keyword} />
	<button type="submit"> Please save me! </button>
</form>
