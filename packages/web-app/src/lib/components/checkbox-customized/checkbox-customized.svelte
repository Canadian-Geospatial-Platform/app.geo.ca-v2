<script lang="ts">
  import Checkmark from '$lib/components/icons/checkmark.svelte';

  // Note: checkboxes in the same form, with the same name attribute
  // are grouped together
  interface Props {
    checkboxId: string;
    checkboxName: string;
    checkboxLabel: string;
    checked?: boolean;
    linkedLabel?: boolean;
    link?: string;
    checkedStateChange: (arg: Event) => void;
  }

  let {
    checkboxId,
    checkboxName,
    checkboxLabel,
    checked = $bindable(false),
    linkedLabel = false,
    link = "",
    checkedStateChange
  }: Props = $props();

  function handleCheckboxClick(event: Event) {
    checkedStateChange(event);
  }
</script>

<div class="flex gap-[0.8125rem] flex-[1_1_10rem]">
  <input 
    type="checkbox" id={checkboxId} name={checkboxName} bind:checked={checked}
    class="peer appearance-none min-w-[1.6875rem] h-[1.6875rem] border-2
      border-custom-16 rounded-sm bg-custom-1 checked:bg-custom-16"
    onchange={handleCheckboxClick}
  />
  <label for={checkboxId}>
    {#if linkedLabel}
      <a class="inline" href={link}>
        {checkboxLabel}
      </a>
    {:else}
      {checkboxLabel}
    {/if}
  </label>
  <Checkmark
    classes="absolute h-4 mt-1.5 ml-1.5 hidden peer-checked:block
      pointer-events-none text-custom-1"
  />
</div>
