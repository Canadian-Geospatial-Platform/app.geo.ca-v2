<script lang="ts">
  import { page } from '$app/stores';

  const translations = $page.data.t;
  const keywordsText = translations?.keywords ? translations["keywords"] : "Related Keywords";

  const url = $page.url;
  const data = $page.data;
  const lang = data.lang;
  const items = data.item_v2;
  const properties = items.properties;

  const keywords = properties.keywords.map((x) => x[lang.slice(0, 2)]);
  const mapBrowserUrl = url.origin + '/' + lang + '/map-browser';
  const searchUrl = mapBrowserUrl + '?search-terms='
</script>

<div class="font-custom-style-body-1">
  <h2 class="font-custom-style-h2 mb-2 md:mb-2 mx-5 md:mx-0">
    {keywordsText}
  </h2>
  <p class="mx-5 md:mx-0 space-y-4">
    {#each keywords as keyword, i}
      <a
        class="font-custom-style-body-2 block md:inline"
        href={searchUrl + encodeURI(keyword.replaceAll(' ', '+'))}
      >
        {keyword.toLowerCase()}
      </a>{i < keywords.length - 1 ? ', ' : ''}
    {/each}
  </p>
</div>