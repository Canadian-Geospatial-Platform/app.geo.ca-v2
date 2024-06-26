<script lang="ts">
  import { page } from '$app/stores';
  import Card from '$lib/components/card/card.svelte';

  /******************* Translations *******************/
  const translations = $page.data.t;

  // Description
  const metadatatext = Object.hasOwn(translations,"metadata") ?
    translations["metadata"] : "Metadata";
  const metadataDescriptionText = Object.hasOwn(translations,"metadataDescription") ?
    translations["metadataDescription"] : "";

  // Top Section
  const dateCreatedText = Object.hasOwn(translations,"dateCreated") ?
    translations["dateCreated"] : "";
  const datePublishedText = Object.hasOwn(translations,"datePublished") ?
    translations["datePublished"] : "";
  const temporalCoverageText = Object.hasOwn(translations,"temporalCoverage") ?
    translations["temporalCoverage"] : "";
  const accessLast30Text = Object.hasOwn(translations,"accessLast30") ?
    translations["accessLast30"] : "";
  const accessAllTimeText = Object.hasOwn(translations,"accessAllTime") ?
    translations["accessAllTime"] : "";

  // Sources
  const sourcesText = Object.hasOwn(translations,"sources") ?
    translations["sources"] : "";

  // Use Limitations
  const useLimitationsText = Object.hasOwn(translations,"useLimitations") ?
    translations["useLimitations"] : "";

  /******************* Data *******************/
  const data = $page.data;
  const lang = data.lang;
  const items = data.result.body.Items[0];

  // Top Section
  const dateCreated = items.created;
  const datePublished = items.published;
  const accessLast30 = data.analyticRes['30'];
  const accessAllTime = data.analyticRes.all;
  let temporalCoverage = items.temporalExtent.begin + ' ' + items.temporalExtent.end;

  if (lang == 'fr-ca') {
    temporalCoverage = temporalCoverage.replaceAll('Present', 'Présent');
  }

  let topSection = [
    [dateCreatedText, dateCreated],
    [datePublishedText, datePublished],
    [temporalCoverageText, temporalCoverage],
    [accessLast30Text, accessLast30],
    [accessAllTimeText, accessAllTime]
 ];

 // Sources
 const distributor = items.distributor;
 const sourcesArray = distributor.map((x) => x['organisation'][lang.slice(0, 2)]);

 // Use limitations
 const useLimitationsRaw = items.useLimits;
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

  @media (max-width: 1023px) {
    .top-table:not(:first-child) {
      border-top: 1px solid #00000029;
      padding-top: 2px;
    }

    .top-table:not(:last-child) {
      padding-bottom: 2px;
    }
  }
</style>
