<script lang="ts">
  const { item } = $props();
</script>

{#each item.keywords as k}
  <span property="keywords">{k}</span>
{/each}
