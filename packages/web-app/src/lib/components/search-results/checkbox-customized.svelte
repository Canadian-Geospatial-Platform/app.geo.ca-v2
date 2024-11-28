<script lang="ts">
  import Checkmark from '$lib/components/icons/checkmark.svelte';
  import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

  // Note: checkboxes in the same form, with the same name attribute
  // are grouped together
  export let checkboxId: string;
  export let checkboxName: string;
  export let checkboxLabel: string;
  export let checked: boolean = false;

  function handleCheckboxClick(event: Event) {
    dispatch('checkedStateChange', event);
  }
</script>

<div class="flex gap-[13px] flex-[1_1_160px]">
  <input 
    type="checkbox" id={checkboxId} name={checkboxName} bind:checked={checked}
    class="peer appearance-none min-w-[27px] h-[27px] border-2 
      border-custom-16 rounded-sm bg-custom-1 checked:bg-custom-16"
    on:change={handleCheckboxClick}
  />
  <label for={checkboxId}>
    {checkboxLabel}
  </label>
  <Checkmark
    classes="absolute h-4 mt-1.5 ml-1.5 hidden peer-checked:block
      pointer-events-none text-custom-1"
  />
</div>