<script lang="ts">
	import { page } from '$app/stores';
	import { browser } from '$app/environment';

	export let coordinates;
	export let id;
	$: center = calculateCenter(coordinates[0]);
	$: zoom = calculateZoom(coordinates[0]);
	// an empty listOfGeoviewLayerConfig is a required field for now. it may become unnecessary at a later date.
	$: config = {
		map: {
			interaction: 'static',
			viewSettings: {
				zoom: zoom,
				center: center,
				projection: 3978
			},
			basemapOptions: {
				basemapId: 'transport',
				shaded: true,
				labeled: true
			},
			listOfGeoviewLayerConfig: []
		},
		theme: 'geo.ca',
		components: [],
		corePackages: [],
		suportedLanguages: ['en']
	};
	$: sConfig = JSON.stringify(config);

	function calculateCenter(coordinates) {
		const defaultValue = [-100, 60];
		if (!coordinates) {
			console.warn('invalid coordinates, returing default value: \n', coordinates);
			return defaultValue;
		}
		let i = 0;
		let xAccumulator = 0;
		let yAccumulator = 0;
		try {
			coordinates.forEach((e) => {
				xAccumulator += e[0];
				yAccumulator += e[1];
				i++;
			});
		} catch (e) {
			console.warn('error iterating coordinates, , returing default value2', coordinates);
			return defaultValue;
		}
		return [xAccumulator / i, yAccumulator / i];
	}

	function calculatePolygonArea(vertices) {
		var total = 0;

		for (var i = 0, l = vertices.length; i < l; i++) {
			var addX = vertices[i][0];
			var addY = vertices[i == vertices.length - 1 ? 0 : i + 1][1];
			var subX = vertices[i == vertices.length - 1 ? 0 : i + 1][0];
			var subY = vertices[i][1];

			total += addX * addY * 0.5;
			total -= subX * subY * 0.5;
		}

		return Math.abs(total);
	}

	function calculateZoom(coordinates) {
		let area = calculatePolygonArea(coordinates);
		if (area > 100) {
			return 3.2;
		}
		if (area > 50) {
			return 4;
		}
		return 5;
	}
</script>

<svelte:head>
	<script src="https://canadian-geospatial-platform.github.io/geoview/public/cgpv-main.js"></script>
</svelte:head>
<div>
	<div
		id={'map-' + id}
		style="height: full"
		class="geoview-map llwp-map bg-purple-100 rounded-lg w-full h-96 xl:h-full"
		data-config={sConfig}
		data-lang="en"
		data-geocore-keys={id}
	/>
</div>
