<script lang="ts">
  import { page } from '$app/stores';
  import Parsedlinks from '$lib/components/parsed-links/parsed-links.svelte';

  const data = $page.data;
  const lang = data.lang;
  const items = data.item_v2;
  const properties = items.properties;

  const title = lang == 'fr-ca' ? properties.title.fr : properties.title.en;
  const descriptionRaw = lang == 'fr-ca' ? properties.description.fr : properties.description.en;
  const description = descriptionRaw.replaceAll(/\n/g, '<br>');
</script>

<div>
  <h1 class="font-custom-style-h1 mb-6 mx-5 md:mx-0">
    {title}
  </h1>
  <p class="font-custom-style-body-1 mx-5 md:mx-0">
    <!------------------------------------------------------------
      Some descriptions may include links, so we can replace them
      with anchors using the Parsedlinks component.
    -------------------------------------------------------------->
    <Parsedlinks linkText={description}/>
  </p>
</div>
