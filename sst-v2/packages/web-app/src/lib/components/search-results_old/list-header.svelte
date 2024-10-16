<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import ResultCount from './result-count.svelte';
	// This component is a header bar with search result information, ordering options and presentation options.
	function handleValueChange(e) {
		let newUrl = $page.url;
		newUrl.searchParams.set('sort', e.target.value);
		goto(newUrl);
	}
</script>

<div class="flex flex-row gap-3">
	<ResultCount />
	<form>
		<div class="select-button">
			<span class="text-slate-600">{$page.data.t_sortBy} -</span>
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
