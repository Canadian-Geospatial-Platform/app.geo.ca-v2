<script lang="ts">
  import Chevronup from '$lib/components/icons/chevronup.svelte';
  import Chevrondown from '$lib/components/icons/chevrondown.svelte';
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();

  let open = false;

  function handleButtonClick() {
    open = !open;
    if (open) {
      dispatch('openChange');
    }
  };
</script>

<div>
  <button on:click={handleButtonClick} class="grid grid-cols-12 w-full h-full text-left">
    <div class="col-span-11">
      <slot name="accordianTitle"></slot>
    </div>
    <div class="col-span-1 self-center">
      {#if open}
        <Chevronup classes="mt-1 ml-1 h-5 w-5 ml-auto text-custom-16"/>
      {:else}
        <Chevrondown classes="mt-1 ml-1 h-5 w-5 ml-auto text-custom-16"/>
      {/if}
    </div>
  </button>
</div>
<div class:hidden={!open}>
  <slot name="accordianContent"></slot>
</div>
