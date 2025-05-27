<script lang="ts">
  import { page } from '$app/stores';
	import SortDown from "$lib/components/icons/sort-down.svelte";
	import SortInactive from "$lib/components/icons/sort-inactive.svelte";
	import SortUp from "$lib/components/icons/sort-up.svelte";
	import Checkmark from '$lib/components/icons/checkmark.svelte';
	import GarbageCan from '$lib/components/icons/garbage-can.svelte';

  // TODO: fix type definition to remove 'any'
  // Every item in the array should have the same set of keys,
  // since the keys will become the column titles of the table
  type TableContent = Array<any>;
  type sortDirectionState = 0 | 1 | 2;

  interface Props {
    tableContent: TableContent;
    tableLabels: any;
    // Requires a url attriute in the tableContent array
    clickableRows: boolean;
    // currentPage and itemsPerPage are only needed when paginated is true
    paginated: boolean;
    currentPage: number;
    itemsPerPage: number;
    // Add a checkbox column
    checkboxCol: boolean;
    // Check all boxes by default
    allSelected: boolean;
    // Add remove column
    removeCol: boolean;
    deleteResource: (id: string) => void;
    selectedIds: Set;
  }

  let {
    tableContent,
    tableLabels,
    clickableRows,
    paginated = false,
    currentPage = 0,
    itemsPerPage = 0,
    checkboxCol = false,
    allSelected = false,
    removeCol = false,
    deleteResource = () => {},
    selectedIds = $bindable(new Set()),
  }: Props = $props();

  /************** Translations **************/
  const lang = $page.data.lang;
  const selectAllLabel = lang == 'fr-ca' ? 'Tout sélectionner' : 'Select all';
  const deleteLabel = lang == 'fr-ca' ? 'Supprimer la ressource' : 'Delete resource';

  // Convert table label keys to an array to ensure that all data rows have the same order
  // and to simplify sorting
  const tableLabelsArray: Array<string> = [];
  for (const label in tableLabels) {
    tableLabelsArray.push(label);
  }

  let sortColumn = $state(tableLabelsArray[0]);
  // Can be 0 (default order from tableLabelsArray), 1 (a-z, sort-up icon), or 2 (z-a, sort-down icon)
  let sortDirection: sortDirectionState = $state(0);
  // Unsorted by default
  let sortedTableContent = $state(tableContent);

  let currentPageItems = $derived(
    sortedTableContent.slice(
      ((currentPage - 1) * itemsPerPage),
      ((currentPage) * itemsPerPage)
    )
  );

  let visibleRows = $derived(paginated ? currentPageItems : sortedTableContent);

  // Check the checkboxes for all items in the visible rows
  if (allSelected) {
    selectAll();
  }

  // Allow parent component to get the list of checked rows
  export function getSelectedIds() {
    return selectedIds;
  }

  export function setSelectedIds(ids) {
    selectedIds = new Set(ids);
  }

  // Allow the parent component to update the table content, for example,
  // if a row is removed by deleting a resource in the list.
  export function updateTableContent(newTableContent) {
    // When updating the table, make sure the correct sort order is maintained
    if (sortDirection === 1) {
      sortedTableContent = newTableContent.toSorted((a, b) =>
        a[sortColumn].localeCompare(b[sortColumn])
      );
    } else if (sortDirection === 2) {
      sortedTableContent = newTableContent.toSorted((a, b) =>
        a[sortColumn].localeCompare(b[sortColumn])
      ).reverse();
    } else {
      sortedTableContent = newTableContent;
    }

    // For paginated table, go back to the first page
    currentPage = 1;
  }

  function selectAll() {
    const newSet = new Set(selectedIds);
    visibleRows.forEach(row => newSet.add(row.id));
    selectedIds = newSet;
  }

  function deselectAll() {
    const newSet = new Set(selectedIds);
    visibleRows.forEach(row => newSet.delete(row.id));
    selectedIds = newSet;
  }

  function handleSortButtonClick(sortLable: string) {
    if (sortLable == sortColumn) {
      sortDirection = (sortDirection + 1) % 3;
    } else {
      sortColumn = sortLable;
      sortDirection = 1;
    }

    if (sortDirection == 1) {
      sortedTableContent = tableContent.toSorted(
        (a, b) => a[sortColumn].localeCompare(b[sortColumn]));
    } else if (sortDirection == 2) {
      sortedTableContent = tableContent.toSorted(
        (a, b) => a[sortColumn].localeCompare(b[sortColumn])).reverse();
    } else {
      sortedTableContent = tableContent;
    }
  }

  // Update the list of checked rows
  function handleCheckboxOnChange(event, rowId) {
    if (event.target.checked) {
      selectedIds = new Set(selectedIds).add(rowId);
    } else {
      const newSet = new Set(selectedIds);
      newSet.delete(rowId);
      selectedIds = newSet;
    }
  }

  // Update the list of checked rows so that all items are checked, or unchecked
  function handleSelectAllChange(event) {
    if (event.target.checked) {
      selectAll();
    } else {
      deselectAll();
    }
  }

  // Deleting the actual resource should be handeled by the parent class where
  // the row data is set, so, this method only dispatches a deleteResource event
  function handleDeleteRowClick(event, rowId) {
    deleteResource(rowId);
  }
</script>

<div class="overflow-auto">
  <table class="w-full bg-custom-1">
    <thead>
      <tr>
        {#if checkboxCol}
          <!-------------- Check All Checkbox -------------->
          <th class="w-fit border border-custom-9">
            <div class="flex flex-col items-center w-fit mx-auto hover:cursor-pointer relative">
              <label class="block font-custom-style-header-1 whitespace-nowrap mb-2" for="checkAll">
                {selectAllLabel}
              </label>
              <input
                type="checkbox"
                id="checkAll"
                name="checkAll"
                checked={visibleRows.every((row) => selectedIds.has(row.id))}
                class="peer appearance-none min-w-[1.6875rem] h-[1.6875rem] border-2
                  border-custom-16 rounded-sm bg-custom-1 checked:bg-custom-16 hover:cursor-pointer"
                onchange={(event) => handleSelectAllChange(event)}
              />
              <Checkmark
                classes="absolute inset-y-[2.35rem] h-4 w-4 hidden peer-checked:block
                  pointer-events-none text-custom-1 z-10"
              />
            </div>
          </th>
        {/if}

        {#each tableLabelsArray as labelTranslation, i}
          <!-------------- Column Titles -------------->
          <th class={[(i == 0 && tableLabelsArray.length > 1) && "w-1/2"]}>
            <div class="flex flex-row justify-between font-custom-style-header-1">
              {tableLabels[labelTranslation]}
              <button class="px-2" onclick={() => handleSortButtonClick(labelTranslation)}>
                {#if sortDirection == 1 && labelTranslation == sortColumn}
                  <SortUp classes={"inline w-4 h-4 text-custom-16"}/>
                {:else if sortDirection == 2 && labelTranslation == sortColumn}
                  <SortDown classes={"inline w-4 h-4 text-custom-16"}/>
                {:else}
                  <SortInactive classes={"inline w-4 h-4"}/>
                {/if}
              </button>
            </div>
          </th>
        {/each}

        {#if removeCol}
          <!-------------- Remove Row Column -------------->
          <th class="w-fit border border-custom-9">
            <div class="block font-custom-style-header-1 mb-2">
              {deleteLabel}
            </div>
          </th>
        {/if}
      </tr>
    </thead>
    <tbody>
      {#each visibleRows as row, i}
        <tr class={
          [(clickableRows && row?.url && !checkboxCol) &&
            'group hover:bg-custom-5 [&>td:first-child]:text-custom-16 [&>td:first-child]:font-bold [&>td:first-child]:hover:underline',
          (clickableRows && row?.url && checkboxCol) &&
            '[&>td:not(:first-child)]:hover:bg-custom-5 [&>td:nth-child(2)]:text-custom-16 [&>td:nth-child(2)]:font-bold [&>td:nth-child(2)]:hover:underline']
        }>
          {#if checkboxCol}
            <!-------------- Checkbox Column -------------->
            <td class="pointer-events-none align-center p-2.5 h-full">
              <div class="flex pointer-events-auto w-fit mx-auto hover:cursor-pointer ">
                <input
                  type="checkbox"
                  id={"check-" + row?.id}
                  name={"check-" + row?.id}
                  checked={selectedIds.has(row.id)}
                  class="peer appearance-none min-w-[1.6875rem] h-[1.6875rem] border-2
                    border-custom-16 rounded-sm bg-custom-1 checked:bg-custom-16 hover:cursor-pointer"
                  onchange={(event) => handleCheckboxOnChange(event, row.id)}
                />
                <Checkmark
                  classes="absolute h-4 mt-1.5 ml-1.5 hidden peer-checked:block
                    pointer-events-none text-custom-1"
                />
              </div>
            </td>
          {/if}
          {#if clickableRows && row?.url}
            {#each tableLabelsArray as label}
              <!-------------- Clickable Row -------------->
              <td class="font-custom-style-body-4">
                <a href={row.url} rel="external" class="block w-full h-full p-2.5">
                  {@html row[label]}
                </a>
              </td>
            {/each}
          {:else}
            {#each tableLabelsArray as label}
              <!-------------- Non-Clickable Row -------------->
              <td class="font-custom-style-body-4 p-2.5">
                {@html row[label]}
              </td>
            {/each}
          {/if}

          {#if removeCol}
            <!-------------- Remove Row Column -------------->
            <td class="pointer-events-none align-center p-2.5 h-full">
              <div class="flex pointer-events-auto w-fit mx-auto hover:cursor-pointer ">
                <button id={"garbage-" + row?.id}
                  class="p-2 text-custom-16 rounded border-2 border-transparent hover:border-custom-16
                    hover:text-custom-1 hover:bg-custom-16 hover:shadow-[0_0.1875rem_0.375rem_#00000029]"
                  onclick={(event) => handleDeleteRowClick(event, row.id)}
                >
                  <GarbageCan classes={"h-6"} />
                </button>
              </div>
            </td>
          {/if}
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<style>
  thead, td {
    @apply border;
    @apply border-custom-9;
  }

  th {
    @apply p-2.5;
  }
</style>
