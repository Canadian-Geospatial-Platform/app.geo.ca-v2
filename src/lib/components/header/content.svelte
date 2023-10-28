<script lang="ts">
	import { slide } from 'svelte/transition';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import SignIn from './sign-in.svelte';
	import {locale} from '$lib/components/i18n/i18n';

	$: lang = $page.data.lang;
	$: otherLang = lang == 'en-ca' ? 'fr-ca' : 'en-ca';
	$: otherLangPathName = $page.url.pathname.replace(lang, otherLang);

	$: catalogText = lang == 'en-ca' ? 'catalog' : 'catalogue';
	$: favoritesText = lang == 'en-ca' ? 'favorites' : 'favoris';
	const changeLocale=(newLocale)=>{
		//console.log(newLocale)
		if(newLocale==='fr-ca'){
			locale.set('fr');
		}else{
			locale.set('en');
		}
	}
</script>

<a transition:slide class="a" href={'/' + lang + '/favorites'}>{favoritesText}</a>
<a transition:slide class="a" href={'/' + lang + '/map-browser'}>{catalogText}</a>
<a transition:slide class="a" href={otherLangPathName + $page.url.search} on:click={()=>changeLocale(otherLang)}>{otherLang}</a>
<SignIn />

<style>
	.a {
		@apply p-2;
		@apply m-2;
		@apply text-custom-2;
	}
</style>
