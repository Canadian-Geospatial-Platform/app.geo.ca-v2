<script lang="ts">
  const { item } = $props();
</script>

{#each item.keywords as keyword, index (index)}
  <span property="keywords">{keyword}</span>
{/each}
