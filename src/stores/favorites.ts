import { writable } from 'svelte/store';

export const favorites = writable([]);

export function addFavorite(id) {
	favorites.update((items) => [...items, id]);
}

export function removeFavorite(id) {
	favorites.update((items) => items.splice(id, 1));
}
