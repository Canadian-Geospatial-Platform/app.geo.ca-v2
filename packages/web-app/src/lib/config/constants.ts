/** Default AWS region used when runtime env vars are not set. */
export const AWS_REGION_FALLBACK = 'ca-central-1';

/** Maximum permitted idle time before an authentication session expires, in seconds. */
export const SESSION_INACTIVITY_SECONDS = 2 * 60;

/** Time before inactivity expiry when the user is warned, capped for short test timeouts. */
export const SESSION_WARNING_SECONDS = Math.min(5 * 60, SESSION_INACTIVITY_SECONDS / 4);

/** S3 key prefix used for GeoCore record JSON files. */
export const GEOCORE_RECORD_PREFIX = 'geocore/';

/** Pinned GeoView application version used to load the CGPV script. */
export const GEOVIEW_APP_VERSION = '2.3.0';
