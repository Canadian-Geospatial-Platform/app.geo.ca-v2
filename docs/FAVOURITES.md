# Favourites Feature Architecture

## Overview

The favourites feature allows signed-in users to save and manage datasets and custom map configurations. Guest favourites are stored in browser local storage; when a guest starts sign-in, that list is copied into a short-lived cookie and merged into the signed-in profile.

## Directory Structure

```
packages/web-app/src/
├── lib/
│   ├── components/favourites/        # UI components for favourites feature
│   │   ├── favourites-datasets.svelte      # Dataset list & management
│   │   ├── favourites-maps.svelte          # Map config list & management
│   │   ├── favourites-view.svelte          # Map viewer for selected items
│   │   └── favourites.svelte               # Landing page (hub)
│   ├── db/
│   │   ├── db-types.ts                     # Type definitions (UserData, MapConfigFavourite)
│   │   ├── user.ts                         # DynamoDB user operations (getUserData, putUserData)
│   │   └── favourites.ts                   # mergeGuestFavourites (guest -> signed-in profile merge)
│   └── utils/
│       ├── favourites/
│       │   └── page-load.server.ts         # Shared server-side loader
│       ├── favourites-storage.ts           # Local-storage favourites read/normalize helpers
│       ├── guest-favourites.ts             # Guest favourites cookie encode/decode (client + server)
│       └── map-config-sanitizer.ts         # Removes large style data for storage
└── routes/
    └── [lang]/
        ├── favourites/                      # Landing page (hub)
        ├── favourites/datasets/             # Dataset list route
        ├── favourites/maps/                 # Map config list route
        ├── favourites/view/                 # Map viewer route
        └── api/favourites/+server.ts        # RESTful API (CRUD operations)
```

## Data Model

### UserData (DynamoDB)

```typescript
interface UserData {
  uuid: string | null; // User ID from auth token (null before first write)
  favourites: string[]; // Array of saved dataset record IDs
  mapConfigs?: MapConfigFavourite[]; // Array of saved map configurations
  authRevokedAt?: number | null; // Global back-channel logout marker
  authRevokedSids?: Record<string, number> | null; // Revocation timestamps keyed by provider session ID
  lastBackChannelLogoutJti?: string | null; // Most recently accepted logout-token ID
  lastBackChannelLogoutJtiSeenAt?: number | null; // Timestamp used for replay-window checks
}

interface MapConfigFavourite {
  id: string; // UUID for the saved map
  name: string; // User-provided name
  config: Record<string, unknown>; // Sanitized, serialized map state
  createdAt: string; // ISO 8601 timestamp
}
```

### Size Constraints

- **Map configs limit**: 25 saved maps per user
- **Item size limit**: 300 KB (conservative margin below DynamoDB 400 KB limit)
- **Sanitization**: `map-config-sanitizer.ts` removes large style/layer data to fit within limits

### Guest Favourites

- Kept in browser local storage while browsing as a guest
- Copied into the short-lived `guest_favourites` cookie when sign-in starts
- Merged into `UserData.favourites` after sign-in
- Cookie is cleared after successful persistence

## Routes & Components

### `[lang]/favourites` (Landing Page)

- **Component**: `favourites.svelte`
- **Data**: User lookup via `page-load.server.ts`
- **Purpose**: Dashboard for signed-in users; displays cards to navigate to datasets and maps sections
- **Conditional**: Only visible when user is signed in
- **Header navigation**: Signed-in users see a single "My GEO.ca" / "Mon GEO.ca" link to this landing page in desktop and mobile navigation, without a dropdown or counter. Guests retain the existing "Favourites" / "Favoris" link and counter.
- **Titles and breadcrumbs**: Signed-in users see "My GEO.ca" / "Mon GEO.ca" in the landing heading, browser titles, and parent breadcrumbs throughout the favourites pages. Guests retain "Favourites" / "Favoris".

### `[lang]/favourites/datasets`

- **Component**: `favourites-datasets.svelte`
- **Data**: Fetches saved dataset records from GeoCore API
- **Features**: Display list, delete individual items, delete all, open selected items on map
- **Storage**: Removes deleted IDs from `UserData.favourites`
- **Add to saved map**: Signed-in users can choose an existing saved map for a dataset, using the Add button immediately before Delete (also available on mobile). The column heading retains the full action label. The button is disabled if the dataset has no map layer or no saved maps are available. The picker uses the shared centered app dialog.

### `[lang]/favourites/maps`

- **Component**: `favourites-maps.svelte`
- **Data**: Retrieves saved map configs from `UserData.mapConfigs`
- **Features**: Upload JSON configs, download configs, delete configs, view on map
- **Upload**: Validates max-item limit (25) and auto-renames duplicates
- **Storage**: PATCH endpoint creates, updates, and deletes map configs

### `[lang]/favourites/view`

- **Component**: `favourites-view.svelte`
- **Parameters**: Accepts either:
  - `ids` query param: Array of dataset record IDs to view together
  - `mapId` query param: Single saved map config ID to view
  - `addDatasetId` with `mapId`: Initialize the saved map first, then add this GeoCore dataset as soon as the map is ready, without waiting for existing layers to load. Waits for the new layer's completion promise before showing the save reminder; duplicates are not added. Missing maps and load failures are reported explicitly.
- **Purpose**: Shared map viewer for displaying selected items
- **Features**: Save as new map config, overwrite a loaded saved map config, return to dataset/maps list
- **Unsaved additions**: Adding a dataset does not write to storage. A centered reminder explains that Save overwrites the loaded map and Save as creates a copy; this warning is not repeated below the map. Both save actions are disabled while adding. The addition query parameter survives refresh/language switching until a save succeeds, when it is removed without remounting the map. Failed saves retain the pending addition; already-present datasets clear the parameter immediately.
- **Language switching**: Keeps the current view route, dataset IDs or saved-map ID, source, and presentation-mode query parameters.
- **Navigation**: Desktop and mobile language links preserve each page's query parameters and fragment. On sign-out confirmation, the favourites return target follows the selected language; the sign-in launcher likewise localizes valid same-origin return destinations.

## API Endpoints

### `/[lang]/api/favourites` (RESTful)

**POST**: Add dataset ID to favourites

```json
{ "id": "<record-id>" }
```

**DELETE**: Remove dataset ID from favourites

```json
{ "id": "<record-id>" }
```

**PUT**: Clear all dataset favourites

```json
{}
```

**PATCH**: Create, update or delete map configs

```json
// Create
{ "action": "createMapConfig", "name": "<name>", "config": {...} }

// Overwrite an existing map belonging to the signed-in user
{ "action": "updateMapConfig", "id": "<uuid>", "config": {...} }

// Delete
{ "action": "deleteMapConfig", "id": "<uuid>" }
```

## Data Flow

### Save a Dataset

1. User views dataset on map
2. Click "Add to favourites" button
3. POST `/[lang]/api/favourites` with record ID
4. Server adds ID to `UserData.favourites` in DynamoDB
5. Confirmed ID appears in datasets list

### Save a Map Configuration

1. User arranges map (layers, zoom, pan, style)
2. Click "Save as..." on view page and enter a name
3. PATCH `/[lang]/api/favourites` with map config + name
4. Server:
   - Sanitizes config (removes large style data)
   - Checks size constraints (max 25 configs, item < 300 KB)
   - Auto-renames if duplicate name exists
   - Stores in `UserData.mapConfigs`
5. Confirmed config appears in maps list

### Overwrite a Saved Map Configuration

1. Open a saved map from the maps list and adjust its live state.
2. Click "Save" to overwrite the loaded configuration without a name prompt.
3. PATCH `/[lang]/api/favourites` with `updateMapConfig`, the loaded ID, and the current map config.
4. Server validates and sanitizes the config, enforces the 300 KB UTF-8 item-size limit, and replaces only the matching config. Its ID, name, and creation date are preserved, as are other maps and favourite datasets. Updates are allowed at the 25-map limit.
5. Missing configs return `404` (`not-found`); unavailable storage returns `503` (`unavailable`), and failed persistence returns `500` (`persist-failed`). Updates never create a replacement map.

Successful create/update responses include `mapConfigId` identifying the saved entry alongside `mapConfigs`.

Both save buttons are disabled while a save is pending. If live map state cannot be captured, the viewer reports an error instead of saving the originally loaded state. "Save as..." creates a separate copy and makes it the active overwrite target: the viewer shows its saved name and the "Save" button, and replaces the current URL with the new `mapId` and `source=maps` so refreshing reopens it. Saving does not remount the live map or change presentation mode.

### Dialogs

The map-name prompt and all dataset/map deletion confirmations use the shared `ActionDialog` component rather than browser-native prompts. Cancel or Escape dismisses them without saving or deleting. Prompts support Enter to submit and preserve the existing default-name behavior. Dialog controls are available in English and French.

`AppDialog` supplies the centered white panel, rounded border, shadow, and darkened backdrop used by presentation mode, session warnings, search filters, and the leaving-site notice. It uses the browser's modal top layer so dialogs stay above maps, trap keyboard focus, and restore focus on close. Search filters retain a wider, scrollable layout.

Session expiry and rejected session renewal bypass the manual sign-out confirmation. They replace the current history entry with the localized local-logout route, clear app authentication cookies, and return to the map browser with the session-expired notice. The explicit "Sign out" action still asks for confirmation and follows the provider logout flow. Automatic expiry ends the app session; it does not initiate provider-wide logout.

### Guest → Sign-In Merge

1. Guest clicks "Add to favourites"; the id is stored in local storage and, on sign-in click, encoded into the `guest_favourites` cookie (`lib/utils/guest-favourites.ts`)
2. Guest completes sign-in flow
3. `/sign-in/receive` route verifies the ID token, then calls `mergeGuestFavourites()` (`lib/db/favourites.ts`), which:
   - Decodes and normalizes the `guest_favourites` cookie
   - Merges it into `UserData.favourites` (deduped)
   - Persists merged data to DynamoDB
   - Clears the cookie only after successful persistence

## Key Utilities

### `page-load.server.ts`

Shared server-side loader for all favourites routes:

- Looks up user via cookies
- Fetches full GeoCore records for saved dataset IDs (for display)
- Sanitizes records (removes sensitive fields)
- Returns typed `FavouritesLoadOutput`

### `map-config-sanitizer.ts`

Reduces map config size by removing style/layer data before storage:

- Strips large style objects from layers
- Keeps essential state (zoom, center, visible layers)
- Runs during save and re-sizing checks

### `favourites-storage.ts`

Local storage utilities:

- Reads/normalizes favourites from browser local storage (trim, dedupe, drop empties)
- Resolves initial favourites source on page load (server vs. local storage fallback)

### `guest-favourites.ts`

Shared guest favourites cookie contract used by both the client and server:

- `encodeGuestFavouritesCookieValue()` / `decodeGuestFavouritesCookieValue()`
- Used by the sign-in component (client) when caching favourites before redirect, and by `mergeGuestFavourites()` (server) when merging after sign-in

## Development Notes

### Running Tests

Test favourites API behavior:

```bash
npm run test:unit -- src/lib/tests/favourites-api.test.ts
```

### Adding a New Favourites Feature

1. Add route under `routes/[lang]/favourites/<new-feature>/+page.ts`
2. Create component at `lib/components/favourites/<name>.svelte`
3. Add server-side logic to `lib/utils/favourites/` if needed
4. Update API endpoints in `routes/[lang]/api/favourites/+server.ts`
5. Add JSDoc documentation to all functions
6. Run `npm run check` to validate types and Svelte syntax
7. Run `npm run lint` to check formatting and ESLint rules

### Known Constraints

- No index on favourites table for faster lookups (single user key query)
- Map config size tightly managed; large custom layer styles may not fit
- Duplicate map names auto-renamed (appends `(2)`, `(3)`, etc.)
- Max 25 saved maps per user enforced at API level
- Guest favourites merged one-time at sign-in (no continuous sync)

## Related Documentation

- [README.md](../README.md) - Setup, deployment, and general architecture
- [CONTRIBUTING.md](../CONTRIBUTING.md) - Development workflow (if it exists)
- Inline JSDoc in source files for function-level documentation
