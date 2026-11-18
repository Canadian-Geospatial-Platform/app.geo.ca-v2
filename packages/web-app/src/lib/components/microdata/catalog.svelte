<script lang="ts">
  import { getAppLanguage } from '#lib/utils/language.js';
  import { getTranslations } from '#lib/i18n/index.js';
  import { page } from '$app/state';
  import Organisations from './organisations.svelte';
  const { item, lang: contentLang } = $props();

  // Get the application language and translations for the microdata component.
  const appLang = $derived(getAppLanguage(page.data.lang ?? page.params.lang));
  const microdataTranslations = $derived(getTranslations(appLang).components.microdata);

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
    >{microdataTranslations.catalogueTitle}
    <span property="spatialCoverage" typeof="Place">
      <span property="geo" typeof="GeoShape">
        <span property="name">{microdataTranslations.boundary}</span>
        <span property="polygon">{boundaryMultiPolygon()}</span>
      </span>
    </span>
  </span>

  <span property="description">{microdataTranslations.catalogueDescription}</span>
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
