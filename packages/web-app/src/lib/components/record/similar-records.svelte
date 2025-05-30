<script lang="ts">
  import { page } from '$app/stores';
  import Carousel from '$lib/components/carousel/carousel.svelte'

  const translations = $page.data.t;
  const similarRecordsText = translations?.similarProducts ? translations["similarProducts"] : "Similar records";

  const data = $page.data;
  const lang = data.lang;
  const urlPrefix = $page.url.origin + '/' + lang + '/map-browser/record/';
  const similarRecords = data.similar;

  const cardData = similarRecords.map((record) => {
    const title = lang == "fr-ca" ? record.features_properties_title_fr : record.features_properties_title_en;

    // Todo: Change description when it becomes available from query
    // const description = lang == "fr-ca" ? record.features_properties_description_fr : record.features_properties_description_en;
    const description = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor \
      incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation \
      ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit \
      in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat \
      non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.";

    const url = urlPrefix + record.features_properties_id;

    return {
      title: title,
      description: description,
      url: url
    }
  });
</script>

<div class="font-custom-style-body-1 mx-5 md:mx-0">
  <h2 class="font-custom-style-h2 mb-7">
    {similarRecordsText}
  </h2>
  <Carousel cardData={cardData} />
</div>
