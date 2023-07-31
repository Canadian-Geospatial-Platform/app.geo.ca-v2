<script lang="ts">
	import { goto } from '$app/navigation';
	export let title = 'title';
	export let organization = 'organization';
	export let date = 'date';
	export let description = 'description';
	export let id = 'xxx';
</script>

<li>
	{title}
	{organization}
	{date}
	{description}
	<button>VIEW FOOTPRINT</button>
	<a href={'records/' + id}>VIEW RECORD</a>
</li>
