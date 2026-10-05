import type { Handle } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import { getAppLanguage, isAppLanguage } from '$lib/utils/language';

// OP-to-RP server calls carry no Origin header; the route authenticates via the signed logout_token.
const CSRF_EXEMPT_PATHS = new Set(['/sign-in/back-channel-logout']);
const FORM_CONTENT_TYPES = ['application/x-www-form-urlencoded', 'multipart/form-data', 'text/plain'];
const UNSAFE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function isForbiddenCrossSiteFormRequest(request: Request, url: URL): boolean {
  if (!UNSAFE_METHODS.has(request.method) || CSRF_EXEMPT_PATHS.has(url.pathname)) {
    return false;
  }

  const contentType = request.headers.get('content-type')?.split(';', 1)[0].trim().toLowerCase() ?? '';
  if (!FORM_CONTENT_TYPES.includes(contentType)) {
    return false;
  }

  return request.headers.get('origin') !== url.origin;
}

export const handle: Handle = async ({ event, resolve }) => {
  const url = new URL(event.request.url);

  if (isForbiddenCrossSiteFormRequest(event.request, event.url)) {
    const message = `Cross-site ${event.request.method} form submissions are forbidden`;
    return event.request.headers.get('accept') === 'application/json'
      ? Response.json({ message }, { status: 403 })
      : new Response(message, { status: 403 });
  }

  // In app.geo.ca v1, record pages have a different url structure.
  // To ensure that old links stay relavent, we can redirect them.
  // For example /result/en/floods-in-canada---cartographic-product-collection?id=08b810c2-7c81-40f1-adb1-c32c8a2c9f50&lang=en
  // becomes /en-ca/map-browser/record/08b810c2-7c81-40f1-adb1-c32c8a2c9f
  if (url.pathname.startsWith('/result')) {
    // Get the id and language from the url
    const id = url.searchParams.get('id');
    const lang = getAppLanguage(url.searchParams.get('lang'));

    if (id) {
      // Construct the new URL, throw redirect
      const newUrl = `/${lang}/map-browser/record/${id}`;
      throw redirect(307, newUrl);
    }
  }

  if (url.pathname.startsWith('/map')) {
    // Get the id and language from the url
    const id = url.searchParams.get('rvKey');
    const lang = getAppLanguage(url.searchParams.get('lang'));

    if (id) {
      // Construct the new URL, throw redirect
      const newUrl = `/${lang}/map-browser/record/${id}`;
      throw redirect(307, newUrl);
    }
  }

  // If the request is for fetch-esri-worker-script.worker.js.map,
  // return a 204 No Content response to prevent errors from missing source maps.
  // This is necessary because GeoView's FetchEsriWorker script may reference source maps
  // that are not included in the build, triggering unnecessary 404 errors.
  if (event.url.pathname.endsWith('fetch-esri-worker-script.worker.js.map')) {
    return new Response(null, { status: 204 });
  }

  // Language varification - check to make sure the url lang is supported
  const defaultLang = getAppLanguage();
  const langParam = event.params.lang;

  // If someone enters an invalid language (e.g. fr-BE, or hdsjkfhjkds),
  // they should be rerouted to a valid one.
  // Note: not all events have a language set in the params, so we will ignore those.
  if (langParam && !isAppLanguage(langParam)) {
    const langRedirectUrl = event.request.url.replace(langParam, defaultLang);
    return Response.redirect(new URL(langRedirectUrl), 307);
  }

  return resolve(event);
};
