<script lang="ts">
  import { getComponentLabels, getTranslations } from '#lib/i18n/index.js';
  import { page } from '$app/state';
  import { getAppLanguage, getContentLanguage } from '#lib/utils/language.js';
  import Card from '#lib/components/card/card.svelte';
  import type { ContactInfo } from '#lib/db/db-types.js';

  /******************* Translations *******************/
  const translations = $derived(getComponentLabels(getAppLanguage(page.data.lang ?? page.params.lang), 'record'));

  /******************* Data *******************/
  const data = page.data;
  const appLang = $derived(getAppLanguage(page.data.lang ?? page.params.lang));
  const contentLang = $derived(getContentLanguage(appLang));
  const properties = data.item_v2!;

  // Top Section
  const dateCreated = $derived(properties.created || translations.notApplicable);
  const datePublished = $derived(properties.published || translations.notApplicable);
  const accessLast30 = $derived(data.analyticRes && data.analyticRes['30'] ? data.analyticRes['30'] : translations.notApplicable);
  const accessAllTime = $derived(data.analyticRes && data.analyticRes.all ? data.analyticRes.all : translations.notApplicable);

  const temporalCoverage = $derived(
    `${properties.temporalExtent?.begin} - ${properties.temporalExtent?.end}`.replaceAll(
      'null',
      getTranslations(appLang).components.record.present
    )
  );

  let topSection = $derived([
    [translations.dateCreated, dateCreated],
    [translations.datePublished, datePublished],
    [translations.temporalCoverage, temporalCoverage],
    [translations.accessLast30, accessLast30],
    [translations.accessAllTime, accessAllTime],
  ]);

  // Sources
  const title = properties.title;
  const distributors: ContactInfo[] = (properties.distributor || []).filter(
    (distributor): distributor is ContactInfo => distributor !== null
  );
  const distributorOrgArray = $derived(distributors.map((distributor: ContactInfo) => distributor.organisation[contentLang]));

  const onlineResourceArray = distributors
    ? distributors.map((distributor: ContactInfo) => {
        // Only return the resource if it is a link
        // Also ignore cases where the value is the string 'null'
        if (
          distributor?.onlineResource?.onlineResource &&
          distributor.onlineResource.onlineResource !== 'null' &&
          (distributor?.onlineResource?.onlineResource_Protocol?.toLowerCase() === 'http' ||
            distributor?.onlineResource?.onlineResource_Protocol?.toLowerCase() === 'https')
        ) {
          return distributor.onlineResource.onlineResource;
        }
      })
    : null;

  // Use limitations
  const legalConstraints = properties.useLimits;
  let useLimitations = $derived(translations.notApplicable);

  if (legalConstraints) {
    const urlRegEx = /(https?:\/\/[^\s|)]+)/g;
    try {
      const useLimitationsUrl = legalConstraints.match(urlRegEx)?.[0] || '';
      const useLimitationsLabel = legalConstraints.split(' (')[0];
      useLimitations = `<a href="${useLimitationsUrl}" class="underline hover:no-underline text-custom-16">${useLimitationsLabel}</a>`;
    } catch {
      useLimitations = legalConstraints;
    }
  }
</script>

<div class="font-custom-style-body-1">
  <h2 class="font-custom-style-h2 mb-7 mx-5 md:mx-0">
    {translations.metadata}
  </h2>
  <Card>
    <div class="card-div flex flex-col lg:flex-row lg:space-x-3 justify-between">
      {#each topSection as [topItemLabel, topItemVal] (`${topItemLabel}-${topItemVal}`)}
        <div class="top-table flex flex-col min-w-[15%]">
          <h3 class="pb-1 w-full font-semibold">{topItemLabel}</h3>
          <p class="w-full text-left">{topItemVal}</p>
        </div>
      {/each}
    </div>
    <div class="card-div">
      <h3 class="font-semibold">{translations.sources}</h3>
      <!--
        Citation entries should be in this format:
        Publisher organization. (published date). <i>Name of resource</i>.
        Distributor organization. url link to resource (if it exists).
        NOTE: Publisher currently maps to distributor-derived values because a
        separate publisher source is not yet available in this payload.
      -->
      <div class="space-y-4">
        {#each distributorOrgArray as distributor, index (`${index}-${distributor}`)}
          <p>
            {#if distributor}
              {distributor}.
            {/if}
            {#if datePublished}
              ({datePublished}).
            {/if}
            {#if title}
              <span class="italic">{title}.</span>
            {/if}
            {#if onlineResourceArray?.[index]}
              <a href={onlineResourceArray[index]} class="underline hover:no-underline text-custom-16" rel="external"
                >{onlineResourceArray[index]}</a
              >
            {/if}
          </p>
        {/each}
      </div>
    </div>
    <div class="card-div">
      <h3 class="font-semibold">{translations.useLimitations}</h3>
      <!-- These are our descriptions, no injection risk -->
      <!-- eslint-disable-next-line svelte/no-at-html-tags -->
      <p>{@html useLimitations}</p>
    </div>
  </Card>
</div>

<style lang="postcss">
  @reference "../../../app.css";
  .card-div {
    @apply bg-custom-1;
    @apply p-5;
  }

  @media (max-width: 63.9375rem) {
    .top-table:not(:first-child) {
      padding-top: 0.5rem;
    }

    .top-table:not(:last-child) {
      padding-bottom: 0.5rem;
    }
  }
</style>
