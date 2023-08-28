<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import item from './sample-item.json';

	$: lang = $page.data.lang == 'en-ca' ? 'en' : 'fr';

	onMount(() => {
		console.log(item);
	});
</script>

<div vocab="http://schema.org/" typeof="Dataset" style="display:none;">
	<div property="includedInDataCatalog" typeof="DataCatalog">
		<span property="name" value="Government Of Canada Geo.ca Data Catalog"
			><span property="spatialCoverage" typeof="Place">
				<span property="geo" typeof="GeoShape">
					<span property="name" value="Dataset Boundary" /><span
						property="MULTIPOLYGON"
						value="(((-68.5000000000000000 83.1063220000000058)))"
					/>
				</span>
			</span>
		</span>

		<span
			property="description"
			value="This catalog contains open datasets available on the Geo.ca platform."
		/>
		<span property="datePublished" value={item.published}>
			<span property="dateModified" value="" />
			<span property="inLanguage" value="en-CA" />
			<span property="sameAs" value="http://open.canada.ca" />

			<span property="publisher" typeof="Organization">
				<span property="name" value={item.organisation} />
				<span property="email" value="open-ouvert@tbs-sct.gc.ca" />
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

	<span property="name">{item['title_' + lang]}</span>
	<span property="description">{item.description}</span>

	<span property="dateModified">2023-08-28</span>
	<span property="publisher" typeof="Organization">
		<span property="name">Treasury Board of Canada Secretariat</span>
		<span property="email">open-ouvert@tbs-sct.gc.ca</span>
	</span><span property="temporalCoverage" value="2013-06-19/" /><span property="genre"
		>Information and Communications</span
	><span property="keywords">analytics</span><span property="keywords">metrics</span><span
		property="sameAs"
		value="/data/en/dataset/2916fad5-ebcc-4c86-b0f3-4f619b29f412"
	/>
	<span property="distribution" typeof="DataDownload">
		<span property="inLanguage" content="en,fr" />
		<span property="name" lang="en">Number of Visits, Downloads</span><span property="fileFormat"
			>CSV</span
		>
		<span property="url"
			>https://open.canada.ca/data/dataset/2916fad5-ebcc-4c86-b0f3-4f619b29f412/resource/02a92b0f-b26d-4fbd-9601-d27651703715/download/opendataportal.siteanalytics.totalmonthlyusage.bilingual.csv</span
		>
	</span>
	<span property="distribution" typeof="DataDownload">
		<span property="inLanguage" content="en,fr" />
		<span property="name" lang="en">Top 100 Downloaded Datasets (for the month prior)</span><span
			property="fileFormat">CSV</span
		>
		<span property="url"
			>https://open.canada.ca/data/dataset/2916fad5-ebcc-4c86-b0f3-4f619b29f412/resource/ba980e38-f110-466a-ad92-3ee0d5a60d49/download/opendataportal.siteanalytics.top100datasets.bilingual.csv</span
		>
	</span>
	<span property="distribution" typeof="DataDownload">
		<span property="inLanguage" content="en,fr" />
		<span property="name" lang="en">Datasets by Department or Agency</span><span
			property="fileFormat">CSV</span
		>
		<span property="url"
			>https://open.canada.ca/data/dataset/2916fad5-ebcc-4c86-b0f3-4f619b29f412/resource/5a1b343d-2fea-4c31-8652-f77506e3ea37/download/opendataportal.siteanalytics.datasetsbyorg.bilingual.csv</span
		>
	</span>
	<span property="distribution" typeof="DataDownload">
		<span property="inLanguage" content="en,fr" />
		<span property="name" lang="en">Datasets Released by Month</span><span property="fileFormat"
			>CSV</span
		>
		<span property="url"
			>https://open.canada.ca/data/dataset/2916fad5-ebcc-4c86-b0f3-4f619b29f412/resource/f09148f9-a09b-46ec-bf5b-52f26720f3f3/download/opendataportal.siteanalytics.datasetsbyorgbymonth.bilingual.csv</span
		>
	</span>
	<span property="distribution" typeof="DataDownload">
		<span property="inLanguage" content="en,fr" />
		<span property="name" lang="en">Percentages of Site Visits by Province and Territory</span><span
			property="fileFormat">CSV</span
		>
		<span property="url"
			>https://open.canada.ca/data/dataset/2916fad5-ebcc-4c86-b0f3-4f619b29f412/resource/e06f06a9-d897-4a35-9b73-4c2bc1c2d5cf/download/opendataportal.siteanalytics.provincialusagebreakdown.bilingual.csv</span
		>
	</span>
	<span property="distribution" typeof="DataDownload">
		<span property="inLanguage" content="en,fr" />
		<span property="name" lang="en">Percentages of Site Visits by Country</span><span
			property="fileFormat">CSV</span
		>
		<span property="url"
			>https://open.canada.ca/data/dataset/2916fad5-ebcc-4c86-b0f3-4f619b29f412/resource/b52ee0b2-f2be-4bc5-a27a-db93a228d38b/download/opendataportal.siteanalytics.internationalusagebreakdown.bilingual.csv</span
		>
	</span>
	<span property="distribution" typeof="DataDownload">
		<span property="inLanguage" content="en" />
		<span property="name" lang="en">Open Government Analytics</span><span property="fileFormat"
			>HTML</span
		>
		<span property="url">https://open.canada.ca/en/content/open-government-analytics</span>
	</span>
	<span property="distribution" typeof="DataDownload">
		<span property="inLanguage" content="fr" />
		<span property="name" lang="en">Open Government Analytics</span><span property="fileFormat"
			>HTML</span
		>
		<span property="url"
			>https://ouvert.canada.ca/fr/contenu/analyses-concernant-gouvernement-ouvert</span
		>
	</span>
	<span property="distribution" typeof="DataDownload">
		<span property="inLanguage" content="en,fr" />
		<span property="name" lang="en">Top 20 downloaded Open Information </span><span
			property="fileFormat">CSV</span
		>
		<span property="url"
			>https://open.canada.ca/data/dataset/2916fad5-ebcc-4c86-b0f3-4f619b29f412/resource/9d395c98-f33f-4d40-9e3b-3d383321c577/download/opendataportal.siteanalytics.top20info.csv</span
		>
	</span>
	<span property="distribution" typeof="DataDownload">
		<span property="inLanguage" content="en,fr" />
		<span property="name" lang="en">Downloads per organization, last 12 months</span><span
			property="fileFormat">CSV</span
		>
		<span property="url"
			>https://open.canada.ca/data/dataset/2916fad5-ebcc-4c86-b0f3-4f619b29f412/resource/4ebc050f-6c3c-4dfd-817e-875b2caf3ec6/download/opendataportal.siteanalytics.downloads-072022-072023.csv</span
		>
	</span>
	<span property="distribution" typeof="DataDownload">
		<span property="inLanguage" content="en,fr" />
		<span property="name" lang="en">dataset visits per department, last 12 months</span><span
			property="datePublished"
			value="2021-07-01"
		/><span property="fileFormat">CSV</span>
		<span property="url"
			>https://open.canada.ca/data/dataset/2916fad5-ebcc-4c86-b0f3-4f619b29f412/resource/c14ba36b-0af5-4c59-a5fd-26ca6a1ef6db/download/opendataportal.siteanalytics.visits-072022-072023.csv</span
		>
	</span>
	<span property="distribution" typeof="DataDownload">
		<span property="inLanguage" content="en,fr" />
		<span property="name" lang="en">Openness rating per dataset</span><span property="fileFormat"
			>CSV</span
		>
		<span property="url"
			>https://open.canada.ca/data/dataset/2916fad5-ebcc-4c86-b0f3-4f619b29f412/resource/88c73a5e-905e-4c78-b440-c5d5c3acfea8/download/openness_report.csv</span
		>
	</span>
	<span property="distribution" typeof="DataDownload">
		<span property="inLanguage" content="en,fr" />
		<span property="name" lang="en">Average User Rating by Dataset</span><span property="fileFormat"
			>CSV</span
		>
		<span property="url">https://open.canada.ca/sites/default/files/dataset-ratings.csv</span>
	</span>
	<span property="distribution" typeof="DataDownload">
		<span property="inLanguage" content="en,fr" />
		<span property="name" lang="en">Datasets that have been deleted</span><span
			property="fileFormat">CSV</span
		>
		<span property="url"
			>https://open.canada.ca/data/dataset/2916fad5-ebcc-4c86-b0f3-4f619b29f412/resource/d22d2aca-155b-4978-b5c1-1d39837e1993/download/deletedportalds-082022.csv</span
		>
	</span>
	<span property="distribution" typeof="DataDownload">
		<span property="inLanguage" content="en,fr" />
		<span property="name" lang="en">Open Maps Views</span><span property="fileFormat">CSV</span>
		<span property="url"
			>https://open.canada.ca/data/dataset/2916fad5-ebcc-4c86-b0f3-4f619b29f412/resource/15eeafa2-c331-44e7-b37f-d0d54a51d2eb/download/open-maps-analytics.csv</span
		>
	</span>
	<span property="distribution" typeof="DataDownload">
		<span property="inLanguage" content="en,fr" />
		<span property="name" lang="en">Archive of Analytics Data</span><span
			property="datePublished"
			value="2021-07-09"
		/><span property="fileFormat">ZIP</span>
		<span property="url"
			>https://open.canada.ca/data/dataset/2916fad5-ebcc-4c86-b0f3-4f619b29f412/resource/8debb421-e9cb-49de-98b0-6ce0f421597b/download/archive.zip</span
		>
	</span>
	<span property="distribution" typeof="DataDownload">
		<span property="inLanguage" content="en,fr" />
		<span property="name" lang="en">ATI informal requests per summary</span><span
			property="fileFormat">CSV</span
		>
		<span property="url"
			>https://open.canada.ca/data/dataset/2916fad5-ebcc-4c86-b0f3-4f619b29f412/resource/e664cf3d-6cb7-4aaa-adfa-e459c2552e3e/download/ati-informal-requests-analytics.csv</span
		>
	</span>
	<span property="distribution" typeof="DataDownload">
		<span property="inLanguage" content="en,fr" />
		<span property="name" lang="en">Open Information downloads per department, last 12 months</span
		><span property="fileFormat">CSV</span>
		<span property="url"
			>https://open.canada.ca/data/dataset/2916fad5-ebcc-4c86-b0f3-4f619b29f412/resource/b1dfa726-7ed1-4a6b-ae49-77a200abee72/download/opendataportal.siteanalytics.info-072022-072023.csv</span
		>
	</span>
</div>
