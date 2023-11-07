<script lang="ts">
	import { redirect } from '@sveltejs/kit';
	import Pagination from './pagination/pagination.svelte';
	import Accordion from './share/accordion.svelte';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';

	export let relatedItems: any[] = [];
	export let language: string;
	$: currentPage = 1;
	$: lang = $page.data.lang;
	let pageSize = 10;
	let ppg: number = 8;
	onMount(() => {
		ppg = window.innerWidth > 600 ? 8 : window.innerWidth > 400 ? 5 : 3;
	});
	$: pn = 1;
	function handleRelatedClick(e, id) {
		console.log(id);
		redirect(302, `/record/${id}`);
	}
	$: paginatedItems = relatedItems.slice(0, 10);

	function handleRelatedPage(e) {
		pn = e.detail.pnum;
		paginatedItems = relatedItems.slice((e.detail.pnum - 1) * 10, e.detail.pnum * 10);
	}
</script>

<Accordion id="search-result-related-products" title={$page.data.t.page.relatedproducts}>
	<table>
		<caption class="invisible">{$page.data.t.page.relatedproducts}</caption>
		<tbody id="tbody-related-products" class="divide-y divide-gray-500">
			<tr>
				<th scope="col" class="text-left whitespace-nowrap px-6 py-4">{$page.data.t.page.name}</th>
				<th scope="col" class="text-left whitespace-nowrap px-6 py-4">{$page.data.t.page.type}</th>
			</tr>
			{#each paginatedItems as relatedp}
				<tr class="table-row-link">
					<td>
						<a class="table-cell-link" href={`/${lang}/record/${relatedp.id}`}
							>{relatedp[`description_${language}`]}</a
						>
					</td>
					<td />
				</tr>
			{/each}
			{#if relatedItems.length > 10}
				<tfoot id="tfoot-related-products" style="display: block">
					<Pagination
						rpp={pageSize}
						{ppg}
						rcnt={relatedItems.length}
						current={pn}
						on:handleRelatedPage={handleRelatedPage}
					/>
				</tfoot>
			{/if}
		</tbody>
	</table>
</Accordion>
