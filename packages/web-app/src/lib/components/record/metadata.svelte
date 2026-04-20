<script lang="ts">
  import { page } from '$app/state';
  import Card from '$lib/components/card/card.svelte';
  import type { ContactInfo } from '$lib/db/db-types';

  /******************* Translations *******************/
  const translations = page.data.t;

  // Description
  const metadatatext = translations?.metadata ? translations['metadata'] : 'Metadata';

  // Top Section
  const dateCreatedText = translations?.dateCreated ? translations['dateCreated'] : '';
  const datePublishedText = translations?.datePublished ? translations['datePublished'] : '';
  const temporalCoverageText = translations?.temporalCoverage ? translations['temporalCoverage'] : '';
  const accessLast30Text = translations?.accessLast30 ? translations['accessLast30'] : '';
  const accessAllTimeText = translations?.accessAllTime ? translations['accessAllTime'] : '';

  // Sources
  const sourcesText = translations?.sources ? translations['sources'] : '';

  // Use Limitations
  const useLimitationsText = translations?.useLimitations ? translations['useLimitations'] : '';

  /******************* Data *******************/
  const data = page.data;
  const lang = data.lang;
  const langPrefix = lang.split('-')[0] as 'en' | 'fr';
  const properties = data.item_v2!;

  // Top Section
  const dateCreated = properties.created || 'N/A';
  const datePublished = properties.published || 'N/A';
  const accessLast30 = data.analyticRes && data.analyticRes['30'] ? data.analyticRes['30'] : 'N/A';
  const accessAllTime = data.analyticRes && data.analyticRes.all ? data.analyticRes.all : 'N/A';

  let temporalCoverage = `${properties.temporalExtent?.begin} - ${properties.temporalExtent?.end}`;

  if (lang === 'fr-ca') {
    temporalCoverage = temporalCoverage.replaceAll('null', 'Présent');
  } else {
    temporalCoverage = temporalCoverage.replaceAll('null', 'Present');
  }

  let topSection = [
    [dateCreatedText, dateCreated],
    [datePublishedText, datePublished],
    [temporalCoverageText, temporalCoverage],
    [accessLast30Text, accessLast30],
    [accessAllTimeText, accessAllTime],
  ];

  // Sources
  const title = properties.title;
  const distributors: ContactInfo[] = (properties.distributor || []).filter(
    (distributor): distributor is ContactInfo => distributor !== null
  );
  const distributorOrgArray = distributors.map((distributor: ContactInfo) => distributor.organisation[langPrefix]);

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
  let useLimitations = 'N/A';

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
    {metadatatext}
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
      <h3 class="font-semibold">{sourcesText}</h3>
      <!--
        Citation entries should be in this format:
        Publisher organization. (published date). <i>Name of resource</i>.
        Distributor organization. url link to resource (if it exists).
        TODO: Publisher and distributor were both using distributor. Removed second instance, add publisher back in when it is available.
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
      <h3 class="font-semibold">{useLimitationsText}</h3>
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
