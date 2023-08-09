<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	export let pageCount = 10;
	export let resultsPerPage = 10;
	$: current = $page.url.searchParams.get('page-number') || 0;

	function navigate(pageNumber) {
		let url = $page.url;
		url.searchParams.set('page-number', pageNumber);
		url.searchParams.set('results-per-page', resultsPerPage);
		goto(url, { invalidateAll: true });
	}
</script>

<div class="p-4 m-4 rounded-lg drop-shadow-lg bg-yellow-100 flex justify-center">
	{#each Array(pageCount) as _, i}
		<button
			on:click={() => {
				navigate(i);
			}}
			class="w-12 h-12 m-4 rounded-full drop-shadow-lg"
			class:bg-red-100={current == i}
			class:bg-blue-100={current != i}
		>
			<p class="align-bottom">{i + 1}</p>
		</button>
	{/each}
</div>
