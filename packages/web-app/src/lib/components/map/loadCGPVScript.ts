import { tick } from 'svelte';

// Make sure the cgpv-script is fully loaded before attempting to use geoview
export async function loadCGPVScript(): Promise<void> {
	if (typeof cgpv !== 'undefined') return;

	if (!document.getElementById('cgpv-script')) {
		const script = document.createElement('script');
		script.id = 'cgpv-script';
		script.src = 'https://canadian-geospatial-platform.github.io/geoview/public/cgpv-main.js';
		script.async = true;

		const loadPromise = new Promise<void>((resolve, reject) => {
			script.onload = () => resolve();
			script.onerror = () => reject(new Error('Failed to load CGPV script.'));
		});

		document.head.appendChild(script);
		await loadPromise;
	}

	// wait one tick for globals to register, just in case
	await tick();
}
