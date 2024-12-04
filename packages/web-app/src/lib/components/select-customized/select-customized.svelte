<!-----------------------------------------------------------------
  The default HTML <select> component has two main disadvantages:
    - The drop-down options are difficult to style
    - Individual browsers render selects using different styles,
      causing an inconsistent experience.
  This component is a simple custom select designed to fix those
  problems.

  When using this component, the drop-down options are specified
  in an array of 'SelectOption' objects with the following keys:
    - value - string
    - label - string
    - icon (optional) - an icon component to add an svg icon to the
      option

  When a selection is made, a custom 'selectedChange' event is
  dispatched with the option's 'SelectOption' object as the 
  event's detail value. So, it is up to the parent component to
  handle the select change like this:

  <SelectCustomized
    ...
    on:selectedChange={myHandler}
  />

  <script>
    ...

    function myHandler(event) {
      selected = event.detail;
      ...
    }
  </script>
------------------------------------------------------------------>

<script lang="ts">
  import { createEventDispatcher, afterUpdate } from 'svelte';
	import Chevrondown from "$lib/components/icons/chevrondown.svelte";
  import Chevronup from "$lib/components/icons/chevronup.svelte";
  import Close from '$lib/components/icons/close.svelte';
  import type { SelectOption } from '$lib/components/select-customized/selected-types.d.ts';

	const dispatch = createEventDispatcher();

  export let optionsData: Array<SelectOption>;
  // The default selection object
  export let selected: SelectOption | undefined | null;
  export let selectId: string;
  export let buttonClasses: string = "select-button-2";
  export let buttonWidth: string = "w-full";
  export let iconClasses: string = "w-4 h-4 self-center mr-1";
  export let dropDownColor: string = "#535AA4";
  export let removableSelection: boolean = false;
  export let defaultLabel: string = "";

  let expanded = false;

  function handleSelectClick() {
    expanded = !expanded;
  }

  function handleOptionClick(option: SelectOption) {
    expanded = false;
    selected = option;
    dispatch('selectedChange', selected);
  }

  function handleRemoveSelect() {
    selected = null;
    expanded = false;
    dispatch('selectedChange', selected);
  }

  // Set the width of the dropdown based on the unknown width of the select button
  let selectButton: HTMLElement;
  let dropDown: HTMLElement;

  afterUpdate(() => {
    if (selectButton && dropDown) {
      const selectButtonWidth = selectButton.offsetWidth;
      dropDown.style.width = `${selectButtonWidth - 12}px`;
    }
  });
</script>

<button 
  class="grid grid-cols-12 {buttonClasses} {buttonWidth}"
  aria-haspopup="listbox" 
  aria-expanded={expanded}
  value={selected?.value ?? ''}
  id={selectId}
  type="button"
  on:click={handleSelectClick}
  bind:this={selectButton}
>
  <span
    class="group col-span-11 justify-self-start flex flex-row"
  >
    {#if selected}
      {#if selected?.icon}
        <svelte:component this={selected.icon} classes={iconClasses}/>
      {/if}
      {selected.label}
      {#if removableSelection}
        <button
          class="flex invisible group-hover:visible justify-center items-center
            p-2 mx-1 hover:bg-custom-5 rounded-[50%]"
          type="button"
          on:click|stopPropagation={handleRemoveSelect}
        >
          <Close classes="h-2"/>
        </button>
      {/if}
    {:else}
      <span class="text-custom-9">
        {defaultLabel}
      </span>
    {/if}
  </span>
  <span class="justify-self-end">
    {#if expanded}
      <Chevronup classes="w-5 h-5"/>
    {:else}
      <Chevrondown classes="w-5 h-5"/>
    {/if}
  </span>
</button>
<div
  class="custom-dropdown absolute z-10 mx-1.5 shadow-lg border-x-2 border-b-2 rounded-b-[0.3125rem] bg-custom-1"
  style:--dropDownColor={dropDownColor}
  class:hidden={!expanded}
  bind:this={dropDown}
>
  {#each optionsData as option}
    <button class="flex flex-row w-full px-6 py-2 cursor-pointer bg-custom-1
        last:rounded-b-sm hover:bg-custom-5"
      id={option.value}
      role="option"
      aria-selected={option.value == selected?.value}
      class:selected-option={option.value == selected?.value}
      type="button"
      on:click={() => handleOptionClick(option)}
    >
      {#if option?.icon}
        <svelte:component this={option.icon} classes={iconClasses}/>
      {/if}
      {option.label}
    </button>
  {/each}
</div>

<style>
  .custom-dropdown {
    border-color: var(--dropDownColor);
    color: var(--dropDownColor);
  }

  .selected-option {
    background-color: var(--dropDownColor);
    @apply text-custom-1;
  }
</style>
