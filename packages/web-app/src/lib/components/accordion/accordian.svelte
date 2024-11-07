<script lang="ts">
  import Chevronup from '$lib/components/icons/chevronup.svelte';
  import Chevrondown from '$lib/components/icons/chevrondown.svelte';
  import { createEventDispatcher, afterUpdate, onMount } from 'svelte';

  const dispatch = createEventDispatcher();

  let open = false;
  let slotContent = null;
  let tempSlotContent = null;

  function handleButtonClick() {
    open = !open;
    if (open) {
      dispatch('openChange');
    }
  };

  // Automatically close the acordian when the slot content changes.
  // For example, a change in search filter settings, or pagination change.
  // To do this, we need to keep track of the slot content so that the
  // afterUpdate method isn't triggered by other actions like opening/closing
  // the acordian
  onMount(() => {
    tempSlotContent = slotContent?.innerText;
	});

  afterUpdate(() => {
    if (tempSlotContent != slotContent?.innerText) {
		  open = false;
		  tempSlotContent = slotContent?.innerText;
    }
  });
</script>

<div>
  <button on:click={handleButtonClick} class="grid grid-cols-12 w-full h-full text-left">
    <div bind:this={slotContent} class="col-span-10">
      <slot name="accordianTitle"></slot>
    </div>
    <div class="col-span-1 col-start-12 self-center">
      {#if open}
        <Chevronup classes="mt-1 mr-3 h-7 w-7 ml-auto text-custom-16"/>
      {:else}
        <Chevrondown classes="mt-1 mr-3 h-7 w-7 ml-auto text-custom-16"/>
      {/if}
    </div>
  </button>
</div>
{#if open}
  <div>
    <slot name="accordianContent"></slot>
  </div>
{/if}
