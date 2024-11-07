<script>
  import { page } from '$app/stores';
  import Navbarhorizontal from './navbarhorizontal.svelte';
  import Navbarvertical from './navbarvertical.svelte';

  const translations = $page.data.headerTranslations;
  const logoAlt = translations?.logoAlt ? translations["logoAlt"] : "";
  const logoHref = $page.url.origin;
  const logoSrc = translations?.logoSrc ? translations["logoSrc"] : "";
</script>

<div class="fixed w-full h-20 border-b-4 border-custom-16 shadow-lg bg-custom-1 z-30">
  <div class="grid grid-cols-2 h-full md:grid-cols-6 content-width">
    <a href={logoHref} data-sveltekit-reload class="grid">
      <img 
        class="w-36 self-center"
        src= {logoSrc}
        alt= {logoAlt}
      />
    </a>

    <div class="hidden lg:flex col-span-5 justify-end text-[16px] 2xl:text-[18px] font-custom-style-header-3 ">
      <Navbarhorizontal />
    </div>
    <div class="flex lg:hidden col-span-1 md:col-span-5 justify-end text-[18px] font-custom-style-header-3">
      <Navbarvertical />
    </div>

  </div>
</div>

<style></style>