import { writable } from 'svelte/store';

let all = false;
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

export function allCollapse() {
	console.log('allCollapse');
	organisation.set(all);
	other.set(all);
	spatioTemporal.set(all);
	theme.set(all);
	type.set(all);
	all = !all;
}
