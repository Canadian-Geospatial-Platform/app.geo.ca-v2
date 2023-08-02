<script lang="ts">
	import { page } from '$app/stores';
	export let id;
	export let name;

	let value = $page.url.searchParams.get(id);
</script>

<label for={id}>{name}:</label>
<input {id} name={id} bind:value class="bg-yellow-100"/>
