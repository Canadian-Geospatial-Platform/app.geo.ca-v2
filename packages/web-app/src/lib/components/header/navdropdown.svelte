<script lang="ts">
	import { setPosition } from './setPosition';
	import Info from '../icons/info.svelte';
	import Tooltip from '../tooltip/tooltip.svelte';

	let { options, active = $bindable(), orientation } = $props();
</script>

<div
	class={[
		'hidden',
		active && orientation === 'horizontal' && 'horizontal',
		active && orientation === 'vertical' && 'vertical'
	]}
	use:setPosition={orientation === 'horizontal'}
>
	{#each options as option}
		<div
			class={[
				'bg-custom-1 p-4',
				orientation === 'horizontal' && 'option-horizontal',
				orientation === 'vertical' && 'option-vertical'
			]}
		>
			{#if option?.colTitle}
				<div class="font-custom-style-header-1">
					{option['colTitle']}
				</div>
			{/if}
			{#each option['links'] as link}
				<div class="block px-3 py-2 font-custom-style-header-2">
					{#if link?.info && link?.tipId}
						<a class="hover:underline" href={link['href']} aria-describedby={link['tipId']}>
							{link['title']}
							<Info classes="inline h-3 w-3 text-custom-8" />
							<Tooltip describedById={link['tipId']} tooltipText={link['info']} />
						</a>
					{:else}
						<a class="hover:underline" href={link['href']}>
							{link['title']}
						</a>
					{/if}
				</div>
			{/each}
		</div>
	{/each}
</div>

<style>
	.horizontal {
		@apply flex;
		@apply absolute;
		@apply z-20;
		@apply top-[0.28em];
		@apply left-1/2;
		@apply -translate-x-1/2;
		@apply p-4;
		@apply space-x-4;
		@apply bg-custom-5;
	}

	.vertical {
		@apply grid;
		@apply grid-cols-1;
		@apply w-full;
	}

	.option-horizontal {
		@apply w-56;
	}

	.option-vertical {
		@apply w-full;
	}
</style>
