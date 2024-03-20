<script lang="ts">
	import { tick } from 'svelte';
	import { afterNavigate } from '$app/navigation';
	import Map from '$lib/components/map/map.svelte';
	import { page } from '$app/stores';

	afterNavigate(async () => {
		try {
			await tick();
			cgpv.init();
		} catch (e) {
			console.warn('Error initialising cgpv.', e);
		}
	});
</script>

<h1 class="text-lg">{$page.data.t_title}</h1>
<Map id={$page.data.uuid} coordinates={$page.data.coordinates} />
