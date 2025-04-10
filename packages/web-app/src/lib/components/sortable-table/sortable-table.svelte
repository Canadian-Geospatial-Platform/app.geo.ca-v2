<script lang="ts">
	import SortDown from "$lib/components/icons/sort-down.svelte";
	import SortInactive from "$lib/components/icons/sort-inactive.svelte";
	import SortUp from "$lib/components/icons/sort-up.svelte";

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
  }

  let {
    tableContent,
    tableLabels,
    clickableRows,
    paginated = false,
    currentPage = 0,
    itemsPerPage = 0,
  }: Props = $props();

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

  function handleRowClick(url: string) {
    if (url.length > 0) {
      window.open(url);
    }
  }

  function handleRowClickKeydown(url: string, event: KeyboardEvent) {
    if (url.length > 0 && (event.key == "Enter" || event.key == " ")) {
      window.open(url);
    }
  }
</script>

<div class="overflow-auto">
  <table class="w-full bg-custom-1">
    <thead>
      <tr>
        {#each tableLabelsArray as labelTranslation, i}
          <th class={[(i == 0 && tableLabelsArray.length > 1) && "w-[50%]"]}>
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
      </tr>
    </thead>
    <tbody>
      {#each visibleRows as row}
        {#if clickableRows && row?.url}
          <!--
            Adding a tab index ensures that each clickable row can
            be navigated to using the tab key. Since tr elements are
            not usually navigable, we also need to manually add a
            keydown event to enable using enter or space to open the url.
          -->
          <tr
            onclick={() => handleRowClick(row.url)}
            onkeydown={(event) => handleRowClickKeydown(row.url, event)}
            class="group hover:bg-custom-5 hover:cursor-pointer"
            tabindex="0"
            role="button"
          >
            {#each tableLabelsArray as label}
              <td class="font-custom-style-body-4 first:text-custom-16 first:font-bold first:group-hover:underline">
                {@html row[label]}
              </td>
            {/each}
          </tr>
        {:else}
          <tr>
            {#each tableLabelsArray as label}
              <td class="font-custom-style-body-4">
                {@html row[label]}
              </td>
            {/each}
          </tr>
        {/if}
      {/each}
    </tbody>
  </table>
</div>

<style>
  thead, td {
    @apply border;
    @apply border-custom-9;
  }

  th, td {
    @apply p-2.5;
  }
</style>
