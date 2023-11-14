<script lang="ts">
	import { page } from '$app/stores';
	import { browser } from '$app/environment';

	export let coordinates;
	export let id;
	$: center = calculateCenter(coordinates[0]);
	$: zoom = calculateZoom(coordinates[0]);
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
		theme: 'dark',
		components: [],
		corePackages: [],
		suportedLanguages: ['en']
	};
	$: sConfig = JSON.stringify(config);

	function calculateCenter(coordinates) {
		let i = 0;
		let xAccumulator = 0;
		let yAccumulator = 0;
		coordinates.forEach((e) => {
			xAccumulator += e[0];
			yAccumulator += e[1];
			i++;
		});
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
		console.log(id, area);
		if (area > 100) {
			return 3.2;
		}
		if (area > 50) {
			return 4;
		}
		return 5;
	}
</script>

<!--for now, we pass data config in the html as javascript configuration is more bug prone.-->
<div
	{id}
	class="llwp-map bg-purple-100 rounded-lg w-full h-96 xl:h-full"
	data-lang="en"
	data-config={sConfig}
/>
