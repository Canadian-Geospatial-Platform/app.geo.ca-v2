<script lang="ts">
	import { page } from '$app/stores';
	import Download from './download.svelte';
	import Organisations from './organisations.svelte';
	export let item;
	export let lang;
</script>

<span property="name">{item['title_' + lang]}</span>
<span property="description">{item.description}</span>
<Organisations {item} {lang} />
<span property="temporalCoverage" value={item.temporalExtent.begin + '/' + (item.temporalExtent.end ?? '..')} />
<span property="genre">Information and Communications</span>
<span property="keywords">analytics</span>
<span property="keywords">metrics</span>
<span property="sameAs" value="/data/en/dataset/2916fad5-ebcc-4c86-b0f3-4f619b29f412" />
{#each item.options as option}
	<Download {option} />
{/each}
