import { get, writable } from 'svelte/store';
import { browser } from '$app/environment';

export const favorites = init();

function init() {
	if (!browser || !localStorage.getItem('favorites')) return writable([]);
	try {
		const f = JSON.parse(localStorage.getItem('favorites'));
		return writable(f);
	} catch (e) {
		console.error('Unable to parse favorites from local storage. setting default.');
	}
	return writable([]);
}

export function addFavorite(id) {
	favorites.update((items) => [...items, id]);
	if (browser) localStorage.setItem('favorites', JSON.stringify(get(favorites)));
}

export function removeFavorite(id) {
	favorites.update((items) => items.filter((idx) => idx !== id));
	if (browser) localStorage.setItem('favorites', JSON.stringify(get(favorites)));
}
