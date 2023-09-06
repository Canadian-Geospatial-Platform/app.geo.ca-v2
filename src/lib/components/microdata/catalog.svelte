<script lang="ts">
	import { page } from '$app/stores';
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
</script>

<div property="includedInDataCatalog" typeof="DataCatalog">
	<span property="name" value={catalogTitle}
		><span property="spatialCoverage" typeof="Place">
			<span property="geo" typeof="GeoShape">
				<span property="name" value="Dataset Boundary" /><span
					property="MULTIPOLYGON"
					value="(((-68.5000000000000000 83.1063220000000058)))"
				/>
			</span>
		</span>
	</span>

	<span property="description" value={catalogDescription} />
	<span property="datePublished" value={item.published}>
		<span property="dateModified" value="" />
		<span property="inLanguage" value={lang + "-CA"} />
		<span property="publisher" typeof="Organization">
			<span property="name" value={item.organisation} />
			<span property="email" value="" />
		</span>
		<span property="genre" value="Information and Communications Government and Politics" />

		<span property="license" typeof="CreativeWork"
			><span property="name" value="Open Government Licence - Canada" />
			<span property="sameAs" value="http://open.canada.ca/en/open-government-licence-canada" />
			<span
				property="text"
				value="Rights under which the catalog can be reused are outlined in the Open Government Licence - Canada"
			/>
		</span>
	</span>
</div>
