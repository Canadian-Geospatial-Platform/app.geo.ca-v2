<script lang="ts">
  import Chevronup from '$lib/components/icons/chevronup.svelte';
  import Chevrondown from '$lib/components/icons/chevrondown.svelte';

  let { accordionTitle, accordionContent }: Props = $props();

  let open = $state(false);

  // Allow parent component to control when the Accordian closes
  export function closeAccordion() {
    open = false;
  }

  function handleButtonClick(event) {
    // Do nothing if an <a> was clicked, this prevents the search results
    // page from loading maps unnecessarily
    if (event.target.closest('a')) {
      return;
    }

    open = !open;
  }
</script>

<div>
  <button onclick={handleButtonClick} class="grid grid-cols-12 w-full h-full text-left">
    <div class="col-span-10">
      {@render accordionTitle?.()}
    </div>
    <div class="col-span-1 col-start-12 self-center">
      {#if open}
        <Chevronup classes="mt-1 mr-3 h-7 w-7 ml-auto text-custom-16" />
      {:else}
        <Chevrondown classes="mt-1 mr-3 h-7 w-7 ml-auto text-custom-16" />
      {/if}
    </div>
  </button>
</div>
{#if open}
  <div>
    {@render accordionContent?.()}
  </div>
{/if}
