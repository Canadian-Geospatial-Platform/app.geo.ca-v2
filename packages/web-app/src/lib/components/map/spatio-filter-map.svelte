<script lang="ts">
  import { page } from '$app/stores';
  import { browser } from '$app/environment';
  import { onMount, tick } from 'svelte';

  let {
    coordinates = [
      [-140.99778, 41.67511],
      [-52.6481, 41.67511],
      [-52.6481, 83.23324],
      [-140.99778, 83.23324],
      [-140.99778, 41.67511],
    ],
    dynamic = true,
    bboxModify
  }: Props = $props();

  /************ Map Config ************/

  const mapId = 'map-spatio-filter';
  const interactionType = dynamic ? 'dynamic' : 'static';
  const mapLang = $page.data.lang == 'fr-ca' ? 'fr' : 'en';

  const basemapId = 'transport';
  const shaded = true;
  const labeled = true;

  const mapProjection = 3857;
  const center = [-100, 68];
  const zoom = 2;
  const maxExtent = [-180, -90, 180, 90];

  let config = {
    map: {
      interaction: interactionType,
      viewSettings: {
        initialView: {
          zoomAndCenter: [zoom, center]
        },
        maxExtent: maxExtent,
        projection: mapProjection
      },
      basemapOptions: {
        basemapId: basemapId,
        shaded: shaded,
        labeled: labeled
      },
    },
    navBar: ['zoom'],
    components: [],
    corePackages: []
  };

  const sConfig = JSON.stringify(config);

  /************ Utility Methods ************/

  // This placeholder function logs a warning if called before the map is initialized.  
  // It gets replaced later with a function to update bbox coordinates.
  let setVerticesFromCoords: (coords: number[][][]) => void = () => {
    console.warn("map not initialized");
  };

  // This allows for the bbox vertices to be updated programatically,
  // but only after the map has been initialized
  export function setVertices(coords: number[][][]) {
    setVerticesFromCoords(coords);
  }

  // The geoview modify interaction typically updates only one vertex in a polygon.
  // To ensure the bounding box remains a rectangle, the vertices adjacent to the one
  // being modified, need to be updated too. This method determines what the coordinates
  // should be to maintain a rectangular shape.
  function enforceRectangle(coords, movedIndex, newCoord) {
    // Only modify the polygon if it has four vertices. We check for five
    // since the first and last coordinates will be same to close the polygon.
    if (coords.length != 5) {
      return coords;
    }

    let modifiedCoords = [];

    // Determine which vertices are adjacent to the modified vertex
    // Only these will change, leaving the oposite in the same place
    let oppositeIndex = (movedIndex + 2) % 4;
    let adjacentIndex1 = (movedIndex + 1) % 4;
    let adjacentIndex2 = (movedIndex + 3) % 4;

    // Apply the changes to the feature's coordinates
    modifiedCoords[movedIndex] = [newCoord[0], newCoord[1]];
    modifiedCoords[adjacentIndex1] = [newCoord[0], coords[oppositeIndex][1]];
    modifiedCoords[adjacentIndex2] = [coords[oppositeIndex][0], newCoord[1]];
    modifiedCoords[oppositeIndex] = [coords[oppositeIndex][0], coords[oppositeIndex][1]];

    // Close the polygon
    modifiedCoords[4] = modifiedCoords[0]

    return modifiedCoords;
  }

  /************ After Map Initialization ************/

  onMount(async () => {
    await tick();
    // Remove any old copies of the map
    cgpv.api.maps[mapId]?.remove(true);

    try {
      await cgpv.api.createMapFromConfig(mapId, sConfig);

      /*********** Initialize Map and Polygon ***********/

      const map = cgpv.api.maps[mapId];
      const layerGeometry = map?.layer.geometry;
      const bboxId = 'bbox-outline';
      const groupKey = 'bbox';

      // The projection used to convert coordinates to longitude and latitude
      // coordinates reguardless of the map projection.
      const lonLatProjection = 4326;
      const bboxOptions = {
        style: {
          strokeColor: '#535aa4',
          strokeWidth: 3,
          fillColor: '#535aa4',
          fillOpacity: 0.2,
        }
      };

      // Add bbox polygon to the map
      const bboxPolygon = layerGeometry.addPolygon(coordinates, bboxOptions, bboxId, groupKey);

      // Update the coordinates to apply the projection transformation
      layerGeometry.setFeatureCoords(bboxId, coordinates, lonLatProjection);

      // Create a group to be used with the modify and translate interactions
      layerGeometry.createGeometryGroup(groupKey);

      // Redefine setVerticesFromCoords after polygon has been added
      setVerticesFromCoords = (coords: number[][][]) => {
        layerGeometry.setFeatureCoords(bboxId, coords, lonLatProjection);
      };

      /*********** Get Extent From View Custom Button ***********/

      const buttonGroupName = 'buttonGroup';
      const buttonTooltip = $page.data.lang == "fr-ca" ?
        "Définir le cadre de délimitation sur l'étendue visible" :
        "Set bounding box to visible extent";

      const button = {
        tooltip: buttonTooltip,
        children: cgpv.react.createElement(
          "svg",
          {
            width: 24,
            height: 24,
            viewBox: "0 0 24 24",
            fill: "none",
            stroke: "currentColor",
            strokeWidth: 2,
          },
          cgpv.react.createElement("rect", { x: 3, y: 3, width: 18, height: 18 }),
          cgpv.react.createElement("circle", { cx: 3, cy: 3, r: 2 }),
          cgpv.react.createElement("circle", { cx: 3, cy: 21, r: 2 }),
          cgpv.react.createElement("circle", { cx: 21, cy: 3, r: 2 }),
          cgpv.react.createElement("circle", { cx: 21, cy: 21, r: 2 }),
        ),
        tooltipPlacement: 'left',
        onClick: function () {
          // Get view extent and resolution
          const viewExtent = map.getView().calculateExtent();
          const resolution = map.getView().getResolution();

          // Add a small gap between the edge of the map and the view extent
          const gapPercent = 0.025;
          const longitudeDifference = viewExtent[2] - viewExtent[0];
          const longGapSize = longitudeDifference * gapPercent;

          const latitudeDifference = viewExtent[3] - viewExtent[1];
          const latGapSize = latitudeDifference * gapPercent;

          // For the southern coordinate, add the size of the footerbar to the gap
          // so the southern edge is not blocked
          const heightOfFooterBar = resolution * 48;
          const southGapSize = heightOfFooterBar + latGapSize;

          const viewBboxCoords = [[
              [viewExtent[0] + longGapSize, viewExtent[1] + southGapSize],
              [viewExtent[2] - longGapSize, viewExtent[1] + southGapSize],
              [viewExtent[2] - longGapSize, viewExtent[3] - latGapSize],
              [viewExtent[0] + longGapSize, viewExtent[3] - latGapSize],
              [viewExtent[0] + longGapSize, viewExtent[1] + southGapSize],
            ]];

          // Set coordinates of bbox
          bboxPolygon.getGeometry().setCoordinates(viewBboxCoords);

          // Send the coordinates to the parent component. We can convert the coordinates
          // to longitude and latitude in degrees first
          const lonLatCoords = layerGeometry.getFeatureCoords(bboxId, lonLatProjection)[0];
          bboxModify(lonLatCoords);
        },
      };

      // Add the button to the map
      map.navBarApi.createNavbarButton(button, buttonGroupName);

      /*********** Translate Interaction ***********/

      const translateInteraction = map.initTranslateOneFeatureInteractions(groupKey);

      translateInteraction.onTranslateEnded((sender, payload) => {
        const lonLatCoords = layerGeometry.getFeatureCoords(bboxId, lonLatProjection)[0];
        bboxModify(lonLatCoords);
      });

      /*********** Modify Interaction ***********/

      const modifyStyle = { strokeWidth: 6 };
      const insertVertexCondition = () => false;
      const pixelTolerance = 15;
      const modifyInteraction = map.initModifyInteractions(
        groupKey, modifyStyle, insertVertexCondition, pixelTolerance);

      let bboxCoordinates = [];

      // While the modify interaction is taking place, the modifyDragged event is triggered
      // whenever the vertices of the bounding box are modified. So, when the enforceRectangle()
      // is called, a redundant set of modifyDragged events are dispatched for each of the
      // updated vertices. We can use this flag to indicate when the bounding box is being
      // modified, ignoring these redundant events and avoiding an endless recursive loop.
      let isUpdating = false;

      // This tracks the modified vertex index (-1 means it is unset). It also ensures that
      // enforceRectangle() is applied only to the dragged vertex, preventing redundant calls.
      let modifiedIndex = -1;

      modifyInteraction.onModifyStarted((sender, payload) => {
        // Get coordinates of the bounding box
        const feature = payload.features.item(0);
        if (feature) {
          const geometry = feature.getGeometry();
          if (geometry && geometry.getType() === 'Polygon') {
            bboxCoordinates = geometry.getCoordinates()[0];
          }
        }
      });

      modifyInteraction.onModifyEnded((sender, payload) => {
        // Set the final coordinates of the bounding box.
        // Skipping this step causes the modify vertices and bbox vertices to
        // be mismatched.
        const feature = payload.features.item(0);
        if (feature) {
          const geometry = feature.getGeometry();
          if (geometry && geometry.getType() === 'Polygon') {
            geometry.setCoordinates([bboxCoordinates]);
          }
        }

        // Reset the current modified index
        modifiedIndex = -1;

        // Send the new bbox coordinates back to the parent component. Convert the coordinates to degrees first.
        const lonLatCoords = layerGeometry.getFeatureCoords(bboxId, lonLatProjection)[0];
        bboxModify(lonLatCoords);
      });

      modifyInteraction.onModifyDragged((sender, payload) => {
        // Prevents redundant and recursive calls from the enforceRectangle() function.
        if (isUpdating) {
          return;
        }

        // Get the feature with the dragged vertex
        let feature = payload.features.item(0);

        if (feature) {
          let geometry = feature.getGeometry();

          if (geometry && geometry.getType() === 'Polygon') {
            const newCoordinates = geometry.getCoordinates()[0];

            // Get the index of the vertex being dragged by cycling through
            // newCoordinates array and finding the vertex that doesn't match
            // the original coordinate set.
            if (modifiedIndex === -1) {
              for (let i = 0; i < newCoordinates.length - 1; i++) {
                if (
                  bboxCoordinates[i][0] !== newCoordinates[i][0] ||
                  bboxCoordinates[i][1] !== newCoordinates[i][1]
                ) {
                  modifiedIndex = i;
                  break;
                }
              }
            }

            // If the bounding box has been modified from it's previous state,
            // update it's vertices to ensure that it remains a rectangle.
            // Update the isUpdating flag to prevent redundant modifications.
            if (modifiedIndex !== -1 &&
              (bboxCoordinates[modifiedIndex][0] !== newCoordinates[modifiedIndex][0] ||
              bboxCoordinates[modifiedIndex][1] !== newCoordinates[modifiedIndex][1])
            ) {
              // Block additional updates
              isUpdating = true;

              // Get the updated coordinates of the new bbox
              const newCoords = enforceRectangle(bboxCoordinates, modifiedIndex, newCoordinates[modifiedIndex]);

              // Assign the new coordinates to the map feature and update the bboxCoordinates variable.
              geometry.setCoordinates([newCoords]);
              feature.setGeometry(geometry);
              bboxCoordinates = newCoords;

              // Allow additional updates
              isUpdating = false;
            }
          }
        }
      });
    } catch (e) {
      console.error(e);
    }
  });
</script>

<svelte:head>
  <!-- TODO: switch back to old link after geoview pull request with modifyDragged event accepted -->
  <!-- <script src="https://lbercovitch.github.io/geoview-leah/cgpv-main.js"></script> -->
  <script src="http://localhost:8081/cgpv-main.js"></script>
  <!--<script src="https://canadian-geospatial-platform.github.io/geoview/public/cgpv-main.js"></script>-->
</svelte:head>

<div
  id={mapId}
  class="bg-blue-500/5 h-[25rem] max-w-[36rem]"
  data-config={sConfig}
  data-lang={mapLang}
></div>
