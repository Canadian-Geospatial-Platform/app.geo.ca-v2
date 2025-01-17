<script lang="ts">
  import { page } from '$app/stores';

  interface Props {
    coordinatesId: string;
    active?: boolean;
  }

  let { coordinatesId, active = $bindable(false) }: Props = $props();

  const searchMode = $page.data.searchMode;

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

  let relation = $page.url.searchParams.get('relation') ?? 'intersects';
  let relationGroup = $state(relation);

  export function resetFilters() {
    const urlParams = $page.url.searchParams;
    const spatialRelation = urlParams.get('relation') ?? 'intersects';
    relationGroup = spatialRelation;

    const coords = {
      north: urlParams.get("north"),
      east: urlParams.get("east"),
      south: urlParams.get("south"),
      west: urlParams.get("west"),
    };

    labels.forEach(({ id }) => {
      if (inputs) {
        const key = id.replace(coordinatesId + '-', '');
        const value = coords[key];
        inputs[id].value = value && !isNaN(Number.parseFloat(value)) ? value : null;
      }
    });
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

  function init(key: string) {
    let searchKey = key.replace((coordinatesId + '-'), '');
    let coord = $page.url.searchParams.get(searchKey);
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
<div class="grid grid-cols-1 md:grid-cols-2 gap-3">
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
      />
    </div>
  {/each}
</div>

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
