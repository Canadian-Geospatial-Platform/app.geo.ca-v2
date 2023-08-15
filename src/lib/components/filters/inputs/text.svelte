<script lang="ts">
	import { page } from '$app/stores';
	export let id;
	export let name;
	export let label = true;

	let value = $page.url.searchParams.get(id);
</script>

{#if label}
	<label for={id}>{name}:</label>
{/if}
<input {id} name={id} bind:value />
