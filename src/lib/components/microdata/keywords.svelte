<script lang="ts">
	export let item;
	export let lang;
</script>

{#each item.features[0].properties.keywords as k}
	<span property="keywords">{k[lang]}</span>
{/each}
