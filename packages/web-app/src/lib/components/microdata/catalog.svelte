<script lang="ts">
	import { page } from '$app/state';
	import Organisations from './organisations.svelte';
	const { item, lang } = $props();

	// todo: this component needs to be reworked to get the values from the item with the new schema and handle it correctly. The current HTML is just for reference.
	const catalogDescription = $derived(
		page.data.lang === 'en-ca'
			? 'This catalog contains open datasets available on the Geo.ca platform.'
			: 'Ce catalogue contient des données ouvertes disponibles sur la plateforme Geo.ca.'
	);
	const catalogTitle = $derived(
		page.data.lang === 'en-ca'
			? 'Government Of Canada Geo.ca Data Catalog.'
			: 'Catalogue de données de la plateforme Geo.ca du gouvernement du Canada.'
	);
	
	/**
	 * Constructs a WKT polygon string from the item's coordinates.
	 * 
	 * @returns The WKT polygon string.
	 */
	function boundaryMultiPolygon(): string {
		const jsonPolygon = item.coordinates[0];
		let wktPolygonString = '';
		for (const xy of jsonPolygon) {
			wktPolygonString += xy[0] + ' ' + xy[1] + ',';
		}
		if (wktPolygonString) {
			wktPolygonString = wktPolygonString.slice(0, -1);
		}
		return wktPolygonString;
	}
</script>

<div property="includedInDataCatalog" typeof="DataCatalog">
	<span property="name">{catalogTitle}
		<span property="spatialCoverage" typeof="Place">
			<span property="geo" typeof="GeoShape">
				<span property="name">Dataset Boundary</span>
				<span property="polygon">{boundaryMultiPolygon()}</span>
			</span>
		</span>
	</span>

	<span property="description">{catalogDescription}</span>
	<span property="datePublished">
		<span property="dateModified"></span>
		<span property="inLanguage">{lang + '-CA'}</span>
		<span property="publisher" typeof="Organization">
			<Organisations {item} {lang} />
		</span>
		<span property="genre"></span>

		{#if item?.properties?.constraints?.legal?.[lang]}
			<span property="license" typeof="CreativeWork">
				<span property="name">{item.properties.constraints.legal[lang]}</span>
			</span>
		{/if}
	</span>
</div>
