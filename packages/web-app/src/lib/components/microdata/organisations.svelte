<script lang="ts">
  const { item, lang } = $props();
</script>

{#each item.distributor as distributor, index (index)}
  <span itemscope itemtype="http://schema.org/Organization">
    <span property="name">{distributor?.organisation?.[lang]}</span>
    <span property="email">{distributor?.email?.[lang]}</span>
  </span>
{/each}
