import { writable } from 'svelte/store';

export const organisation = writable(false);
export const other = writable(false);
export const spatioTemporal = writable(false);
export const theme = writable(false);
export const type = writable(false);

export function organisationCollapse() {
	organisation.update((x) => (x = !x));
}

export function otherCollapse() {
	other.update((x) => (x = !x));
}

export function spatioTemporalCollapse() {
	spatioTemporal.update((x) => (x = !x));
}

export function themeCollapse() {
	theme.update((x) => (x = !x));
}

export function typeCollapse() {
	type.update((x) => (x = !x));
}

export function allCollapse(x) {
	organisation.set(x);
	other.set(x);
	spatioTemporal.set(x);
	theme.set(x);
	type.set(x);
}
