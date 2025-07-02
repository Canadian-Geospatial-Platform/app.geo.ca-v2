/**********************************************
 * For the cart, there are several places where the local storage is updated.
 * Sometimes, unrelated components, like the the item counter in the header,
 * needs to be aware of the change. So, we can create a custom event dispatcher here
 * to ensure everything stays synced.
 *********************************************/

// Custom event name
export const LOCALSTORAGE_UPDATED = 'localstorage_updated';

// Function to update localStorage and dispatch event
export function updateLocalStorage(key, value) {
	localStorage.setItem(key, value);
	window.dispatchEvent(
		new CustomEvent(LOCALSTORAGE_UPDATED, {
			detail: { key, value }
		})
	);
}
