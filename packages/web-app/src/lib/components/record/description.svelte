<script lang="ts">
  import { page } from '$app/stores';

  const data = $page.data;
  const lang = data.lang;
  const items = data.item_v2;
  const properties = items.properties;

  const title = lang == 'fr-ca' ? properties.title.fr : properties.title.en;
  const description = lang == 'fr-ca' ? properties.description.fr : properties.description.en;

</script>

<div>
  <h1 class="font-custom-style-h1 mb-6 mx-5 md:mx-0">
    {title}
  </h1>
  <p class="font-custom-style-body-1 mx-5 md:mx-0">
    {@html description}
  </p>
</div>
