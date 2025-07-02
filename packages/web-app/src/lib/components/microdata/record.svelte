<script lang="ts">
	import { page } from '$app/stores';
	import Download from './download.svelte';
	import Organisations from './organisations.svelte';
	import Keywords from './keywords.svelte';
	let { item, lang } = $props();
</script>

<span property="name">{item.title}</span>
<span property="description">{item.description}</span>
<Organisations {item} {lang} />
<span
	property="temporalCoverage"
	value={item.temporalExtent.start + '/' + (item.temporalExtent.end ?? '..')}
></span>
<span property="genre">{item.type}</span>
<Keywords {item} {lang} />
<Download {item} />
