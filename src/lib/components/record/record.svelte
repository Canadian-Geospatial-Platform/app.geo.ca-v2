<script lang="ts">
	import Maplet from '$lib/components/record/maplet/maplet.svelte';
	import Map from '$lib/components/map/map.svelte';
	import { page } from '$app/stores';
	import InfoModal from '$lib/components/record/modal/info-modal.svelte';
	import { openShareDialog } from '$lib/components/record/share/share-button.svelte';
	import Accordion from '$lib/components/record/share/accordion.svelte';
	import RelatedProduct from './related-product.svelte';
	// @ts-ignore
	export let data;
	let showModal = false;
	$: noResults = data.lang == 'en-ca' ? 'No results found!' : 'Aucun résultat trouvé';
	function handleShareClick(networkName: string, url: string) {
		openShareDialog(networkName, url);
	}
	function handleRowClick() {}
	function resourceClick() {}
	function handleRelatedClick() {}
	function viewOnMap() {}
	function setGreyMap() {
		showModal = true;
	}
	function changeMapping() {}
	function handleAnalytic() {}
	function handleViewSimilarRecords() {
		similarRec = !similarRec;
		if (similarRec) {
			// @ts-ignore
			showSimilarRecords = similarRecords.slice(0, 5);
		} else {
			// @ts-ignore
			showSimilarRecords = [...similarRecords];
		}
	}
	// @ts-ignore
	let similarRecords = [];
	// @ts-ignore
	let showSimilarRecords = [];
	if (data.result.body.Items && data.result.body.Items.length > 0) {
		similarRecords = data.result.body.Items[0].similarity;
		if (similarRecords) {
			showSimilarRecords = similarRecords.slice(0, 5);
		}
	}

	$: similarRec = true;

	const licenceOrgs = {
		en: [
			'Alberta',
			'British Columbia',
			'Newfoundland and Labrador',
			'Nova Scotia',
			'Ontario',
			'Quebec',
			'Yukon',
			'Prince Edward Island',
			'New Brunswick'
		],
		fr: [
			'Alberta',
			'Colombie-Britannique',
			'Terre-Neuve-et-Labrador',
			'Nouvelle-Écosse',
			'Ontario',
			'Québec',
			'Yukon',
			'Île-du-Prince-Édouard',
			'Nouveau-Brunswick'
		]
	};
</script>

<InfoModal bind:showModal>
	<h2 slot="header" class="text-xl text-custom-10">No Viewable Content</h2>
	<div>
		<p>This record has no viewable component.</p>
	</div>
</InfoModal>
<div class="grid grid-cols-12 gap-3 p-2 m-2">
	{#if data.result.body.Items && data.result.body.Items.length > 0}
		{#each data.result.body.Items as item}
			{@const inMapping = false}
			{@const coordinates = JSON.parse(item.coordinates)}
			{@const langInd = data.lang === 'en-ca' ? 0 : 1}
			{@const status = item.status.split(';')[langInd]}
			{@const maintenance = item.maintenance.split(';')[langInd]}
			{@const type = item.type.split(';')[langInd]}
			{@const spatialRepresentation = item.spatialRepresentation.split(';')[langInd]}
			{@const language = data.lang === 'en-ca' ? 'en' : 'fr'}
			{@const contact = item.contact}
			{@const tcRange = [item.temporalExtent.begin, item.temporalExtent.end]}

			{@const useL = item.useLimits.match(/^(.+) [–|-] (.+)\((.+)\)$/)}
			{@const showDisclaimer =
				Array.isArray(useL) &&
				licenceOrgs[language].findIndex((p) => p.toLowerCase() === useL[2].trim().toLowerCase()) >
					-1}
			{@const options = item.options
				.filter((o) => {
					return o.protocol !== null && o.url !== null && o.protocol !== 'null' && o.url !== 'null';
				})
				.map((option) => {
					const desc = option.description[language].split(';');
					return {
						name: option.name[language],
						type: desc[0],
						format: desc[1],
						language: 'en',
						url: option.url
					};
				})}
			{@const activeMap =
				options.findIndex(
					(o) =>
						o.type.toUpperCase() === 'WMS' ||
						o.type.toUpperCase() === 'WEB SERVICE' ||
						o.type.toUpperCase() === 'SERVICE WEB'
				) > -1}
			{@const dist = Math.max(
				Math.abs(coordinates[0][2][1] - coordinates[0][0][1]) / 15,
				Math.abs(coordinates[0][1][0] - coordinates[0][0][0]) / 30
			)}
			{@const resolution = 40.7436654315252 * dist * 11132}
			{@const zoom = Math.max(Math.log2(3600000 / resolution), 1)}
			{@const center = [
				(coordinates[0][1][0] + coordinates[0][0][0]) / 2,
				(coordinates[0][2][1] + coordinates[0][0][1]) / 2
			]}
			{@const org =
				!!contact[0].organisation &&
				!!contact[0].organisation[language] &&
				contact[0].organisation[language] !== 'null'
					? contact[0].organisation[language]
					: 'N/A'}
			{@const addr =
				!!contact[0].address &&
				!!contact[0].address[language] &&
				contact[0].address[language] !== 'null'
					? contact[0].address[language]
					: 'N/A'}
			{@const indname =
				!!contact[0].individual &&
				!!contact[0].individual[language] &&
				contact[0].individual[language] !== 'null'
					? contact[0].individual[language]
					: 'N/A'}
			{@const role =
				!!contact[0].role !== null &&
				!!contact[0].role[language] &&
				contact[0].role[language] !== 'null'
					? contact[0].role[language]
					: 'N/A'}
			{@const telephone =
				!!contact[0].telephone &&
				!!contact[0].telephone[language] &&
				contact[0].telephone[language] !== 'null'
					? contact[0].telephone[language]
					: 'N/A'}
			{@const fax =
				!!contact[0].fax && !!contact[0].fax[language] && contact[0].fax[language] !== 'null'
					? contact[0].fax[language]
					: 'N/A'}
			{@const email =
				!!contact[0].email && !!contact[0].email[language] && contact[0].email[language] !== 'null'
					? contact[0].email[language]
					: 'N/A'}
			{@const web =
				!!contact[0].onlineresource &&
				!!contact[0].onlineresource.onlineresource &&
				contact[0].onlineresource.onlineresource !== 'null'
					? `<a href={contact[0].onlineresource.onlineresource} className="table-cell-link" target="_blank">{contact[0].onlineresource.onlineresource}</a>`
					: 'N/A'}
			{@const desc =
				!!contact[0].onlineresource &&
				!!contact[0].onlineresource.onlineresource_description &&
				contact[0].onlineresource.onlineresource_description !== 'null'
					? contact[0].onlineresource.onlineresource_description
					: 'N/A'}

			<main class="col-span-12 md:col-span-8 bg-custom-8 text-custom-1 rounded-lg p-4">
				<div>
					<h1 class="text-4xl">{item.title_en}</h1>
				</div>
				<section class="w-full relative overflow-x-auto">
					<h2 class="text-3xl mb-4 uppercase pt-8">{$page.data.t.page.aboutthisdataset}</h2>
					<div>{item.description}</div>
					<div class="py-6">
						<p><strong>{$page.data.t.page.keywords}:</strong>{item.keywords}</p>
					</div>
					<table>
						<caption class="text-2xl text-left uppercase">{$page.data.t.page.metadata}</caption>
						<tbody class="divide-y divide-gray-500">
							<tr>
								<th scope="row" class="text-left whitespace-nowrap px-6 py-4"
									>{$page.data.t.page.datecreated}</th
								>
								<td>{item.created}</td>
							</tr>
							<tr>
								<th scope="row" class="text-left whitespace-nowrap px-6 py-4"
									>{$page.data.t.page.datepublished}</th
								>
								<td>{item.published}</td>
							</tr>
							<tr>
								<th scope="row" class="text-left whitespace-nowrap px-6 py-4"
									>{$page.data.t.page.temporalcoverage}</th
								>
								<td
									>{#each tcRange as tc}
										<span>{tc} </span>
									{/each}
								</td>
							</tr>
							<tr>
								<th scope="row" class="text-left whitespace-nowrap px-6 py-4"
									>{$page.data.t.page.source}</th
								>
								<td>{contact[0].organisation[language]}</td>
							</tr>
							<tr>
								<th scope="row" class="text-left whitespace-nowrap px-6 py-4"
									>{$page.data.t.page.uselimits}</th
								>
								<td>
									{#if useL === null}
										{item.useLimits}
									{:else}
										{#each [1] as x}
											<div>
												{useL[1]} - {useL[2]}<a href={useL[3]} target="_blank">{useL[3]}</a>
											</div>
										{/each}
									{/if}
								</td>
							</tr>
						</tbody>
					</table>
				</section>
				{#if data.related.length > 0}
					<RelatedProduct relatedItems={data.related} {language} />
				{/if}
				<Accordion id="search-result-data-resources" title={$page.data.t.page.dataresources}>
					<table>
						<caption class="invisible">{$page.data.t.page.dataresources}</caption>
						<tbody
							id="tbody-data-resources"
							class="divide-y divide-gray-500"
							aria-labelledby="data-resources-id"
						>
							<tr>
								<th scope="col" class="text-left whitespace-nowrap px-6 py-4"
									>{$page.data.t.page.name}</th
								>
								<th scope="col" class="text-left whitespace-nowrap px-6 py-4"
									>{$page.data.t.page.type}</th
								>
								<th scope="col" class="text-left whitespace-nowrap px-6 py-4"
									>{$page.data.t.page.format}</th
								>
								<th scope="col" class="text-left whitespace-nowrap px-6 py-4"
									>{$page.data.t.page.languages}</th
								>
							</tr>
							{#each options as option}
								<tr class="table-row-link" onClick={() => handleRowClick(option.url)}>
									<td>
										<a
											class="table-cell-link"
											href={option.url}
											target="_blank"
											onClick={() => resourceClick(option.name, option.type)}>{option.name}</a
										>
									</td>
									<td>{option.type}</td>
									<td>{option.format}</td>
									<td class="text-center">{option.language}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</Accordion>
				<Accordion id="search-result-contact-data" title={$page.data.t.page.contactdata}>
					<table>
						<caption class="invisible">{$page.data.t.page.contactdata}</caption>
						<tbody id="tbody-contact-data" class="divide-y divide-gray-500">
							<tr>
								<th scope="row" class="text-left whitespace-nowrap px-6 py-4"
									>{$page.data.t.page.organization}</th
								>
								<td>{org}</td>
							</tr>
							<tr>
								<th scope="row" class="text-left whitespace-nowrap px-6 py-4"
									>{$page.data.t.page.address}</th
								>
								<td>{addr}</td>
							</tr>
							<tr>
								<th scope="row" class="text-left whitespace-nowrap px-6 py-4"
									>{$page.data.t.page.individualname}</th
								>
								<td>{indname}</td>
							</tr>
							<tr>
								<th scope="row" class="text-left whitespace-nowrap px-6 py-4"
									>{$page.data.t.page.role}le</th
								>
								<td>{role}</td>
							</tr>
							<tr>
								<th scope="row" class="text-left whitespace-nowrap px-6 py-4"
									>{$page.data.t.page.telephone}</th
								>
								<td>{telephone}</td>
							</tr>
							<tr>
								<th scope="row" class="text-left whitespace-nowrap px-6 py-4"
									>{$page.data.t.page.fax}</th
								>
								<td>{fax}</td>
							</tr>
							<tr>
								<th scope="row" class="text-left whitespace-nowrap px-6 py-4"
									>{$page.data.t.page.email}</th
								>
								<td>{email}</td>
							</tr>
							<tr>
								<th scope="row" class="text-left whitespace-nowrap px-6 py-4"
									>{$page.data.t.page.web}</th
								>
								<td>{web}</td>
							</tr>
							<tr>
								<th scope="row" class="text-left whitespace-nowrap px-6 py-4"
									>{$page.data.t.page.description}</th
								>
								<td>{desc}</td>
							</tr>
						</tbody>
					</table>
				</Accordion>
				<Accordion id="search-result-adv-meta" title={$page.data.t.page.advancedmetadata}>
					<table>
						<caption class="invisible">{$page.data.t.page.advancedmetadata}</caption>
						<tbody
							id="tbody-adv-meta"
							class="divide-y divide-gray-500"
							aria-labelledby="advanced-data-id"
						>
							<tr>
								<th scope="row" class="text-left whitespace-nowrap px-6 py-4"
									>{$page.data.t.page.status}</th
								>
								<td>{status}</td>
							</tr>
							<tr>
								<th scope="row" class="text-left whitespace-nowrap px-6 py-4"
									>{$page.data.t.page.maintenance}</th
								>
								<td>{maintenance}</td>
							</tr>
							<tr>
								<th scope="row" class="text-left whitespace-nowrap px-6 py-4"
									>{$page.data.t.page.id}</th
								>
								<td>{item.id}</td>
							</tr>
							<tr>
								<th scope="row" class="text-left whitespace-nowrap px-6 py-4"
									>{$page.data.t.page.topiccategory}</th
								>
								<td>{item.topicCategory}</td>
							</tr>
							<tr>
								<th scope="row" class="text-left whitespace-nowrap px-6 py-4"
									>{$page.data.t.page.type}</th
								>
								<td>{type}</td>
							</tr>
							<tr>
								<th scope="row" class="text-left whitespace-nowrap px-6 py-4"
									>{$page.data.t.page.north}</th
								>
								<td>{coordinates[0][2][1].toString()}</td>
							</tr>
							<tr>
								<th scope="row" class="text-left whitespace-nowrap px-6 py-4"
									>{$page.data.t.page.east}</th
								>
								<td>{coordinates[0][1][0].toString()}</td>
							</tr>
							<tr>
								<th scope="row" class="text-left whitespace-nowrap px-6 py-4"
									>{$page.data.t.page.west}</th
								>
								<td>{coordinates[0][0][0].toString()}</td>
							</tr>
							<tr>
								<th scope="row" class="text-left whitespace-nowrap px-6 py-4"
									>{$page.data.t.page.south}</th
								>
								<td>{coordinates[0][0][1].toString()}</td>
							</tr>
							<tr>
								<th scope="row" class="text-left whitespace-nowrap px-6 py-4"
									>{$page.data.t.page.spatialrepresentation}</th
								>
								<td>{spatialRepresentation}</td>
							</tr>
						</tbody>
					</table>
				</Accordion>
			</main>
			<aside class="col-span-12 md:col-span-4 bg-white pl-2 pr-2 place-items-center">
				<div>
					<section>
						<Maplet {center} {zoom} {coordinates} />
					</section>
					<section class="pt-8">
						<h3 class="uppercase text-2xl">Add to map</h3>
						<p>
							{#if activeMap}
								View the data in depth by adding it to a map.
							{:else}
								This record has no viewable component.
							{/if}
						</p>
						<div class="grid grid-cols-2 gap-3 pt-5">
							<button
								class={activeMap
									? 'bg-custom-10 hover:bg-blue-400 text-white px-6 py-4 rounded'
									: 'bg-custom-10 opacity-60 text-white px-6 py-4 rounded'}
								type="button"
								on:click={activeMap ? () => viewOnMap(event, item.id) : () => setGreyMap(true)}
							>
								<div class="leading-none uppercase text-sm">view on map</div>
							</button>
							<button
								class={activeMap
									? 'bg-custom-10 hover:bg-blue-400 text-white px-6 py-4 rounded'
									: 'bg-custom-10 opacity-60 text-white px-6 py-4 rounded'}
								type="button"
								on:click={activeMap ? () => changeMapping(item.id) : () => setGreyMap(true)}
							>
								<div class="leading-none uppercase text-sm">
									{#if inMapping}
										Added to MyMap
									{:else}
										Add to MyMap
									{/if}
								</div>
							</button>
						</div>
					</section>
					{#if showSimilarRecords.length > 0}
						<section class="pt-8">
							<h3 class="uppercase text-2xl">{$page.data.t.page.similarrecords}</h3>
							<div class="pt-5">
								<ul>
									{#each showSimilarRecords as si, index}
										{@const uri = encodeURI(si.features_properties_id.trim())}
										{@const url = '/' + $page.data.lang + '/record/' + uri}
										{@const txt =
											$page.data.lang === 'en-ca'
												? si.features_properties_title_en
												: si.features_properties_title_fr}
										<li class="list-disc list-inside">
											<a target="_blank" class="text-custom-8 hover:underline" href={url}>{txt}</a>
										</li>
									{/each}
								</ul>
							</div>
							<div class="grid grid-cols-2 gap-3 pt-5">
								<button
									class="bg-custom-10 hover:bg-blue-400 text-white px-6 py-4 rounded"
									type="button"
									on:click={handleViewSimilarRecords}
								>
									<div class="leading-none uppercase text-sm">
										{similarRec ? $page.data.t.page.viewmore : $page.data.t.page.showless}
									</div>
								</button>
							</div>
						</section>
					{/if}
					<section class="pt-8">
						<h3 class="uppercase text-2xl">{$page.data.t.page.metadata}</h3>
						<p>
							{$page.data.t.page.ourmetadatais}
						</p>
						<div class="grid grid-cols-2 gap-3 pt-5">
							<a
								href="https://geocore.metadata.geo.ca/3a27a918-cf02-18c8-fe2b-bac5a7c4357d.geojson"
								class="text-center text-base px-6 py-3 text-blue-100 no-underline bg-custom-10 rounded hover:bg-blue-400 hover:text-blue-200"
								rel="noreferrer"
								target="_blank">{$page.data.t.page.downloadgeocore}</a
							>

							<a
								href="https://csw.open.canada.ca/geonetwork/srv/csw?service=CSW&amp;version=2.0.2&amp;request=GetRecordById&amp;outputSchema=csw:IsoRecord&amp;ElementSetName=full&amp;id=3a27a918-cf02-18c8-fe2b-bac5a7c4357d"
								class="text-center text-base px-6 py-3 text-blue-100 no-underline bg-custom-10 rounded hover:bg-blue-400 hover:text-blue-200"
								rel="noreferrer"
								target="_blank">{$page.data.t.page.viewhnaprecord}</a
							>
						</div>
					</section>
					<section class="pt-8">
						<h3 class="uppercase text-2xl">{$page.data.t.page.numberofacesses}</h3>
						<div class="grid grid-cols-2 gap-1 pt-2">
							<div class="p-3 border border-slate-300 rounded">
								<h4 class="uppercase text-center">{$page.data.t.page.last30}</h4>
								<p class="text-center text-custom-10 text-xl">
									{#if isNaN(data.analyticRes['30'])}
										<span>{$page.data.t.analytic.loadingfailed}</span>

										<button
											class="bg-custom-10 hover:bg-blue-400 text-white px-6 py-4 rounded-lg"
											type="button"
											on:click={() => handleAnalytic(item.id)}
										>
											<div class="leading-none uppercase text-sm">
												{$page.data.t.analytic.tryagain}
											</div>
										</button>
									{:else}
										{data.analyticRes['30']}
									{/if}
								</p>
							</div>
							<div class="p-3 border border-slate-300 rounded">
								<h4 class="uppercase text-center">{$page.data.t.page.alltime}</h4>
								<p class="text-center text-custom-10 text-xl">
									{#if isNaN(data.analyticRes.all)}
										<span>{$page.data.t.analytic.loadingfailed}</span>
										<button
											class="bg-custom-10 hover:bg-blue-400 text-white px-6 py-4 rounded-lg"
											type="button"
											on:click={() => handleAnalytic(item.id)}
										>
											<div class="leading-none uppercase text-sm">
												{$page.data.t.analytic.tryagain}
											</div>
										</button>
									{:else}
										{data.analyticRes.all}
									{/if}
								</p>
							</div>
						</div>
					</section>
				</div>

				<div class="flex flex-col pt-6 pb-8 bg-center bg-cover bg-no-repeat">
					<div class="grid place-items-center my-auto bg-white rounded-3xl space-y-10">
						<div class="text-2xl font-semibold text-blue-500">Share</div>

						<div class="flex items-center justify-center space-x-3">
							<button
								aria-label="facebook"
								class=""
								on:click={() => handleShareClick('facebook', encodeURI(window.location.href))}
								><svg viewBox="0 0 64 64" width="50" height="50"
									><circle cx="32" cy="32" r="31" fill="#3b5998" /><path
										d="M34.1,47V33.3h4.6l0.7-5.3h-5.3v-3.4c0-1.5,0.4-2.6,2.6-2.6l2.8,0v-4.8c-0.5-0.1-2.2-0.2-4.1-0.2 c-4.1,0-6.9,2.5-6.9,7V28H24v5.3h4.6V47H34.1z"
										fill="white"
									/></svg
								>
							</button>
							<button
								aria-label="twitter"
								class=""
								on:click={() => handleShareClick('twitter', encodeURI(window.location.href))}
								><svg viewBox="0 0 64 64" width="50" height="50"
									><circle cx="32" cy="32" r="31" fill="#00aced" /><path
										d="M48,22.1c-1.2,0.5-2.4,0.9-3.8,1c1.4-0.8,2.4-2.1,2.9-3.6c-1.3,0.8-2.7,1.3-4.2,1.6 C41.7,19.8,40,19,38.2,19c-3.6,0-6.6,2.9-6.6,6.6c0,0.5,0.1,1,0.2,1.5c-5.5-0.3-10.3-2.9-13.5-6.9c-0.6,1-0.9,2.1-0.9,3.3 c0,2.3,1.2,4.3,2.9,5.5c-1.1,0-2.1-0.3-3-0.8c0,0,0,0.1,0,0.1c0,3.2,2.3,5.8,5.3,6.4c-0.6,0.1-1.1,0.2-1.7,0.2c-0.4,0-0.8,0-1.2-0.1 c0.8,2.6,3.3,4.5,6.1,4.6c-2.2,1.8-5.1,2.8-8.2,2.8c-0.5,0-1.1,0-1.6-0.1c2.9,1.9,6.4,2.9,10.1,2.9c12.1,0,18.7-10,18.7-18.7 c0-0.3,0-0.6,0-0.8C46,24.5,47.1,23.4,48,22.1z"
										fill="white"
									/></svg
								>
							</button>
							<button
								class="cursor-pointer"
								on:click={() => handleShareClick('linkedin', encodeURI(window.location.href))}
							>
								<svg viewBox="0 0 64 64" width="50" height="50"
									><circle cx="32" cy="32" r="31" fill="#007fb1" /><path
										d="M20.4,44h5.4V26.6h-5.4V44z M23.1,18c-1.7,0-3.1,1.4-3.1,3.1c0,1.7,1.4,3.1,3.1,3.1 c1.7,0,3.1-1.4,3.1-3.1C26.2,19.4,24.8,18,23.1,18z M39.5,26.2c-2.6,0-4.4,1.4-5.1,2.8h-0.1v-2.4h-5.2V44h5.4v-8.6 c0-2.3,0.4-4.5,3.2-4.5c2.8,0,2.8,2.6,2.8,4.6V44H46v-9.5C46,29.8,45,26.2,39.5,26.2z"
										fill="white"
									/></svg
								>
							</button>
							<button
								aria-label="email"
								class=""
								on:click={() => handleShareClick('email', encodeURI(window.location.href))}
							>
								<svg viewBox="0 0 64 64" width="50" height="50"
									><circle cx="32" cy="32" r="31" fill="#7f7f7f" /><path
										d="M17,22v20h30V22H17z M41.1,25L32,32.1L22.9,25H41.1z M20,39V26.6l12,9.3l12-9.3V39H20z"
										fill="white"
									/></svg
								>
							</button>
						</div>
					</div>
				</div>
			</aside>
		{/each}
	{:else}
		<p>{noResults}</p>
	{/if}
</div>

<style>
	table {
		@apply w-full;
		@apply table-auto;
	}
</style>
