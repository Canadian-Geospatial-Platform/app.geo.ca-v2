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
		// Do nothing if an <a> or <button> was clicked, this prevents the search results
		// page from loading maps unnecessarily
		if (event.target.closest('a') || event.target.closest('button')) {
			return;
		}

		open = !open;
	}

	function handleKeydown(event) {
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
