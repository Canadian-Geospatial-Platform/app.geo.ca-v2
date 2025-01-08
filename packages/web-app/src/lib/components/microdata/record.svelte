<script lang="ts">
  import { page } from '$app/stores';
  import Download from './download.svelte';
  import Organisations from './organisations.svelte';
  import Keywords from './keywords.svelte';
  let { item, lang } = $props();
</script>

<span property="name">{item.properties.title[lang]}</span>
<span property="description">{item.properties.description[lang]}</span>
<Organisations {item} {lang} />
<span
  property="temporalCoverage"
  value={item.properties.extent.temporalExtent.start +
    '/' +
    (item.properties.extent.temporalExtent.end ?? '..')}
></span>
<span property="genre">{item.properties.type[lang]}</span>
<Keywords {item} {lang} />
<Download {item} />
