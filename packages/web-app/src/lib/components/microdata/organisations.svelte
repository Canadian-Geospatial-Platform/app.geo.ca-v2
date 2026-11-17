<script lang="ts">
  const { item, lang: contentLang } = $props();
</script>

{#each item.distributor as distributor, index (index)}
  <span itemscope itemtype="http://schema.org/Organization">
    <span property="name">{distributor?.organisation?.[contentLang]}</span>
    <span property="email">{distributor?.email?.[contentLang]}</span>
  </span>
{/each}
