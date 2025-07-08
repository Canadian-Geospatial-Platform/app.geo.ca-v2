<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { updateLocalStorage } from '$lib/utils/event-dispatchers/local-storage-changed.js';
	import Card from '$lib/components/card/card.svelte';
	import NoMap from '$lib/components/icons/no-map.svelte';
	import CheckboxCustomized from '$lib/components/checkbox-customized/checkbox-customized.svelte';
	import FavoritesMap from '$lib/components/map/favourites-map.svelte';
	import SortableTable from '$lib/components/sortable-table/sortable-table.svelte';
	import MapCartListSkeleton from '$lib/components/loading-mask/mapcart-list-skeleton.svelte';
	import Checkmark from '$lib/components/icons/checkmark.svelte';
	import GarbageCan from '$lib/components/icons/garbage-can.svelte';
	import SearchBarSimplified from '$lib/components/search-results/search-bar-simplified.svelte';

	type MapCartRow = {
		id: string;
		name: string;
		url: string;
	};

	/************* Translations ***************/
	const translations = $page.data.t;
	const lang = $page.data.lang;

	const findAResource = translations?.findAResource
		? translations.findAResource
		: 'Find a resource';
	const mapCartTitle = translations?.title ? translations.title : 'Map Cart';
	const mapTitle = translations?.mapTitle ? translations.mapTitle : 'Map';
	const pageDescription = translations?.description ? translations.description : '';
	const remove = translations?.remove ? translations.remove : 'Remove';
	const removeAll = translations?.removeAll ? translations.removeAll : 'Remove all';
	const resourceIdLabel = translations?.resourceId ? translations.resourceId : 'Resource id';
	const resourceListEmpty = translations?.resourceListEmpty
		? translations.resourceListEmpty
		: 'The resource list is empty.';
	const resourceNameLabel = translations?.resourceName
		? translations.resourceName
		: 'Resource name';
	const returnToList = translations?.returnToList ? translations.returnToList : 'Return to list';
	const searchFor = translations?.searchFor
		? translations.searchFor
		: 'Search for additional resources';
	const viewOnMapLabel = translations?.viewOnMap ? translations.viewOnMap : 'View on map';

	const langShort = lang == 'fr-ca' ? 'fr' : 'en';
	const titleKey = 'title_' + langShort;

	/************* Resource Table ***************/
	let sortableTable = $state();
	let selectedIds = $state(new Set());
	let numSelected = $derived(selectedIds.size);

	let loading = $state(true);
	let mapToggle = $state(false);

	let favouriteRecordList = $state(
		$page.data?.userData?.mapCart ? [...$page.data?.userData?.mapCart] : []
	);
	let records = $state([]);
	let tableDataArray = $state([]);

	// Table column labels
	const tableLabels: MapCartRow = {
		name: resourceNameLabel,
		id: resourceIdLabel
	};

	/************* Handlers ***************/

	function handleDeleteResource(id) {
		// Before deleting, ask the user's permission
		const resource = tableDataArray.find((resource) => resource.id == id);
		const resourceName = resource.name;
		const permissionText =
			lang == 'fr-ca'
				? `Êtes-vous sûr de vouloir supprimer la ressource suivante? \n\n${resourceName} (${id})`
				: `Are you sure you want to delete the following resource? \n\n${resourceName} (${id})`;

		if (confirm(permissionText) == true) {
			let selectedSet = new Set(sortableTable.getSelectedIds());
			selectedSet.delete(id);

			// Update resource lists
			favouriteRecordList = favouriteRecordList.filter((listItem) => listItem != id);
			tableDataArray = tableDataArray.filter((row) => row.id != id);
			records = records.filter((record) => record.id != id);

			// Update the table and button label
			sortableTable.updateTableContent(tableDataArray);
			sortableTable.setSelectedIds(selectedSet);

			// Update localStorage and dispatch localstorage_updated event
			updateLocalStorage('MapCartResources', favouriteRecordList);

			// TODO: update user's favourites when the login system is implemented
		}
	}

	function handleRemoveAllClick(event) {
		const permissionText =
			lang == 'fr-ca'
				? `Êtes-vous certain de vouloir supprimer ${favouriteRecordList.length} ressources?`
				: `Are you sure you want to delete ${favouriteRecordList.length} resources?`;

		if (confirm(permissionText) == true) {
			// Update resource lists
			favouriteRecordList = [];
			tableDataArray = [];
			records = [];

			// Update the table and button label
			sortableTable.updateTableContent([]);
			sortableTable.setSelectedIds(new Set());

			// Update localStorage and dispatch localstorage_updated event
			updateLocalStorage('MapCartResources', []);

			// TODO: update user's favourites when the login system is implemented
		}
	}

	function handleOpenMapClick(event) {
		// checkedIds = sortableTable.getSelectedIds();
		mapToggle = true;
	}

	function handleReturnToListClick(event) {
		mapToggle = false;
	}

	// Local storage is only accessible from the client side, so we need to get
	// the MapCartResources array inside onMount
	onMount(async () => {
		// If not signed in, check the local storage for saved resources instead
		if (!$page.data.signedIn) {
			let stored = localStorage.getItem('MapCartResources');

			if (stored) {
				// local storage is always a string, so we need to convert to an array
				stored = stored.split(',');
				favouriteRecordList = [...stored];
			}

			// Issue POST request for record details
			if (favouriteRecordList.length > 0) {
				const response = await fetch('/' + lang + '/map-cart', {
					method: 'POST',
					body: JSON.stringify({ ids: favouriteRecordList, lang: lang }),
					headers: { 'Content-Type': 'application/json' }
				});

				records = await response.json();

				tableDataArray = records.map((record) => {
					return {
						id: record.id,
						name: record[titleKey],
						url: $page.url.origin + '/' + lang + '/map-browser/record/' + record.id
					};
				});
			}

			// Turn off the loading mask once the records have finished loading
			loading = false;
		}
	});
</script>

<h1 class="mt-12 mb-7 mx-5 md:mx-0 font-custom-style-h1 md:mr-auto leading-tight">
	{#if mapToggle}
		{mapTitle}
	{:else}
		{mapCartTitle}
	{/if}
</h1>

<div class="mx-5 md:mx-0 mb-5">
	{#if !loading}
		{#if records.length > 0}
			{#if mapToggle}
				<!-------------- Map -------------->
				<FavoritesMap layerIds={selectedIds} />
				<button
					class="sm:inline-block button-5 w-full sm:w-fit mt-5 mb-5 shadow-[0_0.1875rem_0.375rem_#00000029]"
					onclick={(event) => handleReturnToListClick(event)}
				>
					{returnToList}
				</button>
			{/if}
			<div class:hidden={mapToggle}>
				<!-------------- List -------------->
				<p class="font-custom-style-body-1 mx-0 mb-6">
					{@html pageDescription}
				</p>

				<Card>
					<!-- Table for medium to large screens-->
					<div class="hidden sm:table w-full">
						<SortableTable
							tableContent={tableDataArray}
							{tableLabels}
							clickableRows={true}
							checkboxCol={true}
							allSelected={true}
							removeCol={true}
							deleteResource={handleDeleteResource}
							bind:this={sortableTable}
							bind:selectedIds
						/>
					</div>

					<!-- Cards for moble screens -->
					<div
						class="block sm:hidden rounded bg-custom-1 px-5 drop-shadow-[0_0.1875rem_0.375rem_#00000029] divide-y divide-custom-17"
					>
						{#each tableDataArray as item (item.id)}
							<div class="flex items-center py-5">
								<!-- Checkboxes -->
								<div class="flex pointer-events-auto hover:cursor-pointer w-16 ml-4">
									<input
										type="checkbox"
										id={'check-' + item.id}
										name={'check-' + item.id}
										class="peer appearance-none min-w-[1.6875rem] h-[1.6875rem] border-2
                      border-custom-16 rounded-sm bg-custom-1 checked:bg-custom-16 hover:cursor-pointer"
										checked={selectedIds.has(item.id)}
										onchange={(e) => {
											const newSet = new Set(selectedIds);
											e.target.checked ? newSet.add(item.id) : newSet.delete(item.id);
											selectedIds = newSet;
										}}
									/>
									<Checkmark
										classes="absolute h-4 mt-1.5 ml-1.5 hidden peer-checked:block
                      pointer-events-none text-custom-1"
									/>
								</div>

								<!-- Resource -->
								<div class="flex-1">
									<!-- Resource data-->
									<a href={item.url} class="font-custom-style-h2-2 block">
										{item.name}
									</a>
									<p class="font-custom-style-body-9">{item.id}</p>

									<!-- Remove Button-->
									<button
										class="button-3 mt-4 p-2 text-custom-16 rounded border-2 border-transparent hover:border-custom-16
                      hover:text-custom-1 hover:bg-custom-16 hover:shadow-[0_0.1875rem_0.375rem_#00000029]"
										onclick={() => handleDeleteResource(item.id)}
									>
										<GarbageCan classes={'h-4 inline mb-1'} />
										{remove}
									</button>
								</div>
							</div>
						{/each}
					</div>

					<!-------------- buttons -------------->
					<div class="sm:flex">
						<div class="sm:grow">
							<button
								class="sm:inline-block button-5 w-full sm:w-fit mb-4 sm:mb-0 shadow-[0_0.1875rem_0.375rem_#00000029]"
								onclick={(event) => handleOpenMapClick(event)}
							>
								{viewOnMapLabel} ({numSelected})
							</button>
						</div>

						<button
							class="sm:inline-block button-3 w-full sm:w-fit
                shadow-[0_0.1875rem_0.375rem_#00000029]"
							onclick={(event) => handleRemoveAllClick(event)}
						>
							<GarbageCan classes={'h-4 inline mb-1'} />
							{removeAll}
						</button>
					</div>
				</Card>
			</div>

			<h2 class="mb-4 mt-9 mx-0 font-custom-style-h2 md:mr-auto">
				{searchFor}
			</h2>
			<SearchBarSimplified />
		{:else}
			<!-------------- No records selected -------------->
			<div class="my-8">
				<NoMap classes="text-custom-19 m-auto h-48 md:h-80 lg:h-96" />

				<p class="block m-auto w-fit font-custom-style-h2 text-center">
					{resourceListEmpty}
				</p>

				<a class="block m-auto w-fit mt-5" href={$page.url.origin + '/' + lang + '/map-browser'}>
					<div class="button-3 w-fit shadow-[0_0.1875rem_0.375rem_#00000029]">
						{findAResource}
					</div>
				</a>
			</div>
		{/if}
	{:else if mapToggle}
		<!-- Map loading mask -->
		<div class="animate-pulse bg-custom-6 w-full h-[32rem]"></div>
	{:else if !mapToggle}
		<!-- Table loading skeleton -->
		<MapCartListSkeleton numRecords={6} />
	{/if}
</div>
