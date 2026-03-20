<script lang="ts">
  import Download from './download.svelte';
  import Organisations from './organisations.svelte';
  import Keywords from './keywords.svelte';
  const { item, lang } = $props();
</script>

<span property="name">{item.title}</span>
<span property="description">{item.description}</span>
<Organisations {item} {lang} />
<span property="temporalCoverage">{item.temporalExtent.start + '/' + (item.temporalExtent.end ?? '..')}</span>
<span property="genre">{item.type}</span>
<Keywords {item} />
<Download {item} />
