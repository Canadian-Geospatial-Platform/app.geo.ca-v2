<script lang="ts">
	let { item } = $props();
</script>

{#each item.options as x}
	<span property="distribution" typeof="DataDownload">
		<span property="inLanguage" content="en,fr"></span>
		<span property="name" lang="en">{x.name.en}</span>
		<span property="name" lang="fr">{x.name.fr}</span>
		<span property="url">{x.url}</span>
	</span>
{/each}
