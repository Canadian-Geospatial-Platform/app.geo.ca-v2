<script lang="ts">
	import { page } from '$app/stores';
	import Download from './download.svelte';
	import Organisations from './organisations.svelte';
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
<span property="genre">Information and Communications</span>
<span property="keywords">analytics</span>
<span property="keywords">metrics</span>
<span property="sameAs" value="/data/en/dataset/2916fad5-ebcc-4c86-b0f3-4f619b29f412" />
{#each item.features[0].properties.options as option}
	<Download {option} />
{/each}
