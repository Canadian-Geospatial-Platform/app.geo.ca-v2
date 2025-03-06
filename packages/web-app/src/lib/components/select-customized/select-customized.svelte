<!-----------------------------------------------------------------
  When a selection is made, a custom 'selectedChange' event is
  dispatched with the option's 'SelectOption' object as the 
  event's value. So, it is up to the parent component to
  handle the select change like this:

  <SelectCustomized
    ...
    selectedChange={myHandler}
  />

  <script>
    ...

    function myHandler(event) {
      selected = event;
      ...
    }
  </script>
------------------------------------------------------------------>

<script lang="ts">
  import { page } from "$app/stores";
	import Chevrondown from "$lib/components/icons/chevrondown.svelte";
  import Chevronup from "$lib/components/icons/chevronup.svelte";
  import Close from '$lib/components/icons/close.svelte';
  import type { SelectOption } from '$lib/components/select-customized/selected-types.d.ts';

  interface Props {
    optionsData: Array<SelectOption>;
    // The default selection object
    selected: SelectOption | undefined | null;
    removableSelection?: boolean;
    defaultLabel?: string;
    selectType?: string;
    selectedChange: CustomEvent;
  }

  let {
    optionsData,
    selected = $bindable(),
    removableSelection = false,
    defaultLabel = "",
    selectType = "default",
    selectedChange
  }: Props = $props();

  const lang = $page.data.lang;
  let clearAriaLabel = lang == 'fr-ca' ? 'Effacer la sélection' : 'Clear selection';

  let expanded = $state(false);
  let selectEl = $state();

  function handleSelectionChange(event) {
    let value = event?.target?.value;

    if (value != selected?.value) {
      selected = optionsData.find((x) => x.value == value);
      selectedChange(selected);
    }
  }

  function handleSelectClick(event) {
    expanded = !expanded;
  }

  function handleSearchEnterKeyDown(event) {
    let key = event.key;
    if (key == "Enter" || (key == " " && !expanded)) {
      expanded = !expanded;
    }
  }

  function handleBlur() {
    expanded = false;
  }

  function handleRemoveSelect(event) {
    // Change focus to select element instead of the remove button
    // since the remove button will be removed from the DOM when no
    // option is selected
    if (selectEl instanceof HTMLSelectElement) {
      selectEl.focus();
    }

    // remove the selection
    expanded = false;
    selected = null;
    selectedChange(selected);
  }

</script>

<div
  class={[
    "relative",
    selectType == "resultList" && "resultList",
    selectType == 'default' && "default"
  ]}
>
  <select
    class={[
      "pr-16 md:pr-12 appearance-none cursor-pointer",
      (selectType == "tabCard") && "tabCard",
      (selectType == "categoryFilter") && "categoryFilter",
      (selectType == "resultList" || selectType == "default") && "select-button-2",
      (selectType == "categoryFilter" || selectType == "tabCard") && "button-4"
    ]}
    onchange={handleSelectionChange}
    onclick={handleSelectClick}
    onkeydown={handleSearchEnterKeyDown}
    onblur={handleBlur}
    bind:this={selectEl}
  >
    {#if defaultLabel}
      {#if !selected}
        <option value="" disabled={!removableSelection} selected>{defaultLabel}</option>
      {:else}
        <option value="" disabled={!removableSelection}>{defaultLabel}</option>
      {/if}
    {/if}

    {#each optionsData as option}
      {#if selected && selected.value == option.value}
        <option value={option.value} selected>{option.label}</option>
      {:else}
        <option value={option.value}>{option.label}</option>
      {/if}
    {/each}
  </select>
  {#if selected && removableSelection}
    <button
      type="button"
      aria-label={clearAriaLabel}
      class="clear-btn absolute top-1/4 right-10 md:right-14 text-gray-400 rounded-full p-1.5"
      onclick={handleRemoveSelect}
    >
      <Close classes="w-2.5 h-2.5"/>
    </button>
  {/if}
  {#if expanded}
    <Chevronup classes="w-5 h-5 absolute top-1/4 right-4 md:right-6 pointer-events-none"/>
  {:else}
    <Chevrondown classes="w-5 h-5 absolute top-1/4 right-4 md:right-6 pointer-events-none"/>
  {/if}
</div>

<style>
  .resultList,
  .default {
    @apply text-custom-16;
  }

  .tabCard,
  .categoryFilter {
    /* Set the font explicitly for firefox with a fall back to system-ui */
    font-family: Open Sans, system-ui;
    @apply w-full;
  }

  .clear-btn:hover,
  .clear-btn:focus {
    @apply text-custom-1;
    @apply bg-custom-22;
  }

  option {
    /* Ensures <option> inherits from <select> specifically for firefox */
    font-family: inherit;
  }
</style>
