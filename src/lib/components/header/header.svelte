<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	let lang = $page.data.lang;
	$: otherLang = lang == 'en-ca' ? 'fr-ca' : 'en-ca';
	$: otherLangPathName = $page.url.pathname.replace(lang, otherLang);
	function switchLang() {
		goto(otherLangPathName)
		lang = otherLang;
	}
</script>

<nav>
	<a href="/{lang}/records/12893-12434-fsdf32-q32ef32">record</a>
	<a href="/{lang}/map-browser">map-browser</a>
	<a href="/{lang}/text-browser">text-browser</a>
	<a href={otherLangPathName} on:click|preventDefault={switchLang}>{otherLang}</a>
</nav>
