<script lang="ts">
	import Content from './content.svelte';
	let collapse = true;
	$: icon = collapse ? '|||' : 'X';
</script>

<nav class="flex place-items-center p-2 m-2 text-2xl bg-custom-1 rounded-lg">
	<img
		class="h-24 object-scale shrink mr-auto"
		src="https://geo.ca/wp-content/uploads/2023/02/geo-ca-logo.svg"
		alt="GEO.CA logo, blue and green globe / Logo de GEO.CA, globe bleu et vert"
		decoding="async"
		loading="lazy"
	/>
	<div class="text-right flex flex-col">
		<button
			class="button-1 ml-auto lg:hidden m-4"
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
</nav>
