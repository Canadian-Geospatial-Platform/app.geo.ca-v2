<script lang="ts">
	import { page } from '$app/stores';
	import SortableTable from '$lib/components/sortable-table/sortable-table.svelte';
	import Pagination from '$lib/components/pagination/pagination.svelte';

	type RelatedProductsRow = {
		name: string;
		type: string;
		url: string;
	};

	/******************* Translations *******************/
	const translations = $page.data.t;
	const relatedProductsNotAvailable = translations?.relatedProductsNotAvailable
		? translations['relatedProductsNotAvailable']
		: 'The related products for this record are unavailable.';

	// Row labels
	const nameText = translations?.name ? translations['name'] : 'Name';
	const typeText = translations?.type ? translations['type'] : 'Type';

	/******************* Data *******************/
	const data = $page.data;
	const lang = data.lang;
	const langShort = lang.slice(0, 2);
	const descriptionLang = 'description_' + langShort;

	const url = $page.url;

	const relatedRecords = data.related;
	let tableDataArray: Array<ContactRow> = relatedRecords.map((x) => {
		const recordUrl = url.origin + '/' + lang + '/map-browser/record/' + x.id;
		const row = { name: x[descriptionLang], type: x.type, url: recordUrl };
		return row;
	});

	// Translation of table column labels
	const tableLabels: RelatedProductsRow = {
		name: nameText,
		type: typeText
	};

	/****************** Pagination ******************/
	let itemsPerPage = 10;
	let total = $derived(relatedRecords.length ?? 0);
	let totalPages = $derived(Math.ceil(total / itemsPerPage));
	let currentPage = $state(1);

	function changePage(event: CustomEvent) {
		currentPage = event;
	}
</script>

{#if tableDataArray.length == 0}
	<div>
		{relatedProductsNotAvailable}
	</div>
{:else}
	<SortableTable
		tableContent={tableDataArray}
		{tableLabels}
		clickableRows={true}
		paginated={true}
		{currentPage}
		{itemsPerPage}
	/>
	{#if tableDataArray.length > itemsPerPage}
		<div class="flex justify-end w-full">
			<Pagination totalItems={total} {itemsPerPage} bind:currentPage pageChange={changePage} />
		</div>
	{/if}
{/if}
