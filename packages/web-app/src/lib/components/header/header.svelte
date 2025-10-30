<script>
	import { page } from '$app/stores';
	import Navbarhorizontal from './navbarhorizontal.svelte';
	import Navbarvertical from './navbarvertical.svelte';
	import SignIn from '$lib/components/profile/sign-in.svelte';

	const translations = $page.data.headerTranslations;
	const lang = $page.data.lang;
	const logoAlt = translations?.logoAlt ? translations['logoAlt'] : '';
	const logoHref = lang == 'fr-ca' ? 'https://geo.ca/fr/accueil/' : 'https://geo.ca/home';
	const logoSrc = translations?.logoSrc ? translations['logoSrc'] : '';
</script>

<!-- Note: the z-index needs to be 10010 because the loading mask on the geoview maps are 9999 -->
<header
	class="sticky top-0 w-full h-20 px-5 md:px-0 border-b-4 border-custom-16 shadow-lg bg-custom-1 z-[10010]"
>
	<div class="grid grid-cols-2 gap-3 h-full content-width">
		<a href={logoHref} data-sveltekit-reload>
			<img class="object-contain max-h-20 shrink" src={logoSrc} alt={logoAlt} />
		</a>
		<div class="hidden lg:flex gap-2 justify-end text-lg font-custom-style-header-3">
			<Navbarhorizontal />
			<SignIn />
		</div>
		<div class="flex items-center gap-2 lg:hidden col-span-1 justify-end">
			<Navbarvertical class="justify-end text-lg font-custom-style-header-3" />
		</div>
	</div>
</header>
