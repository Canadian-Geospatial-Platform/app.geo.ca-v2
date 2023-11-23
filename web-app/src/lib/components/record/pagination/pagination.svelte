<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();
	export let rpp: number;
	export let ppg: number;
	export let rcnt: number;
	export let current: number;

	const pcnt = Math.ceil(rcnt / rpp);
	const pgcnt = Math.ceil(pcnt / ppg);
	const cgroup = Math.ceil(current / ppg);
	const pagenumbers: number[] = [];

	for (let i = (cgroup - 1) * ppg + 1; i <= Math.min(cgroup * ppg, pcnt); i++) {
		pagenumbers.push(i);
	}
	$: max = Math.min(current * rpp, rcnt);
</script>

<nav class="pagination-container" aria-label="search results">
	<p class="pagination-total2 text-center" role="status">
		{(current - 1) * rpp + 1} - {max} of total {rcnt} records
	</p>
	{#if pcnt > 1}
		<ul class="pagination pagination-list2 text-center">
			{#if pgcnt > 1}
				<li class={cgroup === 1 ? 'list-item first disabled' : 'list-item first'}>
					<button
						type="button"
						class={cgroup > 1 ? 'page-link page-link-ico' : 'page-link page-link-ico disabled'}
						on:click={cgroup > 1
							? () => dispatch('handleRelatedPage', { pnum: (cgroup - 1) * ppg })
							: undefined}
						aria-label="previous page group"
						aria-disabled={cgroup === 1 ? 'true' : 'false'}
					>
						first
					</button>
				</li>
			{/if}
			<li class={current === 1 ? 'list-item previous disabled' : 'list-item previous'}>
				<button
					type="button"
					class={current > 1 ? 'page-link page-link-ico' : 'page-link page-link-ico disabled'}
					on:click={current > 1
						? () => dispatch('handleRelatedPage', { pnum: current - 1 })
						: undefined}
					aria-label="Previous page"
					aria-disabled={current === 1 ? 'true' : 'false'}
				>
					prev
				</button>
			</li>

			{#each pagenumbers as pn}
				<li class={pn !== current ? 'list-item' : 'list-item current disabled'}>
					<button
						type="button"
						class="page-link"
						aria-label={'Page ' + pn}
						aria-disabled={pn === current ? true : false}
						on:click={pn !== current
							? () => dispatch('handleRelatedPage', { pnum: pn })
							: undefined}
					>
						{pn}
					</button>
				</li>
			{/each}

			<li class={current === pcnt ? 'list-item next disabled' : 'list-item next'}>
				<button
					type="button"
					class={current < pcnt ? 'page-link page-link-ico' : 'page-link page-link-ico disabled'}
					on:click={current < pcnt
						? () => dispatch('handleRelatedPage', { pnum: current + 1 })
						: undefined}
					aria-label="next page"
					aria-disabled={current === pcnt ? 'true' : 'false'}
				>
					next
				</button>
			</li>
			{#if pgcnt > 1}
				<li class={cgroup === pgcnt ? 'list-item last disabled' : 'list-item last'}>
					<button
						type="button"
						class={cgroup < pgcnt ? 'page-link page-link-ico' : 'page-link page-link-ico disabled'}
						on:click={cgroup < pgcnt
							? () => dispatch('handleRelatedPage', { pnum: cgroup * ppg + 1 })
							: undefined}
						aria-label="next page group"
						aria-disabled={cgroup === pgcnt ? 'true' : 'false'}
					>
						last
					</button>
				</li>
			{/if}
		</ul>
	{/if}
</nav>

<style>
	.pagination-container {
		font-size: 0.875rem;
		padding: 1rem 0 0.5rem 0;
		margin: auto;
		max-width: calc(100vw - 61px);
	}
	.pagination-container .pagination-total {
		color: #1f1f1f;
		margin-bottom: 0.5rem;
	}
	.pagination-container .pagination-total2 {
		color: #fff;
		margin-bottom: 0.5rem;
	}
	.pagination-container .pagination-list {
		margin-bottom: 0;
	}
	.pagination-container .pagination-list .list-item.current .page-link {
		background-color: transparent;
		color: #000;
		font-weight: 600;
	}
	.pagination-container .pagination-list .list-item .page-link {
		background-color: transparent;
		border: none;
		color: rgba(0, 0, 0, 0.5);
		font-weight: 400;
		transition: all 0.3s ease;
		padding: 0.5rem 0.6rem;
	}
	.pagination-container .pagination-list .list-item .page-link .ico-pagination {
		border: 1px solid #515aa9;
		border-radius: 25px;
		color: #515aa9;
		font-size: 1.375em;
		transition: all 0.3s ease;
	}
	.pagination-container .pagination-list .list-item .page-link:focus {
		background-color: transparent;
		color: #000;
		font-weight: 600;
	}
	.pagination-container .pagination-list .list-item .page-link:focus .ico-pagination {
		background-color: #515aa9;
		color: #fff;
	}
	.pagination-container .pagination-list .list-item.disabled .page-link:hover {
		cursor: default;
	}
	.pagination-container .pagination-list .list-item.disabled .page-link:focus {
		color: #515aa9;
	}
	.pagination-container .pagination-list .list-item.disabled:not(.current) .page-link {
		opacity: 0.5;
	}
	.pagination-container .pagination-list .list-item:not(.disabled) .page-link:hover {
		background-color: transparent;
		color: #000;
		font-weight: 600;
	}
	.pagination-container
		.pagination-list
		.list-item:not(.disabled)
		.page-link:hover
		.ico-pagination {
		background-color: #515aa9;
		color: #fff;
	}
	.pagination-container .pagination-list2 {
		margin-bottom: 0;
	}
	.list-item {
		display: inline-block;
	}
	.pagination-container .pagination-list2 .list-item.current .page-link {
		background-color: transparent;
		color: #fff;
		font-weight: 600;
	}
	.pagination-container .pagination-list2 .list-item .page-link {
		background-color: transparent;
		border: none;
		color: #c2c2c2;
		font-weight: 300;
		transition: all 0.3s ease;
		padding: 0.5rem 0.6rem;
	}
	.pagination-container .pagination-list2 .list-item .page-link .ico-pagination {
		border: 1px solid #515aa9;
		border-radius: 25px;
		color: #fff;
		font-size: 1.375em;
		transition: all 0.3s ease;
	}
	.pagination-container .pagination-list2 .list-item .page-link:focus {
		background-color: transparent;
		color: #fff;
		font-weight: 600;
	}
	.pagination-container .pagination-list2 .list-item .page-link:focus .ico-pagination {
		background-color: #515aa9;
		color: #fff;
	}
	.pagination-container .pagination-list2 .list-item.disabled .page-link:hover {
		cursor: default;
	}
	.pagination-container .pagination-list2 .list-item.disabled .page-link:focus {
		color: #fff;
	}
	.pagination-container .pagination-list2 .list-item.disabled:not(.current) .page-link {
		opacity: 0.5;
	}
	.pagination-container .pagination-list2 .list-item:not(.disabled) .page-link:hover {
		background-color: transparent;
		color: #fff;
		font-weight: 600;
	}
	.pagination-container
		.pagination-list2
		.list-item:not(.disabled)
		.page-link:hover
		.ico-pagination {
		background-color: #515aa9;
		color: #fff;
	}
</style>
