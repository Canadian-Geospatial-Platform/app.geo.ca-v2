<script lang="ts">
  import { page } from '$app/stores';

  export let dateId: string;
  export let active: boolean = false;

  /************* Translations ***************/
  const translations = $page.data.t;

  const startDate = translations?.startDate ? translations["startDate"] : "Start Date";
  const endDate = translations?.endDate ? translations["endDate"] : "End Date";
  const validatorRequired = translations?.validatorRequired ?
    translations["validatorRequired"] : "Please fill out this field.";
  const validatorStartGreater = translations?.validatorStartGreater ?
    translations["validatorStartGreater"] : "The start date should be earlier or equal to the end date.";

  const startDateKey = dateId + '-begin';
  const endDateKey = dateId + '-end';

  const labels = {
    'start': {'label': startDate, 'key': startDateKey},
    'end': {'label': endDate, 'key': endDateKey}
  };

  let beginInput: HTMLInputElement;
  let endInput: HTMLInputElement;

  export function resetFilters() {
    let beginKey = $page.url.searchParams.get('begin');
    let endKey = $page.url.searchParams.get('end');

    if (beginInput) {
      beginInput.value = beginKey && !isNaN(Date.parse(beginKey)) ? beginKey : "";
    }

    if (endInput) {
      endInput.value = endKey && !isNaN(Date.parse(endKey)) ? endKey : "";
    }
  }

  export function getDateRange() {
    let beginEl = beginInput;
    let endEl = endInput;
    let dateRange = null;

    if (beginEl && endEl) {
      dateRange = {
        begin: beginEl.value,
        end: endEl.value,
      };
    }

    return dateRange;
  }

  function init(key: string) {
    let searchKey = key.replace((dateId + '-'), '');
    let date = $page.url.searchParams.get(searchKey);
    return date;
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
      } else if (input === beginInput) {
        const endDate = Date.parse(endInput?.value || "");
        if (!Number.isNaN(endDate) && date > endDate) {
          message = validatorStartGreater;
        }
      } else if (input === endInput) {
        const startDate = Date.parse(beginInput?.value || "");
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
  <div class="flex flex-col">
    <label for={labels.start.key}>{labels.start.label}</label>
    <input
      bind:this={beginInput}
      type="date"
      id={labels.start.key}
      name={labels.start.key}
      value={init(labels.start.key)}
      disabled="{!active}"
      class="border-2 rounded border-custom-16 px-3.5 py-[0.5625rem]"
      required
      use:customizeValiditor
    />
  </div>
  <div class="flex flex-col">
    <label for={labels.end.key}>{labels.end.label}</label>
    <input
      bind:this={endInput}
      type="date"
      id={labels.end.key}
      name={labels.end.key}
      value={init(labels.end.key)}
      disabled="{!active}"
      class="border-2 rounded border-custom-16 px-3.5 py-[0.5625rem]"
      required
      use:customizeValiditor
    />
  </div>
</div>