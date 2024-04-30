<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	// This component is a header bar with search result information, ordering options and presentation options.
	let total = 0; // the total number of search results
	let start = 0; // the offset of search results
	let end = 0; // the limit of search results

	let selectedValue = 'Relevance';

	$: selectedValue && handleValueChange();

	function handleValueChange() {
		let newUrl = $page.url;
		newUrl.searchParams.set('sort', selectedValue);
		goto(newUrl);
	}
</script>

<div class="flex flex-row gap-3">
	<p class="grow my-auto">
		{start} - {end} of {total} datasets
	</p>
	<form>
		<div class="button-2">
			Sort By -
			<select bind:value={selectedValue}>
				<option>Popularity</option>
				<option>Alphabetical</option>
				<option>Relevance</option>
			</select>
		</div>
	</form>

	<button class="button-1"> Show Map </button>
</div>

<style>
	select {
		background: none;
	}
</style>
