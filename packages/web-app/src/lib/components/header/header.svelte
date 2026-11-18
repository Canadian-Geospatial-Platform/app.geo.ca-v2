<script>
  import { getTranslations } from '#lib/i18n/index.js';
  import { page } from '$app/state';
  import { getAppLanguage } from '#lib/utils/language.js';
  import Navbarhorizontal from './navbarhorizontal.svelte';
  import Navbarvertical from './navbarvertical.svelte';
  import SignIn from '#lib/components/profile/sign-in.svelte';

  const appLang = $derived(getAppLanguage(page.data.lang ?? page.params.lang));
  const headerTranslations = $derived(getTranslations(appLang).components.header);
</script>

<!-- Note: the z-index needs to be 10010 because the loading mask on the geoview maps are 9999 -->
<header class="sticky top-0 w-full h-20 px-5 md:px-0 border-b-4 border-custom-16 shadow-lg bg-custom-1 z-10010">
  <div class="grid grid-cols-2 h-full xl:grid-cols-6 content-width">
    <a href={headerTranslations.homeUrl} data-sveltekit-reload class="relative grid" rel="external">
      <img class="absolute w-36 -left-3 self-center" src={headerTranslations.labels.logoSrc} alt={headerTranslations.labels.logoAlt} />
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
