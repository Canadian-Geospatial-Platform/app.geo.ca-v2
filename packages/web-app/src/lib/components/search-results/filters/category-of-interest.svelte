<script lang="ts">
  import { page } from '$app/state';
  import { tempCategoryOfInterest, updateTempCategoryOfInterest } from '$lib/components/search-results/store';
  import SelectCustomized from '$lib/components/select-customized/select-customized.svelte';
  import type { FilterItem } from '$lib/components/search-results/filters/filter-types.d.ts';
  import type { SelectOption } from '$lib/components/select-customized/selected-types.d.ts';

  // Note: the list of categories are based on the Topic Categories from ISO 19115-1
  // https://icsm-au.github.io/metadata-working-group/defs/TopicCategory
  const categoriesKey = 'category-of-interest';
  const categories = page.data.categories;
  let selected: SelectOption | undefined = undefined;
  let categoryStoreVal: string | null = null;

  const selectedValue = page.url.searchParams.get(categoriesKey);
  let selectedCategory = findCategory(selectedValue);
  if (selectedCategory && selected !== selectedCategory) {
    selected = selectedCategory || undefined;
    updateTempCategoryOfInterest(selected?.value ?? null);
  }

  /**
   * Resets the filter to the value in the URL parameters.
   */
  export function resetFilters(): void {
    let catKey = page.url.searchParams.get('category-of-interest');
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

  /************* Translations ***************/
  const translations = page.data.t;
  const categoryOfInterestText = translations?.categoryOfInterest ? translations['categoryOfInterest'] : 'Select Category of Interest';
  const categorySelectDefaultText = translations?.categorySelectDefault ? translations['categorySelectDefault'] : 'Select a Category...';

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
  tempCategoryOfInterest.subscribe((value: string | null) => {
    let category = findCategory(value);
    if (selected !== category) {
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
      defaultLabel={categorySelectDefaultText}
      selectType={'categoryFilter'}
      bind:selected
      selectedChange={handleCategoryOfInterestChange}
    />
  </div>
</div>
