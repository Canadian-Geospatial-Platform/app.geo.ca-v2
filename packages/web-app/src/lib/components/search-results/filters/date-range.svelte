<script lang="ts">
	import { page } from '$app/state';
	import type { DateRangeItem } from './filter-types';

	interface Props {
		dateId: string;
		active?: boolean;
	}

	let { dateId, active = $bindable(false) }: Props = $props();

	/************* Translations ***************/
	const translations = page.data.t;

	const startDate = translations?.startDate ? translations['startDate'] : 'Start Date';
	const endDate = translations?.endDate ? translations['endDate'] : 'End Date';
	const validatorRequired = translations?.validatorRequired
		? translations['validatorRequired']
		: 'Please fill out this field.';
	const validatorStartGreater = translations?.validatorStartGreater
		? translations['validatorStartGreater']
		: 'The start date should be earlier or equal to the end date.';

	const startDateKey = dateId + '-begin';
	const endDateKey = dateId + '-end';

	const labels = {
		start: { label: startDate, key: startDateKey },
		end: { label: endDate, key: endDateKey }
	};

	let beginInput: HTMLInputElement | undefined = $state();
	let endInput: HTMLInputElement | undefined = $state();

	/**
	 * Resets the date range inputs to the values from the URL parameters or defaults.
	 */
	export function resetFilters(): void {
		let beginKey = page.url.searchParams.get('begin');
		let endKey = page.url.searchParams.get('end');

		if (beginInput) {
			beginInput.value = beginKey && !isNaN(Date.parse(beginKey)) ? beginKey : '';
		}

		if (endInput) {
			endInput.value = endKey && !isNaN(Date.parse(endKey)) ? endKey : '';
		}
	}

	/**
	 * Retrieves the current date range from the input fields.
	 * 
	 * @returns The date range object or null if inputs are missing.
	 */
	export function getDateRange(): DateRangeItem | null {
		let beginEl = beginInput;
		let endEl = endInput;
		let dateRange = null;

		if (beginEl && endEl) {
			dateRange = {
				begin: beginEl.value,
				end: endEl.value
			};
		}

		return dateRange;
	}

	/**
	 * Initializes the input fields with URL parameters or defaults.
	 * 
	 * @param key - The input field key.
	 * @returns The initial value for the input field.
	 */
	function init(key: string): string | null {
		let searchKey = key.replace(dateId + '-', '');
		let date = page.url.searchParams.get(searchKey);
		return date;
	}

	/************* Validators ***************/

	/**
	 * Customizes the validity messages for the date inputs.
	 * 
	 * Note: we are using a custom validator here because, at this time,
	 * there is no way to control the language setting of the browser's
	 * default validator messages. This way, we can translate them to French.
	 * 
	 * @param input - The input element to customize.
	 * @returns An object with a destroy method to clean up event listeners.
	 */
	function customizeValiditor(input: HTMLInputElement): { destroy: () => void } {
		/**
		 * Validates the input and sets custom validity messages.
		 */
		function validate(): void {
			let message = '';
			let date = Date.parse(input.value);

			// Note: The validator message is set when the field is set, and not when
			// the form is submitted. So, we need to check both the start and end dates
			// seperately to account for the user possibly selecting dates in the reverse order.
			if (Number.isNaN(date)) {
				message = validatorRequired;
			} else if (input === beginInput) {
				const endDate = Date.parse(endInput?.value || '');
				if (!Number.isNaN(endDate) && date > endDate) {
					message = validatorStartGreater;
				}
			} else if (input === endInput) {
				const startDate = Date.parse(beginInput?.value || '');
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
		};
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
			disabled={!active}
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
			disabled={!active}
			class="border-2 rounded border-custom-16 px-3.5 py-[0.5625rem]"
			required
			use:customizeValiditor
		/>
	</div>
</div>
