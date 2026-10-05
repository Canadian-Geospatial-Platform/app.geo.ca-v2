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
  import { tick } from 'svelte';
  import { fly } from 'svelte/transition';
  import { page } from '$app/state';
  import { pickByLanguage } from '$lib/utils/language';
  import Chevrondown from '$lib/components/icons/chevrondown.svelte';
  import Chevronup from '$lib/components/icons/chevronup.svelte';
  import Close from '$lib/components/icons/close.svelte';
  import type { SelectOption } from '$lib/components/select-customized/selected-types.d.ts';

  interface Props {
    optionsData: Array<SelectOption>;
    // The default selection object
    selected: SelectOption | undefined;
    removableSelection?: boolean;
    defaultLabel?: string;
    selectType?: string;
    selectedChange: (selected: SelectOption | null) => void;
  }

  let {
    optionsData,
    selected = $bindable(),
    removableSelection = false,
    defaultLabel = '',
    selectType = 'default',
    selectedChange,
  }: Props = $props();

  const lang = page.data.lang;
  let clearAriaLabel = pickByLanguage(lang, 'Clear selection', 'Effacer la sélection');
  let selectAriaLabel = pickByLanguage(lang, 'Select option', 'Selectionner une option');

  let expanded = $state(false);
  let customTriggerEl = $state<HTMLButtonElement>();
  let customMenuEl = $state<HTMLDivElement>();

  const isResultList = $derived(selectType === 'resultList');
  const isTabCard = $derived(selectType === 'tabCard');
  const isDefault = $derived(selectType === 'default');
  const selectedLabel = $derived(selected?.label ?? defaultLabel ?? optionsData[0]?.label ?? '');

  const triggerClasses = $derived.by(() => {
    return [
      'button-action-light relative text-left',
      !isResultList && 'surface-shadow',
      isResultList
        ? 'min-w-[10rem] pr-11'
        : isTabCard
          ? 'w-full pr-10 select-trigger-tab-card'
          : isDefault
            ? 'w-fit min-w-0 px-3! py-1! pr-9! text-sm select-trigger-compact'
            : 'w-full pr-7 select-trigger-compact',
      expanded && 'select-trigger-open',
    ];
  });

  const chevronClasses = $derived(
    `w-5 h-5 absolute top-1/2 -translate-y-1/2 pointer-events-none ${isResultList || isTabCard ? 'right-4' : 'right-2'}`
  );

  const menuClasses = $derived.by(() => {
    if (isResultList) {
      return 'absolute right-0 z-20 mt-2 min-w-full overflow-hidden rounded border border-custom-16 bg-custom-1 surface-shadow';
    }

    return 'absolute left-0 z-20 mt-2 overflow-hidden rounded border border-custom-16 bg-custom-1 surface-shadow';
  });

  const menuStyle = $derived(isDefault && customTriggerEl ? `width: ${customTriggerEl.offsetWidth}px;` : undefined);

  /**
   * Focuses the currently selected option in the open menu.
   */
  function focusSelectedOption(): void {
    const selectedOption = customMenuEl?.querySelector<HTMLButtonElement>('[aria-selected="true"]');
    selectedOption?.focus();
  }

  /**
   * Handles the custom dropdown trigger click event.
   */
  async function handleCustomSelectClick(): Promise<void> {
    expanded = !expanded;

    if (expanded) {
      await tick();
      focusSelectedOption();
    }
  }

  /**
   * Handles the keydown event on the custom dropdown trigger.
   *
   * @param event - The keyboard event.
   */
  async function handleCustomTriggerKeyDown(event: KeyboardEvent): Promise<void> {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      await handleCustomSelectClick();
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();

      if (!expanded) {
        expanded = true;
        await tick();
      }

      focusSelectedOption();
      return;
    }

    if (event.key === 'Escape') {
      expanded = false;
    }
  }

  /**
   * Closes the custom dropdown when focus leaves it.
   *
   * @param event - The focus event.
   */
  function handleCustomFocusOut(event: FocusEvent): void {
    const relatedTarget = event.relatedTarget;

    if (relatedTarget instanceof Node && customMenuEl?.parentElement?.contains(relatedTarget)) {
      return;
    }

    expanded = false;
  }

  /**
   * Handles selecting an option from the custom dropdown.
   *
   * @param option - The selected option.
   */
  function handleCustomOptionClick(option: SelectOption): void {
    if (option.value !== selected?.value) {
      selected = option;
      selectedChange(selected);
    }

    expanded = false;
    customTriggerEl?.focus();
  }

  /**
   * Handles the remove selection button click event.
   */
  function handleRemoveSelect(): void {
    // remove the selection
    expanded = false;
    selected = undefined;
    selectedChange(selected || null);
    customTriggerEl?.focus();
  }
</script>

<div class="relative">
  <div class="relative" onfocusout={handleCustomFocusOut}>
    {#if selected && removableSelection}
      <button
        type="button"
        aria-label={clearAriaLabel}
        class="clear-btn focus-visible-standard absolute top-1/4 right-10 md:right-14 z-10 text-gray-400 rounded-full p-1.5 cursor-pointer"
        onclick={handleRemoveSelect}
      >
        <Close classes="w-2.5 h-2.5" />
      </button>
    {/if}

    <button
      type="button"
      class={[...triggerClasses, 'focus-visible-standard']}
      aria-label={selectAriaLabel}
      aria-haspopup="listbox"
      aria-expanded={expanded ? 'true' : 'false'}
      onclick={handleCustomSelectClick}
      onkeydown={handleCustomTriggerKeyDown}
      bind:this={customTriggerEl}
    >
      <span class="block truncate pr-6">{selectedLabel}</span>
      {#if expanded}
        <Chevronup classes={chevronClasses} />
      {:else}
        <Chevrondown classes={chevronClasses} />
      {/if}
    </button>

    {#if expanded}
      <div
        class={menuClasses}
        style={menuStyle}
        role="listbox"
        aria-label={selectAriaLabel}
        bind:this={customMenuEl}
        transition:fly={{ y: 4, duration: 140 }}
      >
        {#each optionsData as option (option.value)}
          <button
            type="button"
            class="result-list-option focus-visible-standard w-full px-4 py-2 text-left text-custom-16"
            role="option"
            aria-selected={selected?.value === option.value ? 'true' : 'false'}
            onclick={() => handleCustomOptionClick(option)}
          >
            {option.label}
          </button>
        {/each}
      </div>
    {/if}
  </div>
</div>

<style lang="postcss">
  @reference "../../../app.css";
  .clear-btn:hover,
  .clear-btn:focus {
    @apply text-custom-1;
    @apply bg-custom-22;
  }

  .result-list-option:hover,
  .result-list-option:focus {
    @apply bg-custom-23;
    @apply text-custom-1;
    @apply outline-none;
  }

  .select-trigger-compact {
    @apply px-3;
    @apply py-1;
  }

  .select-trigger-tab-card {
    @apply px-4;
    @apply py-2;
  }

  .select-trigger-open,
  .select-trigger-open:hover,
  .select-trigger-open:focus,
  .select-trigger-open:focus-visible {
    @apply bg-custom-16;
    @apply text-custom-1;
    @apply border-custom-16;
  }

  .result-list-option[aria-selected='true'] {
    @apply bg-custom-16;
    @apply text-custom-1;
    @apply font-semibold;
  }
</style>
