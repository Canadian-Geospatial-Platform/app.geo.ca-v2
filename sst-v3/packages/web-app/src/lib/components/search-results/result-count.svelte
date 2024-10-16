<script lang="ts">
	import { page } from '$app/stores';
	$: total = $page.data.total;
	$: start = $page.data.start;
	$: end = $page.data.end;
</script>

<p class="grow my-auto">
	{#if total > 0}
		{start + 1} - {end > total ? total : end} of {total} datasets
	{:else}
		0 - 0 of 0 datasets
	{/if}
</p>
