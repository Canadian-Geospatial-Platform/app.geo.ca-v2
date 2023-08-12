<script>
	import Maplet from '$lib/components/maplet/maplet.svelte';

	export let data;
	$: noResults = data.lang == 'en-ca' ? 'No results found!' : 'Aucun résultat trouvé';
	function handleRowClick(){}
	function resourceClick(){}
	function handleRelatedClick(){}	
	function viewOnMap(){}
	function setGreyMap(){}
	function changeMapping(){}
	function handleAnalytic(){}
</script>
<div class="grid grid-cols-12 gap-3">
{#if data.result.body.Items && data.result.body.Items.length>0}

{#each data.result.body.Items as item}
	{@const inMapping=false}
    {@const coordinates = JSON.parse(item.coordinates)}
	{@const langInd = (data.lang === 'en-ca') ? 0 : 1}
	{@const status = item.status.split(';')[langInd]}
	{@const maintenance = item.maintenance.split(';')[langInd]}
	{@const type = item.type.split(';')[langInd]}
	{@const spatialRepresentation = item.spatialRepresentation.split(';')[langInd]}
	{@const language= (data.lang === 'en-ca') ? 'en' : 'fr'}
	{@const contact=item.contact}
	{@const tcRange = [item.temporalExtent.begin, item.temporalExtent.end]}
    
 	{@const useL = item.useLimits.match(/^(.+) [–|-] (.+)\((.+)\)$/)}
    {@const options = item.options
                                .filter(o => { return o.protocol !== null && o.url !== null && o.protocol !== 'null' && o.url !== 'null' })
                                .map((option) => {
                                    const desc = option.description[language].split(";");
                                    return { name: option.name[language], type: desc[0], format: desc[1], language: 'en', url: option.url };
                                })}  
	{@const activeMap =
                        options.findIndex(
                            (o) =>
                                o.type.toUpperCase() === "WMS" ||
                                o.type.toUpperCase() === "WEB SERVICE" ||
                                o.type.toUpperCase() === "SERVICE WEB"
                        ) > -1}                      
	{@const dist = Math.max(
		Math.abs(coordinates[0][2][1] - coordinates[0][0][1]) / 15,
		Math.abs(coordinates[0][1][0] - coordinates[0][0][0]) / 30
	)}
	{@const resolution = 40.7436654315252 * dist * 11132}
	{@const zoom = Math.max(Math.log2(3600000 / resolution), 1)}
	{@const center=[(coordinates[0][1][0] + coordinates[0][0][0]) / 2, (coordinates[0][2][1] + coordinates[0][0][1]) / 2]}
	{@const org=!!contact[0].organisation && !!contact[0].organisation[language] && contact[0].organisation[language] !== 'null' ? contact[0].organisation[language] : 'N/A'}
	{@const addr=!!contact[0].address && !!contact[0].address[language] && contact[0].address[language] !== 'null' ? contact[0].address[language] : 'N/A'}
	{@const indname=!!contact[0].individual && !!contact[0].individual[language] && contact[0].individual[language] !== 'null' ? contact[0].individual[language] : 'N/A'}
	{@const role=!!contact[0].role !== null && !!contact[0].role[language] && contact[0].role[language] !== 'null' ? contact[0].role[language] : 'N/A'}
	{@const telephone=!!contact[0].telephone && !!contact[0].telephone[language] && contact[0].telephone[language] !== 'null' ? contact[0].telephone[language] : 'N/A'}
	{@const fax=!!contact[0].fax && !!contact[0].fax[language] && contact[0].fax[language] !== 'null' ? contact[0].fax[language] : 'N/A'}
	{@const email=!!contact[0].email && !!contact[0].email[language] && contact[0].email[language] !== 'null' ? contact[0].email[language] : 'N/A'}
	{@const web=!!contact[0].onlineresource && !!contact[0].onlineresource.onlineresource && contact[0].onlineresource.onlineresource !== 'null' ? `<a href={contact[0].onlineresource.onlineresource} className="table-cell-link" target="_blank">{contact[0].onlineresource.onlineresource}</a>` : 'N/A'}
	{@const desc=!!contact[0].onlineresource && !!contact[0].onlineresource.onlineresource_description && contact[0].onlineresource.onlineresource_description !== 'null' ? contact[0].onlineresource.onlineresource_description : 'N/A'}
	
<main class="col-span-8 bg-blue-300">	
	<div>	
	<h1 class="text-4xl">{item.title_en}</h1>
	</div>
	<section>
		<h2 class="text-3xl mb-4 uppercase pt-8">About this dataset</h2>
		<div>{item.description}</div>
		<div class="py-6">
			<p><strong>Keywords:</strong>{item.keywords}</p>
		</div>
		<table class="">
			<caption class="text-2xl uppercase">Metadata</caption>
			<tbody class="divide-y divide-gray-500">
				<tr>
					<th scope="row" class="text-left whitespace-nowrap px-6 py-4">Date created:</th>
					<td>{item.created}</td>
				</tr>
				<tr>
					<th scope="row" class="text-left whitespace-nowrap px-6 py-4">Date published:</th>
					<td>{item.published}</td>
				</tr>
				<tr>
					<th scope="row" class="text-left whitespace-nowrap px-6 py-4">Temporal Coverage</th>
					<td>{#each tcRange as tc}
                             <span>{tc} </span>
                    	{/each}
					</td>
				</tr>
				<tr>
					<th scope="row" class="text-left whitespace-nowrap px-6 py-4">Source(s)</th>
					<td>{contact[0].organisation[language]}</td>
				</tr>
				<tr>
					<th scope="row" class="text-left whitespace-nowrap px-6 py-4">Use Limitations</th>
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
	{#if (data.related.length > 0)}
		<section id="search-result-related-products" class="sec-search-result sec-search-result-related-products">
			<table class="">
				<caption>
					<button id="related-products-id" type="button">Related products</button>
				</caption>
				<tbody id="tbody-related-products" class="divide-y divide-gray-500">
					<tr>
						<th scope="col" class="text-left whitespace-nowrap px-6 py-4">Name</th>
						<th scope="col" class="text-left whitespace-nowrap px-6 py-4">Type</th>
					</tr>
					{#each data.related as relatedp}						
							<tr class="table-row-link" onClick={(e) => handleRelatedClick(e, relatedp.id)}>
								<td>
									<a class="table-cell-link" onClick={(e) => handleRelatedClick(e, relatedp.id)}>{relatedp[`description_${language}`]}</a>
								</td>
								<td></td>
							</tr>					
					{/each}
				</tbody>
			</table>
		</section>
	{/if}
	<section id="search-result-data-resources" class="sec-search-result sec-search-result-data-resources">
		<table class="divide-y divide-gray-500">
			<caption><button id="data-resources-id" type="button" class="table-data-toggle collapse" aria-expanded="false" aria-controls="tbody-data-resources">Data Resources</button></caption>
			<tbody id="tbody-data-resources" class="divide-y divide-gray-500" aria-labelledby="data-resources-id">
				<tr>
				<th scope="col" class="text-left whitespace-nowrap px-6 py-4">Name</th>
				<th scope="col" class="text-left whitespace-nowrap px-6 py-4">Type</th>
				<th scope="col" class="text-left whitespace-nowrap px-6 py-4">Format</th>
				<th scope="col" class="text-left whitespace-nowrap px-6 py-4">Languages</th>
				</tr>
				{#each options as option}    
						<tr class="table-row-link" onClick={() => handleRowClick(option.url)}>
							<td>
								<a class="table-cell-link" href={option.url} target="_blank" onClick={() => resourceClick(option.name, option.type)}>{option.name}</a>
							</td>
							<td>{option.type}</td>
							<td>{option.format}</td>
							<td>{option.language}</td>
						</tr>                                                        
				{/each}
			</tbody>
		</table>
	</section>
	<section id="search-result-contact-data">
		<table class="">
			<caption class="cursor-pointer"><button id="conatct-data-id" type="button" class="" aria-expanded="false" aria-controls="tbody-contact-data">Contact Data</button></caption>
			<tbody id="tbody-contact-data" class="divide-y divide-gray-500">
				<tr>
				<th scope="row" class="text-left whitespace-nowrap px-6 py-4">Organization</th>
				<td>{org}</td>
				</tr>
				<tr>
				<th scope="row" class="text-left whitespace-nowrap px-6 py-4">Address</th>
				<td>{addr}</td>
				</tr>
				<tr>
				<th scope="row" class="text-left whitespace-nowrap px-6 py-4">Individual Name</th>
				<td>{indname}</td>
				</tr>
				<tr>
				<th scope="row" class="text-left whitespace-nowrap px-6 py-4">Role</th>
				<td>{role}</td>
				</tr>
				<tr>
				<th scope="row" class="text-left whitespace-nowrap px-6 py-4">Telephone</th>
				<td>{telephone}</td>
				</tr>
				<tr>
				<th scope="row" class="text-left whitespace-nowrap px-6 py-4">Fax</th>
				<td>{fax}</td>
				</tr>
				<tr>
				<th scope="row" class="text-left whitespace-nowrap px-6 py-4">Email</th>
				<td>{email}</td>
				</tr>
				<tr>
				<th scope="row" class="text-left whitespace-nowrap px-6 py-4">Web</th>
				<td>{web}</td>
				</tr>
				<tr>
				<th scope="row" class="text-left whitespace-nowrap px-6 py-4">Description</th>
				<td>{desc}</td>
				</tr>
			</tbody>
		</table>
	</section>
	<section id="search-result-adv-meta">
               <table >
                  <caption><button id="advanced-data-id" type="button" class=""  aria-expanded="false" aria-controls="tbody-adv-meta">Advanced metadata</button></caption>
                  <tbody id="tbody-adv-meta" class="divide-y divide-gray-500" aria-labelledby="advanced-data-id">
                     <tr>
                        <th scope="row" class="text-left whitespace-nowrap px-6 py-4">Status</th>
                        <td>{status}</td>
                     </tr>
                     <tr>
                        <th scope="row" class="text-left whitespace-nowrap px-6 py-4">Maintenance</th>
                        <td>{maintenance}</td>
                     </tr>
                     <tr>
                        <th scope="row" class="text-left whitespace-nowrap px-6 py-4">ID</th>
                        <td>{item.id}</td>
                     </tr>
                     <tr>
                        <th scope="row" class="text-left whitespace-nowrap px-6 py-4">Topic Category</th>
                        <td>{item.topicCategory}</td>
                     </tr>
                     <tr>
                        <th scope="row" class="text-left whitespace-nowrap px-6 py-4">Type</th>
     	                   <td>{type}</td>
                     </tr>
                     <tr>
                        <th scope="row" class="text-left whitespace-nowrap px-6 py-4">North</th>
                        <td>{coordinates[0][2][1].toString()}</td>
                     </tr>
                     <tr>
                        <th scope="row" class="text-left whitespace-nowrap px-6 py-4">East</th>
                        <td>{coordinates[0][1][0].toString()}</td>
                     </tr>
                     <tr>
                        <th scope="row" class="text-left whitespace-nowrap px-6 py-4">West</th>
                        <td>{coordinates[0][0][0].toString()}</td>
                     </tr>
                     <tr>
                        <th scope="row" class="text-left whitespace-nowrap px-6 py-4">South</th>
                        <td>{coordinates[0][0][1].toString()}</td>
                     </tr>
                     <tr>
                        <th scope="row" class="text-left whitespace-nowrap px-6 py-4">Spatial Representation</th>
                        <td>{spatialRepresentation}</td>
                     </tr>
                  </tbody>
               </table>
            </section>

</main>
<aside class="col-span-4 bg-white">
	<div>
		<section>
			<Maplet mapId="metamap"
				center={center}
				zoom={zoom} coordinates={coordinates}
			/>
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
			<div>
				<button
					type="button"					
					onClick={
						activeMap
							? () => viewOnMap(event, item.id)
							: () => setGreyMap(true)
					}
				>
					View on Map
				</button>
				<button
					id="addMyMap"
					type="button"					
					onClick={
						activeMap
							? () => changeMapping(item.id)
							: () => setGreyMap(true)
					}
				>
					{#if inMapping}
					Added to MyMap
					{:else}
					Add to MyMap
					{/if}
				</button>
			</div>
		</section>
	
		<section class="pt-8">
			<h3 class="uppercase text-2xl">Metadata</h3>
			<p>Our metadata is stored in the geoCore format. A geojson containing all the metadata you see here.</p>
			<div class="btn-group"><a href="https://geocore.metadata.geo.ca/3a27a918-cf02-18c8-fe2b-bac5a7c4357d.geojson" class="btn btn-search mr-2" rel="noreferrer" target="_blank">Download geoCore</a><a href="https://csw.open.canada.ca/geonetwork/srv/csw?service=CSW&amp;version=2.0.2&amp;request=GetRecordById&amp;outputSchema=csw:IsoRecord&amp;ElementSetName=full&amp;id=3a27a918-cf02-18c8-fe2b-bac5a7c4357d" class="btn btn-search" rel="noreferrer" target="_blank">View HNAP Record</a></div>
		</section>
        <section class="pt-8">
			<h3 class="uppercase text-2xl">
				Number of Accesses
			</h3>
			<div class="card-wrap">
				<div class="card">
					<h4 class="uppercase">Last 30 days</h4>
					<p class="card-count">
						{#if isNaN(data.analyticRes["30"])}
							<span>
								loading failed,{" "}
								<button
									type="button"
									class="link-button"
									onClick={() => handleAnalytic(item.id)}
								>
									try again
								</button>
							</span>
						{:else}
							{data.analyticRes["30"]}
						{/if}
					</p>
				</div>
				<div class="card">
					<h4 class="card-title">All time</h4>
					<p class="card-count">
						{#if isNaN(data.analyticRes.all)}
							<span>
								Loading number failed,{" "}
								<button
									type="button"
									class="link-button"
									onClick={() => handleAnalytic(item.id)}
								>
									try again
								</button>
							</span>
						{:else}
							{data.analyticRes.all}
						{/if}
					</p>
				</div>
			</div>
		</section>
	</div>
	<div>
	</div>
</aside>
{/each}
{:else}
	<p>{noResults}</p>
{/if}
</div>

