import type { Handle } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
  const url = new URL(event.request.url);

  // In app.geo.ca v1, record pages have a different url structure.
  // To ensure that old links stay relavent, we can redirect them.
  // For example /result/en/floods-in-canada---cartographic-product-collection?id=08b810c2-7c81-40f1-adb1-c32c8a2c9f50&lang=en
  // becomes /en-ca/map-browser/record/08b810c2-7c81-40f1-adb1-c32c8a2c9f
  if (url.pathname.startsWith('/result')) {
    // Get the id and language from the url
    const id = url.searchParams.get('id');
    let lang = url.searchParams.get('lang') ?? 'en';

    // Convert language code e.g. 'en' to 'en-ca'
    if (lang === 'en') lang = 'en-ca';
    else if (lang === 'fr') lang = 'fr-ca';

    if (id) {
      // Construct the new URL, throw redirect
      const newUrl = `/${lang}/map-browser/record/${id}`;
      throw redirect(307, newUrl);
    }
  }

  return resolve(event);
};