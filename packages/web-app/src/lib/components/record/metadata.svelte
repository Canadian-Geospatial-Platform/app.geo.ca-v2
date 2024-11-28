<script lang="ts">
  import { page } from '$app/stores';
  import Card from '$lib/components/card/card.svelte';

  /******************* Translations *******************/
  const translations = $page.data.t;

  // Description
  const metadatatext = translations?.metadata ? translations["metadata"] : "Metadata";
  const metadataDescriptionText = translations?.metadataDescription ?
    translations["metadataDescription"] : "";

  // Top Section
  const dateCreatedText = translations?.dateCreated ? translations["dateCreated"] : "";
  const datePublishedText = translations?.datePublished ? translations["datePublished"] : "";
  const temporalCoverageText = translations?.temporalCoverage ? translations["temporalCoverage"] : "";
  const accessLast30Text = translations?.accessLast30 ? translations["accessLast30"] : "";
  const accessAllTimeText = translations?.accessAllTime ? translations["accessAllTime"] : "";

  // Sources
  const sourcesText = translations?.sources ? translations["sources"] : "";

  // Use Limitations
  const useLimitationsText = translations?.useLimitations ? translations["useLimitations"] : "";

  /******************* Data *******************/
  const data = $page.data;
  const lang = data.lang;
  const items = data.item_v2;
  const properties = items.properties;

  // Top Section
  const dates = properties.date;
  const dateCreatedObj = dates.find((x) => x.dateType.en == 'creation');
  const dateCreated = dateCreatedObj.date;
  const datePublishedObj = dates.find((x) => x.dateType.en == 'publication');
  const datePublished = datePublishedObj.date;
  const accessLast30 = data.analyticRes['30'];
  const accessAllTime = data.analyticRes.all;
  let temporalCoverage = properties.extent.temporalExtent.start
    + ' ' + properties.extent.temporalExtent.end;

  if (lang == 'fr-ca') {
    temporalCoverage = temporalCoverage.replaceAll('null', 'Présent');
  } else {
    temporalCoverage = temporalCoverage.replaceAll('null', 'Present');
  }

  let topSection = [
    [dateCreatedText, dateCreated],
    [datePublishedText, datePublished],
    [temporalCoverageText, temporalCoverage],
    [accessLast30Text, accessLast30],
    [accessAllTimeText, accessAllTime]
  ];

  // Sources
  const distributor = properties.distributor;
  const sourcesArray = distributor.map((x) => x['organisation'][lang.slice(0, 2)]);

  // Use limitations
  const useLimitationsRaw = properties.constraints.legal[lang.slice(0, 2)];
  const urlRegEx = /(https?:\/\/[^\s|)]+)/g;
  const useLimitationsUrl = useLimitationsRaw.match(urlRegEx)[0];
  const useLimitationsLabel = useLimitationsRaw.split(' (')[0];
  const useLimitations = '<a href="' + useLimitationsUrl
    + '" target="_blank" class="underline text-custom-16">'
    + useLimitationsLabel + '</a>'
</script>

<div class="font-custom-style-body-1">
  <h2 class="font-custom-style-h2 mb-1">
    {metadatatext}
  </h2>
  <p>
    {metadataDescriptionText}
  </p>
  <Card>
    <div class="card-div flex flex-col lg:flex-row lg:space-x-3 justify-between">
      {#each topSection as [topItemLabel, topItemVal]}
        <div class="top-table flex flex-row lg:flex-col min-w-[15%]">
          <h3 class="w-1/2 lg:pb-1 lg:w-full font-semibold">{topItemLabel}</h3>
          <p class="w-1/2 lg:w-full text-right lg:text-left">{topItemVal}</p>
        </div>
      {/each}
    </div>
    <div class="card-div">
      <h3 class="font-semibold">{sourcesText}</h3>
      {#each sourcesArray as source}
        <p>{source}</p>
      {/each}
    </div>
    <div class="card-div">
      <h3 class="font-semibold">{useLimitationsText}</h3>
      <p>{@html useLimitations}</p>
    </div>
  </Card>
</div>

<style>
  .card-div {
    @apply bg-custom-1;
    @apply p-5;
  }

  @media (max-width: 63.9375rem) {
    .top-table:not(:first-child) {
      border-top: 0.0625rem solid #00000029;
      padding-top: 0.125rem;
    }

    .top-table:not(:last-child) {
      padding-bottom: 0.125rem;
    }
  }
</style>
