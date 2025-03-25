<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import SpatioFilterMap from '$lib/components/map/spatio-filter-map.svelte';

  interface Props {
    coordinatesId: string;
    active?: boolean;
  }

  let { coordinatesId, active = $bindable(false) }: Props = $props();

  const searchMode = $page.data.searchMode;

  // Default coord values
  let northCoord = 83.23324;
  let eastCoord = -52.6481;
  let southCoord = 41.67511;
  let westCoord = -140.99778;

  /************* Translations ***************/
  const translations = $page.data.t;

  const north = translations?.north ? translations["north"] : "North";
  const east = translations?.east ? translations["east"] : "East";
  const south = translations?.south ? translations["south"] : "South";
  const west = translations?.west ? translations["west"] : "West";

  const intersects = translations?.intersects ? translations["intersects"] : "Intersects";
  const within = translations?.within ? translations["within"] : "Within";

  const degrees = translations?.degrees ? translations["degrees"] : "Degrees";
  const spatialInstructions = translations?.spatialInstructions ?
    translations["spatialInstructions"] : "";
  const relationInstructions = translations?.relationInstructions ?
    translations["relationInstructions"] : "";

  const validatorRequired = translations?.validatorRequired ?
    translations["validatorRequired"] : "Please fill out this field.";
  const validatorTooBig = translations?.validatorTooBig ?
    translations["validatorTooBig"] : "Value must be less than or equal to ";
  const validatorTooSmall = translations?.validatorTooSmall ?
    translations["validatorTooSmall"] : "Value must be greater than or equal to ";
  const validatorNorthGreater = translations?.validatorNorthGreater ?
    translations["validatorNorthGreater"] :
    "The northern latitude value should be greater than the southern latitude.";

  const labels = [
    { label: north, id: coordinatesId + "-north", max: "90", placeHolder: "90" },
    { label: east, id: coordinatesId + "-east", max: "180", placeHolder: "180" },
    { label: south, id: coordinatesId + "-south", max: "90", placeHolder: "-90" },
    { label: west, id: coordinatesId + "-west", max: "180", placeHolder: "-180" },
  ];

  // Element references
  let inputs = $state({});
  let filterMap = $state();

  let relation = $page.url.searchParams.get('relation') ?? 'intersects';
  let relationGroup = $state(relation);

  /************* Check screen size for map **************/

  // For small screens, don't include the map, use inputs only
  let showMap = $state(true);

  const checkScreenSize = () => {
    // Tailwind's 'sm' breakpoint starts at 640px
    showMap = window.matchMedia('(min-width: 640px)').matches;
  };

  // This is wrapped in onMount to account for the use of window and
  // avoid errors while rendering on the server
  onMount(() => {
    checkScreenSize();

    // Update map visibility on window resize
    const resizeListener = () => checkScreenSize();
    window.addEventListener('resize', resizeListener);

    // Remove the event listener when the component is destroyed
    return () => {
      window.removeEventListener('resize', resizeListener);
    };
  });

  export function resetFilters() {
    const urlParams = $page.url.searchParams;
    const spatialRelation = urlParams.get('relation') ?? 'intersects';
    relationGroup = spatialRelation;

    const coords = {
      north: urlParams.get("north") ?? northCoord,
      east: urlParams.get("east") ?? eastCoord,
      south: urlParams.get("south") ?? southCoord,
      west: urlParams.get("west") ?? westCoord,
    };

    labels.forEach(({ id }) => {
      if (inputs) {
        const key = id.replace(coordinatesId + '-', '');
        const value = coords[key];
        inputs[id].value = value && !isNaN(Number.parseFloat(value)) ? value : null;
      }
    });

    // Reset the bounding box on the map to match the inputs
    if (filterMap) {
      let coordinates = getCoordinates();
      filterMap.setVertices(coordinates);
    }
  }

  export function getBBox() {
    let northEl = inputs['spatio-temporal-north'];
    let eastEl = inputs['spatio-temporal-east'];
    let southEl = inputs['spatio-temporal-south'];
    let westEl = inputs['spatio-temporal-west'];
    let bbox = null;

    if (northEl && eastEl && southEl && westEl) {
      bbox = {
        north: northEl.value,
        east: eastEl.value,
        south: southEl.value,
        west: westEl.value,
      };
    }

    return bbox;
  }

  function handleCoodinateChange() {
    if (filterMap) {
      let coordinates = getCoordinates();
      filterMap.setVertices(coordinates);
    }
  }
  
  function handleBboxModify(coords) {
    let northVal = coords.find((coord, i, arr) => 
      i > 0 && coord[1] > arr[i - 1][1]
    )[1];
    let eastVal = coords.find((coord, i, arr) => 
      i > 0 && coord[0] > arr[i - 1][0]
    )[0];
    let southVal = coords.find((coord, i, arr) => 
      i > 0 && coord[1] < arr[i - 1][1]
    )[1];
    let westVal = coords.find((coord, i, arr) => 
      i > 0 && coord[0] < arr[i - 1][0]
    )[0];

    inputs['spatio-temporal-north'].value = Math.round(northVal * 100000) / 100000;
    inputs['spatio-temporal-east'].value = Math.round(eastVal * 100000) / 100000;
    inputs['spatio-temporal-south'].value = Math.round(southVal * 100000) / 100000;
    inputs['spatio-temporal-west'].value = Math.round(westVal * 100000) / 100000;
  }
  
  function getCoordinates() {
    let northVal = inputs['spatio-temporal-north']?.value ?? northCoord;
    let eastVal = inputs['spatio-temporal-east']?.value ?? eastCoord;
    let southVal = inputs['spatio-temporal-south']?.value ?? southCoord;
    let westVal = inputs['spatio-temporal-west']?.value ?? westCoord;

    return [
      [
        [westVal, southVal],
        [westVal, northVal],
        [eastVal, northVal],
        [eastVal, southVal],
        [westVal, southVal]
      ]
    ]
  }

  function init(key: string) {
    let searchKey = key.replace((coordinatesId + '-'), '');
    let coord = $page.url.searchParams.get(searchKey);

    // Use defaults if no coordinate is available.
    // Defaults are based on the extent of canada's bounding box.
    if (!coord) {
      if (searchKey == "north") {
        coord = northCoord;
      } else if (searchKey == "east") {
        coord = eastCoord;
      } else if (searchKey == "south") {
        coord = southCoord;
      } else if (searchKey == "west") {
        coord = westCoord;
      }
    }

    return coord;
	}

  /************* Validators ***************/

  // Note: we are using a custom validator here because, at this time,
  // there is no way to control the language setting of the browser's
  // default validator messages. This way, we can translate them.
  function customizeValiditor(input: HTMLInputElement) {
    function validate() {
      let message = '';
      let number = Number.parseFloat(input.value);
      let min = Number.parseFloat(input.min);
      let max = Number.parseFloat(input.max);

      // Note: The validator message is set when the field is set, and not when
      // the is form submitted. So, we need to check both the north and south latitudes
      // seperately to account for the user possibly entering values in the reverse order.
      // Also, we only need to check the latitue because longitudes can wrap arround in
      // in the oposite direction.
      if (Number.isNaN(number)) {
        message = validatorRequired;
      } else if (!Number.isNaN(min) && number < min) {
        message = validatorTooSmall + min;
      } else if (!Number.isNaN(max) && number > max) {
        message = validatorTooBig + max;
      } else if (input.id == coordinatesId + '-north') {
        const southValue = Number.parseFloat(inputs[coordinatesId + '-south']?.value || "");
        if (!Number.isNaN(southValue) && number < southValue) {
          message = validatorNorthGreater;
        }
      } else if (input.id == coordinatesId + '-south') {
        const northValue = Number.parseFloat(inputs[coordinatesId + '-north']?.value || "");
        if (!Number.isNaN(northValue) && number > northValue) {
          message = validatorNorthGreater;
        }
      }

			input.setCustomValidity(message);	
		}

		input.addEventListener('input', validate);
		validate();

		return {
			destroy() {
				input.removeEventListener('input', validate);
			}
		}
  }

</script>

{#if searchMode == "semantic"}
  <p class="mt-4 mb-2">{relationInstructions}</p>
  <div class="mb-4">
    <input
      type="radio" name="spatial-relation" id="intersects" value="intersects" bind:group={relationGroup}
    />
    <label class="mr-3" for="intersects">{intersects}</label>
    <input
      type="radio" name="spatial-relation" id="within" value="within" bind:group={relationGroup}
    />
    <label for="within">{within}</label>
  </div>
{/if}
<p class="mb-3" >{spatialInstructions}</p>
<div class="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-[36rem]">
  {#each labels as { label, id, max, placeHolder }}
    <div class="flex flex-col">
      <label for={id}>
        {label} ({degrees})
      </label>
      <!--
        Note: the 'required' attribute only works when the input is enabled,
        so it won't block a form unless the user has selected the spatial checkbox
      -->
      <input
        bind:this={inputs[id]}
        type="number"
        step="any"
        id={id}
        name={id}
        min={'-' + max}
        max={max}
        placeholder={placeHolder}
        disabled="{!active}"
        value={init(id)}
        class="border-2 rounded border-custom-16 px-3.5 py-[0.5625rem]"
        required
        use:customizeValiditor
        oninput={handleCoodinateChange}
      />
    </div>
  {/each}
</div>
<!--
  Geoview maps rely on the size of the map container to load without errors.
  So, wrapping the map in this if statement ensures that the map is only loaded
  once it becomes visible.
-->
{#if active && showMap}
  <div class="pt-4">
    <SpatioFilterMap coordinates={getCoordinates()} bind:this={filterMap} bboxModify={handleBboxModify} />
  </div>
{/if}

<style>
  input[type=radio] {
    @apply appearance-none;
    @apply h-7;
    @apply w-7;
    @apply border-2;
    @apply border-custom-16;
    @apply rounded-[50%];
    @apply relative;
    @apply top-2;
    @apply mr-2;
  }

  input[type=radio]:checked {
    @apply p-1;
    @apply bg-custom-16;
    @apply bg-clip-content;
  }
</style>
