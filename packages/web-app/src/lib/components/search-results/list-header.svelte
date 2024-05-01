<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	// This component is a header bar with search result information, ordering options and presentation options.
	$: total = $page.data.total;
	$: start = $page.data.start;
	$: end = $page.data.end;
	function handleValueChange(e) {
		let newUrl = $page.url;
		newUrl.searchParams.set('sort', e.target.value);
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
			<select class="cursor-pointer" on:change={handleValueChange}>
				<option value="date-desc" selected="selected">Date ↓</option>
				<option value="date-asc">Date ↑</option>
				<option value="popularity-desc">Popularity ↓</option>
				<option value="popularity-asc">Popularity ↑</option>
				<option value="title">title ↑</option>
			</select>
		</div>
	</form>
</div>

<style>
	select {
		background: none;
	}
</style>
