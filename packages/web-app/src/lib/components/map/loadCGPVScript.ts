import { tick } from 'svelte';

/**
 * Ensures the cgpv-script is fully loaded before attempting to use geoview API.
 * @returns {Promise<void>}
 */
export async function loadCGPVScript(): Promise<void> {
  if (typeof (window as any).cgpv !== 'undefined') return;

  if (!document.getElementById('cgpv-script')) {
    const script = document.createElement('script');
    script.id = 'cgpv-script';
    // Link for current dev build: https://canadian-geospatial-platform.github.io/geoview/public/cgpv-main.js
    // Link for release builds: https://viewer-visualiseur.services.geo.ca/apps/GeoView/X.X.X/cgpv-main.js
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
