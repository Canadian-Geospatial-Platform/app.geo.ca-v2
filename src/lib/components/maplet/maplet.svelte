<script lang="ts">
    //import ol from '$lib/assets/css/ol.svelte';
    import { onMount } from 'svelte';
    // OpenLayers
    import { Feature, Map } from 'ol';
    import { FullScreen, defaults as defaultControls } from 'ol/control';    
    import { Polygon } from "ol/geom";
    import TileLayer from "ol/layer/Tile";
    import VectorLayer from "ol/layer/Vector";
    import { fromLonLat } from "ol/proj";
    import { XYZ } from "ol/source";
    import VectorSource from "ol/source/Vector";
    import { Fill, Stroke, Style } from "ol/style";
    import View from "ol/View";
    //import { Coordinate } from "ol/coordinate";
    // Exports
    export let mapId:string;
    export let center:number[];
    export let zoom: number;
    export let coordinates: Coordinate[][];
    // Local state
    let map = null;

    const polygon = new Feature({ geometry: new Polygon(coordinates, "XYZ").transform('EPSG:4326', 'EPSG:3857') });

    polygon.setStyle(new Style({ stroke: new Stroke({ color: 'blue' }), fill: new Fill({ color: 'rgba(0,0,255, 0.1)' }) }));

    const source = new VectorSource({});
    source.addFeature(polygon);
    const initalFeaturesLayer = new VectorLayer({
        source: source
    });
    // functions
    const setupMap = (node) => {
        map = new Map({
            target: mapId,
            layers: [
                new TileLayer({
                    source: new XYZ({
                        url: "https://maps-cartes.services.geo.ca/server2_serveur2/rest/services/BaseMaps/CBMT_CBCT_GEOM_3857/MapServer/WMTS/tile/1.0.0/BaseMaps_CBMT_CBCT_GEOM_3857/default/default028mm/{z}/{y}/{x}.jpg"
                    })
                })
            ],
            view: new View({
                projection: 'EPSG:3857',
                center: fromLonLat(center),
                zoom: zoom
            }),
            controls: defaultControls().extend([new FullScreen()])
        });
        map.addLayer(initalFeaturesLayer);
 
        return {
            destroy() {
                if (map) { // as Map
                    map.setTarget(null);
                    map = null;
                }
            }
        }
    }
</script>

<div id={mapId} class="map" use:setupMap>
</div>

<style>
    @import "./ol.css";
    .map {
        height: 300px;
        overflow: hidden;                 
        margin-top: 0;
        max-height: 300px;
    }
</style>