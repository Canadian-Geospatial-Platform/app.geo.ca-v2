<script lang="ts">
  import { getTranslations } from '#lib/i18n/index.js';
  import { getAppLanguage } from '#lib/utils/language.js';
  import { page } from '$app/state';
  import { onMount } from 'svelte';
  import { tempCategoryOfInterest, updateTempCategoryOfInterest } from '#lib/components/search-results/store.js';
  import SelectCustomized from '#lib/components/select-customized/select-customized.svelte';
  import type { FilterItem } from '#lib/components/search-results/filters/filter-types.d.ts';
  import type { SelectOption } from '#lib/components/select-customized/selected-types.d.ts';

  // Note: the list of categories are based on the Topic Categories from ISO 19115-1
  // https://icsm-au.github.io/metadata-working-group/defs/TopicCategory
  const categoriesKey = 'category-of-interest';

  // App language and translations
  const appLang = $derived(getAppLanguage(page.data.lang ?? page.params.lang));
  const searchResultsTranslations = $derived(getTranslations(appLang).components.searchResults);
  const categories = $derived(searchResultsTranslations.categories);
  const selectedCategory = findCategory(page.url.searchParams.get(categoriesKey));
  let selected = $state<SelectOption | undefined>(selectedCategory ?? undefined);
  let categoryStoreVal: string | null = selectedCategory?.value ?? null;

  /**
   * Resets the filter to the value in the URL parameters.
   */
  export function resetFilters(): void {
    let catKey = page.url.searchParams.get(categoriesKey);
    let selectedCategory = findCategory(catKey);

    selected = selectedCategory || undefined;
    updateTempCategoryOfInterest(selected?.value ?? null);
  }

  /**
   * Gets the current value of the category of interest filter.
   *
   * @returns The selected category value or null.
   */
  export function getValue(): string | null {
    return categoryStoreVal;
  }

  /************* Filter Data ***************/
  /**
   * Finds a category by its name.
   *
   * @param categoryName - The name of the category to find.
   * @returns The found category or null if not found.
   */
  function findCategory(categoryName: string | null): FilterItem | null {
    return categories.find((category: FilterItem) => category.value === categoryName) ?? null;
  }

  /**
   * Changes the selected category.
   *
   * @param newSelection - The new selected option.
   */
  function changeSelection(newSelection: SelectOption | null): void {
    selected = newSelection || undefined;
  }

  /************* Handlers ***************/
  /**
   * Handles changes to the category of interest selection.
   *
   * @param event - The selected option.
   */
  function handleCategoryOfInterestChange(event: SelectOption | null): void {
    changeSelection(event);
    updateTempCategoryOfInterest(selected?.value ?? null);
  }

  /************* Subscriptions ***************/
  onMount(() => {
    resetFilters();
    return tempCategoryOfInterest.subscribe((value: string | null) => {
      const category = findCategory(value);
      changeSelection(category);
      categoryStoreVal = category?.value ?? null;
    });
  });
</script>

<div class="w-full">
  <h3 class="font-custom-style-h3 mb-5">
    {searchResultsTranslations.labels.categoryOfInterest}
  </h3>
  <div class="w-full md:max-w-md">
    <SelectCustomized
      optionsData={categories}
      removableSelection={true}
      defaultLabel={searchResultsTranslations.labels.categorySelectDefault}
      selectType="categoryFilter"
      bind:selected
      selectedChange={handleCategoryOfInterestChange}
    />
  </div>
</div>
