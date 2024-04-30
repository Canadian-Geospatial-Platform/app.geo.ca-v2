<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	let pageCount = 10;
	export let resultsPerPage = 10;
	$: current = parseInt($page.url.searchParams.get('page-number')) || 0;
	$: numberArray = calculateScreenSize(current);

	function calculateScreenSize(current) {
		let ret = [
			current - 3,
			current - 2,
			current - 1,
			current,
			current + 1,
			current + 2,
			current + 3
		];
		if (ret[0] < 0) {
			ret = ret.map((x) => x + ret[0] * -1);
		}
		return ret;
	}

	function navigate(pageNumber) {
		let url = $page.url;
		url.searchParams.set('page-number', pageNumber);
		url.searchParams.set('results-per-page', resultsPerPage);
		goto(url, { invalidateAll: true });
	}
</script>

<div
	class="p-4 rounded-lg drop-shadow-lg bg-custom-5 flex justify-center flex-nowrap overflow-hidden xl:flex"
>
	{#each numberArray as x}
		<button
			on:click={() => {
				navigate(x);
			}}
			class="w-12 h-12 m-4 rounded-full drop-shadow-lg"
			class:bg-custom-8={current == x}
			class:text-custom-1={current == x}
			class:bg-custom-1={current != x}
			class:hidden={x > current + 1 || x < current - 1}
			class:sm:block={x == current + 2 || x == current - 2}
			class:md:block={x >= current + 3 || x <= current - 3}
		>
			<p class="align-bottom">{x + 1}</p>
		</button>
	{/each}
</div>
