<script lang="ts">
	import { page } from '$app/stores';
	$: total = $page.data.total;
	$: start = $page.data.start;
	$: end = $page.data.end;
</script>

<p class="grow my-auto">
	{start} - {end} of {total} datasets
</p>
