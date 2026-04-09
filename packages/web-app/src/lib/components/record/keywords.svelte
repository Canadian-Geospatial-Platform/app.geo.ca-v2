<script lang="ts">
  import { page } from '$app/state';
  import { resolve } from '$app/paths';

  const translations = page.data.t;
  const keywordsText = translations?.keywords ? translations['keywords'] : 'Related keywords';

  const data = page.data;
  const items = data.item_v2!;
  const keywords = items['keywords'];
</script>

<div class="font-custom-style-body-1">
  <h2 class="font-custom-style-h2 mb-5 mx-5 md:mx-0">
    {keywordsText}
  </h2>
  <p class="mx-5 md:mx-0 space-y-2">
    {#each keywords as keyword, index (`${index}-${keyword}`)}
      <a
        class="font-custom-style-body-2 block sm:inline"
        href={resolve(`/${data.lang}/map-browser?search-terms=${encodeURIComponent(keyword.toLowerCase())}`)}
      >
        {keyword.toLowerCase()}
      </a><span class="hidden sm:inline">{index < keywords.length - 1 ? ', ' : ''}</span>
    {/each}
  </p>
</div>
