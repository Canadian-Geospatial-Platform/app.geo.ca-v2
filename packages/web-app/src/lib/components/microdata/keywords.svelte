<script lang="ts">
	let { item, lang } = $props();
</script>

{#each item.keywords as k}
	<span property="keywords">{k}</span>
{/each}
