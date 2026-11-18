<script lang="ts">
  import { page } from '$app/state';
  import { getTranslations } from '#lib/i18n/index.js';
  import { getAppLanguage } from '#lib/utils/language.js';

  const appLang = $derived(getAppLanguage(page.data.lang ?? page.params.lang));
  const legalTranslations = $derived(getTranslations(appLang).components.footer.legal);
</script>

<div class="bg-custom-5 font-open-sans py-4">
  <div class="grid grid-cols-1 md:grid-cols-2 content-width">
    <div class="legal-col">
      <h3 class="mb-2.5">{legalTranslations.contactUs}</h3>
      <p>{legalTranslations.ccmeo}</p>
      <p>{legalTranslations.nrcan}</p>
      <p>{legalTranslations.goc}</p>
      <p><a href={`mailto:${legalTranslations.email}?subject=app.geo.ca`}>{legalTranslations.email}</a></p>
    </div>
    <div class="legal-col md:text-right">
      <img class="w-28 md:ml-auto mb-5" src={legalTranslations.logoUrl} alt={legalTranslations.logoAlt} />
      <p><a href={legalTranslations.licenceUrl} rel="external">{legalTranslations.license}</a></p>
      <p>{legalTranslations.copyright}</p>
      <p>
        {legalTranslations.cdgi}
        <a href={legalTranslations.cdgiLink} rel="external">
          {legalTranslations.cdgiLinkText}
        </a>
        {legalTranslations.cdgiAcronym}
      </p>
    </div>
  </div>
</div>

<style lang="postcss">
  @reference "../../../app.css";
  .legal-col {
    @apply p-3;
  }

  @media (min-width: 48rem) {
    .legal-col {
      align-content: flex-end;
    }
  }

  h3 {
    @apply text-lg;
    @apply font-semibold;
  }

  p {
    @apply text-base;
  }

  a {
    @apply underline;
    @apply hover:no-underline;
    @apply text-custom-8;
  }
</style>
