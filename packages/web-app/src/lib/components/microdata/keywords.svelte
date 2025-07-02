<script lang="ts">
	let { item, lang } = $props();
</script>

{#each item.properties.keywords as k}
	<span property="keywords">{k[lang]}</span>
{/each}
