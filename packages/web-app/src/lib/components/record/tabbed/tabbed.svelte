<script lang="ts">
	import { page } from '$app/stores';
	import TabCard from '$lib/components/tab-card/tab-card.svelte';
	import DataResources from './data-resources.svelte';
	import AdvancedMetadata from './advanced-metadata.svelte';
	import Contact from './contact.svelte';
	import RelatedProducts from './related-products.svelte';

	/******************* Translations *******************/
	const translations = $page.data.t;
	const dataResources: string = translations?.dataResources
		? translations['dataResources']
		: 'Data resources';
	const advancedMetadata: string = translations?.advancedMetadata
		? translations['advancedMetadata']
		: 'Advanced metadata';
	const contactData: string = translations?.contactData
		? translations['contactData']
		: 'Contact';
	const relatedProducts: string = translations?.relatedProducts
		? translations['relatedProducts']
		: 'Related products';

	/******************* Data *******************/
	const tabContentArray = [
		{
			label: dataResources,
			value: 1,
			component: DataResources
		},
		{
			label: advancedMetadata,
			value: 2,
			component: AdvancedMetadata
		},
		{
			label: contactData,
			value: 3,
			component: Contact
		},
		{
			label: relatedProducts,
			value: 4,
			component: RelatedProducts
		}
	];
</script>

<div class="flex flex-col space-y-3">
	<TabCard {tabContentArray} />
</div>
