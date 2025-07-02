<script lang="ts">
	import { page } from '$app/stores';

	const translations = $page.data.t;
	const keywordsText = translations?.keywords ? translations['keywords'] : 'Related keywords';

	const url = $page.url;
	const data = $page.data;
	const lang = data.lang;
	const shortLang = lang.slice(0, 2);
	const items = data.item_v2;
	const keywords = items['keywords'].split(',');
	const mapBrowserUrl = url.origin + '/' + lang + '/map-browser';
	const searchUrl = mapBrowserUrl + '?search-terms=';
</script>

<div class="font-custom-style-body-1">
	<h2 class="font-custom-style-h2 mb-5 mx-5 md:mx-0">
		{keywordsText}
	</h2>
	<p class="mx-5 md:mx-0 space-y-2">
		{#each keywords as keyword, i}
			<a
				class="font-custom-style-body-2 block sm:inline"
				href={searchUrl + encodeURI(keyword.toLowerCase().replaceAll(' ', '+'))}
			>
				{keyword.toLowerCase()}
			</a><span class="hidden sm:inline">{i < keywords.length - 1 ? ', ' : ''}</span>
		{/each}
	</p>
</div>
