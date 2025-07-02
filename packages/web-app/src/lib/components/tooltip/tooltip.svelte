<script lang="ts">
	import { setPosition } from './setPosition';

	let { describedById, tooltipText } = $props();
</script>

<!--
  * NOTE: when creating a tooltip, the parent element should always have
  * an "aria-describedby" property that matches the "id" of the div below.
  * This is to ensure the tooltip is accessible and to ensure the global
  * css properties are applied correctly. For example, from the parent
  * component you can have something like this:
  *
  *  <a aria-describedby={tooltipId} ...>
  *    <Tooltip describedById={tooltipId} .../>
  *  </a>
  *
  * A tooltip's parent class should also be some type of focusable element,
  * i.e. buttons, inputs, anchors, etc. to ensure it can be accessed using
  * the tab key. 
-->
<div role="tooltip" id={describedById} use:setPosition>
	{tooltipText}
</div>

<style>
	[role='tooltip'] {
		@apply hidden;
		@apply absolute;
		@apply ml-4;
		@apply p-2;
		@apply w-40;
		@apply bg-custom-7;
		@apply text-custom-1;
		@apply rounded;
	}

	:global([aria-describedby]:hover),
	:global([aria-describedby]:focus) {
		@apply relative;
	}

	:global([aria-describedby]:hover > [role='tooltip']),
	:global([aria-describedby]:focus > [role='tooltip']) {
		@apply inline;
	}
</style>
