<script lang="ts">
  const { item } = $props();
</script>

{#each item.options as option, index (index)}
  <span property="distribution" typeof="DataDownload">
    <span property="inLanguage">en,fr</span>
    <span property="name" lang="en">{option.name.en}</span>
    <span property="name" lang="fr">{option.name.fr}</span>
    <span property="url">{option.url}</span>
  </span>
{/each}
