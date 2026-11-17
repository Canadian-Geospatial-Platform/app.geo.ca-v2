<script lang="ts">
  import { page } from '$app/state';
  import { getTranslations } from '#lib/i18n/index.js';
  import { getAppLanguage } from '#lib/utils/language.js';

  const legalData = $derived(getTranslations(getAppLanguage(page.data.lang ?? page.params.lang)).components.footer.legal);
</script>

<div class="bg-custom-5 font-open-sans py-4">
  <div class="grid grid-cols-1 md:grid-cols-2 content-width">
    <div class="legal-col">
      <h3 class="mb-2.5">{legalData.contactUs}</h3>
      <p>{legalData.ccmeo}</p>
      <p>{legalData.nrcan}</p>
      <p>{legalData.goc}</p>
      <p><a href={`mailto:${legalData.email}?subject=app.geo.ca`}>{legalData.email}</a></p>
    </div>
    <div class="legal-col md:text-right">
      <img class="w-28 md:ml-auto mb-5" src={legalData.logoUrl} alt={legalData.logoAlt} />
      <p><a href={legalData.licenceUrl} rel="external">{legalData.license}</a></p>
      <p>{legalData.copyright}</p>
      <p>
        {legalData.cdgi}
        <a href={legalData.cdgiLink} rel="external">
          {legalData.cdgiLinkText}
        </a>
        {legalData.cdgiAcronym}
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
