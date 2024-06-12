<script>
  import { page } from '$app/stores';
  import Navbarhorizontal from './navbarhorizontal.svelte';
  import Navbarvertical from './navbarvertical.svelte';

  const translations = $page.data.headerTranslations;
  const logoAlt = Object.hasOwn(translations,"logoAlt") ? translations["logoAlt"] : "";
  const logoHref = Object.hasOwn(translations,"logoHref") ? translations["logoHref"] : "";
  const logoSrc = Object.hasOwn(translations,"logoSrc") ? translations["logoSrc"] : "";
</script>

<div class="fixed w-full h-20 border-b-4 border-custom-16 bg-custom-1 z-10">
  <div class="grid grid-cols-2 h-full md:grid-cols-6 content-width mx-auto">
    <a href={logoHref} data-sveltekit-reload class="grid">
      <img 
        class="w-36 self-center"
        src= {logoSrc}
        alt= {logoAlt}
      />
    </a>

    <div class="hidden lg:flex col-span-5 justify-end font-custom-style-header-3">
      <Navbarhorizontal />
    </div>
    <div class="flex lg:hidden col-span-1 md:col-span-5 justify-end font-custom-style-header-3">
      <Navbarvertical />
    </div>

  </div>
</div>

<style></style>