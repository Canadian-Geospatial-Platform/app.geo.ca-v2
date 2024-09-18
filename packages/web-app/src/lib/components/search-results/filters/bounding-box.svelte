<script lang="ts">
  import { page } from '$app/stores';

  export let coordinatesId: string;
  export let coordinatesName: string;
  export let active: boolean = false;

  /************* Translations ***************/
  const translations = $page.data.t;

  const north = translations?.north ? translations["north"] : "North";
  const east = translations?.east ? translations["east"] : "East";
  const south = translations?.south ? translations["south"] : "South";
  const west = translations?.west ? translations["west"] : "West";
  const degrees = translations?.degrees ? translations["degrees"] : "Degrees";
  const spatialInstructions = translations?.spatialInstructions ?
    translations["spatialInstructions"] : "";
  const validatorRequired = translations?.validatorRequired ?
    translations["validatorRequired"] : "Please fill out this field.";
  const validatorTooBig = translations?.validatorTooBig ?
    translations["validatorTooBig"] : "Value must be less than or equal to ";
  const validatorTooSmall = translations?.validatorTooSmall ?
    translations["validatorTooSmall"] : "Value must be greater than or equal to ";

  const labels = [
    [north, coordinatesId + "-north", "90", "90"],
    [east, coordinatesId + "-east", "180", "180"],
    [south, coordinatesId + "-south", "90", "-90"],
    [west, coordinatesId + "-west", "180", "-180"]
  ];

  function init(key: string) {
    return $page.url.searchParams.get(key);
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

      if (Number.isNaN(number)) {
        message = validatorRequired;
      } else if (!Number.isNaN(min) && number < min) {
        message = validatorTooSmall + min;
      } else if (!Number.isNaN(max) && number > max) {
        message = validatorTooBig + max;
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

<p class="mb-3" >{spatialInstructions}</p>
<div class="grid grid-cols-1 md:grid-cols-2 gap-3">
  {#each labels as inputLabel}
    <div class="flex flex-col">
      <label for={inputLabel[1]}>
        {inputLabel[0] + " (" + degrees + ")"}
      </label>
      <!--
        Note: the 'required' attribute only works when the input is enabled,
        so it won't block a form unless the user has selected the spatial checkbox
      -->
      <input
        type="number" id={inputLabel[1]} name={coordinatesName}
        min={"-" + inputLabel[2]} max={inputLabel[2]}
        placeholder={inputLabel[3]} disabled="{!active}"
        value={init(inputLabel[1])}
        class="border-2 rounded border-custom-16 px-3.5 py-[9px]"
        required use:customizeValiditor
      />
    </div>
  {/each}
</div>
