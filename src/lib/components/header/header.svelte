<script lang="ts">
	import Content from './content.svelte';
	let collapse = true;
	$: icon = collapse ? '|||' : 'X';
</script>

<div class="lg:hidden text-right m-4">
	<button
		class="button-1"
		on:click={() => {
			collapse = !collapse;
		}}>{icon}</button
	>
	{#if !collapse}
		<Content />
	{/if}
</div>
<div class="collapse lg:visible">
	<Content />
</div>
