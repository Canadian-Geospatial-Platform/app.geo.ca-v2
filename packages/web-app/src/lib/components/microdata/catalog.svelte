<script lang="ts">
  import { getAppLanguage } from '#lib/utils/language.js';
  import { getTranslations } from '#lib/i18n/index.js';
  import { page } from '$app/state';
  import Organisations from './organisations.svelte';
  const { item, lang: contentLang } = $props();

  // NOTE: This component still follows a reference markup path and should be
  // updated when the new schema mapping is finalized for these fields.
  const translations = $derived(getTranslations(getAppLanguage(page.data.lang ?? page.params.lang)).components.microdata);

  /**
   * Constructs a WKT polygon string from the item's coordinates.
   *
   * @returns The WKT polygon string.
   */
  function boundaryMultiPolygon(): string {
    const jsonPolygon = item.coordinates[0];
    let wktPolygonString = '';
    for (const xy of jsonPolygon) {
      wktPolygonString += `${xy[0]} ${xy[1]},`;
    }
    if (wktPolygonString) {
      wktPolygonString = wktPolygonString.slice(0, -1);
    }
    return wktPolygonString;
  }
</script>

<div property="includedInDataCatalog" typeof="DataCatalog">
  <span property="name"
    >{translations.catalogueTitle}
    <span property="spatialCoverage" typeof="Place">
      <span property="geo" typeof="GeoShape">
        <span property="name">{translations.boundary}</span>
        <span property="polygon">{boundaryMultiPolygon()}</span>
      </span>
    </span>
  </span>

  <span property="description">{translations.catalogueDescription}</span>
  <span property="datePublished">
    <span property="dateModified"></span>
    <span property="inLanguage">{`${contentLang}-CA`}</span>
    <span property="publisher" typeof="Organization">
      <Organisations {item} lang={contentLang} />
    </span>
    <span property="genre"></span>

    {#if item?.properties?.constraints?.legal?.[contentLang]}
      <span property="license" typeof="CreativeWork">
        <span property="name">{item.properties.constraints.legal[contentLang]}</span>
      </span>
    {/if}
  </span>
</div>
