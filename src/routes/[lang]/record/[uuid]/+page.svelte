<script lang="ts">
	import  Record  from '$lib/components/record/record.svelte';
	import { page } from '$app/stores';
	//export let data;
	
</script>

<Record data={$page.data} />