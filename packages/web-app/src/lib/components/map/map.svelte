<script lang="ts">
	import { page } from '$app/stores';
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import { loadCGPVScript } from '$lib/components/map/loadCGPVScript.ts';

	interface Props {
		coordinates: any;
		id: any;
		dynamic?: boolean;
		width?: string;
		height?: string;
		mapProjection?: number;
		mapType?: any;
		footer?: boolean;
		timeSlider?: boolean;
		chart?: boolean;
	}

	let {
		coordinates,
		id,
		dynamic = false,
		width = '100%',
		height = '36rem',
		mapProjection = 3978,
		mapType = null,
		footer = false,
		timeSlider = false,
		chart = false
	}: Props = $props();

	let mapId = 'map-' + mapType + '-' + id;
	let mapLang = $page.data.lang == 'fr-ca' ? 'fr' : 'en';

	let config = $state({
		map: {
			interaction: dynamic ? 'dynamic' : 'static',
			viewSettings: {
				projection: mapProjection
			},
			basemapOptions: {
				basemapId: 'transport',
				shaded: false,
				labeled: true
			}
		},
		theme: 'geo.ca',
		components: ['north-arrow', 'overview-map'],
		corePackages: [],
		appBar: {
			tabs: {
				core: ['geolocator', 'legend']
			}
		}
	});

	if (footer) {
		config.footerBar = {
			tabs: {
				core: ['layers', 'details', 'data-table']
			},
			collapsed: true
		};
	}

	if (timeSlider) {
		if (footer) {
			config.footerBar.tabs.core.push('time-slider');
		} else {
			config.footerBar = {
				tabs: {
					core: ['time-slider']
				},
				collapsed: true
			};
		}
	}

	if (chart) {
		if (footer) {
			config.footerBar.tabs.core.push('geochart');
		} else {
			config.footerBar = {
				tabs: {
					core: ['geochart']
				},
				collapsed: true
			};
		}
	}

	let sConfig = $derived(JSON.stringify(config));

	// Note: This method can only be called after the map and map layers
	// have finished loading
	function zoomToBBox(coordinates, cgpv) {
		// Since the coordinates are in long-lat format, we need to project them
		const projectedExtent = coordinates[0].map((coordinate) => {
			return cgpv.api.utilities.projection.transformFromLonLat(
				coordinate,
				cgpv.api.utilities.projection.PROJECTIONS[mapProjection]
			);
		});

		// The extent needs to be formatted like this
		//   [furthestWestLong, furthestSouthLat, furthestEastLong, furthestNorthLat]
		// for the zoomToExtent method to work, so we can pull the coordinates from
		// the projected extent
		const longitudes = projectedExtent.map((coord) => coord[0]);
		const latitudes = projectedExtent.map((coord) => coord[1]);

		const furthestWest = Math.min(...longitudes);
		const furthestSouth = Math.min(...latitudes);
		const furthestEast = Math.max(...longitudes);
		const furthestNorth = Math.max(...latitudes);

		const extent = [furthestWest, furthestSouth, furthestEast, furthestNorth];

		cgpv.api.getMapViewer(mapId).zoomToExtent(extent);
	}

	function getBbox(coordinates) {
		// This is the bounding coordinates of Canada
		const defaultValue = [
			[-140.99778, 41.6751050889],
			[-140.99778, 83.23324],
			[-52.6480987209, 83.23324],
			[-52.6480987209, 41.6751050889]
		];

		if (!coordinates) {
			console.warn('invalid coordinates, returing default value: \n', coordinates);
			return defaultValue;
		}

		let bbox = coordinates;

		// If first and last points are the same, remove the redundant one
		if (
			bbox[0][0][0] == bbox[0][bbox.length - 1][0] &&
			bbox[0][0][1] == bbox[0][bbox.length - 1][1]
		) {
			bbox = bbox[0].slice(0, -1);
		}

		// For the Lambert projection (3978), we can add extra points along the top and bottom
		// edge of the bbox to get it to approximate the curve of the latitude lines.
		if (mapProjection == 3978 && bbox.length === 4) {
			// Find which vertices belong to the top and bottom edges.
			// To do this, we can sort the vertices based on the latitude,
			// to determine the top and bottom vertices, then find which which
			// longitude is larger to determine the east and west vertices.
			const sortByLatitude = bbox.sort((a, b) => a[1] - b[1]);
			const bottomPoints = [sortByLatitude[0], sortByLatitude[1]];
			const topPoints = [sortByLatitude[2], sortByLatitude[3]];

			const [bottomWest, bottomEast] = bottomPoints.sort((a, b) => a[0] - b[0]);
			const [topWest, topEast] = topPoints.sort((a, b) => a[0] - b[0]);

			// Add extra points to the north and south edges to aproximate the curve
			const northEdge = addVertices(topWest, topEast, 20);
			const southEdge = addVertices(bottomWest, bottomEast, 20);
			bbox = southEdge.concat(northEdge.reverse());
		}

		for (const coord of bbox) {
			// Check to make sure coordinates are valid
			if (
				coord.length != 2 ||
				isNaN(coord[0]) ||
				isNaN(coord[1]) ||
				coord[0] > 180 ||
				coord[0] < -180 ||
				coord[1] > 90 ||
				coord[1] < -90
			) {
				return defaultValue;
			}
		}

		return bbox;
	}

	// Add additional vertices to a latitudinal edge
	function addVertices(west, east, numVerticesToAdd) {
		const fraction = (east[0] - west[0]) / numVerticesToAdd;
		const latitude = west[1];

		let vertices = [];
		let newLongitude;

		for (let i = 0; i <= numVerticesToAdd; i++) {
			newLongitude = west[0] + i * fraction;
			vertices.push([newLongitude, latitude]);
		}
		return vertices;
	}

	onMount(async () => {
		// The loadCGPVScript function ensures the external cgpv library is fully loaded before
		// trying to use the geocore code, otherwise it sometimes fails
		await loadCGPVScript();

		try {
			// Destroy the old map if it exists. This ensures that when the map is toggled
			// on and off multiple time, it always has visible layers.
			if (cgpv.api.hasMapViewer(mapId)) {
				await cgpv.api.deleteMapViewer(mapId, false);
			}

			// Create the layer config to check if the geocore record has a map. It is undefined if no map exists.
			const geoviewLayerConfig = await cgpv.api.config.createLayerConfig(
				id,
				'geoCore',
				[],
				mapLang
			);

			// Add the geocore layer to the map config if it exists
			if (geoviewLayerConfig) {
				config.map.listOfGeoviewLayerConfig = [
					{
						geoviewLayerType: 'geoCore',
						geoviewLayerId: id
					}
				];
			}

			// Sometimes, when going to a record page from the search results page
			// geoview attemps to build the map using the config from the search page.
			// To stop this, we can assign the map id based on the type of map
			// (i.e., resultList vs record), then check to make sure the map div exists.
			// Note: We can safely use document here since it is inside onMount.
			if (document.getElementById(mapId)) {
				// Build the map from the config
				await cgpv.api.createMapFromConfig(mapId, sConfig);
			}

			// Add bounding box when no map is available
			if (!geoviewLayerConfig) {
				let bbox = getBbox(coordinates);

				// Sometimes, the map's vector layer hasn't finished loading when we try
				// to add the bbox polygon. We need to wait for the layer, so we can wrap
				// the following code in a handler to catch the mapLayersLoaded event before
				// triggering addPolygon.
				cgpv.api.getMapViewer(mapId)?.onMapLayersLoaded(() => {
					cgpv.api.getMapViewer(mapId).layer.geometry.addPolygon([bbox], {
						style: {
							strokeColor: '#535aa4',
							strokeWidth: 3,
							fillColor: '#535aa4',
							fillOpacity: 0.2
						}
					});

					// Zoom to the bounding box of the layer
					zoomToBBox(coordinates, cgpv);
				});
			} else {
				// Check to make sure the layers have finished loading before zooming
				cgpv.api.getMapViewer(mapId)?.onMapLayersLoaded(() => {
					// Zoom to the bounding box of the layer
					zoomToBBox(coordinates, cgpv);
				});
			}
		} catch (e) {
			console.error(e);
		}
	});
</script>

<div
	id={mapId}
	class="bg-blue-500/5 w-full aspect-video"
	data-config={sConfig}
	data-lang={mapLang}
></div>
