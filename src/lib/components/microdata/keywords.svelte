<script lang="ts">
	export let item;
	export let lang;
</script>

{#each item.properties.keywords as k}
	<span property="keywords">{k[lang]}</span>
{/each}
