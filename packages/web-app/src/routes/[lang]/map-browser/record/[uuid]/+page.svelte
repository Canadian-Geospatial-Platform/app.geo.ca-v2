<script lang="ts">
	import Record from '$lib/components/record/record.svelte';
	import { page } from '$app/stores';
</script>

<Record data={$page.data} />
