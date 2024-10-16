<script lang="ts">
	import { page } from '$app/stores';
	import Organisations from './organisations.svelte';
	export let item;
	export let lang;

	// todo: this component needs to be reworked to get the values from the item with the new schema and handle it correctly. The current HTML is just for reference.
	$: catalogDescription =
		$page.data.lang == 'en-ca'
			? 'This catalog contains open datasets available on the Geo.ca platform.'
			: 'Ce catalogue contient des données ouvertes disponibles sur la plateforme Geo.ca.';
	$: catalogTitle =
		$page.data.lang == 'en-ca'
			? 'Government Of Canada Geo.ca Data Catalog.'
			: 'Catalogue de données de la plateforme Geo.ca du gouvernement du Canada.';
	// polygon suit wkt
	function boundaryMultiPolygon() {
		let jsonPolygon = item.geometry.coordinates[0];
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
	<span property="name" value={catalogTitle}
		><span property="spatialCoverage" typeof="Place">
			<span property="geo" typeof="GeoShape">
				<span property="name" value="Dataset Boundary" />
				<span property="polygon" value={boundaryMultiPolygon()} />
			</span>
		</span>
	</span>

	<span property="description" value={catalogDescription} />
	<span property="datePublished" value={''}>
		<span property="dateModified" value="" />
		<span property="inLanguage" value={lang + '-CA'} />
		<span property="publisher" typeof="Organization">
			<Organisations {item} {lang} />
		</span>
		<span property="genre" value="" />

		{#if item?.properties?.constraints?.legal?.[lang]}
			<span property="license" typeof="CreativeWork">
				<span property="name" value={item.properties.constraints.legal[lang]} />
			</span>
		{/if}
	</span>
</div>
