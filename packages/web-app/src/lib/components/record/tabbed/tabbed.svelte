<script lang="ts">
  import { getTranslations } from '#lib/i18n/index.js';
  import { getAppLanguage } from '#lib/utils/language.js';
  import { page } from '$app/state';
  import TabCard from '#lib/components/tab-card/tab-card.svelte';
  import DataResources from './data-resources.svelte';
  import AdvancedMetadata from './advanced-metadata.svelte';
  import Contact from './contact.svelte';
  import RelatedProducts from './related-products.svelte';
  import type { SelectOption } from '#lib/components/select-customized/selected-types.d.ts';

  // App language and translations
  const appLang = $derived(getAppLanguage(page.data.lang ?? page.params.lang));
  const translations = $derived(getTranslations(appLang));

  // Tab content array
  const tabContentArray: SelectOption[] = $derived([
    {
      label: translations.components.record.labels.dataResources,
      value: '1',
      component: DataResources,
    },
    {
      label: translations.components.record.labels.advancedMetadata,
      value: '2',
      component: AdvancedMetadata,
    },
    {
      label: translations.components.record.labels.contactData,
      value: '3',
      component: Contact,
    },
    {
      label: translations.components.record.labels.relatedProducts,
      value: '4',
      component: RelatedProducts,
    },
  ]);
</script>

<div class="flex flex-col space-y-3">
  <TabCard {tabContentArray} />
</div>
