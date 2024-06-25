<script lang="ts">
	import SortDown from "$lib/components/icons/sort-down.svelte";
	import SortInactive from "$lib/components/icons/sort-inactive.svelte";
	import SortUp from "$lib/components/icons/sort-up.svelte";

  // Every item in the array should have the same set of keys,
  // since the keys will become the column titles of the table
  type TableContent = Array<any>;

  export let tableContent: TableContent;
  export let tableLabels;
  // Requires a url attriute in the tableContent array
  export let clickableRows: boolean;

  // Convert table label keys to an array to ensure that all data rows have the same order
  // and to simplify sorting
  const tableLabelsArray: Array<string> = [];
  for (const label in tableLabels) {
    tableLabelsArray.push(label);
  }

  let sortColumn = tableLabelsArray[0];
  // Can be 0 (default order from tableLabelsArray), 1 (a-z, sort-down icon), or 2 (z-a, sort-up icon)
  let sortDirection = 0;
  // Unsorted by default
  let sortedTableContent = tableContent;

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
      window.open(url, '_blank').focus();
    }
  }
</script>

<table class="w-full bg-custom-1">
  <thead>
    <tr>
      {#each tableLabelsArray as labelTranslation, i}
        <th class:w-[50%]={i == 0 && tableLabelsArray.length > 1}>
          <div class="flex flex-row justify-between font-custom-style-header-1">
            {tableLabels[labelTranslation]}
            <button class="px-2" on:click={() => handleSortButtonClick(labelTranslation)}>
              {#if sortDirection == 1 && labelTranslation == sortColumn}
                <SortDown classes={"inline w-4 h-4 text-custom-16"}/>
              {:else if sortDirection == 2 && labelTranslation == sortColumn}
                <SortUp classes={"inline w-4 h-4 text-custom-16"}/>
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
    {#each sortedTableContent as row}
      {#if clickableRows && Object.hasOwn(row, "url")}
        <tr on:click={handleRowClick(row.url)} class="hover:bg-custom-5 hover:cursor-pointer">
          {#each tableLabelsArray as label}
            <td class="font-custom-style-body-4">
              {row[label]}
            </td>
          {/each}
        </tr>
      {:else}
        <tr>
          {#each tableLabelsArray as label}
            <td class="font-custom-style-body-4">
              {row[label]}
            </td>
          {/each}
        </tr>
      {/if}
    {/each}
  </tbody>
</table>

<style>
  thead, td {
    @apply border;
    @apply border-custom-9;
  }

  th, td {
    @apply p-2.5;
  }
</style>