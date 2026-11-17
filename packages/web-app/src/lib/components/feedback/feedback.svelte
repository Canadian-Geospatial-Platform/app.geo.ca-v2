<script lang="ts">
  import { getTranslations } from '#lib/i18n/index.js';
  import { page } from '$app/state';
  import { getAppLanguage } from '#lib/utils/language.js';

  const appLang = $derived(getAppLanguage(page.data.lang ?? page.params.lang));
  const translations = $derived(getTranslations(appLang).components.feedback);
</script>

<div class="font-custom-style-body-1 px-5 mt-9 md:px-0">
  <h2 class="font-custom-style-h2 mb-4">
    {translations.title}
  </h2>
  <div>
    <p>
      {translations.description}
      <br /><a class="underline hover:no-underline text-custom-16" href="mailto:geoinfo@nrcan-rncan.gc.ca?subject=app.geo.ca"
        >{translations.link}</a
      >
    </p>
  </div>
</div>
