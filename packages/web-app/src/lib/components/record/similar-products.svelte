<script lang="ts">
  import { page } from '$app/stores';

  const translations = $page.data.t;
  const similarProductsText = translations?.similarProducts ? translations["similarProducts"] : "Similar records";

  const data = $page.data;
  const lang = data.lang;
  const urlPrefix = $page.url.origin + '/' + lang + '/map-browser/record/';
  const similarProducts = data.similar;

</script>

<div class="font-custom-style-body-1 mx-5 md:mx-0">
  <h2 class="font-custom-style-h2 mb-1">
    {similarProductsText}
  </h2>
  <ul class="flex flex-col space-y-4 list-outside py-2 list-none sm:list-disc sm:ml-[1.125rem]">
    {#each similarProducts as product}
      <li data-sveltekit-reload>
        <a class="font-custom-style-body-2" href={urlPrefix + product.features_properties_id}>
          {lang == 'fr-ca' ? product.features_properties_title_fr : product.features_properties_title_en}
        </a>
      </li>
    {/each}
  </ul>
</div>
