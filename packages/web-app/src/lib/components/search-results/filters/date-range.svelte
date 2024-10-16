<script lang="ts">
  import { page } from '$app/stores';

  export let dateId: string;
  export let dateName: string;
  export let active: boolean = false;

  /************* Translations ***************/
  const translations = $page.data.t;

  const startDate = translations?.startDate ? translations["startDate"] : "Start Date";
  const endDate = translations?.endDate ? translations["endDate"] : "End Date";
  const validatorRequired = translations?.validatorRequired ?
    translations["validatorRequired"] : "Please fill out this field.";
  const validatorStartGreater = translations?.validatorStartGreater ?
    translations["validatorStartGreater"] : "The start date should be earlier or equal to the end date.";

  const startDateKey = dateId + '-start';
  const endDateKey = dateId + '-end';

  const labels = [
    [startDate, startDateKey],
    [endDate, endDateKey]
  ];

  function init(key: string) {
    return $page.url.searchParams.get(key);
	}

  /************* Validators ***************/

  // Note: we are using a custom validator here because, at this time,
  // there is no way to control the language setting of the browser's
  // default validator messages. This way, we can translate them to French.
  function customizeValiditor(input: HTMLInputElement) {
    function validate() {
      let message = '';
      let date = Date.parse(input.value);

      // Note: The validator message is set when the field is set, and not when
      // the form is submitted. So, we need to check both the start and end dates
      // seperately to account for the user possibly selecting dates in the reverse order.
      if (Number.isNaN(date)) {
        message = validatorRequired;
      } else if (input.id == dateId + '-start') {
        let endElement = document.getElementById(dateId + '-end');
        let endDate = Date.parse(endElement.value);
        if (!Number.isNaN(endDate) && date > endDate) {
          message = validatorStartGreater;
        }
      } else if (input.id == dateId + '-end') {
        let startElement = document.getElementById(dateId + '-start');
        let startDate = Date.parse(startElement.value);
        if (!Number.isNaN(startDate) && date < startDate) {
          message = validatorStartGreater;
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

<div class="grid grid-cols-1 md:grid-cols-2 gap-3">
  {#each labels as inputLabel}
    <div class="flex flex-col">
      <label for={inputLabel[1]}>{inputLabel[0]}</label>
      <!--
        Note: the 'required' attribute only works when the input is enabled,
        so it won't block a form unless the user has selected the temporal checkbox
      -->
      <input
        type="date" id={inputLabel[1]} name={dateName}
        value={init(inputLabel[1])} disabled="{!active}"
        class="border-2 rounded border-custom-16 px-3.5 py-[9px]"
        required use:customizeValiditor
      />
    </div>
  {/each}
</div>