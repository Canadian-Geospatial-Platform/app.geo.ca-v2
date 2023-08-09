<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	export let pageCount = 10;

	function navigate(pageNumber) {
		let url = $page.url;
		url.searchParams.set('min', pageNumber * 10 + 1);
		url.searchParams.set('max', pageNumber * 10 + 10);
		goto(url);
	}
</script>

<div class="p-4 m-4 rounded-lg drop-shadow-lg bg-yellow-100 flex justify-center">
	{#each Array(pageCount) as _, i}
		<button
			on:click|preventDefault={() => {
				navigate(i);
			}}
			class="w-12 h-12 m-4 bg-blue-100 rounded-full drop-shadow-lg"
		>
			<p class="align-bottom">{i + 1}</p>
		</button>
	{/each}
</div>
