/**********************************************
 * For the cart, there are several places where the local storage is updated.
 * Sometimes, unrelated components, like the the item counter in the header,
 * needs to be aware of the change. So, we can create a custom event dispatcher here
 * to ensure everything stays synced.
 *********************************************/

// Custom event name
export const LOCALSTORAGE_UPDATED = 'localstorage_updated';

//
/**
 * Function to update localStorage and dispatch event.
 *
 * @param key - The localStorage key to update.
 * @param value - The value to set for the given key (arrays will be joined with commas).
 */
export function updateLocalStorage(key: string, value: unknown): void {
	const stringValue = Array.isArray(value) ? value.join(',') : String(value);
	localStorage.setItem(key, stringValue);
	window.dispatchEvent(
		new CustomEvent(LOCALSTORAGE_UPDATED, {
			detail: { key, value }
		})
	);
}
