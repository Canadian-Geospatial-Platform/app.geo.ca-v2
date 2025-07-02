<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import Carousel from '$lib/components/carousel/carousel.svelte';

	const translations = $page.data.t;
	const similarRecordsText = translations?.similarProducts
		? translations['similarProducts']
		: 'Similar records';

	const data = $page.data;
	const lang = data.lang;
	const recordId = data.item_v2.id;
	const urlPrefix = $page.url.origin + '/' + lang + '/map-browser/record/';
	const similarRecords = data.similar;
	const similarDescriptions = $state({});

	const similarRecordIs = similarRecords.map((record) => {
		return record.features_properties_id;
	});

	const cardData = $derived(
		similarRecords.map((record) => {
			const title =
				lang == 'fr-ca' ? record.features_properties_title_fr : record.features_properties_title_en;
			const id = record.features_properties_id;

			// Todo: Change description when it becomes available from the similarity query.
			// For now, we can use a POST query to get the description for each record. This is slow,
			// so it will be temporary and removed once the similarity descriptions are available
			const description = similarDescriptions?.[id] ?? '';
			// const description = lang == "fr-ca" ? record.features_properties_description_fr : record.features_properties_description_en;

			const url = urlPrefix + record.features_properties_id;

			return {
				title: title,
				description: description,
				url: url
			};
		})
	);

	// TODO: This is a temporary way to get the similar record descriptions.
	// It should be removed once the similarity descriptions have been added to
	// the 'similarity' list in the record data
	onMount(async () => {
		// Get record data for each of the similar records
		const response = await fetch('/' + lang + '/map-browser/record/' + recordId, {
			method: 'POST',
			body: JSON.stringify({ ids: similarRecordIs, lang: lang }),
			headers: { 'Content-Type': 'application/json' }
		});

		const records = await response.json();

		// Update the similarDescriptions
		for (let record of records) {
			const rid = record.id;
			const recordDescription = record.description.replaceAll('\\n', '');
			similarDescriptions[rid] = recordDescription;
		}
	});
</script>

<div class="font-custom-style-body-1 mx-5 md:mx-0">
	<h2 class="font-custom-style-h2 mb-7">
		{similarRecordsText}
	</h2>
	<Carousel {cardData} />
</div>
