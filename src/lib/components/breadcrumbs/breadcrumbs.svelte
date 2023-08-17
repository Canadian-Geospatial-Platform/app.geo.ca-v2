<script lang="ts">
	import { page } from '$app/stores';
	$: geoCaUrl =
		$page.data.lang == 'en-ca' ? 'https://www.geo.ca/home' : 'https://geo.ca/fr/accueil/index.html';
	$: appGeoCaUrl = '/' + $page.data.lang + '/map-browser';
</script>

<ol class="p-2 m-2 flex flex-wrap gap-2 text-custom-8">
	<li><a href={geoCaUrl}>geo.ca</a></li>
	<li>⯈ <a href={appGeoCaUrl}>app.geo.ca</a></li>
	<li>⯈ <span class="text-custom-4">{$page.data.t_title}</span></li>
</ol>

<style>
	a {
		@apply underline;
	}
</style>
