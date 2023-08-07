<script lang="ts">
	import Content from './content.svelte';
	let collapse = true;
</script>

<div class="lg:hidden">
	{#if !collapse}
		<button
			class="button-1"
			on:click={() => {
				collapse = !collapse;
			}}>X</button
		>
		<Content />
	{:else}
		<button
			class="button-1"
			on:click={() => {
				collapse = !collapse;
			}}>|||</button
		>
	{/if}
</div>
<div class="collapse lg:visible">
	<Content />
</div>
