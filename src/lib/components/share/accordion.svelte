<script lang="ts">
	export let id: string;
	export let title: string;
	let active = false;
	function handle() {
		active = !active;
		var panel = this.nextElementSibling;
		if (panel.style.display === 'block') {
			panel.style.display = 'none';
		} else {
			panel.style.display = 'block';
		}
	}
</script>

<section {id} class="w-full pt-6">
	<button
		type="button"
		on:click={handle}
		class={active ? 'accordion active' : 'accordion'}
		aria-expanded={active}
		aria-controls={`${id}-panel`}>{title}</button
	>
	<div class="panel" id={`${id}-panel`}>
		<slot />
	</div>
</section>

<style>
	.accordion {
		@apply bg-custom-10;
		@apply text-white;
		@apply cursor-pointer;
		@apply p-4;
		@apply w-full;
		@apply text-left;
		@apply text-2xl;
		@apply uppercase;
		@apply border-none;
		@apply outline-none;
		@apply duration-500;
	}

	.active,
	.accordion:hover {
		@apply bg-blue-400;
	}

	.panel {
		@apply pt-2;
		@apply text-white;
		@apply bg-custom-10;
		@apply hidden;
		@apply overflow-hidden;
	}

	.accordion:after {
		content: '\02795'; /* Unicode character for "plus" sign (+) */
		font-size: 13px;
		float: right;
		margin-left: 5px;
	}

	.active:after {
		content: '\2796'; /* Unicode character for "minus" sign (-) */
	}
</style>
