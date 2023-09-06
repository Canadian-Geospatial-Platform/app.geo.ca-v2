<script lang="ts">
	import { page } from '$app/stores';
	import Download from './download.svelte';
	import Organisations from './organisations.svelte';
	import Keywords from './keywords.svelte';
	export let item;
	export let lang;
</script>

<span property="name">{item.features[0].properties.title[lang]}</span>
<span property="description">{item.features[0].properties.description[lang]}</span>
<Organisations {item} {lang} />
<span
	property="temporalCoverage"
	value={item.features[0].properties.extent.temporalExtent.start +
		'/' +
		(item.features[0].properties.extent.temporalExtent.end ?? '..')}
/>
<span property="genre">{item.features[0].properties.type[lang]}</span>
<Keywords {item} {lang}/>
{#each item.features[0].properties.options as option}
	<Download {option} />
{/each}
