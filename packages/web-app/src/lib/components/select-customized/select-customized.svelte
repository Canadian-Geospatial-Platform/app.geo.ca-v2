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
  import type { ComponentType } from "svelte";
	import Chevrondown from "$lib/components/icons/chevrondown.svelte";
  import Chevronup from "$lib/components/icons/chevronup.svelte";
  import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

  type SelectOption = {
    value: string,
    label: string,
    // The icon should be a component from the 'icons' folder
    icon?: ComponentType,
  }

  export let optionsData: Array<SelectOption>;
  // The default selection object
  export let selected: SelectOption;
  
  let iconClasses = "w-4 h-4 self-center mr-1";
  $: expanded = false;

  function handleSelectClick() {
    expanded = !expanded;
  }

  function handleOptionClick(option: SelectOption) {
    expanded = !expanded;
    selected = option;
    dispatch('selectedChange', selected);
  }
</script>

<div class="w-full md:w-48">
  <button 
    class="grid grid-cols-12 w-full button-3"
    aria-haspopup="listbox" 
    aria-expanded={expanded}
    on:click={handleSelectClick}
  >
    <span class="col-span-11 justify-self-center md:justify-self-start flex flex-row translate-x-[13.1%] md:translate-x-0">
      {selected.label}
      {#if selected?.icon}
        <svelte:component this={selected.icon} classes={iconClasses}/>
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
    class="responsive-width md:w-44 absolute z-10 mx-2 border-x border-b border-custom-16
      divide-y divide-custom-16 text-custom-16"
    class:hidden={!expanded}
  >
    {#each optionsData as option}
      <button class="flex flex-row w-full px-6 py-2 cursor-pointer bg-custom-1"
        id={option.value}
        role="option"
        aria-selected={option.value == selected.value}
        class:selected-option={option.value == selected.value}
        on:click={() => handleOptionClick(option)}
      >
        {option.label}
        {#if option?.icon}
          <svelte:component this={option.icon} classes={iconClasses}/>
        {/if}
      </button>
    {/each}
  </div>
</div>

<style>
  .selected-option {
    @apply bg-custom-16;
    @apply text-custom-1;
  }

  @media (max-width: 767px) {
    .responsive-width {
      width: calc(100% - 64px);
    }
  }
</style>
