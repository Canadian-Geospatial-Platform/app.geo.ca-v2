<script>
  import { page } from '$app/state';
  import { pickByLanguage } from '$lib/utils/language';
  import Navbarhorizontal from './navbarhorizontal.svelte';
  import Navbarvertical from './navbarvertical.svelte';
  import SignIn from '$lib/components/profile/sign-in.svelte';

  const translations = page.data.headerTranslations;
  const lang = page.data.lang;
  const logoAlt = translations?.logoAlt ? translations['logoAlt'] : '';
  const logoHref = pickByLanguage(lang, 'https://geo.ca/home', 'https://geo.ca/fr/accueil/');
  const logoSrc = translations?.logoSrc ? translations['logoSrc'] : '';
</script>

<!-- Note: the z-index needs to be 10010 because the loading mask on the geoview maps are 9999 -->
<header class="sticky top-0 w-full h-20 px-5 md:px-0 border-b-4 border-custom-16 shadow-lg bg-custom-1 z-10010">
  <div class="grid grid-cols-2 h-full xl:grid-cols-6 content-width">
    <a href={logoHref} data-sveltekit-reload class="relative grid" rel="external">
      <img class="absolute w-36 -left-3 self-center" src={logoSrc} alt={logoAlt} />
    </a>

    <div class="hidden xl:flex col-span-5 justify-end text-lg font-custom-style-header-3">
      <Navbarhorizontal />
      <SignIn />
    </div>
    <div class="flex xl:hidden col-span-1 xl:col-span-5 justify-end text-lg font-custom-style-header-3">
      <Navbarvertical />
    </div>
  </div>
</header>
