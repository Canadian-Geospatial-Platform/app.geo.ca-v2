<script>
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import Organisation from './organisation.svelte';
	import Other from './other.svelte';
	import SpatioTemporal from './spatio-temporal.svelte';
	import Theme from './theme.svelte';
	import Type from './type.svelte';

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
	<br />
	<Organisation />
	<br />
	<Other />
	<br />
	<SpatioTemporal />
	<br />
	<Theme />
	<br />
	<Type />
	<br />
	<input bind:value={keyword} />
	<button type="submit"> Please save me! </button>
</form>
