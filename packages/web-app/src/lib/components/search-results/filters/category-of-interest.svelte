<script lang="ts">
	import { page } from '$app/stores';
	import {
		tempCategoryOfInterest,
		updateTempCategoryOfInterest
	} from '$lib/components/search-results/store';
	import SelectCustomized from '$lib/components/select-customized/select-customized.svelte';
	import type { FilterItem } from '$lib/components/search-results/filters/filter-types.d.ts';
	import type { SelectOption } from '$lib/components/select-customized/selected-types.d.ts';

	// Note: the list of categories are based on the Topic Categories from ISO 19115-1
	// https://icsm-au.github.io/metadata-working-group/defs/TopicCategory
	const categoriesKey = 'category-of-interest';
	const categories = $page.data.categories;
	let selected: SelectOption | null = null;
	let categoryStoreVal: string | null = null;

	let selectedValue = $page.url.searchParams.get(categoriesKey);
	let selectedCategory = findCategory(selectedValue);
	if (selectedCategory && selected !== selectedCategory) {
		selected = selectedCategory;
		updateTempCategoryOfInterest(selected?.value ?? null);
	}

	export function resetFilters() {
		let catKey = $page.url.searchParams.get('category-of-interest');
		let selectedCategory = findCategory(catKey);

		selected = selectedCategory;
		updateTempCategoryOfInterest(selected?.value ?? null);
	}

	export function getValue() {
		return categoryStoreVal;
	}

	/************* Translations ***************/
	const translations = $page.data.t;
	const categoryOfInterestText = translations?.categoryOfInterest
		? translations['categoryOfInterest']
		: 'Select Category of Interest';
	const categorySelectDefautText = translations?.categorySelectDefaut
		? translations['categorySelectDefaut']
		: 'Select a Category...';

	/************* Filter Data ***************/
	function findCategory(categoryName: string | null) {
		return categories.find((x: FilterItem) => x.value == categoryName) ?? null;
	}

	function changeSelection(newSelection: SelectOption | null) {
		selected = newSelection;
	}

	/************* Handlers ***************/
	function handleCategoryOfInterestChange(event: CustomEvent) {
		changeSelection(event);
		updateTempCategoryOfInterest(selected?.value ?? null);
	}

	/************* Subscriptions ***************/
	tempCategoryOfInterest.subscribe((value) => {
		let category = findCategory(value);
		if (selected != category) {
			changeSelection(category);
		}
		categoryStoreVal = value;
	});
</script>

<div class="w-full">
	<h3 class="font-custom-style-h3 mb-5">
		{categoryOfInterestText}
	</h3>
	<div class="w-full md:max-w-md">
		<SelectCustomized
			optionsData={categories}
			removableSelection={true}
			defaultLabel={categorySelectDefautText}
			selectType={'categoryFilter'}
			bind:selected
			selectedChange={handleCategoryOfInterestChange}
		/>
	</div>
</div>
