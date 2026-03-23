<script lang="ts">
  import Chevronup from '$lib/components/icons/chevronup.svelte';
  import Chevrondown from '$lib/components/icons/chevrondown.svelte';

  let { accordionTitle, accordionContent } = $props();

  let open = $state(false);

  /**
   * Closes the accordion by setting the open state to false.
   *
   * This function is exported to allow parent components to control when the accordion closes.
   */
  export function closeAccordion(): void {
    open = false;
  }

  /**
   * Handles click events on the accordion header.
   *
   * Toggles the accordion open/closed state unless an anchor tag or button element was clicked.
   * This prevents unintended accordion toggling when clicking interactive elements within the header.
   *
   * @param event - The mouse or keyboard event triggered by user interaction
   */
  function handleButtonClick(event: MouseEvent | KeyboardEvent): void {
    // Do nothing if an <a> or <button> was clicked, this prevents the search results
    // page from loading maps unnecessarily
    if (event.target instanceof Element && (event.target.closest('a') || event.target.closest('button'))) {
      return;
    }

    open = !open;
  }

  /**
   * Handles keydown events for keyboard accessibility.
   *
   * Triggers the accordion toggle when Enter or Space key is pressed.
   *
   * @param event - The keyboard event from user input
   */
  function handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      handleButtonClick(event);
    }
  }
</script>

<div>
  <!--
    Note: this is a clickable div instead of a button to allow for the rendered
    sections (e.g. accordionTitle) to include buttons
  -->
  <div
    onclick={handleButtonClick}
    onkeydown={handleKeydown}
    class="grid grid-cols-12 w-full h-full text-left"
    role="button"
    aria-pressed={open ? 'true' : 'false'}
    aria-expanded={open ? 'true' : 'false'}
    tabindex="0"
    aria-label="Toggle Accordion"
  >
    <div class="col-span-10 sm:col-span-11">
      {@render accordionTitle?.()}
    </div>
    <div class="col-span-1 col-start-12 self-center">
      {#if open}
        <Chevronup classes="mt-1 mr-3 h-7 w-7 ml-auto text-custom-16" />
      {:else}
        <Chevrondown classes="mt-1 mr-3 h-7 w-7 ml-auto text-custom-16" />
      {/if}
    </div>
  </div>
</div>
{#if open}
  <div>
    {@render accordionContent?.()}
  </div>
{/if}
