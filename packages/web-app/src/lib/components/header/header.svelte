<script>
  import { page } from '$app/stores';
  import Navbarhorizontal from './navbarhorizontal.svelte';
  import Navbarvertical from './navbarvertical.svelte';

  const translations = $page.data.headerTranslations;
  const lang = $page.data.lang;
  const logoAlt = translations?.logoAlt ? translations["logoAlt"] : "";
  const logoHref = lang == 'fr-ca' ? 'https://geo.ca/fr/accueil/' : 'https://geo.ca/home';
  const logoSrc = translations?.logoSrc ? translations["logoSrc"] : "";
</script>

<!-- Note: the z-index needs to be 100010 because the loading mask on the geoview maps are 99999 -->
<div class="sticky top-0 w-full h-20 px-5 md:px-0 border-b-4 border-custom-16 shadow-lg bg-custom-1 z-[100010]">
  <div class="grid grid-cols-2 h-full md:grid-cols-6 content-width">
    <a href={logoHref} data-sveltekit-reload class="relative grid">
      <img 
        class="absolute w-36 -left-3 self-center"
        src= {logoSrc}
        alt= {logoAlt}
      />
    </a>

    <div class="hidden lg:flex col-span-5 justify-end text-base 2xl:text-lg font-custom-style-header-3 ">
      <Navbarhorizontal />
    </div>
    <div class="flex lg:hidden col-span-1 md:col-span-5 justify-end text-lg font-custom-style-header-3">
      <Navbarvertical />
    </div>

  </div>
</div>

<style></style>