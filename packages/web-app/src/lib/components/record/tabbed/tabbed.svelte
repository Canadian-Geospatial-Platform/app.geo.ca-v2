<script lang="ts">
  import { page } from "$app/stores";
  import TabCard from "$lib/components/tab-card/tab-card.svelte";
  import DataResources from "./data-resources.svelte";
  import AdvancedMetadata from "./advanced-metadata.svelte";
  import Contact from "./contact.svelte";

  /******************* Translations *******************/
  const translations = $page.data.t;
  const dataResources: string = translations?.dataResources ?
    translations["dataResources"] : "Data Resources";
  const advancedMetadata: string = translations?.advancedMetadata ?
    translations["advancedMetadata"] : "Advanced Metadata";
  const contactData: string = translations?.contactData ?
    translations["contactData"] : "Contact Data";

  /******************* Data *******************/
  const tabContentArray = [
    {
      label: dataResources,
      value: 1,
      component: DataResources
    }, {
      label: advancedMetadata,
      value: 2,
      component: AdvancedMetadata
    }, {
      label: contactData,
      value: 3,
      component: Contact
    }
  ]
</script>

<div class="flex flex-col space-y-3">
  <TabCard {tabContentArray}/>
</div>