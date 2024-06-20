<script lang="ts">
  import { page } from '$app/stores';
  import Parsedlinks from '$lib/components/parsed-links/parsed-links.svelte';

  const data = $page.data;
  const lang = data.lang;
  const items = data.result.body.Items[0];

  const title = lang == 'fr-ca' ? items.title_fr : items.title_en;
  const description = items.description.replaceAll(/\\n/g, '<br>');
</script>

<div>
  <h1 class="font-custom-style-h1 mb-6">
    {title}
  </h1>
  <p class="font-custom-style-body-1">
    <!------------------------------------------------------------
      Some descriptions may include links, so we can replace them
      with anchors using the Parsedlinks component.
    -------------------------------------------------------------->
    <Parsedlinks linkText={description}/>
  </p>
</div>
